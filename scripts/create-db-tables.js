/**
 * Script to create database tables in Supabase
 * 
 * This is a helper script for development.
 * Run with: node scripts/create-db-tables.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

const createTables = async () => {
  console.log('Creating tables in Supabase...');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '../supabase/migrations/20240508_create_initial_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running SQL migrations...');
    
    // For service role key, we can run arbitrary SQL
    if (supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Error executing SQL:', error);
        // Try alternative approach with individual statements
        console.log('Trying alternative approach...');
        await createTablesManually();
      } else {
        console.log('SQL executed successfully!');
      }
    } else {
      console.log('Using anon key - limited functionality available');
      await createTablesManually();
    }

  } catch (error) {
    console.error('Error:', error);
  }
};

const createTablesManually = async () => {
  try {
    // Try to create profiles table
    console.log('Creating profiles table...');
    const { error: profilesError } = await supabase.rpc('create_profiles_if_not_exists', {});
    
    if (profilesError) {
      console.error('Error creating profiles table:', profilesError);
    } else {
      console.log('Profiles table created successfully!');
    }
    
    // Try to check if profiles table exists
    const { error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.code === '42P01') {
      console.error('Failed to create profiles table. You need to run the SQL manually in the Supabase dashboard.');
      console.log('Instructions:');
      console.log('1. Go to https://app.supabase.io/project/_/sql');
      console.log('2. Create a new query');
      console.log('3. Paste the contents of supabase/migrations/20240508_create_initial_tables.sql');
      console.log('4. Run the query');
    } else {
      console.log('Profiles table exists or was created successfully!');
    }
    
  } catch (error) {
    console.error('Error in manual table creation:', error);
  }
};

// Run the script
createTables()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 