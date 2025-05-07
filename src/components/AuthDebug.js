'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabase';

export default function AuthDebug() {
  const [showDebug, setShowDebug] = useState(false);
  const [supabaseSession, setSupabaseSession] = useState(null);
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSupabaseSession(data.session);
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSupabaseSession(session);
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 text-xs rounded-md opacity-50 hover:opacity-100 z-50"
      >
        Debug Auth
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md z-50 text-sm">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Auth Debug Panel</h3>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-100 p-2 rounded">
          <h4 className="font-medium mb-1">Context</h4>
          <p>isAuthenticated: <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>{String(isAuthenticated)}</span></p>
          <p>user: {user ? `${user.email} (${user.id.slice(0, 6)}...)` : "null"}</p>
        </div>
        
        <div className="bg-gray-100 p-2 rounded">
          <h4 className="font-medium mb-1">Supabase</h4>
          <p>Session: <span className={supabaseSession ? "text-green-600" : "text-red-600"}>{String(!!supabaseSession)}</span></p>
          <p>User: {supabaseSession?.user ? `${supabaseSession.user.email} (${supabaseSession.user.id.slice(0, 6)}...)` : "null"}</p>
        </div>
      </div>
      
      <div className="mt-2 flex gap-2">
        <button 
          onClick={async () => {
            const { data } = await supabase.auth.getSession();
            setSupabaseSession(data.session);
          }}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Refresh
        </button>
        
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 