import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hard-code the credentials for server-side API routes
const supabaseUrl = 'https://itetzcqolezorrcegtkf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss';

// Create a dedicated server-side Supabase client for the API route
const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request) {
  const startTime = Date.now();
  const headers = request.headers;
  const environment = headers.get('X-Client-Env') || 'unknown';
  const isLocalhost = environment === 'localhost';
  
  // Shorter timeout for localhost
  const pingTimeout = isLocalhost ? 3000 : 5000;
  
  try {
    // Simple lightweight query to test connectivity
    // Add a timeout promise to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout after ${pingTimeout}ms`));
      }, pingTimeout);
    });
    
    // Create the query promise
    const queryPromise = supabaseClient
      .from('categories')  // Try categories instead of profiles
      .select('count')
      .limit(1);
    
    // Race the promises
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    
    if (error) {
      console.error(`Ping failed (${environment}):`, error);
      return NextResponse.json({
        success: false,
        message: error.message,
        code: error.code,
        duration: Date.now() - startTime,
        environment
      }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    const duration = Date.now() - startTime;
    const status = isLocalhost && duration > 1000 ? 'slow-local' : 
                  !isLocalhost && duration > 2000 ? 'slow-prod' : 'good';
    
    return NextResponse.json({
      success: true,
      duration,
      environment,
      status
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error(`Ping error (${environment}):`, error);
    return NextResponse.json({
      success: false,
      message: error.message,
      duration: Date.now() - startTime,
      environment
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 