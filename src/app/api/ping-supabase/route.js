import { NextResponse } from 'next/server';
import supabase from '../../../utils/supabase';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Simple lightweight query to test connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .withTimeout(5000); // 5s timeout for ping
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
        code: error.code,
        duration: Date.now() - startTime
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message,
      duration: Date.now() - startTime
    }, { status: 500 });
  }
} 