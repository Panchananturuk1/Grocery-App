// Custom server for Next.js on Render
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Log startup information
console.log('Starting custom Next.js server...');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT || 10000}`);

// Get port from environment variable or use a default
const port = parseInt(process.env.PORT, 10) || 10000;

// Determine if we're in dev mode
const dev = process.env.NODE_ENV !== 'production';

// Initialize Next.js app
const app = next({ dev });
const handle = app.getRequestHandler();

// Configure error handling settings
const LOGGING = {
  VERBOSE: true, // Set to false in extreme production scenarios
  MAX_ERROR_COUNT: 10 // Limit repeated error logs
};

// Error tracking
let errorCount = 0;
let lastErrorTime = Date.now();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      const now = Date.now();
      // Reset error count if more than 5 minutes have passed
      if (now - lastErrorTime > 300000) {
        errorCount = 0;
      }
      
      // Increment error counter and update timestamp
      errorCount++;
      lastErrorTime = now;
      
      // Log error (with rate limiting)
      if (LOGGING.VERBOSE && errorCount <= LOGGING.MAX_ERROR_COUNT) {
        console.error('Error handling request:', err);
        
        if (errorCount === LOGGING.MAX_ERROR_COUNT) {
          console.log(`Maximum error log count reached. Suppressing further errors for 5 minutes.`);
        }
      }
      
      // Send error response to client
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Start listening on all interfaces (0.0.0.0) for cloud compatibility
  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${port}`);
    console.log(`> Mode: ${dev ? 'development' : 'production'}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application continues to run despite unhandled promise rejections
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  // For serious exceptions, we may want to terminate the process
  // process.exit(1);
}); 