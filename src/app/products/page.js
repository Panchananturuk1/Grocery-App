'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/products/ProductCard';
import supabase from '../../utils/supabase';
import queryCache from '../../utils/cache-util';
import { FiSearch, FiFilter, FiX, FiRefreshCw, FiDatabase, FiInfo, FiWifi } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { initializeDatabase } from '../../utils/setup-db';
import { setupProductsDatabase } from '../../utils/create-tables';
import logger from '../../utils/logger';

// Detect environment
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Connection diagnostic component
function ConnectionDiagnostics({ isVisible }) {
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      // Get connection stats
      const connectionStats = supabase.getConnectionStats();
      setStats(connectionStats);
    }
  }, [isVisible]);
  
  if (!isVisible || !stats) return null;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm">
      <div className="flex justify-between items-center">
        <h4 className="font-medium flex items-center">
          <FiWifi className="mr-2" /> Connection Diagnostics 
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200">
            {stats.environment}
          </span>
        </h4>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 text-xs"
        >
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {expanded ? (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white p-2 rounded shadow-sm">
              <p className="text-xs font-medium">Query Performance</p>
              <ul className="text-xs mt-1">
                <li>Success Rate: {stats.queries.successRate}%</li>
                <li>Avg. Duration: {stats.queries.avgDuration}ms</li>
                <li>Slow Queries: {stats.queries.slowQueries}</li>
              </ul>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <p className="text-xs font-medium">Connection Health</p>
              <ul className="text-xs mt-1">
                <li>Success Rate: {stats.connection.successRate}%</li>
                <li>Avg. Ping: {stats.connection.avgDuration}ms</li>
              </ul>
            </div>
          </div>
          
          {stats.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium">Recommendations:</p>
              <ul className="text-xs mt-1 list-disc pl-4 space-y-1">
                {stats.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-3 text-xs">
            <p><strong>Note:</strong> {isLocalhost 
              ? "Local development may experience different connection patterns than production."
              : "Supabase free tier has limited connections and may experience timeouts during high load or after periods of inactivity."
            }</p>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-700">
          {stats.recommendations.length > 0
            ? `${stats.recommendations[0]} ${stats.recommendations.length > 1 ? `(+${stats.recommendations.length - 1} more)` : ''}`
            : isLocalhost 
              ? 'Local connection appears stable.'
              : 'No specific issues detected with production connection.'}
        </div>
      )}
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  const initialSearch = searchParams.get('search');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [refetchCount, setRefetchCount] = useState(0);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [priceRange, setPriceRange] = useState([0, 10000]); // Default price range
  const [sortBy, setSortBy] = useState('newest'); // Default sort

  // Ensure database is initialized
  useEffect(() => {
    const setupDb = async () => {
      try {
        await initializeDatabase();
      } catch (err) {
        logger.logError('Error initializing database from products page:', err);
      }
    };
    
    setupDb();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        console.log('Fetching categories...');
        
        // Check cache first
        const cachedCategories = queryCache.get('categories', { sort: 'name' });
        if (cachedCategories) {
          console.log('Using cached categories data');
          setCategories(cachedCategories);
          return;
        }
        
        // Use environment-appropriate timeout 
        const timeoutMs = isLocalhost ? 15000 : 30000;
        
        // Use optimized supabase client
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')
          .withTimeout(timeoutMs)
          .withRetry(isLocalhost ? 2 : 3, 2000);
        
        if (error) {
          console.error('Categories error details:', error);
          throw error;
        }
        
        console.log('Categories data:', data ? `Found ${data.length} categories` : 'No data returned');
        
        // Store in cache
        if (data) {
          queryCache.set('categories', { sort: 'name' }, data);
        }
        
        setCategories(data || []);
      } catch (error) {
        // Better error handling
        const errorMessage = error.message || 'Unknown error';
        const errorCode = error.code || 'No error code';
        console.error('Error fetching categories:', error);
        console.error('Error details:', { message: errorMessage, code: errorCode });
        
        // Show a more detailed error message
        toast.error(`Failed to load categories: ${errorMessage}`);
        
        // Set empty categories to avoid null issues
        setCategories([]);
      }
    }
    
    fetchCategories();
  }, []);

  useEffect(() => {
    // Add debounce to prevent multiple fetches when filters change rapidly
    const debounceTimer = setTimeout(() => {
      if (Date.now() - lastFetchTime > 500) { // Only fetch if last fetch was >500ms ago
        fetchProducts();
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, priceRange, sortBy, searchQuery, lastFetchTime]);

  const fetchProducts = useCallback(async () => {
    // Don't fetch if we've recently fetched
    if (Date.now() - lastFetchTime < 500 && refetchCount > 0) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setLastFetchTime(Date.now());
    setRefetchCount(prev => prev + 1);
    
    // Create cache parameters
    const cacheParams = {
      category: selectedCategory,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      search: searchQuery,
      sort: sortBy
    };
    
    // Check cache first (only use cache if not forcing refresh)
    if (refetchCount > 1) {
      const cachedProducts = queryCache.get('products', cacheParams);
      if (cachedProducts) {
        console.log('Using cached products data');
        setProducts(cachedProducts);
        setLoading(false);
        return;
      }
    }
    
    try {
      console.log('Fetching products...');
      
      let query = supabase
        .from('products')
        .select('*, categories(name)');
      
      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      // Apply price filter
      query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
      
      // Apply search if exists
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      console.log('Executing products query...');
      
      // Use environment-appropriate settings
      const timeoutMs = isLocalhost ? 20000 : 45000;
      const retries = isLocalhost ? 3 : 4;
      
      // Add improvements to the query
      const { data, error } = await query
        .withTimeout(timeoutMs)
        .withRetry(retries, 2000);
      
      if (error) {
        // Full error logging
        console.error('Products error details:', error);
        
        // Check for specific errors
        if (error.code === '42P01') {
          // Table doesn't exist error
          console.error('Products table does not exist!');
          throw new Error('Products table does not exist. Please run the database setup script.');
        } else if (error.code === 'PGRST116') {
          // Foreign key constraint error
          throw new Error('Database relationship error. Category may not exist.');
        } else if (error.message && error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else if (error.message && error.message.includes('timeout')) {
          throw new Error('Request timed out. Supabase may be experiencing high latency or connection issues.');
        } else {
          throw error;
        }
      }
      
      console.log('Products data:', data ? `Found ${data.length} products` : 'No data returned');
      
      // Store in cache if we got data
      if (data) {
        queryCache.set('products', cacheParams, data);
      }
      
      // Set products data
      setProducts(data || []);
    } catch (error) {
      // Improved error handling
      const errorMessage = error.message || 'Unknown error';
      const errorCode = error.code || 'No error code';
      console.error('Error fetching products details:', { message: errorMessage, code: errorCode });
      
      // Set appropriate error message based on the error
      if (errorMessage.includes('timeout')) {
        setError('Database connection is slow. This is common with Supabase free tier. Try refreshing or waiting a few minutes.');
      } else if (errorMessage.includes('table does not exist')) {
        setError('Products table does not exist. Please use the Setup Database button below.');
      } else {
        setError(`Failed to load products: ${errorMessage}`);
      }
      
      toast.error('Database connection issue', {
        duration: 5000,
        id: 'db-error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, priceRange, sortBy, searchQuery, lastFetchTime, refetchCount]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Force immediate refetch and clear search cache
    setLastFetchTime(0);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 10000]);
    setSortBy('newest');
    setSearchQuery('');
    // Force refresh when clearing filters
    setLastFetchTime(0);
  };

  const toggleFilters = () => {
    setFilterOpen(!filterOpen);
  };

  const handleRetry = () => {
    // Clear cache and force refresh
    queryCache.clear('products');
    setLastFetchTime(0);
  };
  
  const handleDatabaseSetup = async () => {
    setLoading(true);
    setError('Setting up database...');
    
    try {
      // Initialize basic database structure
      await initializeDatabase();
      
      // Setup products database with sample data
      const success = await setupProductsDatabase();
      
      if (success) {
        setError(null);
        // Wait a moment for DB operations to complete
        setTimeout(() => {
          fetchProducts();
        }, 1000);
      } else {
        setError('Failed to set up database. See console for details.');
      }
    } catch (err) {
      console.error('Database setup error:', err);
      setError('Database setup failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-black mb-6">All Products</h1>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={toggleFilters}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center md:hidden"
                >
                  <FiFilter className="mr-2" /> Filters
                </button>
              </div>
            </form>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className={`md:block ${filterOpen ? 'block' : 'hidden'} md:w-1/4`}>
              <div className="bg-white rounded-lg shadow p-4 sticky top-24">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-black">Filters</h2>
                  <button
                    onClick={clearFilters}
                    className="text-green-600 text-sm hover:text-green-700 flex items-center"
                  >
                    <FiX className="mr-1" /> Clear All
                  </button>
                </div>
                
                {/* Categories Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-black mb-2">Categories</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="all-categories"
                        type="radio"
                        name="category"
                        checked={selectedCategory === ''}
                        onChange={() => setSelectedCategory('')}
                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor="all-categories" className="ml-2 block text-sm text-black">
                        All Categories
                      </label>
                    </div>
                    
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center">
                        <input
                          id={`category-${category.id}`}
                          type="radio"
                          name="category"
                          checked={selectedCategory === category.id}
                          onChange={() => setSelectedCategory(category.id)}
                          className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="ml-2 block text-sm text-black"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-black mb-2">Price Range</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* Sort By */}
                <div>
                  <h3 className="text-lg font-medium text-black mb-2">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Products Grid */}
            <div className="md:w-3/4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-4 h-80 animate-pulse">
                      <div className="h-40 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-full mt-auto"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Products</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleRetry}
                      className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      <FiRefreshCw className="mr-2" /> Retry
                    </button>
                    
                    {error.includes('table does not exist') && (
                      <button
                        onClick={handleDatabaseSetup}
                        className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 flex items-center justify-center"
                        disabled={loading}
                      >
                        <FiDatabase className="mr-2" /> Setup Database
                      </button>
                    )}
                    
                    <a
                      href="/database-fix"
                      className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                    >
                      <FiDatabase className="mr-2" /> Database Diagnostics
                    </a>
                  </div>
                  
                  {/* Add connection diagnostics */}
                  {error.includes('connection is slow') && <ConnectionDiagnostics isVisible={true} />}
                  
                  {/* Show SQL instructions if needed */}
                  {error.includes('table does not exist') && (
                    <div className="mt-6 text-left bg-gray-100 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">Database Setup Required</h4>
                      <p className="text-sm mb-2">
                        You need to set up the database tables. Please visit the 
                        <a href="/database-fix" className="text-blue-600 hover:text-blue-800 mx-1">Database Diagnostics</a>
                        page for guided setup.
                      </p>
                    </div>
                  )}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-600">No products found</h3>
                  <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Loading fallback component
function ProductsLoading() {
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">All Products</h1>
          <div className="bg-white rounded-lg shadow p-4 mb-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4 h-80 animate-pulse">
                <div className="h-40 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full mt-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
} 