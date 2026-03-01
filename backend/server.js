require('dotenv').config({
  path: require('path').resolve(__dirname, '..', '.env')
});

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

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

if (!supabase) {
  console.error('WARNING: Supabase client not initialized - missing env vars');
}

/* ================= REDIS SESSION STORE ================= */
let sessionStore = undefined; // falls back to memory store if Redis fails

try {
  const { createClient } = require('redis');
  const RedisStore = require('connect-redis').default;

  if (process.env.REDIS_URL) {
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
          if (retries > 3) return new Error('Redis max retries reached');
          return retries * 500;
        }
      }
    });

    redisClient.on('error', (err) => console.error('Redis error:', err.message));
    redisClient.on('connect', () => console.log('Redis connected'));

    redisClient.connect().catch(err => {
      console.error('Redis connect failed:', err.message);
    });

    sessionStore = new RedisStore({ client: redisClient });
    console.log('Redis store initialized');
  } else {
    console.warn('REDIS_URL not set - using memory store');
  }
} catch (err) {
  console.error('Redis setup error:', err.message);
}

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
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

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

app.get('/debug-session', (req, res) => {
  res.json({ session: req.session, sessionID: req.sessionID });
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
  });
}

module.exports = app;