'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { initializeDatabase } from '../utils/setup-db';
import toast from 'react-hot-toast';
import logger from '../utils/logger';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { user, isAuthenticated } = useAuth();
  // Add throttle tracking for errors
  const lastErrorTime = useRef(0);
  const errorToastShown = useRef(false);

  useEffect(() => {
    const setupDatabase = async () => {
      if (!user || !isAuthenticated) {
        setIsInitializing(false);
        return;
      }

      // Prevent multiple concurrent initialization attempts
      if (isInitializing) return;
      
      setIsInitializing(true);
      try {
        const success = await initializeDatabase();
        setIsInitialized(success);
        if (!success) {
          logger.logError('Failed to initialize database', 'db');
          setHasError(true);
          
          // Show error toast only once per session or if 10 minutes have passed
          const now = Date.now();
          if (!errorToastShown.current || (now - lastErrorTime.current > 600000)) {
            toast.error('Database setup issue. Check your Supabase SQL functions.', {
              id: 'db-setup-error', // Use a consistent ID to prevent duplicates
              duration: 5000
            });
            lastErrorTime.current = now;
            errorToastShown.current = true;
          }
        }
      } catch (error) {
        logger.logError('Error initializing database:', 'db', error);
        setHasError(true);
        
        // Show error toast only once per session or if 10 minutes have passed
        const now = Date.now();
        if (!errorToastShown.current || (now - lastErrorTime.current > 600000)) {
          toast.error('Database connection error. Please try again later.', {
            id: 'db-connect-error', // Use a consistent ID to prevent duplicates
            duration: 5000
          });
          lastErrorTime.current = now;
          errorToastShown.current = true;
        }
      } finally {
        setIsInitializing(false);
      }
    };

    setupDatabase();
  }, [user, isAuthenticated]);

  const retryInitialization = async () => {
    // Prevent retry if already initializing
    if (isInitializing) return;
    
    setIsInitializing(true);
    setHasError(false);
    errorToastShown.current = false;
    
    try {
      logger.logInfo('Retrying database initialization', 'db');
      const success = await initializeDatabase();
      setIsInitialized(success);
      
      if (success) {
        toast.success('Database initialized successfully');
        logger.logInfo('Database initialized successfully on retry', 'db');
      } else {
        toast.error('Failed to initialize database');
        logger.logError('Failed to initialize database on retry', 'db');
        setHasError(true);
      }
    } catch (error) {
      logger.logError('Error retrying database initialization:', 'db', error);
      toast.error('Failed to initialize database');
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