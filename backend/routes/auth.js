const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ================= REGISTER ================= */
router.post('/register', async (req, res) => {
  console.log('Registration attempt:', req.body.email);

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check if email already exists
    const { data: emailCheck, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailError) {
      console.error('Email check error:', emailError);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    if (emailCheck) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from('users')
      .insert({ username, email, password: hashedPassword, role: 'user' })
      .select();

    if (error) {
      console.error('Insert error:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log('Registration successful for:', email);
    return res.json({ success: true, message: 'Registered successfully' });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* ================= LOGIN ================= */
  router.post('/login', async (req, res) => {
    console.log('Login attempt:', req.body.email);

    try {
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

      // Save session
      req.session.isLoggedIn = true;
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.role = user.role;

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ success: false, error: 'Session error' });
        }

        console.log('Login successful for:', email, '| Role:', user.role);

        // Redirect based on role
        const redirect = user.role === 'admin' ? '/admin' : '/user';
        res.json({ success: true, redirect });
      });

    } catch (err) {
      console.error('LOGIN ERROR:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

/* ================= VERIFY ================= */
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

/* ================= LOGOUT ================= */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    // ✅ Must match the session name set in server.js
    res.clearCookie('code-editor-session');
    res.json({ success: true });
  });
});

module.exports = router;