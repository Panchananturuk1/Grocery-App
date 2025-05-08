import { NextResponse } from 'next/server';
import supabase from '../../../utils/supabase';

export async function GET(request) {
  const startTime = Date.now();
  const isLocalhost = request.headers.get('host')?.includes('localhost') || false;

  try {
    // Get connection stats from monitor
    const stats = supabase.getConnectionStats();
    
    // Run a quick test query
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .withTimeout(3000);
      
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1)
      .withTimeout(3000);
    
    // Create a detailed status report
    const statusReport = {
      environment: isLocalhost ? 'localhost' : 'production',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      connection: {
        stats: stats.connection,
        recommendations: stats.recommendations
      },
      tables: {
        profiles: {
          exists: !profilesError || profilesError.code !== '42P01',
          error: profilesError ? {
            code: profilesError.code,
            message: profilesError.message
          } : null
        },
        products: {
          exists: !productsError || productsError.code !== '42P01',
          error: productsError ? {
            code: productsError.code,
            message: productsError.message
          } : null
        }
      },
      cachingActive: true,
      supabaseSettings: {
        timeoutConfig: {
          fetch: isLocalhost ? 30000 : 60000,
          query: isLocalhost ? 25000 : 45000,
          maxRetries: isLocalhost ? 3 : 5
        }
      }
    };
    
    return NextResponse.json(statusReport, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: isLocalhost ? 'localhost' : 'production'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
} 