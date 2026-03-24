const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { logAction } = require('../utils/logger');

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

router.get('/ping', (req, res) => {
  res.json({ message: 'Auth router is working', timestamp: new Date().toISOString() });
});

router.post('/register', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const { data: emailCheck, error: emailError } = await supabase
      .from('users').select('id').eq('email', email).maybeSingle();

    if (emailError) return res.status(500).json({ success: false, error: 'Database error' });
    if (emailCheck) return res.status(400).json({ success: false, error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // FIX: capture the inserted row so we can log with the real user id
    const { data: insertedUsers, error } = await supabase
      .from('users')
      .insert({ username, email, password: hashedPassword, role: 'user' })
      .select();

    if (error) return res.status(400).json({ success: false, error: error.message });

    const newUser = insertedUsers?.[0];
    if (newUser) {
      await logAction(newUser.id, newUser.email, 'REGISTER', 'New account created', req.ip);
    }

    return res.json({ success: true, message: 'Registered successfully' });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  try {
    const supabase = getSupabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password, role')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Update last_login_at — non-fatal if column doesn't exist
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (updateErr) {
      console.warn('last_login_at update failed:', updateErr.message);
    }

    req.session.isLoggedIn = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.email = user.email;
    req.session.role = user.role;

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) { console.error('Session save error:', err); reject(err); }
        else { console.log('Session saved successfully'); resolve(); }
      });
    });

    // FIX: log BEFORE sending response so it's inside the try/catch
    await logAction(user.id, user.email, 'LOGIN', 'User logged in', req.ip);

    console.log('Login successful:', email, '| Role:', user.role);
    const redirect = user.role === 'admin' ? '/admin' : '/user';
    return res.json({ success: true, redirect });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

router.get('/verify', (req, res) => {
  if (req.session?.isLoggedIn && req.session?.userId) {
    return res.json({
      success: true,
      id: req.session.userId,
      username: req.session.username,
      email: req.session.email,
      role: req.session.role
    });
  }
  return res.status(401).json({ success: false, error: 'Not authenticated' });
});

router.post('/logout', async (req, res) => {
  // Log before session is destroyed so we still have userId/email
  await logAction(req.session.userId, req.session.email, 'LOGOUT', 'User logged out', req.ip);

  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, error: 'Logout failed' });
    res.clearCookie('code-editor-session');
    res.json({ success: true });
  });
});

module.exports = router;