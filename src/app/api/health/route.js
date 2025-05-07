// Health check endpoint for Render
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      message: 'OrderKaro API is healthy'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
} 