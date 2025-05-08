'use client';

import supabase from './supabase';
import { toast } from 'react-hot-toast';

/**
 * Check if anonymous access to categories and products is working
 */
export const checkAnonymousAccess = async () => {
  console.log('Checking anonymous database access...');
  
  try {
    // Check categories access
    console.log('Testing categories access...');
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);
    
    if (catError) {
      console.error('Categories access error:', catError);
      if (catError.message.includes('API key')) {
        return {
          success: false,
          table: 'categories',
          error: catError.message,
          isRlsIssue: true
        };
      }
      return {
        success: false,
        table: 'categories',
        error: catError.message,
        isRlsIssue: false
      };
    }
    
    // Check products access
    console.log('Testing products access...');
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (prodError) {
      console.error('Products access error:', prodError);
      if (prodError.message.includes('API key')) {
        return {
          success: false,
          table: 'products',
          error: prodError.message,
          isRlsIssue: true
        };
      }
      return {
        success: false,
        table: 'products',
        error: prodError.message,
        isRlsIssue: false
      };
    }
    
    // Both checks passed
    console.log('Anonymous access is working properly');
    console.log('Categories data:', catData);
    console.log('Products data:', prodData);
    
    return {
      success: true,
      categories: catData?.length || 0,
      products: prodData?.length || 0
    };
  } catch (error) {
    console.error('Error checking anonymous access:', error);
    return {
      success: false,
      error: error.message,
      isRlsIssue: false
    };
  }
};

/**
 * Show diagnostic toast messages based on access check results
 */
export const runAccessCheck = async () => {
  const result = await checkAnonymousAccess();
  
  if (result.success) {
    toast.success(`Database access OK. Found ${result.categories} categories and ${result.products} products.`);
    return true;
  } else {
    if (result.isRlsIssue) {
      toast.error(`RLS issue with ${result.table}: ${result.error}`, { 
        duration: 6000,
        id: 'rls-error'
      });
      
      // Show help toast
      setTimeout(() => {
        toast(
          "Run SQL scripts from fix-rls-policies.sql in your Supabase dashboard to fix RLS issues",
          { 
            icon: '💡',
            duration: 8000,
            id: 'rls-help'
          }
        );
      }, 1000);
    } else {
      toast.error(`Database error: ${result.error}`);
    }
    return false;
  }
};

/**
 * Fix common issues by forcing a refresh of client credentials
 */
export const attemptClientFix = async () => {
  try {
    // Force reloading the Supabase client
    localStorage.removeItem('sb:session');
    
    // Clear any in-memory cache
    sessionStorage.clear();
    
    // Try to reconnect
    const { data, error } = await supabase.auth.refreshSession();
    
    // Reload the page to apply changes
    toast.success('Credentials reset. Reloading page...', {
      id: 'reload-toast',
      duration: 2000
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('Failed to fix client:', error);
    toast.error('Could not reset client. Try manual page refresh.');
    return false;
  }
}; 