'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../utils/supabase';
import { useRouter } from 'next/navigation';
import toastManager from '../utils/toast-manager';
import logger, { LOG_LEVELS } from '../utils/logger';

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Configure logger for auth
logger.configureLogger({
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO
});

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        logger.logDebug('AuthContext: Checking session...', 'auth');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
          logger.logDebug('AuthContext: Session found, user set:', 'auth', user.email);
        } else {
          setUser(null);
          logger.logDebug('AuthContext: No session found', 'auth');
        }
      } catch (error) {
        logger.logError('AuthContext: Error getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    getSession();

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.logDebug('AuthContext: Auth state changed:', 'auth', event);
        
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
          logger.logDebug('AuthContext: User signed in:', 'auth', user.email);
        } else {
          setUser(null);
          logger.logDebug('AuthContext: User signed out', 'auth');
        }
        setLoading(false);
        setAuthInitialized(true);
      }
    );

    // Only run a single check every 30 seconds instead of continuous polling
    const intervalId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentAuthState = !!user;
        const newAuthState = !!session;
        
        // Only update if there's a mismatch between current state and actual state
        if (currentAuthState !== newAuthState) {
          logger.logDebug('AuthContext: Auth state mismatch detected, updating...', 'auth');
          if (session) {
            const { data: { user: userData } } = await supabase.auth.getUser();
            setUser(userData);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        logger.logWithRetry(LOG_LEVELS.ERROR, 'AuthContext: Error polling for session:', 'polling', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      try {
        subscription?.unsubscribe();
        clearInterval(intervalId);
      } catch (err) {
        logger.logError('Error cleaning up auth subscriptions:', err);
      }
    };
  }, []);

  // User signup function with profile creation
  const signUp = async (email, password, name) => {
    setLoading(true);
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      
      logger.logDebug('AuthContext: Starting signUp for', 'auth', sanitizedEmail);
      
      // Register the user
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        logger.logError('AuthContext: Signup error:', error);
        return { data: null, error };
      }

      // Create profile if user was created successfully
      if (data?.user) {
        setUser(data.user);
        
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: sanitizedEmail,
              full_name: name,
              created_at: new Date().toISOString()
            });
            
          if (profileError) {
            logger.logError('Error creating profile:', profileError);
          }
        } catch (profileErr) {
          logger.logError('Error creating profile:', profileErr);
        }
      }
      
      return { data, error: null };
    } catch (error) {
      logger.logError('Signup error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // User login function - Improved for reliability
  const signIn = async (email, password) => {
    setLoading(true);
    
    // Create an abort controller to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000); // 15 second timeout
    
    try {
      logger.logDebug('AuthContext: Starting signIn for', 'auth', email);
      
      // Make sure there's no existing session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        logger.logDebug('AuthContext: User already has a session, using existing session', 'auth');
        setUser(sessionData.session.user);
        clearTimeout(timeoutId);
        // Use toastManager instead of direct toast call
        toastManager.success('Logged in successfully!');
        return { data: sessionData, error: null };
      }
      
      // Perform login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        logger.logError('AuthContext: Login error:', error);
        return { data: null, error };
      }
      
      // Set user state immediately to speed up UI update
      if (data && data.user) {
        setUser(data.user);
        logger.logDebug('AuthContext: User signed in:', 'auth', data.user.email);
      }
      
      // Use toastManager instead of direct toast call
      toastManager.success('Logged in successfully!');
      return { data, error: null };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        logger.logError('AuthContext: Login request timed out');
        return { data: null, error: { message: 'Login request timed out. Please try again.' } };
      }
      
      logger.logError('AuthContext: Login error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // User logout function with improved cleanup
  const signOut = async () => {
    try {
      setLoading(true);
      logger.logInfo('AuthContext: Starting signOut process', 'auth');
      
      // First clear all notifications to avoid stacking toasts
      toastManager.dismissAll();
      
      // Clear user state immediately to speed up UI update
      setUser(null);
      
      // Force-clear localStorage and sessionStorage first to ensure session is cleared
      if (isBrowser) {
        try {
          // Clear Supabase session data from storage
          localStorage.removeItem('sb:session');
          sessionStorage.removeItem('sb:session');
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          
          // Clear any other potential auth-related storage
          localStorage.removeItem('sb-refresh-token');
          localStorage.removeItem('sb-access-token');
          sessionStorage.removeItem('sb-refresh-token');
          sessionStorage.removeItem('sb-access-token');
          
          // Clear all Supabase storage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key);
            }
          });
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              sessionStorage.removeItem(key);
            }
          });
          
          // Clear any cookies if possible
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name.includes('supabase') || name.includes('sb-')) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });
        } catch (e) {
          logger.logWarn('Error clearing local/session storage:', 'auth', e);
        }
      }
      
      // Call Supabase signOut (even if previous steps failed)
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          logger.logError('Error in supabase.auth.signOut:', error);
          // Continue with forced logout even if there's an error
        }
      } catch (signOutError) {
        logger.logError('Exception in supabase.auth.signOut:', signOutError);
        // Continue with forced logout
      }
      
      logger.logInfo('AuthContext: Completed signOut API call', 'auth');
      
      // Show success message using toastManager
      toastManager.success('Logged out successfully');
      
      // Force a complete page reload to clear all state
      if (isBrowser) {
        window.location.href = '/';
      }
      
      return { success: true };
    } catch (error) {
      logger.logError('Error signing out:', error);
      toastManager.error('Failed to log out');
      
      // Force a page reload as a last resort
      if (isBrowser) {
        setTimeout(() => {
          window.location.href = '/'; 
        }, 1000);
      }
      
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    authInitialized,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    resetPassword: async (email, redirectUrl) => {
      try {
        logger.logDebug('AuthContext: Starting password reset for', 'auth', email);
        
        // Check email format first
        if (!email || !email.includes('@')) {
          logger.logWarn('AuthContext: Invalid email format for password reset', 'auth');
          return { 
            success: false, 
            error: { message: 'Please enter a valid email address' }
          };
        }
        
        // Set redirect URL with fallback
        const resetRedirectUrl = redirectUrl || 
          (isBrowser ? `${window.location.origin}/reset-password` : '/reset-password');
        
        logger.logDebug('AuthContext: Using redirect URL', 'auth', resetRedirectUrl);
        
        // Try to send the reset email
        const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: resetRedirectUrl,
        });
        
        if (error) {
          logger.logError('AuthContext: Password reset error:', error);
          // Add more context to help with troubleshooting
          if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
            logger.logWarn('Rate limit hit for password reset', 'auth');
          }
          
          if (process.env.NODE_ENV === 'development') {
            // In development, provide more detailed diagnostics
            logger.logDebug('AuthContext: Development mode password reset diagnostic', 'auth', {
              email: email,
              redirectUrl: resetRedirectUrl,
              error: error.message,
              errorCode: error.code || 'no_code',
              status: error.status || 'no_status'
            });
          }
          
          return { success: false, error };
        }
        
        logger.logInfo('AuthContext: Password reset email sent', 'auth');
        return { success: true, data };
      } catch (error) {
        logger.logError('AuthContext: Password reset exception:', error);
        return { 
          success: false, 
          error: { 
            message: 'An unexpected error occurred. Please try again.', 
            originalError: error 
          }
        };
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Simplified useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    logger.logWarn('useAuth must be used within an AuthProvider', 'auth');
    // Return default values silently
    return {
      user: null,
      loading: false,
      isAuthenticated: false,
      authInitialized: false,
      signUp: async (email, password, name) => {
        const sanitizedEmail = email.trim().toLowerCase();
        // Call supabase directly when context isn't available
        const { data, error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        
        if (data && data.user) {
          try {
            await supabase.from('profiles').insert({
              id: data.user.id,
              email: sanitizedEmail,
              full_name: name,
              created_at: new Date().toISOString()
            });
          } catch (err) {
            logger.logError('Error creating profile outside context:', err);
          }
        }
        
        return { data, error };
      },
      signIn: async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
      },
      signOut: async () => {
        return await supabase.auth.signOut();
      }
    };
  }
  return context;
}; 