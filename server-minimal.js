// Minimal server for testing on Render
const http = require('http');

// Get port from environment
const PORT = process.env.PORT || 10000;

console.log('Starting minimal test server');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${PORT}`);

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Basic routing
  if (req.url === '/api/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Add error handler
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running at http://0.0.0.0:${PORT}`);
}); 