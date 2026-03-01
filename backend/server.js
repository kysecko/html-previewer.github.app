require('dotenv').config({
  path: require('path').resolve(__dirname, '..', '.env')
});

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

/* ================= SUPABASE ================= */
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Add them in the Vercel dashboard under Settings → Environment Variables.');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* ================= CORS ================= */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

/* ================= SESSION ================= */
// NOTE: In-memory sessions do NOT persist between Vercel serverless invocations.
// For production, replace this with a persistent store.
//
// Option A — Supabase-backed sessions via connect-pg-simple:
//   npm install connect-pg-simple
//   const pgSession = require('connect-pg-simple')(session);
//   store: new pgSession({ conString: process.env.DATABASE_URL })
//
// Option B — Redis via @upstash/redis + connect-redis:
//   npm install connect-redis @upstash/redis
//   const { createClient } = require('@upstash/redis');
//   const RedisStore = require('connect-redis').default;
//   const redisClient = createClient({ url: process.env.REDIS_URL });
//   store: new RedisStore({ client: redisClient })
//
// Option C — Switch to stateless JWT auth (recommended for serverless).
app.use(
  session({
    name: 'code-editor-session',
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true on Vercel (HTTPS)
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

/* ================= BODY PARSING ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= REQUEST LOGGING ================= */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/* ================= MIDDLEWARE ================= */
const { requireAuth } = require('./middleware/auth');

/* ================= STATIC FILES ================= */
// Serve static assets (CSS, JS, images) BEFORE page routes but AFTER API routes.
// Vercel will also serve these from its CDN if you configure vercel.json correctly.
app.use(express.static(path.join(__dirname, '../public')));

/* ================= API ROUTES ================= */
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');

app.use('/auth', authRouter);
app.use('/api/projects', projectsRouter);

/* ================= TEST / DEBUG ENDPOINTS ================= */
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/api/projects/debug', (req, res) => {
  res.json({
    message: 'Projects route is accessible',
    session: req.session
      ? { userId: req.session.userId, isLoggedIn: req.session.isLoggedIn, username: req.session.username }
      : 'No session',
    timestamp: new Date().toISOString()
  });
});

app.get('/debug-session', (req, res) => {
  res.json({ session: req.session, sessionID: req.sessionID });
});

/* ================= PAGE ROUTES ================= */

// Root — redirect logged-in users, otherwise serve index
app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) {
    return res.redirect('/pages/user/home.html');
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Protected pages
app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.redirect('/pages/user/home.html');
  }
  res.sendFile(path.join(__dirname, '../public/pages/admin/dashboard.html'));
});

app.get('/admin/dashboard.html', requireAuth, (req, res) => {
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

/* ================= EXPORT FOR VERCEL ================= */
// Vercel does NOT use app.listen() — it calls your exported app directly.
// Keep the listen block for local development only.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Static files served from: ${path.join(__dirname, '../public')}`);
  });
}

module.exports = app;