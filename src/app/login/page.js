'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import { FiMail, FiLock, FiLoader, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import supabase from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is already authenticated via context
        if (user) {
          console.log('Login page: User already logged in, redirecting to home');
          router.push('/');
          return;
        }
        
        // Double-check with Supabase directly
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Login page: Session found, redirecting to home');
          router.push('/');
        }
      } catch (err) {
        console.error('Login page auth check error:', err);
      }
    };
    
    checkAuth();
  }, [user, router]);

  // Clear field-specific error when user types
  useEffect(() => {
    if (email && formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: '' }));
    }
  }, [email]);

  useEffect(() => {
    if (password && formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: '' }));
    }
  }, [password]);

  const validateForm = () => {
    let isValid = true;
    const errors = { email: '', password: '' };

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      console.log('Attempting login with email:', email);
      // Login directly with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        let errorMessage = 'Login failed. Please try again.';
        
        // Provide more specific error messages based on the error
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before logging in. Check your inbox for a confirmation link.';
        } else if (error.message.toLowerCase().includes('network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        setLoginError(errorMessage);
        toast.error(errorMessage);
        console.error('Login error:', error);
      } else {
        console.log('Login successful, user:', data?.user?.email);
        toast.success('Logged in successfully');
        
        // Force a small delay to allow auth state to propagate
        setTimeout(() => {
          router.push('/');
        }, 500);
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please try again.';
      setLoginError(errorMsg);
      toast.error(errorMsg);
      console.error('Login exception:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white py-4 px-6">
              <h2 className="text-2xl font-bold">Login to Your Account</h2>
              <p className="text-green-100">Welcome back to OrderKaro!</p>
            </div>

            <form onSubmit={handleSubmit} className="py-6 px-8">
              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded flex items-start">
                  <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`w-full pl-10 pr-3 py-2 border ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" size={14} />
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className={`w-full pl-10 pr-3 py-2 border ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900`}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="mr-1" size={14} />
                    {formErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" /> Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-green-600 hover:text-green-500">
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 