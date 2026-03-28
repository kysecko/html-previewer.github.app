const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function logAction(userId, userEmail, action, details = '', ipAddress = '') {
  const { data, error } = await supabase.from('logs').insert([{
    user_id: userId,
    user_email: userEmail,
    action,
    details,
    ip_address: ipAddress,
    created_at: new Date().toISOString()
  }]);

  if (error) {
    console.error('Log Action:', error.message, error.details);
  } else {
    console.log('Log Action success:', action);
  }
}

module.exports = { logAction };