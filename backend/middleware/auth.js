function requireAuth(req, res, next) {
  console.log('Auth check:', {
    path: req.path,
    sessionId: req.sessionID,
    userId: req.session?.userId,
    isLoggedIn: req.session?.isLoggedIn
  });

  if (req.session?.userId && req.session?.isLoggedIn) {
    console.log('Authentication passed');
    return next();
  }

  console.log('Authentication failed');
  
  // If it's an API request, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      redirect: '/login.html' 
    });
  }
  
  // For HTML pages, redirect to login
  res.redirect('/login.html');
}

module.exports = { requireAuth };