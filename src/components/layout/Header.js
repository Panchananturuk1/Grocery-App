'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiHome, FiPackage, FiList } from 'react-icons/fi';
import supabase from '../../utils/supabase';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const router = useRouter();
  const { user: contextUser } = useAuth();
  
  // Direct check for authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a user in context
        if (contextUser) {
          setIsAuthenticated(true);
          setUserInfo(contextUser);
          console.log("Header: User is authenticated from context", contextUser.email);
          return;
        }
        
        // Direct check with Supabase as fallback
        const { data: { session } } = await supabase.auth.getSession();
        const isLoggedIn = !!session;
        
        console.log("Header: Direct Supabase check - session exists:", isLoggedIn);
        setIsAuthenticated(isLoggedIn);
        
        if (isLoggedIn && session.user) {
          setUserInfo(session.user);
          console.log("Header: User is authenticated", session.user.email);
        } else {
          setUserInfo(null);
          console.log("Header: User is not authenticated");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    };
    
    // Check immediately on mount and when contextUser changes
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change in Header:", event);
        const isLoggedIn = !!session;
        
        // Update state immediately on auth change
        setIsAuthenticated(isLoggedIn);
        setUserInfo(session?.user || null);
        
        if (event === 'SIGNED_IN') {
          console.log("Header detected sign in:", session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log("Header detected sign out");
        }
      }
    );
    
    // Also poll auth status every few seconds as a failsafe
    const intervalId = setInterval(checkAuth, 3000);
    
    return () => {
      subscription?.unsubscribe();
      clearInterval(intervalId);
    };
  }, [contextUser]);
  
  // Default cart state
  const totalItems = 0;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      console.log("Signing out user...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Update UI state immediately
      setIsAuthenticated(false);
      setUserInfo(null);
      setIsMenuOpen(false);
      
      console.log("Sign out successful, redirecting to home");
      router.push('/');
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const getUserInitial = () => {
    if (!userInfo) return '';
    const name = userInfo.user_metadata?.full_name || userInfo.email || '';
    return name.charAt(0).toUpperCase();
  };

  console.log("Header render - isAuthenticated:", isAuthenticated);

  return (
    <header className="bg-green-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          OrderKaro
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="hover:text-green-200 flex items-center gap-1">
            <FiHome className="inline" /> Home
          </Link>
          <Link href="/products" className="hover:text-green-200 flex items-center gap-1">
            <FiPackage className="inline" /> Products
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link 
                href="/profile" 
                className="hover:text-green-200 flex items-center justify-center bg-green-700 rounded-full p-2 w-9 h-9"
                title="Your Profile"
              >
                {getUserInitial() || <FiUser className="text-xl" />}
              </Link>
              <Link href="/orders" className="hover:text-green-200 flex items-center gap-1">
                <FiList className="inline" /> Orders
              </Link>
              <button 
                onClick={handleSignOut} 
                className="hover:text-green-200 flex items-center gap-1"
              >
                <FiLogOut className="inline" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login" className="hover:text-green-200">
                Login
              </Link>
              <Link href="/register" className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-green-100">
                Register
              </Link>
            </div>
          )}
          
          <Link href="/cart" className="relative hover:text-green-200">
            <FiShoppingCart className="text-2xl" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-green-800 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          {isAuthenticated && (
            <Link 
              href="/profile" 
              className="mr-3 flex items-center justify-center bg-green-700 rounded-full p-2 w-8 h-8"
            >
              {getUserInitial() || <FiUser className="text-sm" />}
            </Link>
          )}
          <Link href="/cart" className="relative mr-4 hover:text-green-200">
            <FiShoppingCart className="text-xl" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-green-800 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <button 
            onClick={toggleMenu} 
            className="text-2xl focus:outline-none"
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-green-700 px-4 py-2">
          <nav className="flex flex-col space-y-3">
            <Link href="/" className="hover:text-green-200 py-2 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
              <FiHome /> Home
            </Link>
            <Link href="/products" className="hover:text-green-200 py-2 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
              <FiPackage /> Products
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="hover:text-green-200 py-2 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                  <FiUser /> Profile
                </Link>
                <Link href="/orders" className="hover:text-green-200 py-2 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                  <FiList /> Orders
                </Link>
                <button 
                  onClick={handleSignOut} 
                  className="hover:text-green-200 py-2 text-left flex items-center gap-2"
                >
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-green-200 py-2" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-green-100 inline-block my-2" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
} 