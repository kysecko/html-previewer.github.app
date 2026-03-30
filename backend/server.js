require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

// LOAD ROUTES

let requireAuth, authRouter, projectsRouter, usersRouter;

try {
  requireAuth = require('./middleware/auth').requireAuth;
  usersRouter = require('./routes/users');
  authRouter = require('./routes/auth');
  projectsRouter = require('./routes/projects');
} catch (err) {
  console.error('Error loading route modules:', err.message);

  requireAuth = (req, res, next) => next();

  authRouter = express.Router();
  authRouter.all('*', (req, res) => res.json({ message: 'Auth fallback' }));

  projectsRouter = express.Router();
  projectsRouter.all('*', (req, res) => res.json({ message: 'Projects fallback' }));

  usersRouter = express.Router();
  usersRouter.all('*', (req, res) => res.json({ message: 'Users fallback' }));
}

// CORS

app.use(cors({
  origin: [
    'https://html-previewer-github.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

// SESSION

const sessionConfig = {
  name: 'code-editor-session',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
};

if (process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis');
    const RedisStore = require('connect-redis').default;

    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: { tls: true, rejectUnauthorized: false }
    });

    redisClient.connect().catch(() => { });
    sessionConfig.store = new RedisStore({ client: redisClient });
  } catch (err) {
    console.error('Redis setup failed:', err.message);
  }
}

app.use(session(sessionConfig));

// MIDDLEWARES

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!isProd) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// PATHS

const publicPath = path.join(__dirname, '..', 'public');

// STATIC FILES

app.use(express.static(publicPath, {
  maxAge: '7d', // cache for 7 days
  etag: true
}));

// API ROUTES

const logsRouter = require('./routes/logs');
app.use('/api/logs', logsRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/users', usersRouter);

app.get('/api/test', (req, res) => {
  res.json({ message: 'API working', session: !!req.session });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// PAGE ROUTES

// Home — redirect to /user if already logged in
app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Auth pages (clean URLs, no .html)
app.get('/login', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(publicPath, 'register.html')));

// Guest compiler
app.get('/guest/compiler', (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

// Protected user pages
app.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/home.html'));
});

app.get('/user/compiler', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

// Admin dashboard
app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
});

// CLEAN URL HANDLER (.html extension remover)

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (path.extname(req.path)) return next();

  const filePath = path.join(publicPath, req.path + '.html');

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) return res.sendFile(filePath);
    next();
  });
});

// ERROR HANDLING

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: isProd ? 'Something went wrong' : err.message
  });
});

// START SERVER ( on local only )

if (!isProd) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;