'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabase';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const auth = useAuth();
  
  // Update authentication state whenever auth changes
  useEffect(() => {
    const updateAuthState = async () => {
      try {
        // First check context
        if (auth?.user) {
          setIsAuthenticated(true);
          console.log("Home page: User authenticated from context:", auth.user.email);
          return;
        }
        
        // Fallback to direct Supabase check
        const { data: { session } } = await supabase.auth.getSession();
        const isLoggedIn = !!session;
        setIsAuthenticated(isLoggedIn);
        
        if (isLoggedIn) {
          console.log("Home page: User authenticated from Supabase session:", session.user.email);
        } else {
          console.log("Home page: User not authenticated");
        }
      } catch (err) {
        console.error("Home page auth check error:", err);
        setIsAuthenticated(false);
      }
    };
    
    // Check immediately when component mounts or auth changes
    updateAuthState();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Home page: Auth state change:", event);
        const isLoggedIn = !!session;
        setIsAuthenticated(isLoggedIn);
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [auth, auth?.user]);
  
  // Sample products data - in a real app this would come from your API
  const featuredProducts = [
    {
      id: 1,
      name: 'Fresh Organic Apples',
      price: 120,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      category: 'Fruits',
    },
    {
      id: 2,
      name: 'Fresh Carrots',
      price: 50,
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      category: 'Vegetables',
    },
    {
      id: 3,
      name: 'Whole Wheat Bread',
      price: 35,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      category: 'Bakery',
    },
    {
      id: 4,
      name: 'Organic Milk',
      price: 60,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      category: 'Dairy',
    },
  ];

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-green-50 to-white min-h-screen">
        {/* Database Diagnostic Banner */}
        <div className="bg-blue-50 py-2 px-4">
          <div className="container mx-auto max-w-6xl flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Having trouble loading products or categories? 
            </p>
            <Link href="/diagnostics" className="text-sm text-blue-600 font-medium hover:text-blue-800">
              Run Database Diagnostics →
            </Link>
          </div>
        </div>
        
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
                  Fresh Groceries Delivered To Your Doorstep
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Shop from a wide selection of fresh fruits, vegetables, dairy products, and more. 
                  Get them delivered to you in no time!
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/products" 
                    className="bg-green-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-green-700 transition-colors">
                    Shop Now
                  </Link>
                  {!isAuthenticated && (
                    <Link href="/login" 
                      className="bg-white text-green-600 border border-green-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-green-50 transition-colors">
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Fresh Groceries"
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Shop By Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <Link href={`/categories/${category.slug}`} key={category.id} 
                  className="bg-green-50 rounded-lg p-4 text-center transition-transform hover:scale-105">
                  <div className="bg-white rounded-full p-4 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                    <img src={category.icon} alt={category.name} className="w-12 h-12" />
                  </div>
                  <h3 className="font-medium text-gray-800">{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* Featured Products */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-medium text-lg text-gray-800 mb-2">{product.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-bold">₹{product.price}</span>
                      <button className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Why Choose Us */}
        <section className="py-12 px-4 bg-green-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose OrderKaro</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-green-100 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Fast Delivery</h3>
                <p className="text-gray-600">Get your groceries delivered to your doorstep within hours.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-green-100 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Fresh Products</h3>
                <p className="text-gray-600">We ensure all our products are fresh and of the highest quality.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-green-100 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Easy Returns</h3>
                <p className="text-gray-600">Not satisfied with your order? Return it hassle-free.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 bg-green-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to shop fresh groceries?</h2>
            <p className="text-lg mb-8 text-green-100">
              {isAuthenticated 
                ? 'Browse our products and start adding items to your cart!'
                : 'Create an account now and get 10% off on your first order!'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {!isAuthenticated && (
                <>
                  <Link href="/register" 
                    className="bg-white text-green-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-green-50 transition-colors">
                    Create Account
                  </Link>
                  <Link href="/login" 
                    className="bg-transparent border border-white text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-green-700 transition-colors">
                    Login
                  </Link>
                </>
              )}
              <Link href="/products" 
                className="bg-transparent border border-white text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-green-700 transition-colors">
                Browse Products
              </Link>
            </div>
          </div>
        </section>
    </div>
    </MainLayout>
  );
}

// Sample data
const categories = [
  { id: 1, name: 'Fruits', slug: 'fruits', icon: 'https://img.icons8.com/color/96/000000/apple.png' },
  { id: 2, name: 'Vegetables', slug: 'vegetables', icon: 'https://img.icons8.com/color/96/000000/carrot.png' },
  { id: 3, name: 'Dairy', slug: 'dairy', icon: 'https://img.icons8.com/color/96/000000/milk-bottle.png' },
  { id: 4, name: 'Bakery', slug: 'bakery', icon: 'https://img.icons8.com/color/96/000000/bread.png' },
  { id: 5, name: 'Beverages', slug: 'beverages', icon: 'https://img.icons8.com/color/96/000000/coffee.png' },
  { id: 6, name: 'Snacks', slug: 'snacks', icon: 'https://img.icons8.com/color/96/000000/popcorn.png' },
];
