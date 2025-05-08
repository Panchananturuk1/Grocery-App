'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeDatabase } from '../utils/setup-db';
import logger from '../utils/logger';
import toastManager from '../utils/toast-manager';

/**
 * Custom hook to handle database initialization
 * @returns {Object} Database initialization state
 */
export const useDatabase = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState(null);
  // Track retry attempts
  const retryAttempts = useRef(0);
  const MAX_RETRIES = 3;
  const lastErrorShown = useRef(false);

  // Initialize database when user is authenticated
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const setupDb = async () => {
      // Skip if already initializing, initialized, or user is not authenticated
      if (initializing || initialized || !isAuthenticated || !user) {
        return;
      }
      
      try {
        setInitializing(true);
        
        // Check if we should show progress notification
        if (retryAttempts.current === 0) {
          logger.logInfo('Initializing database for user', 'db');
        } else {
          logger.logInfo(`Retry attempt ${retryAttempts.current} of ${MAX_RETRIES}`, 'db');
        }
        
        const result = await initializeDatabase();
        
        if (isMounted) {
          setInitialized(result);
          
          if (result) {
            setError(null);
            // Reset retry counter on success
            retryAttempts.current = 0;
            lastErrorShown.current = false;
            
            // Clear any error notifications on success
            toastManager.dismissErrors();
          } else {
            setError(new Error('Failed to initialize database'));
            
            // Only show error message on first failure or after retries are exhausted
            if (!lastErrorShown.current) {
              toastManager.error('Having trouble connecting to the database.', {
                id: 'db-init-error',
                duration: 3000
              });
              lastErrorShown.current = true;
            }
            
            // Auto retry with backoff if under max retries
            if (retryAttempts.current < MAX_RETRIES) {
              const backoffTime = Math.min(2000 * Math.pow(1.5, retryAttempts.current), 10000);
              retryAttempts.current++;
              
              // Schedule retry
              timeoutId = setTimeout(() => {
                if (isMounted) {
                  setInitializing(false); // Reset initializing to allow retry
                  setupDb(); // Retry setup
                }
              }, backoffTime);
              
              return; // Don't reset initializing yet
            }
          }
        }
      } catch (err) {
        logger.logError('Database initialization error:', 'db', err);
        if (isMounted) {
          setError(err);
          
          // Only show error message if not already shown
          if (!lastErrorShown.current) {
            toastManager.error('Database connection error. Will retry.', {
              id: 'db-connection-error',
              duration: 3000
            });
            lastErrorShown.current = true;
          }
          
          // Auto retry with backoff if under max retries
          if (retryAttempts.current < MAX_RETRIES) {
            const backoffTime = Math.min(2000 * Math.pow(1.5, retryAttempts.current), 10000);
            retryAttempts.current++;
            
            // Schedule retry
            timeoutId = setTimeout(() => {
              if (isMounted) {
                setInitializing(false); // Reset initializing to allow retry
                setupDb(); // Retry setup
              }
            }, backoffTime);
            
            return; // Don't reset initializing yet
          }
        }
      } finally {
        if (isMounted && !timeoutId) {
          setInitializing(false);
        }
      }
    };
    
    // Don't run initialization until auth is complete
    if (!authLoading) {
      setupDb();
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isAuthenticated, initialized, initializing, authLoading]);
  
  // Force re-initialization
  const reinitialize = async () => {
    // Clear previous error state
    setError(null);
    setInitialized(false);
    retryAttempts.current = 0;
    lastErrorShown.current = false;
    // Initialization will be triggered by the effect
  };
  
  return {
    initialized,
    initializing,
    error,
    reinitialize
  };
};

export default useDatabase; 