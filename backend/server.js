require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

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
    secure: isProd,           // HTTPS lang kapag production
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 1 araw
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
  res.json({
    message: 'API gumagana',
    session: !!req.session
  });
});

// Health check — para malaman kung buhay ang server
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});

// ==============================
// STATIC FILES — CSS, JS, IMAGES
// ==============================

// Ang lahat ng static files ay nasa public folder
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// ==============================
// MGA PAGE ROUTES (CLEAN URLS)
// ==============================

app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Mga pampublikong pahina — nasa public root
app.get('/login',    (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(publicPath, 'register.html')));

// Compiler para sa mga bisita — nasa pages/user/
app.get('/guest/compiler', (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/compiler.html'));
});

// Mga pahina na kailangan ng login — nasa pages/user/
app.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/home.html'));
});

app.get('/user/compiler', requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/compiler.html'));
});

// Admin dashboard — nasa pages/admin/
app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
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