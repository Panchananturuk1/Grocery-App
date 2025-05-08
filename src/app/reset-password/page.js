'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import { FiLock, FiLoader, FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import toastManager from '../../utils/toast-manager';
import supabase from '../../utils/supabase';
import ClientWrapper from '../../components/ClientWrapper';
import logger from '../../utils/logger';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';
const DEV_MODE = process.env.NODE_ENV === 'development';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if the hash token is valid on page load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Check if we have hash type params (from Supabase auth redirect)
        const hashParams = isBrowser ? window.location.hash : '';
        logger.logDebug('Checking hash params for reset token:', 'auth', hashParams);
        
        // Check for token in query params (for development mode)
        const emailParam = searchParams?.get('email');
        const tokenParam = searchParams?.get('token') || searchParams?.get('access_token');
        
        if (DEV_MODE && emailParam && !tokenParam) {
          logger.logInfo('Development mode: Email parameter detected', 'auth');
          setShowManualInput(true);
        }
        
        if (DEV_MODE && tokenParam) {
          logger.logInfo('Development mode: Token parameter detected', 'auth');
          // Use direct token approach for development
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenParam,
              type: 'email',
            });
            
            if (error) {
              logger.logError('Error verifying OTP token:', error);
            } else {
              logger.logInfo('OTP verification succeeded', 'auth');
              setTokenValid(true);
              setVerifyingToken(false);
              return;
            }
          } catch (err) {
            logger.logError('Exception while verifying OTP token:', err);
          }
        }
        
        // Supabase automatically handles the token from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.logError('Error verifying reset token:', error);
          setTokenValid(false);
          setResetError('Invalid or expired password reset link. Please request a new one.');
        } else if (data && data.session) {
          // We have a valid session
          logger.logInfo('Valid session detected for password reset', 'auth');
          setTokenValid(true);
        } else {
          logger.logWarn('No valid session found for password reset', 'auth');
          // No token in URL or token is invalid
          setTokenValid(false);
          
          // Different message for development mode
          if (DEV_MODE) {
            setResetError('No valid reset token found. You can try the manual token input below.');
            setShowManualInput(true);
          } else {
            setResetError('Invalid or expired password reset link. Please request a new one.');
          }
        }
      } catch (error) {
        logger.logError('Error during token verification:', error);
        setTokenValid(false);
        setResetError('An error occurred while verifying your reset link. Please try again.');
      } finally {
        setVerifyingToken(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  // Function to manually verify a token (for development)
  const handleManualTokenVerify = async () => {
    if (!manualTokenInput) {
      toastManager.error('Please enter a token');
      return;
    }
    
    setLoading(true);
    
    try {
      // Try to verify the token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: manualTokenInput,
        type: 'recovery',
      });
      
      if (error) {
        logger.logError('Manual token verification error:', error);
        toastManager.error('Invalid token');
        setLoading(false);
        return;
      }
      
      logger.logInfo('Manual token verification succeeded', 'auth');
      setTokenValid(true);
      toastManager.success('Token verified');
    } catch (err) {
      logger.logError('Exception during manual token verification:', err);
      toastManager.error('Error verifying token');
    } finally {
      setLoading(false);
    }
  };

  // Development-only function to handle password reset when direct API access isn't available
  const handleDevModeReset = async () => {
    if (password.length < 6) {
      setResetError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the email from query params
      const email = searchParams?.get('email');
      
      if (!email) {
        toastManager.error('Email parameter is missing');
        setLoading(false);
        return;
      }
      
      // In development mode, try two approaches:
      
      // 1. Try direct login followed by password update (requires existing user)
      try {
        logger.logInfo('Development mode: Attempting direct login', 'auth');
        
        // Try to create a session by sending a magic link
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: false,
          }
        });
        
        if (magicLinkError) {
          logger.logWarn('Magic link failed, will try alternative method', 'auth');
        } else {
          logger.logInfo('Magic link sent successfully', 'auth');
          setResetSuccess(true);
          toastManager.success(
            'In production, a magic link would be sent and the user would update their password'
          );
          setLoading(false);
          return;
        }
      } catch (err) {
        logger.logWarn('Error in magic link approach:', err);
      }
      
      // 2. Simulate a successful reset for testing UI flows
      logger.logInfo('Development mode: Simulating password reset success', 'auth');
      setResetSuccess(true);
      setLoading(false);
      toastManager.success('Password reset simulation successful (development mode only)');
      
    } catch (err) {
      logger.logError('Exception during dev mode reset:', err);
      toastManager.error('Reset failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Validate password
    if (password.length < 6) {
      setResetError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setLoading(true);
    setResetError(null);
    
    try {
      // First verify we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        logger.logError('No active session found for password reset', 'auth');
        setLoading(false);
        
        if (DEV_MODE) {
          setResetError('No active session. In development mode, try the manual reset options below.');
          setShowManualInput(true);
        } else {
          setResetError('Your reset link has expired or is invalid. Please request a new one.');
        }
        return;
      }
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        logger.logError('Error resetting password:', error);
        setLoading(false);
        
        if (error.message.includes('token') || error.message.includes('JWT')) {
          setResetError('Your reset link has expired. Please request a new one.');
        } else {
          setResetError(error.message || 'Failed to reset password. Please try again.');
        }
        return;
      }
      
      // Password reset successful
      setResetSuccess(true);
      toastManager.success('Your password has been reset successfully');
      
      // Sign out the user to clear session (they should login with new password)
      await supabase.auth.signOut();
    } catch (error) {
      logger.logError('Exception during password reset:', error);
      setLoading(false);
      
      if (DEV_MODE) {
        // In development, offer the manual options
        setResetError('Error during reset. Try the development options below.');
        setShowManualInput(true);
      } else {
        setResetError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  if (verifyingToken) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 py-6 px-8">
              <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            </div>
            <div className="p-8">
              <div className="text-center">
                <FiLoader className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg text-gray-700">Verifying your reset link...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!tokenValid && !resetSuccess && !showManualInput) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 py-6 px-8">
              <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            </div>
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FiAlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Invalid Reset Link</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {resetError || 'Your password reset link is invalid or has expired.'}
                </p>
              </div>
              
              <div className="mt-6">
                <Link href="/forgot-password" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  Request New Reset Link
                </Link>
              </div>
              
              {DEV_MODE && (
                <div className="mt-4">
                  <button 
                    onClick={() => setShowManualInput(true)}
                    className="text-blue-600 text-sm hover:underline text-center w-full"
                  >
                    Development: Try manual token input
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (showManualInput && DEV_MODE) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 py-6 px-8">
              <h2 className="text-2xl font-bold text-white">Development Mode</h2>
            </div>
            <div className="p-8">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                <div className="flex items-start">
                  <FiInfo className="text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Development Testing</h4>
                    <p className="text-xs text-gray-700 mt-1">
                      This page is for development testing when email delivery isn't working.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Enter Reset Token
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter token from console or URL hash"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide the token hash from your console or URL
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleManualTokenVerify}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Token'}
                </button>
                
                <button
                  onClick={handleDevModeReset}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={loading}
                >
                  Test Reset Flow
                </button>
              </div>
              
              <div className="mt-4">
                <Link href="/forgot-password" className="text-blue-600 text-sm hover:underline">
                  Back to forgot password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (resetSuccess) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 py-6 px-8">
              <h2 className="text-2xl font-bold text-white">Password Reset</h2>
            </div>
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <FiCheck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Password Reset Complete</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
              </div>
              
              <div className="mt-6">
                <Link href="/login" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  Go to Login
                </Link>
              </div>
            </div>
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
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          </div>
          <div className="p-8">
            {resetError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
                <p className="flex items-center">
                  <FiAlertCircle className="mr-2" />
                  {resetError}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              Set a new password for your account. Choose a strong password that's at least 6 characters long.
            </p>
            
            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
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
                      Resetting password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
              
              {DEV_MODE && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                  <div className="flex items-start">
                    <FiInfo className="text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Development Mode</h4>
                      <p className="text-xs text-gray-700 mt-1">
                        This password reset is running in development mode.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <ClientWrapper waitForAuth={false}>
      <ResetPasswordContent />
    </ClientWrapper>
  );
} 