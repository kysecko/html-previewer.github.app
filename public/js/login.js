// Simple login.js for testing
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Login.js loaded');
  
  const form = document.getElementById('loginForm');
  if (!form) {
    console.error('❌ Login form not found');
    return;
  }
  
  console.log('✅ Form found, attaching submit handler');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📝 Form submitted');
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const termsCheckbox = document.getElementById('terms');
    
    console.log('Email:', email);
    console.log('Password length:', password?.length);
    
    // Simple validation
    if (!email || !password) {
      alert('Email and password are required');
      return;
    }
    
    if (termsCheckbox && !termsCheckbox.checked) {
      alert('Please accept the terms');
      return;
    }
    
    try {
      console.log('Sending request to /api/auth/login');
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      console.log('Response status:', res.status);
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Login successful, redirecting to:', data.redirect);
        window.location.href = data.redirect || '/user';
      } else {
        alert('Login failed: ' + (data.error || 'Unknown error'));
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Connection error: ' + err.message);
    }
  });
  
  // Test API connectivity
  fetch('/api/test')
    .then(res => res.json())
    .then(data => console.log('API test:', data))
    .catch(err => console.error('API test failed:', err));
});