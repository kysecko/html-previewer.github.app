require('dotenv').config({
  path: require('path').resolve(__dirname, '..', '.env')
});

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// CRITICAL: Tells Express to trust Vercel's proxy for secure cookies
app.set('trust proxy', 1);

/* DEBUG ENV  */
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

/* SUPABASE */
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;
if (!supabase) console.error('WARNING: Supabase client not initialized');

/* REDIS SESSION STORE */
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

let redisClient = null;
let sessionStore = null;

// Only attempt Redis connection if URL is provided
if (process.env.REDIS_URL) {
  console.log('Attempting to connect to Redis...');

  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.REDIS_URL?.startsWith('rediss://'),
      rejectUnauthorized: false,
      connectTimeout: 30000,
      reconnectStrategy: (retries) => {
        console.log(`Redis reconnection attempt ${retries}`);
        if (retries > 10) {
          console.error('Redis max retries reached - continuing without Redis');
          return false;
        }
        return Math.min(retries * 1000, 5000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Redis connected successfully');
  });

  redisClient.on('ready', () => {
    console.log('Redis client ready');
  });

  redisClient.on('end', () => {
    console.log('Redis connection ended');
  });

  // Connect and handle failure gracefully
  redisClient.connect().catch(err => {
    console.error('Redis connection failed:', err.message);
    redisClient = null;
  });

  // Create store only if client connected successfully
  if (redisClient) {
    try {
      sessionStore = new RedisStore({
        client: redisClient,
        prefix: 'sess:',
        disableTouch: false,
        ttl: 86400
      });
      console.log('Redis session store created');
    } catch (err) {
      console.error('Failed to create Redis store:', err.message);
      sessionStore = null;
    }
  }
} else {
  console.warn('REDIS_URL not provided - using memory store (sessions will not persist across restarts)');
}

// Session configuration with fallback
const sessionConfig = {
  name: 'code-editor-session',
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development',
  resave: false,
  saveUninitialized: false,
  proxy: true,                    // NEW: Required when behind proxy (Vercel)
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
};

// Use Redis store if available, otherwise memory store
if (sessionStore) {
  sessionConfig.store = sessionStore;
  console.log('Using Redis session store');
} else {
  console.log('Using memory session store');
}

app.use(session(sessionConfig));

/* CORS - Improved for Vercel + Railway cross-origin */
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://html-previewer-github.vercel.app',
    'https://html-previewer-github-dka6vuab2-kyseckos-projects.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

/* BODY PARSING */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* REQUEST LOGGING */
app.use((req, res, next) => {
  const status = req.session?.isLoggedIn ? `authenticated ${req.session.email}` : 'not logged in';
  console.log(`${req.method} ${req.originalUrl} | ${status} | sid: ${req.sessionID}`);
  next();
});

/* MIDDLEWARE */
const { requireAuth } = require('./middleware/auth');

/* API ROUTES */
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

/* DEBUG ENDPOINTS */
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/debug-session', (req, res) => {
  res.json({
    session: req.session,
    sessionID: req.sessionID,
    storeType: sessionStore?.constructor?.name || 'MemoryStore',
    redisReady: redisClient ? redisClient.isReady : false,
    hasRedisUrl: !!process.env.REDIS_URL
  });
});

/* STATIC FILES */
app.use(express.static(path.join(__dirname, '../public')));

/* PAGE ROUTES  */
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

/* 404 HANDLER */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

/* START */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;