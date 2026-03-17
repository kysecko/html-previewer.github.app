require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

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

const sessionConfig = {
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
};

if (!isVercel && process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis');
    const RedisStore = require('connect-redis').default;

    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: { 
        tls: true, 
        rejectUnauthorized: false,
        connectTimeout: 10000
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    // Connect and wait for it to complete
    redisClient.connect().then(() => {
      console.log('Redis client ready');
    }).catch(err => {
      console.error('Redis connection failed:', err.message);
    });

    sessionConfig.store = new RedisStore({
      client: redisClient,
      prefix: 'sess:',
      ttl: 86400
    });

    console.log('Using Redis session store');
  } catch (err) {
    console.error('Redis setup failed:', err.message);
    console.log('Using memory session store');
  }
} else {
  console.log('Using memory session store');
}

app.use(session(sessionConfig));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const authStatus = req.session?.isLoggedIn 
    ? `authenticated ${req.session.email}` 
    : 'not authenticated';
  console.log(`${req.method} ${req.path} - ${authStatus}`);
  next();
});

const { requireAuth } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: isVercel,
    redisConfigured: !!process.env.REDIS_URL,
    redisActive: !isVercel && !!process.env.REDIS_URL,
    sessionActive: !!req.session
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
  if (req.session?.isLoggedIn) {
    return res.redirect('/user');
  }
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
  if (req.session.role !== 'admin') {
    return res.redirect('/user');
  }
  res.sendFile(path.join(publicPath, 'pages/admin/dashboard.html'));
});

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path 
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: isProd ? 'An error occurred' : err.message
  });
});

if (!isProd) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${isProd ? 'production' : 'development'}`);
    console.log(`Redis: ${!isVercel && process.env.REDIS_URL ? 'enabled' : 'disabled'}`);
  });
}

module.exports = app;