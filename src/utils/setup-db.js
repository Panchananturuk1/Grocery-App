'use client';

import logger from './logger';
import supabase from './supabase';
import toast from 'react-hot-toast';
import toastManager from './toast-manager'; // Use manager for consistency

// Keep track of initialization attempts to prevent spam
let initializationAttempts = 0;
const MAX_ATTEMPTS = 3;
let lastInitTime = 0;
const COOLDOWN_PERIOD = 60000; // 1 minute cooldown

/**
 * Creates tables if they don't exist
 */
const createTablesIfNotExist = async () => {
  try {
    // Create profiles table
    const { error: profilesError } = await supabase.rpc('create_profiles_if_not_exists', {});
    
    if (profilesError) {
      logger.logWarn(`RPC create_profiles_if_not_exists failed (Code: ${profilesError.code}). Checking table presence.`, 'db-setup');
      
      const { error: tableCheckError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      
      if (tableCheckError && tableCheckError.code === '42P01') {
        logger.logError('Profiles table does not exist and RPC failed. Manual setup likely required.', 'db-setup');
        return false;
      } else if (tableCheckError) {
        logger.logError(`Error checking profiles table existence: ${tableCheckError.message}`, 'db-setup');
      }
    }
    return true;
  } catch (error) {
    logger.logError(`Exception creating/checking tables: ${error.message}`, 'db-setup', error);
    return false;
  }
};

/**
 * Sets up the database tables and required schema for OrderKaro
 */
export const setupDatabase = async (userId) => {
  if (!userId) {
    logger.logError('User ID is required to set up database', 'db-setup');
    return { success: false, error: 'User ID is required' };
  }

  try {
    const now = Date.now();
    if (initializationAttempts >= MAX_ATTEMPTS && now - lastInitTime < COOLDOWN_PERIOD) {
      logger.logWarn('Too many database initialization attempts, cooling down', 'db-setup');
      return { success: false, error: 'Too many attempts' };
    }
    
    initializationAttempts++;
    lastInitTime = now;

    // Check Supabase connection first with timeout (this one is okay as it uses AbortController)
    try {
      logger.logDebug('Checking Supabase connection (getSession)', 'db-setup');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const { data, error } = await supabase.auth.getSession({ signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (error) {
        if (error.name === 'AbortError') {
           logger.logWarn('Database connection check (getSession) timed out', 'db-setup');
           return { success: false, error, message: 'Connection check timed out. Please try again.' };
        } else {
          logger.logError('Database connection error (getSession):', 'db-setup', error);
          return { success: false, error, message: 'Unable to verify connection. Please check your network.' };
        }
      }
      logger.logInfo('Database connection verified', 'db-setup');
    } catch (connError) {
      logger.logError('Database connection failed unexpectedly:', 'db-setup', connError);
      return { success: false, error: connError, message: 'Unable to connect to database. An unexpected error occurred.' };
    }

    const tablesExist = await createTablesIfNotExist();
    if (!tablesExist) {
      logger.logError('Required core tables (e.g., profiles) do not exist or could not be created.', 'db-setup');
      return { success: false, error: 'Core tables missing', message: 'Essential database tables are missing. Please run the database setup script or contact support.' };
    }

    try {
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        logger.logWarn('Could not get user data for profile setup:', 'db-setup', getUserError);
      } else {
        const user = userData?.user;
        if (user) {
          logger.logDebug('Attempting to upsert profile for user:', 'db-setup', user.email);
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
            
          if (upsertError) {
            logger.logWarn(`Failed to upsert profile (Code: ${upsertError.code}): ${upsertError.message}`, 'db-setup');
          } else {
            logger.logInfo('User profile created/updated successfully', 'db-setup');
          }
        }
      }
    } catch (profileError) {
      logger.logWarn(`Error during profile handling: ${profileError.message}`, 'db-setup', profileError);
    }

    logger.logInfo('Database setup completed', 'db-setup');
    initializationAttempts = 0;
    return { success: true };

  } catch (error) {
    logger.logError(`Unexpected error during database setup: ${error.message}`, 'db-setup', error);
    return { success: false, error, message: 'An unexpected error occurred during database setup.' };
  }
};

/**
 * Ensures the products table exists
 */
export const ensureProductsTableExists = async () => {
  try {
    logger.logDebug('Ensuring products table exists...', 'db-setup');
    const { error: checkError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    
    if (!checkError) {
      logger.logInfo('Products table exists', 'db-setup');
      return true;
    }
    
    if (checkError.code === '42P01') {
      logger.logWarn('Products table does not exist, attempting to create via RPC...', 'db-setup');
      const { error: rpcError } = await supabase.rpc('create_products_table_if_not_exists', {});
      
      if (rpcError) {
        logger.logError(`Failed to create products table via RPC: ${rpcError.message}`, 'db-setup', rpcError);
        return false;
      } else {
        logger.logInfo('Products table created successfully via RPC', 'db-setup');
        return true;
      }
    } else {
      logger.logError(`Error checking products table: ${checkError.message}`, 'db-setup', checkError);
      return false;
    }
  } catch (error) {
    logger.logError(`Exception ensuring products table exists: ${error.message}`, 'db-setup', error);
    return false;
  }
};

/**
 * Initialize database for the current user
 */
export const initializeDatabase = async () => {
  try {
    logger.logDebug('Initializing database...', 'db-setup');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession({ signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (sessionError) {
       if (sessionError.name === 'AbortError') {
         logger.logWarn('Initial getSession timed out', 'db-setup');
       } else {
         logger.logError('Error getting session during initialization:', 'db-setup', sessionError);
       }
       return false;
    }
    
    if (!session || !session.user) {
      logger.logInfo('No authenticated user session found for database setup', 'db-setup');
      return false;
    }
    
    const result = await setupDatabase(session.user.id);
    
    if (!result.success) {
      logger.logWarn('setupDatabase failed.', 'db-setup', result.error);
      if (initializationAttempts <= MAX_ATTEMPTS) {
        toastManager.error(result.message || 'Error setting up your account.', {
          id: 'db-setup-error',
          duration: 6000
        });
      }
      return false;
    }
    
    const productsTableOk = await ensureProductsTableExists();
    if (!productsTableOk) {
       logger.logWarn('Products table check/creation failed. Product features may be limited.', 'db-setup');
    }
    
    logger.logInfo('Database initialization sequence completed successfully.', 'db-setup');
    return true;

  } catch (error) {
    logger.logError(`Top-level database initialization error: ${error.message}`, 'db-setup', error);
    return false;
  }
}; 