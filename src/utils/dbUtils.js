import supabase from './supabase';
import logger from './logger';

/**
 * Checks if the profiles table exists
 * @returns {Promise<boolean>} True if table exists, false otherwise
 */
export const profilesTableExists = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // If error code is 42P01, table doesn't exist
    if (error && error.code === '42P01') {
      logger.logWarn('Profiles table does not exist in the database', 'db');
      return false;
    }
    
    // Table exists (even if no rows or other errors)
    return true;
  } catch (error) {
    logger.logError('Error checking if profiles table exists:', 'db', error);
    return false;
  }
};

/**
 * Checks if a profile exists for the given user ID
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} True if profile exists, false otherwise
 */
export const profileExists = async (userId) => {
  try {
    // First check if table exists
    const tableExists = await profilesTableExists();
    if (!tableExists) {
      logger.logWarn(`Can't check if profile exists - table doesn't exist`, 'db');
      return false;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error) {
      // Don't log for not found errors
      if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
        return false;
      }
      
      // Log other errors
      logger.logError('Error checking if profile exists:', 'db', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    logger.logError('Error checking if profile exists:', 'db', error);
    return false;
  }
};

/**
 * Creates a profile for a user
 * @param {object} profile - The profile data to insert
 * @returns {Promise<object>} Result with data and error properties
 */
export const createProfile = async (profile) => {
  try {
    // First check if table exists
    const tableExists = await profilesTableExists();
    if (!tableExists) {
      logger.logWarn(`Can't create profile - table doesn't exist`, 'db');
      return { 
        data: null, 
        error: { message: 'Profiles table does not exist' },
        tableExists: false
      };
    }
    
    // First check if profile already exists
    const exists = await profileExists(profile.id);
    if (exists) {
      return { data: null, error: { message: 'Profile already exists' } };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select();
    
    return { data, error, tableExists: true };
  } catch (error) {
    logger.logError('Error creating profile:', 'db', error);
    return { data: null, error };
  }
};

/**
 * Gets a user's profile
 * @param {string} userId - The user ID
 * @returns {Promise<object>} The user profile or null
 */
export const getUserProfile = async (userId) => {
  try {
    // First check if table exists
    const tableExists = await profilesTableExists();
    if (!tableExists) {
      logger.logWarn(`Can't get profile - table doesn't exist`, 'db');
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      logger.logError('Error getting user profile:', 'db', error);
      return null;
    }
    
    return data;
  } catch (error) {
    logger.logError('Error in getUserProfile:', 'db', error);
    return null;
  }
}; 