require('dotenv').config({
  path: require('path').resolve(__dirname, '..', '.env')
});

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
console.log('SERVER __dirname =', __dirname);
console.log('STATIC PATH =', path.join(__dirname, '../public'));

// Debug: Check if index.html exists
const indexPath = path.join(__dirname, '../public/index.html');
console.log('INDEX PATH =', indexPath);
console.log('INDEX EXISTS =', fs.existsSync(indexPath));

/* ================= SUPABASE ================= */
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* ================= CORS ================= */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

/* ================= SESSION ================= */
app.use(
  session({
    name: 'code-editor-session',
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

/* ================= BODY ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= IMPORT MIDDLEWARE ================= */
const { requireAuth } = require('./middleware/auth');

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('  Session:', {
    userId: req.session?.userId,
    isLoggedIn: req.session?.isLoggedIn,
    email: req.session?.email
  });
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('  Body:', req.body);
  }
  next();
});

/* ================= IMPORT ROUTES ================= */
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');

/* ================= USE ROUTES (MOUNT FIRST!) ================= */
app.use('/auth', authRouter);
app.use('/api/projects', projectsRouter);

/* ================= TEST ENDPOINTS ================= */
app.get('/api/test', (req, res) => {
  console.log('/api/test endpoint hit');
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/api/projects/debug', (req, res) => {
  console.log('/api/projects/debug endpoint hit');
  console.log('Session:', req.session);
  res.json({ 
    message: 'Projects route is accessible',
    session: req.session ? {
      userId: req.session.userId,
      isLoggedIn: req.session.isLoggedIn,
      username: req.session.username
    } : 'No session',
    timestamp: new Date().toISOString()
  });
});

/* ================= DEBUG ================= */
app.get('/debug-session', (req, res) => {
  res.json({
    session: req.session,
    sessionID: req.sessionID
  });
});

/* ================= DEFAULT (ROOT) ================= */
app.get('/', (req, res) => {
  console.log('ROOT route hit');
  console.log('Session:', req.session);
  
  if (req.session?.isLoggedIn) {
    console.log('User is logged in, redirecting...');
    return res.redirect('/pages/user/home.html');
  }
  
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

/* ================= PROTECTED ROUTES ================= */
app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.redirect('/pages/user/home.html');
  }
  res.sendFile(path.join(__dirname, '../public/pages/admin/dashboard.html'));
});

app.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/user/home.html'));
});

app.get('/pages/user/home.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/user/home.html'));
});

app.get('/pages/user/compiler.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/user/compiler.html'));
});

app.get('/admin/dashboard.html', requireAuth, (req, res) => {
  console.log('Serving dashboard for user:', req.session.userId);
  res.sendFile(path.join(__dirname, '../public/pages/admin/dashboard.html'));
});

/* ================= STATIC FILES (LAST) ================= */
app.use(express.static(path.join(__dirname, '../public')));

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  console.log('404 - Route not found:', req.path);
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, '../public')}`);
});