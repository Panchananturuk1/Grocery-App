'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { DataProvider } from "../context/DataContext";
import { DatabaseProvider } from "../context/DatabaseContext";
import toast from 'react-hot-toast';
import logger from '../utils/logger';
import AuthErrorBoundary from '../components/AuthErrorBoundary';

export default function Providers({ children }) {
  const [initialized, setInitialized] = useState(false);

  // Check and clear any stale sessions on mount
  useEffect(() => {
    const checkForInitialization = async () => {
      try {
        // Import supabase dynamically to prevent circular dependencies
        const { default: supabase } = await import('../utils/supabase');
        
        // Check if we have valid session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          logger.logError('Error checking session during initialization:', error);
          // Force cleanup on error
          clearAuthData();
        }
        
        setInitialized(true);
      } catch (err) {
        logger.logError('Error in provider initialization:', err);
        setInitialized(true);
      }
    };
    
    checkForInitialization();
  }, []);
  
  // Helper to clear authentication data
  const clearAuthData = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb:session');
        sessionStorage.removeItem('sb:session');
        
        // Clear any auth-related items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      logger.logWarn('Error clearing stale auth data:', e);
    }
  };

  if (!initialized) {
    return null; // Wait for initialization
  }

  // Use a multi-provider setup for clearer component hierarchy
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <DatabaseProvider>
          <DataProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </DataProvider>
        </DatabaseProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  );
} 