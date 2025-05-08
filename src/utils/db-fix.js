'use client';

import supabase from './supabase';
import logger from './logger';
import { toast } from 'react-hot-toast';

/**
 * Creates the check function in Supabase that verifies if other functions exist
 */
const createCheckFunction = async () => {
  try {
    // Try direct SQL execution to create the check function
    // This will only work if you have the right permissions
    const { data, error } = await supabase.rpc('admin_create_sql_check_function', {});
    
    if (error) {
      console.error('Could not create check function:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception creating check function:', error);
    return false;
  }
};

/**
 * Direct SQL to create categories table
 */
const createCategoriesTable = async () => {
  try {
    // Attempt to create the categories table directly
    const { data, error } = await supabase.rpc('create_categories_table_direct', {});
    
    if (error) {
      console.error('Error creating categories table:', error);
      
      // Try emergency direct creation if we have enough permissions
      const { error: emergencyError } = await supabase.rpc('admin_create_categories_table', {});
      
      if (emergencyError) {
        console.error('Failed emergency categories table creation:', emergencyError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Exception creating categories table:', error);
    return false;
  }
};

/**
 * Direct SQL to create products table
 */
const createProductsTable = async () => {
  try {
    // Attempt to create the products table directly
    const { data, error } = await supabase.rpc('create_products_table_direct', {});
    
    if (error) {
      console.error('Error creating products table:', error);
      
      // Try emergency direct creation if we have enough permissions
      const { error: emergencyError } = await supabase.rpc('admin_create_products_table', {});
      
      if (emergencyError) {
        console.error('Failed emergency products table creation:', emergencyError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Exception creating products table:', error);
    return false;
  }
};

/**
 * Add sample data to tables
 */
const addSampleData = async () => {
  try {
    // Check if categories exist
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(10);
    
    if (categoriesError) {
      console.error('Error checking categories:', categoriesError);
      return false;
    }
    
    // Add sample categories if needed
    if (!categories || categories.length === 0) {
      const { error: insertError } = await supabase
        .from('categories')
        .insert([
          { name: 'Fruits', description: 'Fresh fruits' },
          { name: 'Vegetables', description: 'Fresh vegetables' },
          { name: 'Dairy', description: 'Milk, cheese, and eggs' },
          { name: 'Bakery', description: 'Bread and baked goods' },
          { name: 'Beverages', description: 'Drinks and juices' }
        ]);
      
      if (insertError) {
        console.error('Error adding sample categories:', insertError);
        return false;
      }
      
      console.log('Sample categories added successfully');
    } else {
      console.log('Categories already exist:', categories.length);
    }
    
    // Fetch categories again to get IDs
    const { data: updatedCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(10);
    
    if (fetchError || !updatedCategories || updatedCategories.length === 0) {
      console.error('Error fetching updated categories:', fetchError);
      return false;
    }
    
    // Check if products exist
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (productsError && productsError.code !== '42P01') {
      console.error('Error checking products:', productsError);
      return false;
    }
    
    // Only add products if the table exists but is empty
    if ((!products || products.length === 0) && !productsError) {
      // Map categories to easily find IDs
      const categoryMap = {};
      updatedCategories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      });
      
      // Sample products to add
      const sampleProducts = [
        { 
          name: 'Apples', 
          description: 'Fresh red apples', 
          price: 79.99, 
          stock: 100,
          category_id: categoryMap['fruits'] || updatedCategories[0].id,
          image_url: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXBwbGV8ZW58MHx8MHx8fDA%3D'
        },
        { 
          name: 'Bananas', 
          description: 'Fresh yellow bananas', 
          price: 49.99, 
          stock: 150,
          category_id: categoryMap['fruits'] || updatedCategories[0].id,
          image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmFuYW5hc3xlbnwwfHwwfHx8MA%3D%3D'
        },
        { 
          name: 'Milk', 
          description: 'Fresh whole milk, 1L', 
          price: 59.99, 
          stock: 50,
          category_id: categoryMap['dairy'] || updatedCategories[2].id,
          image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fG1pbGt8ZW58MHx8MHx8fDA%3D'
        }
      ];
      
      // Insert sample products
      const { error: insertProductsError } = await supabase
        .from('products')
        .insert(sampleProducts);
      
      if (insertProductsError) {
        console.error('Error adding sample products:', insertProductsError);
        return false;
      }
      
      console.log('Sample products added successfully');
    } else {
      console.log('Products already exist or table missing');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding sample data:', error);
    return false;
  }
};

/**
 * Check if SQL functions exist
 */
const checkRpcFunctions = async () => {
  try {
    // Try to call a simple function to check if RPC functions are set up
    const { data, error } = await supabase.rpc('check_function_exists', {
      function_name: 'create_products_table_if_not_exists'
    });
    
    if (error) {
      console.error('RPC function check failed:', error);
      
      // Try to create the check function
      await createCheckFunction();
      
      // Try one more time
      const { data: retryData, error: retryError } = await supabase.rpc('check_function_exists', {
        function_name: 'create_products_table_if_not_exists'
      });
      
      if (retryError) {
        console.error('RPC function check failed after creating check function:', retryError);
        return false;
      }
      
      return retryData;
    }
    
    return data;
  } catch (error) {
    console.error('Exception checking RPC functions:', error);
    return false;
  }
};

/**
 * Check for RLS issues on tables
 */
const checkRlsIssues = async () => {
  try {
    console.log('Checking for RLS issues...');
    
    // Test anonymous access to categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .single();
    
    // Test anonymous access to products
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
      .single();
    
    const hasRlsIssues = {
      categories: catError && catError.message.includes('API key'),
      products: prodError && prodError.message.includes('API key')
    };
    
    console.log('RLS check results:', {
      categories: {
        hasIssue: hasRlsIssues.categories,
        error: catError ? catError.message : null
      },
      products: {
        hasIssue: hasRlsIssues.products,
        error: prodError ? prodError.message : null
      }
    });
    
    return hasRlsIssues;
  } catch (error) {
    console.error('Error checking RLS issues:', error);
    return {
      categories: true,
      products: true,
      error: error.message
    };
  }
};

/**
 * Diagnose connection issues and table problems
 */
export const diagnoseDatabaseIssues = async () => {
  const results = {
    connection: false,
    tables: {
      categories: false,
      products: false
    },
    rpcFunctions: false,
    rlsIssues: {
      categories: false,
      products: false
    },
    errors: []
  };
  
  try {
    // Check basic connection
    try {
      const { data, error } = await supabase.auth.getSession();
      results.connection = !error;
      
      if (error) {
        results.errors.push(`Connection error: ${error.message}`);
      }
    } catch (connError) {
      results.errors.push(`Connection exception: ${connError.message}`);
    }
    
    // Check if tables exist
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      results.tables.categories = !categoriesError;
      
      if (categoriesError && categoriesError.code === '42P01') {
        results.errors.push('Categories table does not exist');
      } else if (categoriesError) {
        results.errors.push(`Categories error: ${categoriesError.message}`);
      }
    } catch (error) {
      results.errors.push(`Categories check exception: ${error.message}`);
    }
    
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      results.tables.products = !productsError;
      
      if (productsError && productsError.code === '42P01') {
        results.errors.push('Products table does not exist');
      } else if (productsError) {
        results.errors.push(`Products error: ${productsError.message}`);
      }
    } catch (error) {
      results.errors.push(`Products check exception: ${error.message}`);
    }
    
    // Check RPC functions
    results.rpcFunctions = await checkRpcFunctions();
    
    // Check for RLS issues
    if (results.tables.categories || results.tables.products) {
      const rlsIssues = await checkRlsIssues();
      results.rlsIssues = rlsIssues;
      
      if (rlsIssues.categories) {
        results.errors.push('Categories table has RLS permission issues (API key error)');
      }
      
      if (rlsIssues.products) {
        results.errors.push('Products table has RLS permission issues (API key error)');
      }
    }
    
    return results;
  } catch (error) {
    results.errors.push(`Diagnosis exception: ${error.message}`);
    return results;
  }
};

/**
 * Attempts to fix RLS policies for products and categories
 */
const fixRlsPolicies = async () => {
  try {
    console.log('Attempting to fix RLS policies...');
    
    // First try to fix categories RLS
    const { error: catError } = await supabase.rpc('fix_categories_rls_policies', {});
    
    if (catError) {
      console.error('Error fixing categories RLS policies:', catError);
      
      // Try direct approach for categories
      const { error: directCatError } = await supabase.rpc('set_public_categories_policy', {});
      if (directCatError) {
        console.error('Error with direct categories RLS fix:', directCatError);
        return false;
      }
    }
    
    // Then try to fix products RLS
    const { error: prodError } = await supabase.rpc('fix_products_rls_policies', {});
    
    if (prodError) {
      console.error('Error fixing products RLS policies:', prodError);
      
      // Try direct approach for products
      const { error: directProdError } = await supabase.rpc('set_public_products_policy', {});
      if (directProdError) {
        console.error('Error with direct products RLS fix:', directProdError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Exception fixing RLS policies:', error);
    return false;
  }
};

/**
 * Fix database setup issues
 */
export const fixDatabaseIssues = async () => {
  try {
    // First diagnose the issues
    const diagnosis = await diagnoseDatabaseIssues();
    console.log('Database diagnosis:', diagnosis);
    
    // Check if we have connection
    if (!diagnosis.connection) {
      toast.error('Cannot fix database: No connection to Supabase');
      return false;
    }
    
    // If check function is missing, try to create it first
    if (!diagnosis.rpcFunctions) {
      toast.loading('Attempting to create SQL check function...', { id: 'check-fn' });
      const checkFnResult = await createCheckFunction();
      
      if (checkFnResult) {
        toast.success('Created SQL check function', { id: 'check-fn' });
        
        // Re-diagnose to see if it worked
        const updatedDiagnosis = await diagnoseDatabaseIssues();
        diagnosis.rpcFunctions = updatedDiagnosis.rpcFunctions;
      } else {
        toast.error('Could not create SQL check function', { id: 'check-fn' });
      }
    }
    
    // If we don't have RPC functions, we can't fix automatically
    if (!diagnosis.rpcFunctions) {
      toast.error('SQL functions not found. Please set up SQL functions in Supabase');
      return false;
    }
    
    // Fix missing tables
    let tablesFixed = true;
    
    if (!diagnosis.tables.categories) {
      toast.loading('Creating categories table...', { id: 'create-categories' });
      const categoryResult = await createCategoriesTable();
      tablesFixed = tablesFixed && categoryResult;
      
      if (categoryResult) {
        toast.success('Categories table created', { id: 'create-categories' });
      } else {
        toast.error('Failed to create categories table', { id: 'create-categories' });
      }
    }
    
    if (!diagnosis.tables.products) {
      toast.loading('Creating products table...', { id: 'create-products' });
      const productsResult = await createProductsTable();
      tablesFixed = tablesFixed && productsResult;
      
      if (productsResult) {
        toast.success('Products table created', { id: 'create-products' });
      } else {
        toast.error('Failed to create products table', { id: 'create-products' });
      }
    }
    
    // Add sample data if tables were fixed
    if (tablesFixed) {
      toast.loading('Adding sample data...', { id: 'sample-data' });
      const dataResult = await addSampleData();
      
      if (dataResult) {
        toast.success('Sample data added', { id: 'sample-data' });
      } else {
        toast.error('Failed to add sample data', { id: 'sample-data' });
      }
    }
    
    // Fix RLS policies regardless of whether tables were just created
    // This helps with "No API key found in request" errors
    toast.loading('Fixing table permissions...', { id: 'fix-rls' });
    const rlsResult = await fixRlsPolicies();
    
    if (rlsResult) {
      toast.success('Table permissions fixed', { id: 'fix-rls' });
    } else {
      toast.error('Failed to fix table permissions', { id: 'fix-rls' });
    }
    
    // Final diagnosis to confirm fix
    const finalDiagnosis = await diagnoseDatabaseIssues();
    const allFixed = finalDiagnosis.tables.categories && finalDiagnosis.tables.products;
    
    if (allFixed) {
      toast.success('Database issues fixed! Refresh the page.');
      return true;
    } else {
      toast.error('Some database issues could not be fixed');
      return false;
    }
  } catch (error) {
    console.error('Error fixing database issues:', error);
    toast.error(`Error fixing database: ${error.message}`);
    return false;
  }
}; 