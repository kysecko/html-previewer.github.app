function requireAuth(req, res, next) {
  console.log('Auth check:', {
    path: req.path,
    sessionId: req.sessionID,
    userId: req.session?.userId,
    isLoggedIn: req.session?.isLoggedIn
  });

  if (req.session?.userId && req.session?.isLoggedIn) {
    console.log('Authentication passed');

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return next();
  }

  console.log('Authentication failed');

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      error: 'Authentication required',
      redirect: '/login'
    });
  }

  res.redirect('/login');
}

module.exports = { requireAuth };