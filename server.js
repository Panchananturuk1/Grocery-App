// Custom server for Next.js on Render
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Log startup information
console.log('Starting custom Next.js server...');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT || 10000}`);

// Determine if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
console.log(`Running in ${dev ? 'development' : 'production'} mode`);

// Set up Next.js app with proper configuration
let nextConfig = {};

// In production with standalone output, we need to specify the directory
if (!dev) {
  console.log('Using standalone configuration');
  // When using standalone output, the app needs to know where to find its files
  nextConfig = {
    dir: path.join(process.cwd()),
    conf: {
      distDir: '.next',
      outDir: '.next/standalone'
    }
  };
}

// Initialize Next.js app
const app = next({ dev, ...nextConfig });
const handle = app.getRequestHandler();

// Get port from environment variable
const port = parseInt(process.env.PORT || '10000', 10);

// Start the server
app.prepare()
  .then(() => {
    // Create HTTP server
    const server = createServer((req, res) => {
      try {
        // Handle the incoming request
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Add error handler for the server
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1); // Exit so Render can restart the service
    });

    // Listen on all interfaces (0.0.0.0)
    server.listen(port, '0.0.0.0', (err) => {
      if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
        return;
      }
      
      console.log(`> Ready on http://0.0.0.0:${port}`);
      console.log('Server is now listening for requests');
    });
  })
  .catch((err) => {
    console.error('Error preparing Next.js app:', err);
    process.exit(1);
  }); 