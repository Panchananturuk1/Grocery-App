'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/products/ProductCard';
import supabase from '../../utils/supabase';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  const initialSearch = searchParams.get('search');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [priceRange, setPriceRange] = useState([0, 10000]); // Default price range
  const [sortBy, setSortBy] = useState('newest'); // Default sort

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    }
    
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, priceRange, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
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
      
      const { data, error } = await query;
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 10000]);
    setSortBy('newest');
    setSearchQuery('');
  };

  const toggleFilters = () => {
    setFilterOpen(!filterOpen);
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">All Products</h1>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  <h2 className="text-xl font-semibold">Filters</h2>
                  <button
                    onClick={clearFilters}
                    className="text-green-600 text-sm hover:text-green-700 flex items-center"
                  >
                    <FiX className="mr-1" /> Clear All
                  </button>
                </div>
                
                {/* Categories Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Categories</h3>
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
                      <label htmlFor="all-categories" className="ml-2 block text-sm text-gray-700">
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
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Price Range</h3>
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
                  <h3 className="text-lg font-medium mb-2">Sort By</h3>
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