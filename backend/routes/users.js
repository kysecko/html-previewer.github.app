const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function requireAdmin(req, res, next) {
  if (req.session?.isLoggedIn && req.session?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Admin access required' });
}

// GET /api/users
router.get('/', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();

    // Select only columns that actually exist in your custom users table
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Users fetch error:', JSON.stringify(error));
      return res.status(500).json({ success: false, error: error.message });
    }

    const formatted = users.map(u => ({
      id:        u.id,
      username:  u.username,
      email:     u.email,
      role:      u.role,
      createdAt: u.created_at,
      lastLogin: null,   // not tracked yet — add last_login_at column to enable
      active:    false   // set to false until last_login_at column is added
    }));

    return res.json({ success: true, users: formatted, total: formatted.length });

  } catch (err) {
    console.error('USERS ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

// GET /api/users/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, role');

    if (error) {
      console.error('Stats fetch error:', JSON.stringify(error));
      return res.status(500).json({ success: false, error: error.message });
    }

    const stats = {
      total:   users.length,
      admins:  users.filter(u => u.role === 'admin').length,
      regular: users.filter(u => u.role !== 'admin').length,
      active:  0  // will show real data once last_login_at column is added
    };

    return res.json({ success: true, stats });

  } catch (err) {
    console.error('STATS ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

module.exports = router;