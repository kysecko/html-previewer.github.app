const express = require('express');
const router = express.Router();
const path = require('path');

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  res.redirect('/login.html');
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session && req.session.isLoggedIn && req.session.role === 'admin') {
    return next();
  }
  res.redirect('/user');
}

// User dashboard route
router.get('/user', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/user/home.html'));
});

// Admin dashboard route
router.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// API endpoint to get current user info
router.get('/api/current-user', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.session.userId,
      email: req.session.email,
      role: req.session.role
    }
  });
});

module.exports = router;