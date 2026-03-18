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

// GET /api/users — returns all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at, last_sign_in_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Consider a user "active" if they logged in within the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const formatted = users.map(u => ({
      id:          u.id,
      username:    u.username,
      email:       u.email,
      role:        u.role,
      createdAt:   u.created_at,
      lastLogin:   u.last_sign_in_at,
      active:      u.last_sign_in_at
                     ? new Date(u.last_sign_in_at) > thirtyDaysAgo
                     : false
    }));

    return res.json({ success: true, users: formatted, total: formatted.length });

  } catch (err) {
    console.error('USERS ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/users/stats — summary counts
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, role, last_sign_in_at');

    if (error) return res.status(500).json({ success: false, error: error.message });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = {
      total:   users.length,
      admins:  users.filter(u => u.role === 'admin').length,
      regular: users.filter(u => u.role !== 'admin').length,
      active:  users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo).length,
    };

    return res.json({ success: true, stats });

  } catch (err) {
    console.error('STATS ERROR:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;