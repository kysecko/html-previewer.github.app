require('dotenv').config({
  path: require('path').resolve(__dirname, '..', '.env')
});

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

/* ================= SUPABASE ================= */
const { createClient: createSupabaseClient } = require('@supabase/supabase-js'); // ✅ renamed

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Add them in Vercel Dashboard → Settings → Environment Variables.');
}

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* ================= REDIS SESSION STORE ================= */
/* ================= REDIS SESSION STORE ================= */
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

let sessionStore;

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.connect()
  .then(() => console.log('Redis connected'))
  .catch(err => console.error('Redis connection failed:', err));

redisClient.on('error', (err) => console.error('Redis error:', err));

sessionStore = new RedisStore({ client: redisClient });

app.post('/api/test-session', (req, res) => {
  req.session.testValue = 'hello';
  req.session.save((err) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }
    res.json({ success: true, sessionID: req.sessionID, testValue: req.session.testValue });
  });
});
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

/* ================= API ROUTES ================= */
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');

app.use('/api/auth', authRouter);
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

/* ================= STATIC FILES ================= */
app.use(express.static(path.join(__dirname, '../public')));

/* ================= PAGE ROUTES ================= */

app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) {
    return res.redirect('/user');
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/guest/compiler', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/user/compiler.html'));
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

app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.redirect('/user');
  }
  res.sendFile(path.join(__dirname, '../public/pages/admin/dashboard.html'));
});

app.get('/admin/dashboard.html', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.redirect('/user');
  }
  res.sendFile(path.join(__dirname, '../public/pages/admin/dashboard.html'));
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

/* ================= START ================= */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Static files: ${path.join(__dirname, '../public')}`);
  });
}

module.exports = app;