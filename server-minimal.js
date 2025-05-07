// Minimal server for Render deployments
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

console.log('Starting minimal Next.js server...');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT || 10000}`);

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 10000;

// Create Next.js app with minimal configuration
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, '0.0.0.0', (err) => {
      if (err) throw err;
      console.log(`> Minimal server ready on http://0.0.0.0:${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to prepare Next.js app:', err);
    process.exit(1);
  });

// Basic error handlers
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit to keep the service running
}); 