'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import { FiMail, FiLock, FiLoader, FiAlertCircle, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import toastManager from '../../utils/toast-manager';
import supabase from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext'; 
import ClientWrapper from '../../components/ClientWrapper';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define a component to show common database errors
const DatabaseErrorMessage = ({ error }) => {
  if (!error) return null;
  
  // Handle specific database errors
  if (error.includes('Database connection error') || 
      error.includes('timeout') || 
      error.includes('network') || 
      error.includes('Connection')) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Database connection error!</strong>
        <p className="text-sm">
          We're having trouble connecting to our database. This could be due to:
        </p>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>Temporary server issues</li>
          <li>Network connectivity problems</li>
          <li>Supabase maintenance</li>
        </ul>
        <p className="text-sm mt-2">
          Please try again in a few minutes.
        </p>
      </div>
    );
  }
  
  // Default error message
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
      <p>{error}</p>
    </div>
  );
};

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user, signIn } = useAuth();
  const loginAttemptRef = useRef(0);
  const loginTimeoutRef = useRef(null);
  
  // Clear any lingering timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  // Check if user is already logged in - both on mount and when auth state changes
  useEffect(() => {
    const checkAndRedirect = async () => {
      console.log("Checking auth status for redirect");
      
      // First check auth context
      if (isAuthenticated && user) {
        console.log("Already authenticated via context, redirecting");
        setRedirecting(true);
        if (isBrowser) {
          window.location.href = '/';
        }
        return;
      }

      // As a fallback, check directly with Supabase
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("Session found via direct check, redirecting");
          setRedirecting(true);
          if (isBrowser) {
            window.location.href = '/';
          }
          return;
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };

    checkAndRedirect();
  }, [isAuthenticated, user]);

  const handleDirectLogin = async (e) => {
    if (e) e.preventDefault();
    
    if (loading) return;
    
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    // Increment login attempt counter
    loginAttemptRef.current += 1;
    const currentAttempt = loginAttemptRef.current;
    
    setLoading(true);
    setLoginError(null);
    
    // Set a hard timeout to prevent infinite loading
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
    }
    
    loginTimeoutRef.current = setTimeout(() => {
      // Only update state if this is still the current login attempt
      if (currentAttempt === loginAttemptRef.current) {
        setLoading(false);
        setLoginError('Login request timed out. Network may be slow or server unavailable.');
      }
    }, 15000); // Increased timeout to 15 seconds for slower networks

    try {
      // First clear any existing auth data to prevent conflicts
      if (isBrowser) {
        try {
          localStorage.removeItem('sb:session');
          sessionStorage.removeItem('sb:session');
          // Clear any other potential auth-related storage
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
        } catch (e) {
          console.warn('Error clearing storage:', e);
        }
      }

      // Use supabase directly instead of context for more direct control
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      // Clear the timeout since we got a response
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }

      // Only update state if this is still the current login attempt
      if (currentAttempt !== loginAttemptRef.current) return;

      if (error) {
        console.error('Login error:', error);
        setLoading(false);
        
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Invalid email or password. Please try again.');
        } else {
          setLoginError(error.message || 'An error occurred during login');
        }
        return;
      }
      
      if (data && data.user) {
        // Import and initialize database for this user
        try {
          const { initializeDatabase } = await import('../../utils/setup-db');
          await initializeDatabase();
        } catch (dbError) {
          console.error('Error initializing database:', dbError);
          // Continue anyway - non-fatal error
        }
        
        console.log("Login successful, redirecting...");
        toastManager.success('Login successful!');
        
        // Set redirecting state to show loading screen
        setRedirecting(true);
        
        // Set a guaranteed hard redirect after a short delay
        // This ensures we redirect even if context updates are slow
        if (isBrowser) {
          setTimeout(() => {
            console.log("Forcing navigation to home page");
            window.location.href = '/';
          }, 1000);
        }
      } else {
        setLoading(false);
        setLoginError('Login succeeded but user data is missing. Please try again.');
      }
    } catch (error) {
      // Clear the timeout since we got a response (error)
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
      
      // Only update state if this is still the current login attempt
      if (currentAttempt !== loginAttemptRef.current) return;
      
      console.error('Login exception:', error);
      setLoading(false);
      setLoginError('An unexpected error occurred. Please try again later.');
    }
  };

  // If we're redirecting, show a loading screen instead of the login form
  if (redirecting) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FiLoader className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg text-gray-700">Logging you in...</p>
            <p className="text-sm text-gray-500 mt-2">You will be redirected shortly</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 py-6 px-8">
            <h2 className="text-2xl font-bold text-white">Login to OrderKaro</h2>
          </div>
          <div className="p-8">
            {loginError && <DatabaseErrorMessage error={loginError} />}
            
            <form onSubmit={handleDirectLogin}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <div 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
              
              {loginError && loginError.includes('timeout') && (
                <div className="mb-4 text-center">
                  <button
                    type="button"
                    onClick={() => isBrowser && window.location.reload()}
                    className="text-green-600 underline inline-flex items-center"
                  >
                    <FiRefreshCw className="mr-1" /> Reload page and try again
                  </button>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <Link href="/forgot-password" className="text-sm text-green-600 hover:underline">
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-green-600 hover:underline">
                    Register
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

export default function LoginPage() {
  return (
    <ClientWrapper waitForAuth={false}>
      <LoginContent />
    </ClientWrapper>
  );
} 