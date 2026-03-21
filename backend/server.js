require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);

// Environment check
const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

// ==============================
// PAG LOAD NG MGA ROUTES
// ==============================

let requireAuth, authRouter, projectsRouter, usersRouter;

try {
  // Kinukuha ang middleware at routes
  requireAuth = require('./middleware/auth').requireAuth;
  usersRouter = require('./routes/users');
  authRouter = require('./routes/auth');
  projectsRouter = require('./routes/projects');
} catch (err) {
  // Kapag may error sa pag-load, gagamit ng fallback para hindi mag-crash
  console.error('Error loading route modules:', err.message);

  requireAuth = (req, res, next) => next();

  authRouter = express.Router();
  authRouter.all('*', (req, res) => res.json({ message: 'Auth fallback' }));

  projectsRouter = express.Router();
  projectsRouter.all('*', (req, res) => res.json({ message: 'Projects fallback' }));

  usersRouter = express.Router();
  usersRouter.all('*', (req, res) => res.json({ message: 'Users fallback' }));
}

// ==============================
// CORS CONFIGURATION
// ==============================

app.use(cors({
  origin: [
    'https://html-previewer-github.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

// ==============================
// SESSION CONFIGURATION
// ==============================

const sessionConfig = {
  name: 'code-editor-session',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd, // HTTPS only kapag production
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
};

// Redis (optional)
if (process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis');
    const RedisStore = require('connect-redis').default;

    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false
      }
    });

    redisClient.connect().catch(() => { });

    sessionConfig.store = new RedisStore({
      client: redisClient
    });

  } catch (err) {
    console.error('Redis setup failed:', err.message);
  }
}

// Apply session
app.use(session(sessionConfig));

// ==============================
// MIDDLEWARES
// ==============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simpleng request logger (dev only)
if (!isProd) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// ==============================
// API ROUTES
// ==============================

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/users', usersRouter);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API working',
    session: !!req.session
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});

// ==============================
// STATIC FILES
// ==============================

// Public folder path
const publicPath = path.join(__dirname, '..', 'public');

// Static files (CSS, JS, images)
app.use(express.static(publicPath));

// ==============================
// CLEAN URL HANDLER (.html remover)
// ==============================

app.get('*', (req, res, next) => {

  // I-skip ang API routes
  if (req.path.startsWith('/api')) return next();

  // I-skip kung may extension (css, js, png, etc.)
  if (path.extname(req.path)) return next();

  let filePath;

  // Root page
  if (req.path === '/') {
    filePath = path.join(publicPath, 'index.html');
  } else {
    filePath = path.join(publicPath, req.path + '.html');
  }

  // Check kung existing file
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) return res.sendFile(filePath);
    next();
  });
});

// PAGE ROUTES
// Protected routes — bago ang wildcard
app.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/home.html'));
});

app.get('/user/compiler', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
});

// Home
app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) {
    return res.redirect('/user');
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Guest compiler
app.get('/guest/compiler', (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

// User page (secured)
app.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/home.html'));
});

// User compiler
app.get('/user/compiler', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

// Admin dashboard
app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.redirect('/user');
  }
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
});

// ERROR HANDLING

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: isProd ? 'Something went wrong' : err.message
  });
});

// SERVER START

if (!isProd) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;