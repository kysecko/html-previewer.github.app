const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working properly' });
});

router.post('/login', async (req, res) => {
  console.log('Login endpoint hit');
  res.json({ success: true, message: 'Login endpoint working', redirect: '/user' });
});

router.post('/register', async (req, res) => {
  console.log('Register endpoint hit');
  res.json({ success: true, message: 'Register endpoint working' });
});

router.get('/verify', (req, res) => {
  res.json({ success: false, message: 'Verify endpoint' });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout endpoint' });
});

module.exports = router;