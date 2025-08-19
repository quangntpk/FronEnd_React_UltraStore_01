const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // Move this to the top

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://fashionhub.azurewebsites.net'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the dist directory
const staticPath = path.join(__dirname, 'dist');
console.log(`Attempting to serve static files from: ${staticPath}`);
if (!fs.existsSync(staticPath)) {
  console.error(`Error: 'dist' folder not found at ${staticPath}`);
  process.exit(1); // Exit if dist is missing
}
app.use(express.static(staticPath, {
  maxAge: '1d',
  etag: false
}));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle React routing
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Index.html not found');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with error handling
app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`🚀 Server is running on http://0.0.0.0:${port}`);
  console.log(`📁 Serving static files from: ${staticPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});