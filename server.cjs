const express = require('express');
const path = require('path');
const cors = require('cors');

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
app.use(express.static(staticPath, {
  maxAge: '1d', // Cache static assets for 1 day
  etag: false
}));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📁 Serving static files from: ${staticPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});