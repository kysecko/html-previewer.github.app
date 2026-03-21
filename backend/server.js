require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);

// Sinusuri kung nasa production o Vercel environment
const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

// ==============================
// PAG-LOAD NG MGA ROUTES AT MIDDLEWARE
// ==============================

let requireAuth, authRouter, projectsRouter, usersRouter;

try {
  requireAuth    = require('./middleware/auth').requireAuth;
  usersRouter    = require('./routes/users');
  authRouter     = require('./routes/auth');
  projectsRouter = require('./routes/projects');
} catch (err) {
  // Kapag may error sa pag-load, gagamit ng fallback para hindi mag-crash ang server
  console.error('Error sa pag-load ng mga route module:', err.message);

  requireAuth = (req, res, next) => next();

  authRouter = express.Router();
  authRouter.all('*', (req, res) => res.json({ message: 'Auth fallback' }));

  projectsRouter = express.Router();
  projectsRouter.all('*', (req, res) => res.json({ message: 'Projects fallback' }));

  usersRouter = express.Router();
  usersRouter.all('*', (req, res) => res.json({ message: 'Users fallback' }));
}

// ==============================
// CORS — SINO ANG PWEDENG MAG-ACCESS SA API
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
    secure: isProd,                    // HTTPS lang kapag production
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000       // 1 araw
  }
};

// Redis para sa session storage (opsyonal)
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

    redisClient.connect().catch(() => {});

    sessionConfig.store = new RedisStore({ client: redisClient });

  } catch (err) {
    console.error('Hindi na-setup ang Redis:', err.message);
  }
}

app.use(session(sessionConfig));

// ==============================
// PANGKALAHATANG MIDDLEWARE
// ==============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simpleng logger ng mga request (para sa development lang)
if (!isProd) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// ==============================
// API ROUTES
// ==============================

app.use('/api/auth',     authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/users',    usersRouter);

// Pangsubok na endpoint para malaman kung gumagana ang API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API gumagana', session: !!req.session });
});

// Health check — para malaman kung buhay ang server
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ==============================
// STATIC FILES — CSS, JS, IMAGES
// ==============================

// Ang lahat ng static files ay nasa public folder
// Istruktura:
//   public/index.html
//   public/login.html
//   public/register.html
//   public/pages/compiler.html
//   public/pages/user/home.html
//   public/pages/admin/dashboard.html
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// ==============================
// PROTECTED ROUTES — kailangan ng login
// (dapat nasa itaas ng wildcard handler)
// ==============================

// Home page ng naka-login na user
app.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/home.html'));
});

// Compiler ng naka-login na user
app.get('/user/compiler', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/compiler.html'));
});

// Admin dashboard — para lang sa may admin role
app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
});

// ==============================
// WILDCARD CLEAN URL HANDLER
// Awtomatikong hinahanap ang .html file base sa URL
// ==============================

app.get('*', (req, res, next) => {
  // I-skip ang API routes
  if (req.path.startsWith('/api')) return next();

  // I-skip kung may extension na (css, js, png, atbp.)
  if (path.extname(req.path)) return next();

  // Root — kung naka-login na, i-redirect sa /user
  if (req.path === '/') {
    if (req.session?.isLoggedIn) return res.redirect('/user');
    return res.sendFile(path.join(publicPath, 'index.html'));
  }

  // Mga posibleng lokasyon ng HTML file base sa URL
  // Halimbawa: /login → public/login.html
  //            /compiler → public/pages/compiler.html
  const possiblePaths = [
    path.join(publicPath, req.path + '.html'),              // public/login.html
    path.join(publicPath, 'pages', req.path + '.html'),    // public/pages/compiler.html
  ];

  // Subukang i-serve ang unang mahanap na file
  const tryNext = (paths) => {
    if (paths.length === 0) return next();
    fs.access(paths[0], fs.constants.F_OK, (err) => {
      if (!err) return res.sendFile(paths[0]);
      tryNext(paths.slice(1));
    });
  };

  tryNext(possiblePaths);
});

// ==============================
// ERROR HANDLING
// ==============================

// 404 — hindi nahanap ang hiniling na pahina o endpoint
app.use((req, res) => {
  res.status(404).json({
    error: 'Hindi nahanap',
    path: req.path
  });
});

// Pangkalahatang error handler para sa lahat ng hindi inaasahang error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: isProd ? 'May nangyaring mali' : err.message
  });
});

// ==============================
// PAGPAPATAKBO NG SERVER (development lang)
// ==============================

if (!isProd) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server tumatakbo sa port ${PORT}`);
  });
}

module.exports = app;