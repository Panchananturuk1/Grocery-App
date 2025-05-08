'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiHome, FiPackage, FiList, FiSettings, FiMapPin } from 'react-icons/fi';
import supabase from '../../utils/supabase';
import toastManager from '../../utils/toast-manager';
import logger from '../../utils/logger';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const router = useRouter();
  const { user: contextUser, signOut } = useAuth();
  const dropdownRef = useRef(null);
  
  // Direct check for authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Don't run check if already checking to prevent race conditions
        if (contextUser) {
          setIsAuthenticated(true);
          setUserInfo(contextUser);
          logger.logDebug("Header: User is authenticated from context", "auth-ui", contextUser.email);
          return;
        }
        
        // Direct check with Supabase as fallback
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        const isLoggedIn = !!session;
        
        logger.logDebug("Header: Direct Supabase check - session exists:", "auth-ui", isLoggedIn);
        
        // Only update state if it's different to avoid unnecessary re-renders
        if (isAuthenticated !== isLoggedIn) {
          setIsAuthenticated(isLoggedIn);
        }
        
        if (isLoggedIn && session.user) {
          setUserInfo(session.user);
          logger.logDebug("Header: User is authenticated", "auth-ui", session.user.email);
        } else if (!isLoggedIn && userInfo) {
          setUserInfo(null);
          logger.logDebug("Header: User is not authenticated", "auth-ui");
        }
      } catch (err) {
        logger.logError("Auth check error:", err);
        // Don't change state on error to avoid flickering
      }
    };
    
    // Check immediately on mount and when contextUser changes
    checkAuth();
    
    // Set up auth state listener with error handling
    let subscription;
    try {
      const response = supabase.auth.onAuthStateChange(
        async (event, session) => {
          logger.logDebug("Auth state change in Header:", "auth-ui", event);
          const isLoggedIn = !!session;
          
          // Update state immediately on auth change
          setIsAuthenticated(isLoggedIn);
          setUserInfo(session?.user || null);
          
          if (event === 'SIGNED_IN') {
            logger.logDebug("Header detected sign in:", "auth-ui", session?.user?.email);
          } else if (event === 'SIGNED_OUT') {
            logger.logDebug("Header detected sign out", "auth-ui");
          }
        }
      );
      
      subscription = response.data.subscription;
    } catch (err) {
      logger.logError("Error setting up auth listener:", err);
    }
    
    // Don't poll continuously as it can cause performance issues
    // Instead check less frequently (every 30 seconds)
    const intervalId = setInterval(checkAuth, 30000);
    
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (err) {
          logger.logError("Error unsubscribing from auth listener:", err);
        }
      }
      clearInterval(intervalId);
    };
  }, [contextUser, isAuthenticated, userInfo]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isBrowser) return;
    
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Default cart state
  const totalItems = 0;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleSignOut = async () => {
    try {
      logger.logInfo("Header: Signing out user...", "auth-ui");
      
      // First close any open UI elements
      setIsProfileDropdownOpen(false);
      setIsMenuOpen(false);
      
      // Show a loading toast
      const loadingToast = toastManager.loading('Logging out...');
      
      // First try context signOut - this is the proper way
      let success = false;
      
      try {
        // Call the context's signOut function with a timeout
        const signOutPromise = signOut();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign out timeout')), 3000)
        );
        
        const result = await Promise.race([signOutPromise, timeoutPromise]);
        success = result && result.success;
      } catch (signOutErr) {
        logger.logError("Context signOut failed:", signOutErr);
        // Continue to fallback
      }
      
      // If context sign out failed, try direct Supabase call as fallback
      if (!success) {
        logger.logInfo("Header: Trying direct Supabase signOut as fallback", "auth-ui");
        
        // Clear local storage manually
        if (isBrowser) {
          try {
            // Clear all Supabase storage as aggressive cleanup
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase')) {
                localStorage.removeItem(key);
              }
            });
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase')) {
                sessionStorage.removeItem(key);
              }
            });
          } catch (storageErr) {
            logger.logWarn("Error clearing storage:", "auth-ui", storageErr);
          }
        }
        
        // Call Supabase directly
        try {
          await supabase.auth.signOut();
          success = true;
        } catch (directSignOutErr) {
          logger.logError("Direct Supabase signOut failed:", directSignOutErr);
        }
      }
      
      // Dismiss the loading toast
      toastManager.dismiss(loadingToast);
      
      // Update local state
      setIsAuthenticated(false);
      setUserInfo(null);
      
      // Show success message unless already done by context
      toastManager.success('Logged out successfully');
      
      // Force refresh the page to fully clear state
      if (isBrowser) {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    } catch (err) {
      logger.logError("Header: Sign out error:", err);
      toastManager.error('Error logging out. Please try again.');
      
      // Force a page reload as last resort for errors
      if (isBrowser) {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        router.push('/');
      }
    }
  };

  const getUserInitial = () => {
    if (!userInfo) return '';
    const name = userInfo.user_metadata?.full_name || userInfo.email || '';
    return name.charAt(0).toUpperCase();
  };

  const getUserFullName = () => {
    if (!userInfo) return 'User';
    return userInfo.user_metadata?.full_name || userInfo.email.split('@')[0] || 'User';
  };

  // Only log at verbose level as this happens very frequently
  logger.logVerbose("Header render - isAuthenticated:", "render", isAuthenticated);

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
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={toggleProfileDropdown}
                  className="hover:text-green-200 flex items-center justify-center bg-green-700 rounded-full p-2 w-9 h-9"
                  title="Your Profile"
                >
                  {getUserInitial() || <FiUser className="text-xl" />}
                </button>
                
                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-50">
                    <div className="border-b border-gray-200 pb-2 pt-1 px-3">
                      <p className="text-sm font-medium">{getUserFullName()}</p>
                      <p className="text-xs text-gray-500 truncate">{userInfo?.email}</p>
                    </div>
                    
                    <Link href="/profile" className="block px-3 py-1 text-sm hover:bg-gray-100">
                      <FiUser className="inline mr-2" /> My Profile
                    </Link>
                    <Link href="/profile/address" className="block px-3 py-1 text-sm hover:bg-gray-100">
                      <FiMapPin className="inline mr-2" /> My Addresses
                    </Link>
                    <Link href="/orders" className="block px-3 py-1 text-sm hover:bg-gray-100">
                      <FiList className="inline mr-2" /> My Orders
                    </Link>
                    <Link href="/settings" className="block px-3 py-1 text-sm hover:bg-gray-100">
                      <FiSettings className="inline mr-2" /> Settings
                    </Link>
                    <div className="border-t border-gray-200 mt-1">
                      <button 
                        onClick={handleSignOut} 
                        className="block w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <FiLogOut className="inline mr-2" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="/orders" className="hover:text-green-200 flex items-center gap-1">
                <FiList className="inline" /> Orders
              </Link>
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
            <div className="relative mr-3">
              <button 
                onClick={toggleProfileDropdown}
                className="flex items-center justify-center bg-green-700 rounded-full p-2 w-8 h-8"
              >
                {getUserInitial() || <FiUser className="text-sm" />}
              </button>
              
              {/* Mobile Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-50">
                  <div className="border-b border-gray-200 pb-2 pt-1 px-3">
                    <p className="text-sm font-medium">{getUserFullName()}</p>
                    <p className="text-xs text-gray-500 truncate">{userInfo?.email}</p>
                  </div>
                  
                  <Link href="/profile" className="block px-3 py-1 text-sm hover:bg-gray-100">
                    My Profile
                  </Link>
                  <Link href="/profile/address" className="block px-3 py-1 text-sm hover:bg-gray-100">
                    My Addresses
                  </Link>
                  <Link href="/orders" className="block px-3 py-1 text-sm hover:bg-gray-100">
                    My Orders
                  </Link>
                  <div className="border-t border-gray-200 mt-1">
                    <button 
                      onClick={handleSignOut} 
                      className="block w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            
            {!isAuthenticated && (
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