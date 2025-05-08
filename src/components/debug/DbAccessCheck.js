'use client';

import { useState, useEffect } from 'react';
import { checkAnonymousAccess, attemptClientFix } from '../../utils/db-access-check';
import { FiDatabase, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function DbAccessCheck({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fixing, setFixing] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const checkResult = await checkAnonymousAccess();
      setResult(checkResult);
      
      if (onComplete) {
        onComplete(checkResult);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        isRlsIssue: false
      });
    } finally {
      setLoading(false);
    }
  };
  
  const runClientFix = async () => {
    setFixing(true);
    await attemptClientFix();
    setFixing(false);
  };
  
  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center text-lg font-medium">
          <FiDatabase className="mr-2" /> Database Access Check
        </h3>
        <button 
          onClick={runCheck} 
          disabled={loading}
          className="p-2 text-blue-500 hover:text-blue-700"
          title="Run check again"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <FiRefreshCw className="animate-spin mr-2 text-blue-500" />
          <span>Checking database access...</span>
        </div>
      ) : result ? (
        <div>
          {result.success ? (
            <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-start">
              <FiCheckCircle className="mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p>Database access is working correctly!</p>
                <p className="text-sm mt-1">
                  Found {result.categories} categories and {result.products} products.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 text-red-700 p-3 rounded-md">
              <div className="flex items-start">
                <FiAlertTriangle className="mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Database access error</p>
                  <p className="text-sm mt-1">{result.error}</p>
                  
                  {result.isRlsIssue && (
                    <div className="mt-2 text-sm bg-yellow-50 p-2 rounded text-yellow-700">
                      This appears to be a Row Level Security (RLS) issue. You need to run the 
                      SQL code from <code className="bg-yellow-100 px-1 rounded">fix-rls-policies.sql</code> in 
                      your Supabase dashboard.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <button
                  onClick={runClientFix}
                  disabled={fixing}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {fixing ? 'Resetting...' : 'Reset Client & Reload'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No diagnostic information available</p>
      )}
    </div>
  );
} 