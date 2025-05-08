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

// Track ping health status to avoid constant pings if connection is down
let lastPingTime = 0;
let consecutiveFailures = 0;
const FAILURE_BACKOFF_MS = 30000; // 30 seconds

export async function GET(request) {
  const startTime = Date.now();
  
  // Check headers
  const headers = request.headers || new Headers();
  const environment = headers.get('X-Client-Env') || 'unknown';
  const isLocalhost = environment === 'localhost';
  
  // Implement backoff for repeated failures to prevent constant hammering
  if (consecutiveFailures > 2) {
    const timeSinceLastPing = startTime - lastPingTime;
    if (timeSinceLastPing < FAILURE_BACKOFF_MS) {
      // Return cached error rather than pinging again
      return NextResponse.json({
        success: false,
        cached: true,
        message: 'Connection issues detected. Backing off from repeated attempts.',
        failureCount: consecutiveFailures,
        nextAttemptIn: Math.round((FAILURE_BACKOFF_MS - timeSinceLastPing) / 1000) + 's',
        environment
      }, { 
        status: 503, // Service unavailable
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  }
  
  // Update last ping time
  lastPingTime = startTime;
  
  // Use a more reasonable timeout that won't create excessive errors
  const pingTimeout = isLocalhost ? 5000 : 8000;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), pingTimeout);
    
    try {
      // Perform a lightweight query to test connectivity
      const { data, error } = await supabaseClient
        .from('categories') // Assuming 'categories' is a small, public table
        .select('id', { count: 'exact', head: true }) // Fetch only count, no data
        .limit(1)
        .abortSignal(controller.signal); // Pass the abort signal

      // Clear timeout since the request completed or was aborted by Supabase client
      clearTimeout(timeoutId);
      
      if (error) {
        // If Supabase client itself aborted due to its internal timeout or an explicit abort
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          throw new Error('Supabase query timed out or was aborted');
        }
        // For other errors, treat as a failed ping
        throw error;
      }
      
      // Reset failure counter on success
      consecutiveFailures = 0;
      
      const duration = Date.now() - startTime;
      const status = duration > 2000 ? 'slow' : 'good';
      
      return NextResponse.json({
        success: true,
        duration,
        environment,
        status,
        // data: data // Optionally include data if needed for diagnostics
      }, {
        headers: {
          'Cache-Control': 'private, max-age=0, no-cache',
          'Pragma': 'no-cache'
        }
      });
    } catch (queryError) {
      // Ensure timeout is cleared if an error occurs before it fires
      clearTimeout(timeoutId);
      throw queryError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    // Increment failure counter
    consecutiveFailures++;
    
    // Determine if it's a timeout
    const isTimeout = error.name === 'AbortError' || 
                      error.message?.toLowerCase().includes('timeout') || 
                      error.message?.toLowerCase().includes('aborted');
    
    // Log but with reduced verbosity for timeouts
    if (isTimeout) {
      console.warn(`Ping timeout or aborted (${environment}): ${pingTimeout}ms`);
    } else {
      console.error(`Ping error (${environment}):`, error.message);
    }
    
    return NextResponse.json({
      success: false,
      message: isTimeout ? 'Connection timed out or aborted' : error.message,
      isTimeout,
      failureCount: consecutiveFailures,
      duration: Date.now() - startTime,
      environment
    }, { 
      status: isTimeout ? 408 : 500, // Use proper timeout status code
      headers: {
        'Cache-Control': 'private, max-age=0, no-cache',
        'Pragma': 'no-cache'
      }
    });
  }
} 