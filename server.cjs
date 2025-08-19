// server.cjs
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
// ✅ SỬA: Azure cần PORT từ environment
const port = process.env.PORT || 3000; // Đổi từ 8080 thành 3000

console.log('🚀 Starting server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', port);
console.log('🌍 Platform:', process.platform);

// Enable CORS với domain Azure
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://fashionhub.azurewebsites.net'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' })); // Giảm limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ THÊM: Basic health check trước khi check dist
app.get('/api/health', (req, res) => {
  console.log('📊 Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: port,
    env: process.env.NODE_ENV || 'production'
  });
});

// ✅ THÊM: Root endpoint cho Azure health probe
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  const staticPath = path.join(__dirname, 'dist');
  const indexPath = path.join(staticPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Serving index.html');
    res.sendFile(indexPath);
  } else {
    console.log('❌ index.html not found, serving fallback');
    res.status(200).json({ 
      message: 'FashionHub Server is running',
      timestamp: new Date().toISOString(),
      staticPath: staticPath,
      indexExists: fs.existsSync(indexPath)
    });
  }
});

// Static files
const staticPath = path.join(__dirname, 'dist');
console.log(`📁 Static path: ${staticPath}`);

if (fs.existsSync(staticPath)) {
  console.log('✅ dist folder found');
  app.use(express.static(staticPath, {
    maxAge: '1h',
    etag: false
  }));
} else {
  console.log('❌ dist folder not found');
}

// Catch all cho React Router
app.get('*', (req, res) => {
  console.log(`📄 Catch-all for: ${req.path}`);
  const indexPath = path.join(staticPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ 
      message: 'FashionHub API',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ SỬA: Chỉ bind port, không bind IP cụ thể
const server = app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🔗 Health: /api/health`);
});

// ✅ THÊM: Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});