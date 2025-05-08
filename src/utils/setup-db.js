'use client';

import logger from './logger';
import supabase from './supabase';
import toast from 'react-hot-toast';

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
      // If RPC method doesn't exist, try direct SQL (only works with service role key)
      logger.logWarn('Failed to create tables via RPC, trying direct fallback approach', 'db-setup');
      
      // Use the REST API to check if table exists
      const { error: tableCheckError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist - we need to handle this gracefully
        logger.logWarn('Profiles table does not exist, app will use in-memory mode', 'db-setup');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.logError('Error creating tables:', 'db-setup', error);
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
    // Skip if we've attempted too many times in a short period
    const now = Date.now();
    if (initializationAttempts >= MAX_ATTEMPTS && now - lastInitTime < COOLDOWN_PERIOD) {
      logger.logWarn('Too many database initialization attempts, cooling down', 'db-setup');
      return { success: false, error: 'Too many attempts' };
    }
    
    initializationAttempts++;
    lastInitTime = now;

    // Check Supabase connection first
    try {
      // Verify basic connectivity
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.logError('Database connection error:', 'db-setup', error);
        return { 
          success: false, 
          error, 
          message: 'Unable to connect to database. Please check your internet connection.'
        };
      }
      
      logger.logInfo('Database connection verified', 'db-setup');
    } catch (connError) {
      logger.logError('Database connection failed:', 'db-setup', connError);
      return { 
        success: false, 
        error: connError, 
        message: 'Unable to connect to database. Please check your internet connection.'
      };
    }

    // Make sure required tables exist
    const tablesExist = await createTablesIfNotExist();
    if (!tablesExist) {
      logger.logWarn('Required tables do not exist - using memory only mode', 'db-setup');
      // We'll continue without failing, but features may be limited
    }

    // Try to create/update the user profile
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (user) {
        // Only try to create the profile if tables exist
        if (tablesExist) {
          // Use upsert instead of insert to handle both create and update cases
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
            if (upsertError.code === '42P01') {
              // Table doesn't exist, we'll continue in memory-only mode
              logger.logWarn('Profiles table not available, using memory mode', 'db-setup');
            } else {
              logger.logError('Error creating user profile:', 'db-setup', upsertError);
              // We won't fail the setup for this
            }
          } else {
            logger.logInfo('User profile created/updated successfully', 'db-setup');
          }
        }
      }
    } catch (profileError) {
      logger.logError('Error handling user profile:', 'db-setup', profileError);
      // Continue anyway - non-fatal error
    }

    // Success case - even with table issues, we'll return success to allow app to function
    logger.logInfo('Database setup completed', 'db-setup');
    // Reset attempt counter on success
    initializationAttempts = 0;
    return { success: true };
  } catch (error) {
    logger.logError('Error setting up database:', 'db-setup', error);
    return { 
      success: false, 
      error, 
      message: 'Unexpected error during database setup. Check console for details.'
    };
  }
};

/**
 * Initialize database for the current user
 */
export const initializeDatabase = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      logger.logInfo('No authenticated user found for database setup', 'db-setup');
      return false;
    }
    
    const result = await setupDatabase(session.user.id);
    if (!result.success) {
      if (initializationAttempts < MAX_ATTEMPTS) {
        toast.error(result.message || 'Error setting up your account. Some features may not work correctly.', {
          id: 'db-setup-error',
          duration: 5000
        });
      }
      return false;
    }
    
    return true;
  } catch (error) {
    logger.logError('Database initialization error:', 'db-setup', error);
    return false;
  }
}; 