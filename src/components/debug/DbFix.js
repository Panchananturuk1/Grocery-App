'use client';

import { useState, useEffect } from 'react';
import { FiDatabase, FiAlertTriangle, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { diagnoseDatabaseIssues, fixDatabaseIssues } from '../../utils/db-fix';
import { toast } from 'react-hot-toast';

export default function DbFix() {
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await diagnoseDatabaseIssues();
      setDiagnosis(result);
    } catch (err) {
      setError(err.message);
      console.error('Error during diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const runFix = async () => {
    setFixing(true);
    setError(null);
    
    try {
      const success = await fixDatabaseIssues();
      
      if (success) {
        toast.success('Database fixed successfully! Refresh the page.');
        
        // Run another diagnosis to update the UI
        await runDiagnosis();
      } else {
        toast.error('Could not fix all database issues');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error during database fix:', err);
      toast.error(`Fix error: ${err.message}`);
    } finally {
      setFixing(false);
    }
  };
  
  useEffect(() => {
    runDiagnosis();
  }, []);
  
  return (
    <div className="bg-white shadow-lg rounded-lg p-5 max-w-lg mx-auto my-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FiDatabase className="mr-2" /> Database Diagnostics
        </h2>
        <button 
          onClick={runDiagnosis}
          disabled={loading}
          className="text-blue-500 hover:text-blue-700"
          title="Refresh Diagnosis"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <FiRefreshCw className="animate-spin text-blue-500 mr-2" size={24} />
          <span>Running diagnosis...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <div className="flex items-center">
            <FiAlertTriangle className="mr-2" />
            <span>Error: {error}</span>
          </div>
          <button 
            onClick={runDiagnosis} 
            className="mt-3 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : diagnosis ? (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex justify-between items-center p-3 border rounded-md">
            <div className="flex items-center">
              <span className="font-medium">Database Connection:</span>
            </div>
            <div className={`flex items-center ${diagnosis.connection ? 'text-green-600' : 'text-red-600'}`}>
              {diagnosis.connection ? (
                <>
                  <FiCheck className="mr-1" /> Connected
                </>
              ) : (
                <>
                  <FiX className="mr-1" /> Disconnected
                </>
              )}
            </div>
          </div>
          
          {/* Tables Status */}
          <div className="space-y-2">
            <div className="font-medium">Tables:</div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 flex justify-between items-center rounded-md ${
                diagnosis.tables.categories ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <span>Categories</span>
                {diagnosis.tables.categories ? <FiCheck /> : <FiX />}
              </div>
              
              <div className={`p-2 flex justify-between items-center rounded-md ${
                diagnosis.tables.products ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <span>Products</span>
                {diagnosis.tables.products ? <FiCheck /> : <FiX />}
              </div>
            </div>
          </div>
          
          {/* RLS Status */}
          {diagnosis.tables.categories && diagnosis.tables.products && (
            <div className="space-y-2">
              <div className="font-medium">Table Permissions (RLS):</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 flex justify-between items-center rounded-md ${
                  !diagnosis.rlsIssues?.categories ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <span>Categories Access</span>
                  {!diagnosis.rlsIssues?.categories ? <FiCheck /> : <FiX />}
                </div>
                
                <div className={`p-2 flex justify-between items-center rounded-md ${
                  !diagnosis.rlsIssues?.products ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <span>Products Access</span>
                  {!diagnosis.rlsIssues?.products ? <FiCheck /> : <FiX />}
                </div>
              </div>
              
              {(diagnosis.rlsIssues?.categories || diagnosis.rlsIssues?.products) && (
                <div className="mt-2 text-xs bg-yellow-50 p-2 rounded-md text-yellow-700">
                  RLS issues detected - Tables exist but permissions prevent anonymous access. 
                  Click "Fix Database Issues" to repair permissions.
                </div>
              )}
            </div>
          )}
          
          {/* RPC Functions */}
          <div className="flex justify-between items-center p-3 border rounded-md">
            <div className="flex items-center">
              <span className="font-medium">SQL Functions:</span>
            </div>
            <div className={`flex items-center ${diagnosis.rpcFunctions ? 'text-green-600' : 'text-red-600'}`}>
              {diagnosis.rpcFunctions ? (
                <>
                  <FiCheck className="mr-1" /> Available
                </>
              ) : (
                <>
                  <FiX className="mr-1" /> Missing
                </>
              )}
            </div>
          </div>
          
          {/* Errors */}
          {diagnosis.errors.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-md">
              <div className="font-medium text-yellow-800 mb-1">Issues Found:</div>
              <ul className="text-sm space-y-1">
                {diagnosis.errors.map((err, index) => (
                  <li key={index} className="text-yellow-700 flex items-start">
                    <FiAlertTriangle className="mr-1 mt-0.5 flex-shrink-0" />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Fix Button */}
          {(
            !diagnosis.tables.categories || 
            !diagnosis.tables.products || 
            diagnosis.rlsIssues?.categories || 
            diagnosis.rlsIssues?.products
          ) && diagnosis.connection && (
            <div className="mt-4">
              <button
                onClick={runFix}
                disabled={fixing || !diagnosis.rpcFunctions}
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
                  fixing 
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : !diagnosis.rpcFunctions 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {fixing ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" /> Fixing...
                  </>
                ) : (
                  <>
                    <FiDatabase className="mr-2" /> Fix Database Issues
                  </>
                )}
              </button>
              
              {!diagnosis.rpcFunctions && (
                <p className="text-red-600 text-sm mt-2">
                  SQL functions are missing. Please run the SQL functions from sql-functions.md in your Supabase dashboard.
                </p>
              )}
            </div>
          )}
          
          {/* All Good Message */}
          {diagnosis.connection && 
            diagnosis.tables.categories && 
            diagnosis.tables.products && 
            !diagnosis.rlsIssues?.categories && 
            !diagnosis.rlsIssues?.products && (
            <div className="bg-green-50 p-3 rounded-md text-green-700 flex items-center">
              <FiCheck className="mr-2" />
              <span>All database tables are set up correctly with proper permissions!</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-5 text-gray-500">
          No diagnosis information available
        </div>
      )}
      
      {/* Manual Setup Instructions */}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-medium mb-2">Manual Database Setup</h3>
        <ol className="text-sm space-y-2 text-gray-700 list-decimal pl-5">
          <li>Go to your Supabase project dashboard</li>
          <li>Go to "SQL Editor" and create a new query</li>
          <li>Copy and run each function from the <code className="bg-gray-100 px-1 rounded">sql-functions.md</code> file</li>
          <li>Refresh this page and run diagnosis again</li>
          <li>If tables exist but you can't view categories/products, check your Supabase Row Level Security (RLS) policies</li>
        </ol>
      </div>
    </div>
  );
} 