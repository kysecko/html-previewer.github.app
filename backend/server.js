require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

console.log('========== SERVER STARTUP DEBUG ==========');
console.log('Current directory:', __dirname);
console.log('Process ID:', process.pid);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Memory usage:', process.memoryUsage());
console.log('Environment variables present:', {
  NODE_ENV: !!process.env.NODE_ENV,
  VERCEL: !!process.env.VERCEL,
  REDIS_URL: !!process.env.REDIS_URL,
  SESSION_SECRET: !!process.env.SESSION_SECRET,
  PORT: !!process.env.PORT
});
console.log('NODE_ENV value:', process.env.NODE_ENV);
console.log('VERCEL value:', process.env.VERCEL);
console.log('==========================================');

const app = express();
app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

console.log('Environment detection:', { isProd, isVercel });

// Debug: Check if required modules exist
try {
  console.log('Checking required modules...');
  require.resolve('./middleware/auth');
  console.log('✓ auth middleware found');
  require.resolve('./routes/auth');
  console.log('✓ auth routes found');
  require.resolve('./routes/projects');
  require.resolve('./routes/users');
  console.log('✓ projects routes found');
} catch (err) {
  console.error('❌ Module not found:', err.message);
}

// Load route modules FIRST
console.log('Loading route modules...');
let requireAuth, authRouter, projectsRouter, usersRouter;
try {
  requireAuth = require('./middleware/auth').requireAuth;
  usersRouter = require('./routes/users');
  authRouter = require('./routes/auth');
  projectsRouter = require('./routes/projects');
  console.log('✓ Route modules loaded successfully');
} catch (err) {
  console.error('Failed to load route modules:', err);
  console.error('Route module error stack:', err.stack);
  // Create fallback modules to prevent crashes
  requireAuth = (req, res, next) => {
    console.log('Fallback auth - allowing request');
    next();
  };
  authRouter = express.Router();
  authRouter.all('*', (req, res) => res.json({ message: 'Auth router fallback' }));
  projectsRouter = express.Router();
  projectsRouter.all('*', (req, res) => res.json({ message: 'Projects router fallback' }));
}

app.use(cors({
  origin: [
    'https://html-previewer-github.vercel.app',
    'https://html-previewer-github-dka6vuab2-kyseckos-projects.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

console.log('CORS configured');

const sessionConfig = {
  name: 'code-editor-session',
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
};

console.log('Session config created:', { 
  name: sessionConfig.name,
  hasSecret: !!sessionConfig.secret,
  resave: sessionConfig.resave,
  cookieSecure: sessionConfig.cookie.secure 
});

if (!isVercel && process.env.REDIS_URL) {
  console.log('Attempting to configure Redis...');
  try {
    const { createClient } = require('redis');
    const RedisStore = require('connect-redis').default;

    console.log('Redis modules loaded successfully');
    console.log('Redis URL exists, connecting...');

    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: { 
        tls: true, 
        rejectUnauthorized: false,
        connectTimeout: 10000
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis error event:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully (connect event)');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready (ready event)');
    });

    redisClient.on('end', () => {
      console.log('Redis connection ended');
    });

    // Connect without awaiting to prevent blocking
    redisClient.connect().then(() => {
      console.log('Redis connect() promise resolved');
    }).catch(err => {
      console.error('Redis connect() promise rejected:', err.message);
      console.error('Redis connection error details:', err);
    });

    sessionConfig.store = new RedisStore({
      client: redisClient,
      prefix: 'sess:',
      ttl: 86400
    });

    console.log('Redis store configured and attached to session');
  } catch (err) {
    console.error('Redis setup threw exception:', err);
    console.error('Redis exception stack:', err.stack);
    console.log('Falling back to memory session store');
  }
} else {
  console.log('Using memory session store:', { 
    isVercel, 
    hasRedisUrl: !!process.env.REDIS_URL 
  });
}

console.log('Applying session middleware...');
app.use(session(sessionConfig));
console.log('Session middleware applied');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('Body parsers configured');

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('  Headers:', {
    origin: req.headers.origin,
    cookie: req.headers.cookie ? 'present' : 'none',
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });
  
  // Capture response
  const oldSend = res.send;
  res.send = function(data) {
    console.log(`  Response ${res.statusCode} for ${req.method} ${req.url}`);
    oldSend.apply(res, arguments);
  };
  
  next();
});

app.use((req, res, next) => {
  const authStatus = req.session?.isLoggedIn 
    ? `authenticated ${req.session.email}` 
    : 'not authenticated';
  console.log(`Auth check: ${req.method} ${req.path} - ${authStatus}`);
  next();
});

// Mount routes AFTER they're defined
console.log('Mounting routes...');
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/users', usersRouter);
console.log('Routes mounted: /api/auth, /api/projects');

app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: isVercel,
    redisConfigured: !!process.env.REDIS_URL,
    redisActive: !isVercel && !!process.env.REDIS_URL,
    sessionActive: !!req.session,
    sessionID: req.sessionID,
    pid: process.pid,
    memory: process.memoryUsage()
  });
});

app.get('/api/health', (req, res) => {
  console.log('Health check hit');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/api/debug', (req, res) => {
  console.log('Debug endpoint hit');
  res.json({
    process: {
      cwd: process.cwd(),
      execPath: process.execPath,
      version: process.version,
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasRedisUrl: !!process.env.REDIS_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET
    },
    paths: {
      __dirname: __dirname,
      publicPath: path.join(__dirname, '..', 'public')
    }
  });
});

const publicPath = path.join(__dirname, '..', 'public');
console.log('Public path:', publicPath);

// Check if public directory exists
try {
  const publicExists = fs.existsSync(publicPath);
  console.log('Public directory exists:', publicExists);
  if (publicExists) {
    const files = fs.readdirSync(publicPath);
    console.log('Public directory contents:', files);
  }
} catch (err) {
  console.error('Error checking public directory:', err);
}

app.use(express.static(publicPath));
console.log('Static files middleware configured');

app.get('/', (req, res) => {
  console.log('Root path hit, session:', !!req.session);
  if (req.session?.isLoggedIn) {
    console.log('User authenticated, redirecting to /user');
    return res.redirect('/user');
  }
  console.log('Serving index.html');
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/guest/compiler', (req, res) => {
  console.log('Guest compiler path hit');
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

app.get(['/user', '/pages/user/home.html'], requireAuth, (req, res) => {
  console.log('User home path hit, authenticated');
  res.sendFile(path.join(publicPath, 'pages/user/home.html'));
});

app.get('/pages/user/compiler.html', requireAuth, (req, res) => {
  console.log('User compiler path hit, authenticated');
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

app.get(['/admin', '/admin/dashboard.html'], requireAuth, (req, res) => {
  console.log('Admin path hit, checking role:', req.session.role);
  if (req.session.role !== 'admin') {
    console.log('Not admin, redirecting to /user');
    return res.redirect('/user');
  }
  console.log('Admin authenticated, serving dashboard');
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
});

app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.path);
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: isProd ? 'An error occurred' : err.message,
    stack: isProd ? undefined : err.stack
  });
});

console.log('All routes and middleware configured');

if (!isProd) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`========== SERVER STARTED ==========`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${isProd ? 'production' : 'development'}`);
    console.log(`Vercel: ${isVercel ? 'yes' : 'no'}`);
    console.log(`Redis: ${!isVercel && process.env.REDIS_URL ? 'enabled' : 'disabled'}`);
    console.log(`Public path: ${publicPath}`);
    console.log(`=====================================`);
  });
} else {
  console.log('Production mode - not starting listener (Vercel will handle)');
}

console.log('Server module export ready');
module.exports = app;