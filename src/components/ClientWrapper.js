'use client';

import { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import supabase from '../utils/supabase';

/**
 * ClientWrapper ensures components that depend on client-side features
 * like browser APIs only render after hydration is complete.
 * 
 * This prevents hydration mismatches between server and client rendering
 * for components that use authentication, localStorage, etc.
 */
export default function ClientWrapper({ children, waitForAuth = true }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(waitForAuth);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    // Mark component as mounted (hydrated)
    setIsMounted(true);
    
    if (!waitForAuth) {
      return;
    }
    
    // Check auth state to prevent auth-related rendering issues
    const checkAuth = async () => {
      try {
        // Set a hard timeout to prevent blocking rendering indefinitely
        const timeoutPromise = new Promise(resolve => {
          setTimeout(() => {
            console.log("Auth check timeout reached, continuing render");
            resolve({ timedOut: true });
          }, 1500); // Reduced from 2000ms to 1500ms for faster rendering
        });
        
        // Check auth state
        const authPromise = new Promise(async resolve => {
          try {
            const { data } = await supabase.auth.getSession();
            resolve({ 
              session: data.session,
              hasSession: !!data.session
            });
          } catch (err) {
            console.error("Auth check failed:", err);
            resolve({ error: err });
          }
        });
        
        // Wait for either the timeout or auth check
        const result = await Promise.race([timeoutPromise, authPromise]);
        
        if (result && !result.timedOut) {
          console.log("Auth check completed, session exists:", result.hasSession);
        }
      } catch (err) {
        console.error('Error in ClientWrapper auth check:', err);
      } finally {
        setIsAuthLoaded(true);
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
    
    // Also set up a fallback timeout to prevent indefinite loading
    const fallbackTimeout = setTimeout(() => {
      if (isCheckingAuth) {
        console.warn("Fallback timeout triggered for auth check");
        setIsAuthLoaded(true);
        setIsCheckingAuth(false);
      }
    }, 3000); // Reduced from 5000ms to 3000ms for faster fallback
    
    // Set up auth state change listener
    let authListener;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("ClientWrapper detected auth change:", event);
        // Mark auth as loaded whenever there's a definitive auth event
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setIsAuthLoaded(true);
          setIsCheckingAuth(false);
        }
      });
      authListener = data.subscription;
    } catch (err) {
      console.error("Error setting up auth listener in ClientWrapper:", err);
    }
    
    return () => {
      clearTimeout(fallbackTimeout);
      if (authListener) {
        try {
          authListener.unsubscribe();
        } catch (err) {
          console.error("Error unsubscribing from auth listener:", err);
        }
      }
    };
  }, [waitForAuth]);

  // Wait for both mounting and initial auth check before rendering
  if (!isMounted || (waitForAuth && isCheckingAuth && !isAuthLoaded)) {
    // Return a minimal loading state that won't cause hydration mismatches
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiLoader className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 