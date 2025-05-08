'use client';

import supabase from './supabase';
import logger from './logger';
import { toast } from 'react-hot-toast';

/**
 * Creates the products and categories tables and adds sample data
 */
export const createTablesAndSampleData = async () => {
  try {
    // Create categories table
    const { error: categoriesError } = await supabase.rpc('create_products_table_if_not_exists', {});
    
    if (categoriesError) {
      console.error('Error creating products/categories tables:', categoriesError);
      logger.logError('Error creating tables via RPC:', 'db-setup', categoriesError);
      
      // Try direct approach with SQL - only works with admin key
      toast.error('Failed to create tables automatically. Please run SQL setup manually.');
      return false;
    }
    
    logger.logInfo('Tables created successfully', 'db-setup');
    
    // Check if we already have categories
    const { data: existingCategories, error: checkCategoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);
      
    if (checkCategoriesError) {
      console.error('Error checking categories:', checkCategoriesError);
      return false;
    }
    
    // Add sample categories if needed
    if (!existingCategories || existingCategories.length === 0) {
      // Add sample categories
      const { error: insertCategoriesError } = await supabase
        .from('categories')
        .insert([
          { name: 'Fruits & Vegetables', description: 'Fresh produce' },
          { name: 'Dairy & Eggs', description: 'Milk, cheese, and eggs' },
          { name: 'Bakery', description: 'Bread and pastries' },
          { name: 'Beverages', description: 'Drinks and juices' },
          { name: 'Snacks', description: 'Chips, nuts, and other snacks' }
        ]);
        
      if (insertCategoriesError) {
        console.error('Error inserting categories:', insertCategoriesError);
        return false;
      }
      
      logger.logInfo('Sample categories added', 'db-setup');
    }
    
    // Get categories to reference in products
    const { data: categories, error: getCategoriesError } = await supabase
      .from('categories')
      .select('id, name');
      
    if (getCategoriesError || !categories) {
      console.error('Error fetching categories for products:', getCategoriesError);
      return false;
    }
    
    // Map category names to IDs for easy reference
    const categoryMap = categories.reduce((map, category) => {
      map[category.name] = category.id;
      return map;
    }, {});
    
    // Check if we already have products
    const { data: existingProducts, error: checkProductsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
      
    if (checkProductsError) {
      console.error('Error checking products:', checkProductsError);
      return false;
    }
    
    // Add sample products if needed
    if (!existingProducts || existingProducts.length === 0) {
      // Find some category IDs to use
      const fruitsId = categoryMap['Fruits & Vegetables'];
      const dairyId = categoryMap['Dairy & Eggs'];
      const bakeryId = categoryMap['Bakery'];
      
      if (!fruitsId || !dairyId || !bakeryId) {
        console.error('Missing required category IDs');
        return false;
      }
      
      // Add sample products
      const { error: insertProductsError } = await supabase
        .from('products')
        .insert([
          { 
            name: 'Organic Bananas', 
            description: 'Fresh organic bananas, perfect for smoothies or snacking.',
            price: 59.99,
            stock: 50,
            category_id: fruitsId,
            image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmFuYW5hc3xlbnwwfHwwfHx8MA%3D%3D'
          },
          { 
            name: 'Red Apples', 
            description: 'Crisp and sweet red apples, locally sourced.',
            price: 89.99,
            stock: 40,
            category_id: fruitsId,
            image_url: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXBwbGV8ZW58MHx8MHx8fDA%3D'
          },
          { 
            name: 'Full-Fat Milk', 
            description: 'Fresh full-fat milk, 1 liter carton.',
            price: 68.50,
            stock: 25,
            category_id: dairyId,
            image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fG1pbGt8ZW58MHx8MHx8fDA%3D'
          },
          { 
            name: 'Whole Wheat Bread', 
            description: 'Freshly baked whole wheat bread, 400g loaf.',
            price: 45.00,
            stock: 15,
            category_id: bakeryId,
            image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnJlYWR8ZW58MHx8MHx8fDA%3D'
          },
          { 
            name: 'Organic Eggs', 
            description: 'Farm-fresh organic eggs, 6-pack.',
            price: 79.99,
            stock: 30,
            category_id: dairyId,
            image_url: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWdnc3xlbnwwfHwwfHx8MA%3D%3D'
          }
        ]);
        
      if (insertProductsError) {
        console.error('Error inserting products:', insertProductsError);
        return false;
      }
      
      logger.logInfo('Sample products added', 'db-setup');
    }
    
    return true;
  } catch (error) {
    logger.logError('Error in createTablesAndSampleData:', 'db-setup', error);
    console.error('Error creating tables and sample data:', error);
    return false;
  }
};

/**
 * Setup database tables for the products page
 */
export const setupProductsDatabase = async () => {
  try {
    const result = await createTablesAndSampleData();
    if (result) {
      toast.success('Products database setup successfully!');
      return true;
    } else {
      toast.error('Error setting up products database');
      return false;
    }
  } catch (error) {
    logger.logError('Error in setupProductsDatabase:', 'db-setup', error);
    toast.error('Failed to set up products database');
    return false;
  }
}; 