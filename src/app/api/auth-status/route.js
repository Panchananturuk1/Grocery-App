import { NextResponse } from 'next/server';
import supabase from '../../../utils/supabase';

export async function GET() {
  try {
    // Get the session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if session exists
    const isAuthenticated = !!session;
    
    // Get user info if authenticated
    let user = null;
    if (isAuthenticated) {
      const { data: { user: userData } } = await supabase.auth.getUser();
      user = {
        id: userData.id,
        email: userData.email,
        created_at: userData.created_at,
        user_metadata: userData.user_metadata
      };
    }
    
    return NextResponse.json({
      success: true,
      isAuthenticated,
      user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      error: error.message
    }, { status: 500 });
  }
} 