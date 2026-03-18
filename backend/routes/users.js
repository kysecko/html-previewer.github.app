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

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Users fetch error:', JSON.stringify(error));
      return res.status(500).json({ success: false, error: error.message });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const formatted = users.map(u => ({
      id:        u.id,
      username:  u.username,
      email:     u.email,
      role:      u.role,
      createdAt: u.created_at,
      lastLogin: u.last_login_at,
      active:    u.last_login_at
                   ? new Date(u.last_login_at) > thirtyDaysAgo
                   : false
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
      .select('id, role, last_login_at');

    if (error) {
      console.error('Stats fetch error:', JSON.stringify(error));
      return res.status(500).json({ success: false, error: error.message });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = {
      total:   users.length,
      admins:  users.filter(u => u.role === 'admin').length,
      regular: users.filter(u => u.role !== 'admin').length,
      active:  users.filter(u => u.last_login_at && new Date(u.last_login_at) > thirtyDaysAgo).length,
    };

    return res.json({ success: true, stats });

  } catch (err) {
    console.error('STATS ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

module.exports = router;