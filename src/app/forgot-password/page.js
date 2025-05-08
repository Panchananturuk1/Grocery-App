'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import { FiMail, FiLoader, FiAlertCircle, FiCheck, FiArrowLeft, FiInfo } from 'react-icons/fi';
import toastManager from '../../utils/toast-manager';
import { useAuth } from '../../context/AuthContext';
import ClientWrapper from '../../components/ClientWrapper';
import supabase from '../../utils/supabase';
import logger from '../../utils/logger';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Development fallback options - for when emails aren't delivered in development
const DEV_MODE = process.env.NODE_ENV === 'development';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [devResetToken, setDevResetToken] = useState('');
  const router = useRouter();
  const { resetPassword } = useAuth();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    if (!email) {
      setResetError('Please enter your email address');
      return;
    }

    setLoading(true);
    setResetError(null);
    
    try {
      // Remove the admin API call which isn't available in client-side library
      // Instead, we'll just attempt the reset and handle errors appropriately
      
      // Use the resetPassword method from AuthContext
      const { success, error } = await resetPassword(email.trim());

      if (!success && error) {
        logger.logError('Reset password error:', error);
        
        // Special handling for development mode
        if (DEV_MODE) {
          setShowDevOptions(true);
          // Create a manual reset link for development testing
          const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`;
          setDevResetToken(resetLink);
          
          toastManager.error('Reset email may not be delivered in development. Use the test link below.');
        }
        
        setLoading(false);
        
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          setResetError('Too many reset attempts. Please try again later.');
        } else if (error.message?.includes('network') || error.message?.includes('connection')) {
          setResetError('Network error. Please check your internet connection and try again.');
        } else {
          setResetError(error.message || 'An error occurred. Please try again.');
        }
        return;
      }
      
      // For security reasons, always show success even if email doesn't exist
      setResetSent(true);
      toastManager.success('Password reset instructions sent to your email');
      
      // In development mode, also show direct link option
      if (DEV_MODE) {
        setShowDevOptions(true);
        const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`;
        setDevResetToken(resetLink);
      }
    } catch (error) {
      console.error('Reset password exception:', error);
      setLoading(false);
      setResetError('An unexpected error occurred. Please try again later.');
      
      // Show dev options in development mode
      if (DEV_MODE) {
        setShowDevOptions(true);
        const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`;
        setDevResetToken(resetLink);
      }
    }
  };

  // Development helper - create a magic link directly
  const handleManualResetLink = async () => {
    try {
      if (!email) {
        toastManager.error('Please enter an email address first');
        return;
      }
      
      // In development, we can use a simpler approach with OTP
      toastManager.info('Generating test link...');
      
      // Generate a sign-in link with Supabase (works in development)
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // This will allow password reset even if user doesn't exist
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/reset-password`
        }
      });
      
      if (error) {
        logger.logError('Error generating OTP link:', error);
        toastManager.error('Could not generate test link: ' + error.message);
        return;
      }
      
      // For demonstration, create a mock reset URL
      const mockResetUrl = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}#testing=true`;
      
      // The link would normally be in an email, but we're showing it directly
      toastManager.success('Test reset link created! Check browser console.');
      setDevResetToken('Check browser console for link details');
      
      // Log information in the console
      console.log('=== DEVELOPMENT PASSWORD RESET INFO ===');
      console.log('1. Magic link sent to:', email);
      console.log('2. Check your email for the actual link');
      console.log('3. For testing without email, use this URL:', mockResetUrl);
      console.log('4. Add this to URL parameters: type=recovery&token=YOUR_TOKEN');
      console.log('=== END PASSWORD RESET INFO ===');
    } catch (err) {
      logger.logError('Error in manual reset:', err);
      toastManager.error('Failed to generate test link');
    }
  };

  if (resetSent) {
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
                <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                <p className="mt-2 text-sm text-gray-600">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-4">
                  If you don't see the email in your inbox, please check your spam folder.
                </p>
                <p className="text-sm text-gray-600">
                  The link in the email will expire after 24 hours.
                </p>
              </div>
              
              {/* Development mode options */}
              {DEV_MODE && showDevOptions && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start">
                    <FiInfo className="text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm text-yellow-800">Development Testing Options</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        Email delivery may not work in development. Use the options below:
                      </p>
                      <div className="mt-2">
                        <button 
                          onClick={handleManualResetLink}
                          className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 text-xs py-1 px-2 rounded"
                        >
                          Generate Test Link
                        </button>
                      </div>
                      {devResetToken && (
                        <div className="mt-2 text-xs overflow-hidden text-ellipsis">
                          <p>Check console for details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <Link href="/login" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  Return to Login
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
            <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
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
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            <form onSubmit={handleResetRequest}>
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
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                      Sending reset instructions...
                    </>
                  ) : (
                    "Send reset instructions"
                  )}
                </button>
              </div>
              
              {/* Development help notice */}
              {DEV_MODE && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-start">
                    <FiInfo className="text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Development Mode</h4>
                      <p className="text-xs text-gray-700 mt-1">
                        Email delivery may not work in development. 
                        Test options will be provided after submission.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-green-600 hover:underline inline-flex items-center"
                >
                  <FiArrowLeft className="mr-1" /> Back to login
                </Link>
              </div>
            </form>
            
            {/* Show dev options if enabled */}
            {DEV_MODE && showDevOptions && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
                <h4 className="font-medium text-sm mb-2">Development Testing Options</h4>
                <button 
                  onClick={handleManualResetLink}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-3 rounded"
                >
                  Generate Test Link
                </button>
                {devResetToken && (
                  <div className="mt-2 text-xs">
                    <p>Check console for reset link information</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <ClientWrapper waitForAuth={false}>
      <ForgotPasswordContent />
    </ClientWrapper>
  );
} 