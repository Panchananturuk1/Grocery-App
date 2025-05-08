'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
// Removed unused: useSearchParams
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/products/ProductCard';
import supabase from '../../utils/supabase';
// Removed unused: queryCache
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'; // Keep only needed icons
import toastManager from '../../utils/toast-manager'; 
// Removed unused: initializeDatabase (assuming context handles this)
import logger from '../../utils/logger';

function ProductsContent() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simplified fetch function
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    logger.logInfo('ProductsPage: Fetching all products...');

    try {
      // Basic query to get all products, select specific fields
      const { data, error: queryError } = await supabase
        .from('products')
        .select('id, name, price, image_url, description') // Removed stock
        .order('created_at', { ascending: false }); // Keep basic sort

      if (queryError) {
        throw queryError; // Let the catch block handle it
      }

      logger.logInfo('ProductsPage: Products data received:', data ? `${data.length} products` : 'No data');
      setProducts(data || []);

    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      logger.logError('ProductsPage: Error fetching products:', { message: errorMessage, code: error.code, details: error });
      
      const displayError = `Failed to load products: ${errorMessage.substring(0, 150)}`;
      setError(displayError);
      toastManager.error(displayError, { id: 'products-fetch-error', duration: 7000 });
      setProducts([]); // Clear products on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRetry = () => {
    fetchProducts(); // Simple retry, fetches again
  };

  // Simplified Render Logic
  return (
    <div className="w-full">
      {loading ? (
        <div className="text-center py-12">
          <FiRefreshCw className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg p-6">
          <FiAlertTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">Oops! Something went wrong.</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRetry} 
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 flex items-center mx-auto"
          >
            <FiRefreshCw className="mr-2" /> Try Again
          </button>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {/* Removed Search Icon as search is removed */}
          <h3 className="text-xl font-semibold text-gray-600">No products found</h3>
          <p className="text-gray-500 mt-2">There are currently no products available.</p>
          {/* Removed Clear Filters button */}
        </div>
      )}
    </div>
  );
}

// Loading component (remains the same)
function ProductsLoading() {
  return (
    <div className="w-full">
        <div className="mb-8 p-4 bg-white rounded-lg shadow animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div className="w-full h-40 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
            ))}
        </div>
    </div>
  );
}

// Main page component (remains the same)
export default function ProductsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Our Products</h1>
        </div>
        <Suspense fallback={<ProductsLoading />}>
          <ProductsContent />
        </Suspense>
      </div>
    </MainLayout>
  );
} 