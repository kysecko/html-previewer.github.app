// login.js - Minimal working version
console.log('🔵 login.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 DOM fully loaded');

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
    console.log('✅ Lucide icons initialized');
  }

  const form = document.getElementById('loginForm');
  console.log('📝 Form element:', form);

  if (!form) {
    console.error('❌ Login form not found!');
    return;
  }

  // Remove any existing event listeners (just to be safe)
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  // Get fresh references
  const freshForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const termsCheckbox = document.getElementById('terms');
  const emailMessage = document.getElementById('emailMessage');
  const passwordMessage = document.getElementById('passwordMessage');

  console.log('📧 Email input:', emailInput);
  console.log('🔑 Password input:', passwordInput);

  if (!emailInput || !passwordInput) {
    console.error('❌ Email or password input not found');
    return;
  }

  // Simple validation functions
  function showError(input, messageDiv, message) {
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.style.color = '#FF0000';
      messageDiv.style.display = 'block';
    }
    if (input?.parentElement) {
      input.parentElement.style.borderColor = '#FF0000';
    }
  }

  function clearError(input, messageDiv) {
    if (messageDiv) {
      messageDiv.textContent = '';
      messageDiv.style.display = 'none';
    }
    if (input?.parentElement) {
      input.parentElement.style.borderColor = '';
    }
  }

  function showSuccess(input, messageDiv, message = '') {
    if (messageDiv && message) {
      messageDiv.textContent = message;
      messageDiv.style.color = '#2ecc71';
      messageDiv.style.display = 'block';
    }
    if (input?.parentElement) {
      input.parentElement.style.borderColor = '#2ecc71';
    }
  }

  // Real-time validation
  emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      clearError(emailInput, emailMessage);
    } else if (!emailRegex.test(email)) {
      showError(emailInput, emailMessage, 'Please enter a valid email');
    } else {
      showSuccess(emailInput, emailMessage, '✓ Valid email');
    }
  });

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;

    if (!password) {
      clearError(passwordInput, passwordMessage);
    } else if (password.length < 8) {
      showError(passwordInput, passwordMessage, 'Password too short');
    } else {
      showSuccess(passwordInput, passwordMessage);
    }
  });

  // Form submission
  freshForm.addEventListener('submit', async (e) => {
    console.log('🚀 Form submitted!');
    e.preventDefault();
    e.stopPropagation();

    // Clear previous errors
    clearError(emailInput, emailMessage);
    clearError(passwordInput, passwordMessage);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate
    if (!email) {
      showError(emailInput, emailMessage, 'Email is required');
      alert('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(emailInput, emailMessage, 'Invalid email');
      alert('Please enter a valid email');
      return;
    }

    if (!password) {
      showError(passwordInput, passwordMessage, 'Password is required');
      alert('Password is required');
      return;
    }

    if (termsCheckbox && !termsCheckbox.checked) {
      alert('Please accept the terms and conditions');
      return;
    }

    // Disable button
    const submitBtn = freshForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
    }

    try {
      console.log('Sending login request...');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        console.log('Login successful, redirecting to:', data.redirect);
        window.location.href = data.redirect || '/user';
      } else {
        alert('Login failed: ' + (data.error || 'Unknown error'));
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
        }
      }

    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error: ' + error.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    }
  });

  console.log('✅ Form submit handler attached');
});

// Test API connectivity
fetch('/api/test')
  .then(r => r.json())
  .then(data => console.log('API test:', data))
  .catch(err => console.error('API test failed:', err));