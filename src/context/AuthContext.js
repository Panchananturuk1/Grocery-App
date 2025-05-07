'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../utils/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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
        console.log('AuthContext: Checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
          console.log('AuthContext: Session found, user set:', user.email);
        } else {
          setUser(null);
          console.log('AuthContext: No session found');
        }
      } catch (error) {
        console.error('AuthContext: Error getting session:', error);
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
        console.log('AuthContext: Auth state changed:', event);
        
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
          console.log('AuthContext: User signed in:', user.email);
        } else {
          setUser(null);
          console.log('AuthContext: User signed out');
        }
        setLoading(false);
        setAuthInitialized(true);
      }
    );

    // Set up a polling mechanism as a backup to ensure auth state is correct
    const intervalId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentAuthState = !!user;
        const newAuthState = !!session;
        
        // Only update if there's a mismatch between current state and actual state
        if (currentAuthState !== newAuthState) {
          console.log('AuthContext: Auth state mismatch detected, updating...');
          if (session) {
            const { data: { user: userData } } = await supabase.auth.getUser();
            setUser(userData);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('AuthContext: Polling error:', err);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      console.log('AuthContext: Cleaning up listeners');
      subscription?.unsubscribe();
      clearInterval(intervalId);
    };
  }, [user]);

  // User signup function - Simplified
  const signUp = async (email, password, name) => {
    setLoading(true);
    try {
      // Sanitize email
      const sanitizedEmail = email.trim().toLowerCase();
      
      // Auth signup
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
        console.error('Signup error:', error);
        return { data: null, error };
      }
      
      // Try to create profile after signup
      if (data && data.user) {
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
            console.error('Error creating profile:', profileError);
          }
        } catch (profileErr) {
          console.error('Error creating profile:', profileErr);
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // User login function - Simplified
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { data: null, error };
      }
      
      // Set user state immediately to speed up UI update
      if (data && data.user) {
        setUser(data.user);
      }
      
      toast.success('Logged in successfully!');
      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // User logout function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      // Clear user state immediately to speed up UI update
      setUser(null);
      
      if (error) throw error;
      
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
      toast.error('Failed to log out');
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
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Simplified useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider');
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
            console.error('Profile creation error:', err);
          }
        }
        
        return { data, error };
      },
      signIn: async () => ({ error: { message: 'Auth context not available' }}),
      signOut: async () => {}
    };
  }
  return context;
}; 