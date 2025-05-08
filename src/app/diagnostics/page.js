'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiDatabase, FiRefreshCw, FiInfo } from 'react-icons/fi';
import MainLayout from '../../components/layout/MainLayout';
import DbAccessCheck from '../../components/debug/DbAccessCheck';
import DbFix from '../../components/debug/DbFix';
import { Toaster } from 'react-hot-toast';

export default function DiagnosticsPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [accessCheckComplete, setAccessCheckComplete] = useState(false);
  const [accessResult, setAccessResult] = useState(null);
  
  const handleAccessCheckComplete = (result) => {
    setAccessCheckComplete(true);
    setAccessResult(result);
  };
  
  return (
    <MainLayout>
      <Toaster position="top-center" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-4 text-gray-600 hover:text-gray-800">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">OrderKaro Database Diagnostics</h1>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This page helps diagnose and fix common database connection issues in the OrderKaro app.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex items-start">
              <FiInfo className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-700">Instructions</p>
                <ol className="list-decimal ml-5 mt-2 text-blue-700 text-sm space-y-1">
                  <li>Run the Database Access Check below</li>
                  <li>If it shows errors, run the SQL scripts from fix-rls-policies.sql in your Supabase dashboard</li>
                  <li>Click "Reset Client & Reload" to apply the changes</li>
                  <li>If problems persist, use the Advanced Database Fix tool below</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        <DbAccessCheck onComplete={handleAccessCheckComplete} />
        
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiDatabase className="mr-2" />
            {showAdvanced ? "Hide Advanced Database Tools" : "Show Advanced Database Tools"}
          </button>
        </div>
        
        {showAdvanced && (
          <div className="mt-6">
            <DbFix />
          </div>
        )}
        
        <div className="mt-10 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Database Connection Details</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="mb-2"><span className="font-medium">Supabase URL:</span> https://itetzcqolezorrcegtkf.supabase.co</p>
            <p className="mb-2"><span className="font-medium">Database Status:</span> {accessResult?.success ? 
              <span className="text-green-600">Connected</span> : 
              <span className="text-red-600">Not Connected</span>}
            </p>
            
            {accessResult?.success && (
              <p className="mb-2">
                <span className="font-medium">Data Available:</span> {accessResult.categories} Categories, {accessResult.products} Products
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 