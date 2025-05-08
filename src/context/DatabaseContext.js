'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import toastManager from '../utils/toast-manager';

// Create context
const DatabaseContext = createContext(null);

/**
 * Provider component for database initialization and state
 */
export const DatabaseProvider = ({ children }) => {
  // Use the database hook to handle initialization
  const databaseState = useDatabase();
  
  // Clear any existing error toasts on mount
  useEffect(() => {
    // Wait until after hydration to clear toasts
    const timeoutId = setTimeout(() => {
      toastManager.dismissErrors();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return (
    <DatabaseContext.Provider value={databaseState}>
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Custom hook to use the database context
 * @returns {Object} Database context values
 */
export const useDbContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDbContext must be used within a DatabaseProvider');
  }
  return context;
};

export default DatabaseContext; 