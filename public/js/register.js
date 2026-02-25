document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const message = document.getElementById('message');
  const successModal = document.getElementById('successModal');

  // Get input elements
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  // Get message elements
  const emailMessage = document.getElementById('emailMessage');
  const passwordMessage = document.getElementById('passwordMessage');
  const confirmPasswordMessage = document.getElementById('confirmPasswordMessage');

  // Utility functions for showing messages
  const showFieldError = (input, messageDiv, errorMsg) => {
    if (messageDiv) {
      messageDiv.textContent = errorMsg;
      messageDiv.style.color = '#FF0000';
      messageDiv.style.display = 'block';
    }
    input.parentElement.style.borderColor = '#FF0000';
  };

  const clearFieldError = (input, messageDiv) => {
    if (messageDiv) {
      messageDiv.textContent = '';
      messageDiv.style.display = 'none';
    }
    input.parentElement.style.borderColor = '';
  };

  const showFieldSuccess = (input, messageDiv, successMsg = '') => {
    if (messageDiv) {
      messageDiv.textContent = successMsg;
      messageDiv.style.color = '#2ecc71';
      messageDiv.style.display = successMsg ? 'block' : 'none';
    }
    input.parentElement.style.borderColor = '#2ecc71';
  };

  // Clear all field errors
  const clearAllFieldErrors = () => {
    clearFieldError(emailInput, emailMessage);
    clearFieldError(passwordInput, passwordMessage);
    clearFieldError(confirmPasswordInput, confirmPasswordMessage);
    usernameInput.parentElement.style.borderColor = '';
  };

  // Username validation (real-time)
  usernameInput.addEventListener('input', () => {
    const value = usernameInput.value.trim();

    if (value.length === 0) {
      // Reset border if empty
      usernameInput.parentElement.style.borderColor = '';
    } else if (value.length < 3) {
      // Less than 3 characters → invalid
      usernameInput.parentElement.style.borderColor = '#FF0000';
    } else {
      // 3 or more characters → valid
      usernameInput.parentElement.style.borderColor = '#2ecc71';
    }
  });

  // Email validation (real-time)
  emailInput.addEventListener('input', () => {
    const value = emailInput.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (value.length === 0) {
      clearFieldError(emailInput, emailMessage);
    } else if (!emailRegex.test(value)) {
      showFieldError(emailInput, emailMessage, 'Please enter a valid email address');
    } else {
      showFieldSuccess(emailInput, emailMessage, 'Valid email');
    }
  });

  // Password strength validation (real-time)
  passwordInput.addEventListener('input', () => {
    const value = passwordInput.value;

    if (value.length === 0) {
      clearFieldError(passwordInput, passwordMessage);
    } else if (value.length < 8) {
      showFieldError(passwordInput, passwordMessage, 'Password must be at least 8 characters');
    } else if (!/(?=.*[a-z])/.test(value)) {
      showFieldError(passwordInput, passwordMessage, 'Password must contain a lowercase letter');
    } else if (!/(?=.*[A-Z])/.test(value)) {
      showFieldError(passwordInput, passwordMessage, 'Password must contain an uppercase letter');
    } else if (!/(?=.*\d)/.test(value)) {
      showFieldError(passwordInput, passwordMessage, 'Password must contain a number');
    } else {
      showFieldSuccess(passwordInput, passwordMessage, '✓ Strong password');
    }

    // Also check confirm password if it has a value
    if (confirmPasswordInput.value.length > 0) {
      validateConfirmPassword();
    }
  });

  // Confirm password validation (real-time)
  const validateConfirmPassword = () => {
    const value = confirmPasswordInput.value;
    const passwordValue = passwordInput.value;

    if (value.length === 0) {
      clearFieldError(confirmPasswordInput, confirmPasswordMessage);
    } else if (value !== passwordValue) {
      showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Passwords do not match');
    } else {
      showFieldSuccess(confirmPasswordInput, confirmPasswordMessage, 'Passwords match');
    }
  };

  confirmPasswordInput.addEventListener('input', validateConfirmPassword);

  // Form submission with sequential validation (one error at a time)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous messages
    message.textContent = '';
    message.style.display = 'none';
    clearAllFieldErrors();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Helper function to show main error message
    const showMainError = (errorText) => {
      message.textContent = errorText;
      message.style.color = '#e74c3c';
      message.style.display = 'block';
      message.style.padding = '0.75rem';
      message.style.backgroundColor = '#fee';
      message.style.borderRadius = '4px';
    };

    // Sequential validation - check one field at a time, stop at first error

    // 1. Username validation
    if (username.length === 0) {
      showMainError('Username is required');
      usernameInput.parentElement.style.borderColor = '#FF0000';
      usernameInput.focus();
      return;
    }

    if (username.length < 3) {
      showMainError('Username must be at least 3 characters');
      usernameInput.parentElement.style.borderColor = '#FF0000';
      usernameInput.focus();
      return;
    }

    // 2. Email validation
    if (email.length === 0) {
      showMainError('Email is required');
      showFieldError(emailInput, emailMessage, 'Email is required');
      emailInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMainError('Please enter a valid email address');
      showFieldError(emailInput, emailMessage, 'Invalid email address');
      emailInput.focus();
      return;
    }

    // 3. Password validation
    if (password.length === 0) {
      showMainError('Password is required');
      showFieldError(passwordInput, passwordMessage, 'Password is required');
      passwordInput.focus();
      return;
    }

    if (password.length < 8) {
      showMainError('Password must be at least 8 characters');
      showFieldError(passwordInput, passwordMessage, 'Too short');
      passwordInput.focus();
      return;
    }

    if (!/(?=.*[a-z])/.test(password)) {
      showMainError('Password must contain at least one lowercase letter');
      showFieldError(passwordInput, passwordMessage, 'Missing lowercase');
      passwordInput.focus();
      return;
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      showMainError('Password must contain at least one uppercase letter');
      showFieldError(passwordInput, passwordMessage, 'Missing uppercase');
      passwordInput.focus();
      return;
    }

    if (!/(?=.*\d)/.test(password)) {
      showMainError('Password must contain at least one number');
      showFieldError(passwordInput, passwordMessage, 'Missing number');
      passwordInput.focus();
      return;
    }

    // 4. Confirm password validation
    if (confirmPassword.length === 0) {
      showMainError('Please confirm your password');
      showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Confirmation required');
      confirmPasswordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      showMainError('Passwords do not match');
      showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Passwords do not match');
      confirmPasswordInput.focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating your account...';
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor = 'not-allowed';

    try {
      console.log('Sending registration request...');

      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        showMainError('Server returned invalid response');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        return;
      }

      if (!res.ok) {
        // Server returned an error (400, 401, 500, etc.)
        console.log('Server error:', data.error);
        showMainError(data.error || 'Registration failed');

        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        return;
      }

      // Success! Show modal and redirect to login
      console.log('Registration successful!');
      if (successModal) {
        successModal.style.display = 'flex';
        successModal.style.alignItems = 'center';
        successModal.style.justifyContent = 'center';
      }

      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);

    } catch (err) {
      // This only catches network errors (server down, no internet, etc.)
      console.error('Network error:', err);
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      showMainError('Something went wrong. Please check your connection and try again.');

      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  });

  // Clear main error message on focus (but keep field-specific errors)
  usernameInput.addEventListener('focus', () => {
    // Only clear the main message, not the border
    message.style.display = 'none';
  });

  emailInput.addEventListener('focus', () => {
    // Only clear the main message
    message.style.display = 'none';
  });

  passwordInput.addEventListener('focus', () => {
    // Only clear the main message
    message.style.display = 'none';
  });

  confirmPasswordInput.addEventListener('focus', () => {
    // Only clear the main message
    message.style.display = 'none';
  });
});