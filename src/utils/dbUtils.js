import supabase from './supabase';

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
      return false;
    }
    
    // Table exists (even if no rows or other errors)
    return true;
  } catch (error) {
    console.error('Error checking if profiles table exists:', error);
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error) {
      // 406 is "Not Acceptable" - returned when no matching rows found
      if (error.code === '406' || error.message?.includes('No rows found')) {
        return false;
      }
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking if profile exists:', error);
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
    // First check if profile already exists
    const exists = await profileExists(profile.id);
    if (exists) {
      return { data: null, error: { message: 'Profile already exists' } };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile);
    
    return { data, error };
  } catch (error) {
    console.error('Error creating profile:', error);
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}; 