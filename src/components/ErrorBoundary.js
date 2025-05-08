'use client';

import { useState, useEffect } from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add window error event listener
    const handleError = (event) => {
      console.error('ErrorBoundary caught error:', event.error);
      setError(event.error?.message || 'An unknown error occurred');
      setHasError(true);
      event.preventDefault(); // Prevent default error handling
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      handleError({ error: event.reason });
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto mb-4">
            <FiAlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-sm">
            <p className="font-medium">Error details:</p>
            <p className="text-red-700">{error || 'Unknown error'}</p>
          </div>
          <p className="text-gray-600 mb-6 text-center">
            We've encountered an unexpected error. This could be due to network issues or database connectivity problems.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FiRefreshCw className="mr-2" /> Refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
} 