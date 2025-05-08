'use client';

import { FiAlertTriangle, FiRefreshCw, FiCode, FiDatabase } from 'react-icons/fi';
import { useData } from '../context/DataContext';
import Link from 'next/link';

/**
 * Component to display when database initialization fails
 */
export default function DatabaseErrorPage() {
  const { retryInitialization } = useData();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-5">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="bg-red-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
            <FiAlertTriangle className="text-red-500 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Database Setup Error</h1>
          <p className="text-gray-600">We couldn't properly set up the database for your account. This is usually caused by missing SQL functions in your Supabase project.</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
          <h2 className="flex items-center text-gray-800 font-medium mb-3">
            <FiDatabase className="mr-2" /> How to Fix This Issue
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-600">
            <li>Log in to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Supabase Dashboard</a></li>
            <li>Select your project</li>
            <li>Go to the <strong>SQL Editor</strong> section</li>
            <li>Click <strong>New Query</strong></li>
            <li>Copy and paste each SQL function from the <strong>sql-functions.md</strong> file</li>
            <li>Click <strong>Run</strong> after pasting each function</li>
          </ol>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
          <h2 className="flex items-center text-gray-800 font-medium mb-3">
            <FiCode className="mr-2" /> Required SQL Functions
          </h2>
          <p className="text-gray-600 mb-3">
            You need to create these 3 functions in your Supabase project:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><code>set_current_timestamp_updated_at()</code></li>
            <li><code>create_profiles_table_if_not_exists()</code></li>
            <li><code>create_user_addresses_table_if_not_exists()</code></li>
          </ul>
          <p className="text-gray-600 mt-3">
            The SQL code for these functions can be found in the <code>sql-functions.md</code> file in your project.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={retryInitialization}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <FiRefreshCw className="mr-2" /> Retry Database Setup
          </button>
          
          <Link 
            href="/"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 