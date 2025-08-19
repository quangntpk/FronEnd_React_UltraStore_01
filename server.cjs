const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

console.log('🚀 FashionHub Starting...');
console.log('📊 Port:', port);
console.log('📁 Working Directory:', __dirname);

// List files to debug
try {
  const files = fs.readdirSync(__dirname);
  console.log('📂 Files in working directory:', files);
  
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
    console.log('📂 Files in dist:', distFiles);
  }
} catch (err) {
  console.error('❌ Cannot read directory:', err.message);
}

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Health check (SIMPLE)
app.get('/health', (req, res) => {
  console.log('💚 Health check requested');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  console.log('💚 API Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: port
  });
});

// ✅ Debug endpoint
app.get('/api/debug', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    const distExists = fs.existsSync(path.join(__dirname, 'dist'));
    const distFiles = distExists ? fs.readdirSync(path.join(__dirname, 'dist')) : [];
    
    res.json({
      workingDir: __dirname,
      rootFiles: files,
      distExists: distExists,
      distFiles: distFiles,
      indexInRoot: files.includes('index.html'),
      indexInDist: distFiles.includes('index.html')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Static files từ dist folder
const distPath = path.join(__dirname, 'dist');
console.log(`📁 Dist path: ${distPath}`);
console.log(`📁 Dist exists: ${fs.existsSync(distPath)}`);

if (fs.existsSync(distPath)) {
  console.log('✅ Serving static files from dist');
  app.use(express.static(distPath));
} else {
  console.log('❌ Dist folder not found');
}

// ✅ Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root request');
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Serving index.html from dist');
    res.sendFile(indexPath);
  } else {
    console.log('❌ index.html not found, serving JSON');
    res.json({ 
      message: 'FashionHub API Running',
      timestamp: new Date().toISOString(),
      note: 'index.html not found in dist folder'
    });
  }
});

// ✅ SPA fallback
app.get('*', (req, res) => {
  console.log(`📄 SPA fallback for: ${req.path}`);
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Application not built',
      path: req.path,
      suggestion: 'Run npm run build first'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ Start server với proper error handling
console.log('🔄 Starting server...');

try {
  const server = app.listen(port, () => {
    console.log(`✅ SUCCESS: Server running on http://localhost:${port}`);
    console.log(`🔗 Health: http://localhost:${port}/health`);
    console.log(`🐛 Debug: http://localhost:${port}/api/debug`);
    console.log(`🌐 App: http://localhost:${port}/`);
  });

  server.on('error', (err) => {
    console.error('💥 Server error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📴 SIGINT received (Ctrl+C)');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

} catch (err) {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
}