const express = require('express');
const router = express.Router();
const path = require('path');

function isAuthenticated(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  res.redirect('/login.html');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.isLoggedIn && req.session.role === 'admin') {
    return next();
  }
  res.redirect('/user');
}

router.get('/user', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/user/home.html'));
});

router.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

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