'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiHome, FiPackage, FiList } from 'react-icons/fi';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
          <Link href="/categories" className="hover:text-green-200 flex items-center gap-1">
            <FiList className="inline" /> Categories
          </Link>
          <Link href="/products" className="hover:text-green-200 flex items-center gap-1">
            <FiPackage className="inline" /> Products
          </Link>
          
          {isAdmin && (
            <Link href="/admin" className="hover:text-green-200">
              Admin
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="hover:text-green-200 flex items-center gap-1">
                <FiUser className="inline" /> {user?.name || 'Profile'}
              </Link>
              <Link href="/orders" className="hover:text-green-200">
                Orders
              </Link>
              <button 
                onClick={logout} 
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
          <Link href="/cart" className="relative mr-4 hover:text-green-200">
            <FiShoppingCart className="text-2xl" />
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
            <Link href="/" className="hover:text-green-200 py-2 flex items-center gap-2">
              <FiHome /> Home
            </Link>
            <Link href="/categories" className="hover:text-green-200 py-2 flex items-center gap-2">
              <FiList /> Categories
            </Link>
            <Link href="/products" className="hover:text-green-200 py-2 flex items-center gap-2">
              <FiPackage /> Products
            </Link>
            
            {isAdmin && (
              <Link href="/admin" className="hover:text-green-200 py-2">
                Admin
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="hover:text-green-200 py-2 flex items-center gap-2">
                  <FiUser /> {user?.name || 'Profile'}
                </Link>
                <Link href="/orders" className="hover:text-green-200 py-2">
                  Orders
                </Link>
                <button 
                  onClick={logout} 
                  className="hover:text-green-200 py-2 text-left flex items-center gap-2"
                >
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-green-200 py-2">
                  Login
                </Link>
                <Link href="/register" className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-green-100 inline-block">
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