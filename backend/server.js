require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const path       = require('path');
const cors       = require('cors');

const app = express();
app.set('trust proxy', 1);

// Detect environments
const isProd    = process.env.NODE_ENV === 'production';
const isVercel  = !!process.env.VERCEL;

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

// ------------------ Session Store Setup ------------------
function buildSessionMiddleware() {
  const sessionConfig = {
    name:              'code-editor-session',
    secret:            process.env.SESSION_SECRET || 'fallback-secret-for-development',
    resave:            false,
    saveUninitialized: false,
    cookie: {
      secure:   isProd,
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      maxAge:   24 * 60 * 60 * 1000
    }
  };

  // 🚨 IMPORTANT: Disable Redis on Vercel (serverless cannot maintain connections)
  if (process.env.REDIS_URL && !isVercel) {
    try {
      const { createClient } = require('redis');
      const RedisStore        = require('connect-redis').default;

      const redisClient = createClient({
        url:    process.env.REDIS_URL,
        socket: { tls: true, rejectUnauthorized: false }
      });

      redisClient.on('error',   (err) => console.error('Redis error:', err));
      redisClient.on('connect', ()    => console.log('Redis connected'));

      redisClient.connect().catch((err) => console.error('Redis connect failed:', err));

      sessionConfig.store = new RedisStore({
        client:          redisClient,
        prefix:          'sess:',
        ttl:             86400,
        disableTouch:    false
      });

      console.log('Session store: Upstash Redis');
    } catch (err) {
      console.error('Redis setup failed, falling back to memory store:', err.message);
    }
  } else {
    console.warn('⚠️ Redis disabled (Vercel or no REDIS_URL) — using memory store');
  }

  return session(sessionConfig);
}

// 🚨 Disable sessions entirely on Vercel (prevents crashes)
if (!isVercel) {
  app.use(buildSessionMiddleware());
} else {
  console.warn('⚠️ Sessions disabled on Vercel (serverless environment)');
}

// ------------------ Body Parser ------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------ Logging ------------------
app.use((req, res, next) => {
  const status = req.session?.isLoggedIn
    ? `authenticated ${req.session.email}`
    : 'not logged in';
  console.log(`${req.method} ${req.originalUrl} | ${status} | sid: ${req.sessionID}`);
  next();
});

// ------------------ Routes ------------------
const { requireAuth } = require('./middleware/auth');
const authRouter      = require('./routes/auth');
const projectsRouter  = require('./routes/projects');

// 🚨 Avoid protected routes breaking on Vercel (no session)
if (!isVercel) {
  app.use('/api/auth',     authRouter);
  app.use('/api/projects', projectsRouter);
} else {
  console.warn('⚠️ Auth routes disabled on Vercel (no sessions)');
}

app.get('/api/test', (req, res) => {
  res.json({
    message:   'API is working!',
    timestamp: new Date().toISOString(),
    redis:     !!process.env.REDIS_URL,
    env:       process.env.NODE_ENV,
    vercel:    isVercel
  });
});

// ------------------ Static Files ------------------
const publicPath = path.join(__dirname, '..', 'public');
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

app.get('/pages/user/compiler.html', requireAuth, (req, res) => {
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
    error:   'Internal server error',
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