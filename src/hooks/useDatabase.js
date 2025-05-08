'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeDatabase } from '../utils/setup-db';
import logger from '../utils/logger';

/**
 * Custom hook to handle database initialization
 * @returns {Object} Database initialization state
 */
export const useDatabase = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize database when user is authenticated
  useEffect(() => {
    let isMounted = true;
    
    const setupDb = async () => {
      // Skip if already initializing, initialized, or user is not authenticated
      if (initializing || initialized || !isAuthenticated || !user) {
        return;
      }
      
      try {
        setInitializing(true);
        logger.logInfo('Initializing database for user', 'db');
        
        const success = await initializeDatabase();
        
        if (isMounted) {
          setInitialized(success);
          setError(success ? null : new Error('Failed to initialize database'));
        }
      } catch (err) {
        logger.logError('Database initialization error:', 'db', err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
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
    };
  }, [user, isAuthenticated, initialized, initializing, authLoading]);
  
  // Force re-initialization
  const reinitialize = async () => {
    setInitialized(false);
    setError(null);
    // Re-initialization will be triggered by the effect
  };
  
  return {
    initialized,
    initializing,
    error,
    reinitialize
  };
};

export default useDatabase; 