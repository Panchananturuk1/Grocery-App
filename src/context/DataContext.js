'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { initializeDatabase } from '../utils/setup-db';
import toastManager from '../utils/toast-manager';
import logger from '../utils/logger';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const initAttempts = useRef(0);
  const MAX_ATTEMPTS = 3;

  // Clear error notifications on mount
  useEffect(() => {
    // Wait a bit after hydration
    const timeoutId = setTimeout(() => {
      toastManager.dismissErrors();
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;
    
    const setupDatabase = async () => {
      if (!user || !isAuthenticated) {
        setIsInitializing(false);
        return;
      }

      // Prevent multiple concurrent initialization attempts
      if (isInitializing || isInitialized) return;
      
      setIsInitializing(true);
      try {
        const success = await initializeDatabase();
        
        if (!mounted) return;
        
        setIsInitialized(success);
        
        if (!success) {
          logger.logError('Failed to initialize database', 'db');
          setHasError(true);
          
          // Only show error on first attempt or after max retries
          if (initAttempts.current === 0 || initAttempts.current >= MAX_ATTEMPTS) {
            toastManager.error('Database setup issue. Please try again later.', {
              id: 'db-setup-error', // Use a consistent ID to prevent duplicates
              duration: 3000
            });
          }
          
          // Auto-retry with backoff if under max attempts
          if (initAttempts.current < MAX_ATTEMPTS) {
            initAttempts.current++;
            const backoffTime = Math.min(1500 * Math.pow(1.5, initAttempts.current), 8000);
            
            timeoutId = setTimeout(() => {
              if (mounted) {
                setIsInitializing(false);
                // Try again
                setupDatabase();
              }
            }, backoffTime);
            
            return; // Don't reset isInitializing yet
          }
        } else {
          // Success - reset error state and counter
          setHasError(false);
          initAttempts.current = 0;
          
          // Clear any error notifications on success
          toastManager.dismissErrors();
        }
      } catch (error) {
        if (!mounted) return;
        
        logger.logError('Error initializing database:', 'db', error);
        setHasError(true);
        
        // Only show error on first attempt or after max retries
        if (initAttempts.current === 0 || initAttempts.current >= MAX_ATTEMPTS) {
          toastManager.error('Database connection error. Please check your internet connection.', {
            id: 'db-connect-error', 
            duration: 3000
          });
        }
        
        // Auto-retry with backoff if under max attempts
        if (initAttempts.current < MAX_ATTEMPTS) {
          initAttempts.current++;
          const backoffTime = Math.min(1500 * Math.pow(1.5, initAttempts.current), 8000);
          
          timeoutId = setTimeout(() => {
            if (mounted) {
              setIsInitializing(false);
              // Try again
              setupDatabase();
            }
          }, backoffTime);
          
          return; // Don't reset isInitializing yet
        }
      } finally {
        if (mounted && !timeoutId) {
          setIsInitializing(false);
        }
      }
    };

    setupDatabase();
    
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isAuthenticated, isInitialized]);

  const retryInitialization = async () => {
    // Prevent retry if already initializing
    if (isInitializing) return;
    
    // Reset states for retry
    setIsInitializing(true);
    setHasError(false);
    initAttempts.current = 0;
    
    // Clear any existing error notifications
    toastManager.dismissErrors();
    
    try {
      logger.logInfo('Retrying database initialization', 'db');
      const success = await initializeDatabase();
      setIsInitialized(success);
      
      if (success) {
        toastManager.success('Database initialized successfully');
        logger.logInfo('Database initialized successfully on retry', 'db');
      } else {
        toastManager.error('Failed to initialize database');
        logger.logError('Failed to initialize database on retry', 'db');
        setHasError(true);
      }
    } catch (error) {
      logger.logError('Error retrying database initialization:', 'db', error);
      toastManager.error('Failed to initialize database');
      setHasError(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const value = {
    isInitialized,
    isInitializing,
    hasError,
    retryInitialization
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    logger.logWarn('useData must be used within a DataProvider', 'db');
    return {
      isInitialized: false,
      isInitializing: false,
      hasError: false,
      retryInitialization: () => {}
    };
  }
  return context;
};

export default DataContext; 