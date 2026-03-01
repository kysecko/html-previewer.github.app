require('dotenv').config({
  path: require('path').resolve(__dirname, '..', '.env')
});

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.set('trust proxy', 1);

/* ================= DEBUG ENV ================= */
app.get('/debug-env', (req, res) => {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasRedisUrl: !!process.env.REDIS_URL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV
  });
});

/* ================= SUPABASE ================= */
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;
if (!supabase) console.error('WARNING: Supabase client not initialized');

/* ================= REDIS SESSION STORE ================= */
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.REDIS_URL?.startsWith('rediss://'),
    rejectUnauthorized: false,
    connectTimeout: 10000,
    // ✅ Keep connection alive — prevents Vercel from closing Redis mid-request
    keepAlive: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Redis max retries reached');
      return Math.min(retries * 200, 3000);
    }
  }
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('end', () => console.log('⚠️ Redis connection closed'));
redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting'));
redisClient.connect().catch(err => console.error('Redis connect error:', err.message));

const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
  // ✅ Disable touch to prevent TTL refresh issues on Vercel
  disableTouch: false,
  ttl: 86400 // 24 hours in seconds
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
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

/* ================= SESSION ================= */
app.use(session({
  name: 'code-editor-session',
  secret: process.env.SESSION_SECRET,
  resave: true,          // ✅ CHANGED: force resave on every request to keep session alive
  saveUninitialized: false,
  rolling: true,         // ✅ NEW: resets maxAge on every request so session stays fresh
  store: sessionStore,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

/* ================= BODY PARSING ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= REQUEST LOGGING ================= */
app.use((req, res, next) => {
  const status = req.session?.isLoggedIn ? `✅ ${req.session.email}` : '❌ not logged in';
  console.log(`${req.method} ${req.originalUrl} | ${status} | sid: ${req.sessionID}`);
  next();
});

/* ================= MIDDLEWARE ================= */
const { requireAuth } = require('./middleware/auth');

/* ================= API ROUTES ================= */
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

/* ================= DEBUG ENDPOINTS ================= */
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/debug-session', (req, res) => {
  res.json({
    session: req.session,
    sessionID: req.sessionID,
    storeType: sessionStore?.constructor?.name || 'unknown',
    redisReady: redisClient.isReady
  });
});

/* ================= STATIC FILES ================= */
app.use(express.static(path.join(__dirname, '../public')));

/* ================= PAGE ROUTES ================= */
app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) return res.redirect('/user');
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
  if (req.session.role !== 'admin') return res.redirect('/user');
  res.sendFile(path.join(__dirname, '../public/pages/admin/dashboard.html'));
});

app.get('/admin/dashboard.html', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') return res.redirect('/user');
  res.sendFile(path.join(__dirname, '../public/pages/admin/dashboard.html'));
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
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
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;