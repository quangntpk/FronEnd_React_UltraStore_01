const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

console.log('🚀 FashionHub Starting...');
console.log('📊 Environment:', process.env.NODE_ENV || 'production');
console.log('📊 Port:', port);
console.log('📁 Working Directory:', __dirname);
console.log('🌐 Azure Site:', process.env.WEBSITE_SITE_NAME || 'local');

// Debug current directory structure
try {
  const files = fs.readdirSync(__dirname);
  console.log('📂 Root files:', files);
  
  // Check for dist folder
  const distPath = path.join(__dirname, 'dist');
  const distExists = fs.existsSync(distPath);
  console.log(`📁 Dist folder exists: ${distExists}`);
  
  if (distExists) {
    const distFiles = fs.readdirSync(distPath);
    console.log('📂 Files in dist:', distFiles);
  }
  
  // Check for index.html in both locations
  const indexInRoot = fs.existsSync(path.join(__dirname, 'index.html'));
  const indexInDist = distExists && fs.existsSync(path.join(distPath, 'index.html'));
  console.log(`📄 index.html in root: ${indexInRoot}`);
  console.log(`📄 index.html in dist: ${indexInDist}`);
  
} catch (err) {
  console.error('❌ Cannot read directory:', err.message);
}

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://fashionhub.azurewebsites.net',
    `https://bicacuatho.azurewebsites.net`
  ].filter(Boolean),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ✅ Health check endpoints
app.get('/health', (req, res) => {
  console.log('💚 Basic health check');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  console.log('💚 Detailed health check');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: port,
    env: process.env.NODE_ENV || 'production',
    azure: !!process.env.WEBSITE_SITE_NAME
  });
});

// ✅ Debug endpoint
app.get('/api/debug', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    const distPath = path.join(__dirname, 'dist');
    const distExists = fs.existsSync(distPath);
    const distFiles = distExists ? fs.readdirSync(distPath) : [];
    
    res.json({
      workingDir: __dirname,
      rootFiles: files,
      distExists: distExists,
      distFiles: distFiles,
      indexInRoot: files.includes('index.html'),
      indexInDist: distFiles.includes('index.html'),
      environment: process.env.NODE_ENV || 'production',
      azureSite: process.env.WEBSITE_SITE_NAME || null,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ✅ Static files serving (FLEXIBLE - handles both structures)
const distPath = path.join(__dirname, 'dist');
const indexInRoot = path.join(__dirname, 'index.html');
const indexInDist = path.join(distPath, 'index.html');

console.log('🔍 Checking static file locations:');
console.log(`   - Dist folder: ${distPath} (exists: ${fs.existsSync(distPath)})`);
console.log(`   - Index in root: ${indexInRoot} (exists: ${fs.existsSync(indexInRoot)})`);
console.log(`   - Index in dist: ${indexInDist} (exists: ${fs.existsSync(indexInDist)})`);

// Setup static file serving based on what's available
if (fs.existsSync(distPath) && fs.existsSync(indexInDist)) {
  console.log('✅ Using DIST FOLDER structure (recommended)');
  app.use(express.static(distPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
  }));
} else if (fs.existsSync(indexInRoot)) {
  console.log('✅ Using ROOT FOLDER structure (flat deployment)');
  app.use(express.static(__dirname, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
  }));
} else {
  console.log('⚠️ No static files found - API only mode');
}

// ✅ Root endpoint with fallback logic
app.get('/', (req, res) => {
  console.log('🏠 Root request received');
  
  // Try dist/index.html first (recommended structure)
  if (fs.existsSync(indexInDist)) {
    console.log('✅ Serving index.html from dist folder');
    return res.sendFile(indexInDist);
  }
  
  // Fallback to root/index.html (flat deployment)
  if (fs.existsSync(indexInRoot)) {
    console.log('✅ Serving index.html from root folder');
    return res.sendFile(indexInRoot);
  }
  
  // No index.html found - serve API response
  console.log('⚠️ No index.html found - serving API response');
  res.json({ 
    message: 'FashionHub API Running',
    timestamp: new Date().toISOString(),
    status: 'ready',
    note: 'Frontend not deployed - API endpoints available',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      debug: '/api/debug'
    }
  });
});

// ✅ SPA fallback for React Router (FLEXIBLE)
app.get('*', (req, res) => {
  console.log(`📄 SPA fallback for: ${req.path}`);
  
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }
  
  // Try to serve index.html from dist first
  if (fs.existsSync(indexInDist)) {
    console.log('✅ SPA fallback: serving from dist');
    return res.sendFile(indexInDist);
  }
  
  // Fallback to root index.html
  if (fs.existsSync(indexInRoot)) {
    console.log('✅ SPA fallback: serving from root');
    return res.sendFile(indexInRoot);
  }
  
  // No index.html found
  console.log('❌ SPA fallback: no index.html found');
  res.status(404).json({ 
    error: 'Page not found',
    path: req.path,
    message: 'Frontend application not properly deployed',
    availableEndpoints: ['/health', '/api/health', '/api/debug']
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ✅ Start server with comprehensive error handling
console.log('🔄 Attempting to start server...');

try {
  const server = app.listen(port, () => {
    console.log('🎉 ================================');
    console.log(`✅ Server successfully started!`);
    console.log(`🌐 URL: http://localhost:${port}`);
    console.log(`🔗 Health: http://localhost:${port}/health`);
    console.log(`🐛 Debug: http://localhost:${port}/api/debug`);
    if (process.env.WEBSITE_SITE_NAME) {
      console.log(`☁️ Azure: https://${process.env.WEBSITE_SITE_NAME}.azurewebsites.net`);
    }
    console.log('🎉 ================================');
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('💥 Server startup error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use`);
      console.log('💡 Try: killall node or use different port');
    }
    process.exit(1);
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal) => {
    console.log(`📴 ${signal} received - starting graceful shutdown`);
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

} catch (err) {
  console.error('💥 Failed to start server:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
}