'use client';

import DbFix from '../../components/debug/DbFix';
import MainLayout from '../../components/layout/MainLayout';
import { FiDatabase, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function DatabaseFixPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-black flex items-center">
            <FiDatabase className="mr-2" /> Database Setup & Troubleshooting
          </h1>
          <Link href="/products" className="text-blue-600 hover:text-blue-800 flex items-center">
            <FiArrowLeft className="mr-1" /> Back to Products
          </Link>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <p className="text-blue-700">
            This page helps diagnose and fix database connection issues. If you're seeing errors about 
            missing tables or failed queries, this utility can help set up your database correctly.
          </p>
        </div>
        
        <DbFix />
        
        <div className="mt-8 bg-gray-50 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-3">Common Database Issues</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Missing Tables</h3>
              <p className="text-sm text-gray-700 mt-1">
                If your tables are missing, you need to run the SQL functions in your Supabase dashboard.
                The functions are found in the <code className="bg-gray-200 px-1 rounded">sql-functions.md</code> file
                at the root of the project.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Connection Timeouts</h3>
              <p className="text-sm text-gray-700 mt-1">
                Supabase free tier may experience slow connections or timeouts during periods of high usage.
                This is normal and usually resolves within a few minutes. Try refreshing or checking back later.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Row Level Security (RLS) Issues</h3>
              <p className="text-sm text-gray-700 mt-1">
                If tables exist but you can't access the data, you might have Row Level Security (RLS) issues.
                Make sure the SQL functions include the correct RLS policies for public access to products and categories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 