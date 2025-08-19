const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

console.log('🚀 FashionHub Starting...');
console.log('📊 Environment:', process.env.NODE_ENV || 'production');
console.log('🔌 Port:', port);
console.log('🌍 Azure Site:', process.env.WEBSITE_SITE_NAME || 'local');
console.log('📁 Working Directory:', __dirname);

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:8080', 
    'https://fashionhub.azurewebsites.net',
    `https://${process.env.WEBSITE_SITE_NAME}.azurewebsites.net`
  ].filter(Boolean),
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ✅ Health checks
app.get('/health', (req, res) => {
  console.log('📊 Health check requested');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  const distPath = path.join(__dirname, 'dist');
  const indexInRoot = path.join(__dirname, 'index.html');
  const indexInDist = path.join(distPath, 'index.html');
  
  console.log('📊 Detailed health check');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: port,
    env: process.env.NODE_ENV || 'production',
    azure: !!process.env.WEBSITE_SITE_NAME,
    structure: {
      workingDir: __dirname,
      distFolderExists: fs.existsSync(distPath),
      indexInRoot: fs.existsSync(indexInRoot),
      indexInDist: fs.existsSync(indexInDist)
    }
  });
});

// ✅ Debug endpoint
app.get('/api/debug', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    const distFiles = fs.existsSync(path.join(__dirname, 'dist')) 
      ? fs.readdirSync(path.join(__dirname, 'dist')) 
      : [];
    
    res.json({
      workingDir: __dirname,
      rootFiles: files,
      distFiles: distFiles,
      hasDistFolder: files.includes('dist'),
      hasIndexInRoot: files.includes('index.html'),
      hasServer: files.includes('server.cjs')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Static files - kiểm tra nhiều locations
const distPath = path.join(__dirname, 'dist');
const indexInRoot = path.join(__dirname, 'index.html');

console.log(`📁 Checking paths:`);
console.log(`   - Dist folder: ${distPath} (exists: ${fs.existsSync(distPath)})`);
console.log(`   - Index in root: ${indexInRoot} (exists: ${fs.existsSync(indexInRoot)})`);

// Setup static serving
if (fs.existsSync(distPath)) {
  console.log('✅ Using dist folder for static files');
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true
  }));
} else if (fs.existsSync(indexInRoot)) {
  console.log('✅ Using root directory for static files (flat structure)');
  app.use(express.static(__dirname, {
    maxAge: '1d',
    etag: true
  }));
} else {
  console.log('❌ No static files found');
}

// ✅ SPA fallback - kiểm tra multiple locations
app.get('*', (req, res) => {
  console.log(`📄 SPA fallback for: ${req.path}`);
  
  const indexInDist = path.join(distPath, 'index.html');
  const indexInRoot = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexInDist)) {
    console.log('✅ Serving index.html from dist');
    res.sendFile(indexInDist);
  } else if (fs.existsSync(indexInRoot)) {
    console.log('✅ Serving index.html from root');
    res.sendFile(indexInRoot);
  } else {
    console.log('❌ No index.html found');
    res.status(404).json({ 
      error: 'Application files not found',
      path: req.path,
      checkedPaths: [indexInDist, indexInRoot],
      availableFiles: fs.readdirSync(__dirname)
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server với comprehensive error handling
try {
  console.log('🚀 Attempting to start server...');
  
  const server = app.listen(port, () => {
    console.log(`✅ Server successfully running on port ${port}`);
    console.log(`🔗 Health: http://localhost:${port}/health`);
    console.log(`🐛 Debug: http://localhost:${port}/api/debug`);
    console.log(`🌐 Live: https://${process.env.WEBSITE_SITE_NAME || 'localhost'}.azurewebsites.net`);
  });

  server.on('error', (err) => {
    console.error('💥 Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📴 SIGINT received');
    server.close(() => {
      console.log('✅ Server closed gracefully');  
      process.exit(0);
    });
  });

} catch (err) {
  console.error('💥 Failed to start server:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
}