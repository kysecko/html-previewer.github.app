require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);

// ------------------ CORS ------------------
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

// ------------------ Session ------------------
const isProd = process.env.NODE_ENV === 'production';

app.use(session({
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
}));

// ------------------ Body Parser ------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------ Logging ------------------
app.use((req, res, next) => {
  const status = req.session?.isLoggedIn ? `authenticated ${req.session.email}` : 'not logged in';
  console.log(`${req.method} ${req.originalUrl} | ${status} | sid: ${req.sessionID}`);
  next();
});

// ------------------ Routes ------------------
const { requireAuth } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// ------------------ Static Files ------------------
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// ------------------ Page Routes ------------------
app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/guest/compiler', (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

app.get(['/user', '/pages/user/home.html'], requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/home.html'));
});

app.get(['/pages/user/compiler.html'], requireAuth, (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/user/compiler.html'));
});

app.get(['/admin', '/admin/dashboard.html'], requireAuth, (req, res) => {
  if (req.session.role !== 'admin') return res.redirect('/user');
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
});

// ------------------ 404 & Error Handler ------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: isProd ? 'Something went wrong' : err.message
  });
});

// ------------------ Local Dev Server ------------------
if (!isProd) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// ------------------ Export for Vercel ------------------
module.exports = app;