console.log('login.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
    console.log('Lucide icons initialized');
  }
  // redirect spinner
  const redirectSpinner = document.getElementById('redirectSpinner');

  const showSpinner = () => {
    if (redirectSpinner) redirectSpinner.style.display = 'flex';
  };
  const form = document.getElementById('loginForm');
  console.log('Form element:', form);

  if (!form) {
    console.error('Login form not found!');
    return;
  }

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const termsCheckbox = document.getElementById('terms');
  const emailMessage = document.getElementById('emailMessage');
  const passwordMessage = document.getElementById('passwordMessage');

  console.log('Email input:', emailInput);
  console.log('Password input:', passwordInput);

  if (!emailInput || !passwordInput) {
    console.error('Email or password input not found');
    return;
  }

  // Toggle password visibility (inline SVG — no lucide dependency)
  const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  const togglePassword = document.getElementById('toggle-password');
  if (togglePassword) {
    togglePassword.innerHTML = eyeIcon;
    togglePassword.style.color = 'inherit';
    togglePassword.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePassword.innerHTML = isPassword ? eyeOffIcon : eyeIcon;
    });
  }

  const modal = document.createElement('div');
  const modalBox = document.createElement('div');
  const modalTitle = document.createElement('p');
  const modalMessage = document.createElement('p');

  modal.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.65);
        display: flex; align-items: flex-start; justify-content: center;
        padding-top: 50px;
        z-index: 9999; opacity: 0; pointer-events: none;
        transition: opacity 0.25s ease;
    `;

  modalBox.style.cssText = `
        background: #1a1a1a; border: 1px solid #ff4d4d; border-radius: 14px;
        padding: 28px; width: 90%; max-width: 360px; text-align: center;
        transform: scale(0.92); transition: transform 0.25s ease;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    `;

  modalTitle.style.cssText = `
        color: #ff4d4d; font-size: 15px; font-weight: 700; margin-bottom: 6px; font-family: inherit;
    `;

  modalMessage.style.cssText = `
        color: #ffaaaa; font-size: 13px; line-height: 1.6; margin: 0; font-family: inherit;
    `;

  modalBox.appendChild(modalTitle);
  modalBox.appendChild(modalMessage);
  modal.appendChild(modalBox);
  document.body.appendChild(modal);

  let autoCloseTimer;

  const closeModal = () => {
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    modalBox.style.transform = 'scale(0.92)';
  };

  const showModal = (title, msg) => {
    clearTimeout(autoCloseTimer);
    modalTitle.textContent = title;
    modalMessage.textContent = msg;
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'all';
    modalBox.style.transform = 'scale(1)';
    autoCloseTimer = setTimeout(closeModal, 3000);
  };

  const showFieldError = (input, msgDiv, errorMsg) => {
    if (msgDiv) {
      msgDiv.textContent = errorMsg;
      msgDiv.style.color = '#FF0000';
      msgDiv.style.display = 'block';
    }
    if (input?.parentElement) {
      input.parentElement.style.borderColor = '#FF0000';
    }
  };

  const clearFieldError = (input, msgDiv) => {
    if (msgDiv) {
      msgDiv.textContent = '';
      msgDiv.style.display = 'none';
    }
    if (input?.parentElement) {
      input.parentElement.style.borderColor = '';
    }
  };

  const showFieldSuccess = (input, msgDiv, successMsg = '') => {
    if (msgDiv) {
      msgDiv.textContent = successMsg;
      msgDiv.style.color = '#2ecc71';
      msgDiv.style.display = successMsg ? 'block' : 'none';
    }
    if (input?.parentElement) {
      input.parentElement.style.borderColor = '#2ecc71';
    }
  };

  emailInput.addEventListener('input', () => {
    const v = emailInput.value.trim();
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!v) {
      clearFieldError(emailInput, emailMessage);
    } else if (!re.test(v)) {
      showFieldError(emailInput, emailMessage, 'Please enter a valid email address');
    } else {
      showFieldSuccess(emailInput, emailMessage, 'Valid email');
    }
  });

  passwordInput.addEventListener('input', () => {
    const v = passwordInput.value;
    if (!v) {
      clearFieldError(passwordInput, passwordMessage);
    } else if (v.length < 8) {
      showFieldError(passwordInput, passwordMessage, 'Password must be at least 8 characters');
    } else {
      showFieldSuccess(passwordInput, passwordMessage);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    clearFieldError(emailInput, emailMessage);
    clearFieldError(passwordInput, passwordMessage);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let isValid = true;

    if (!email) {
      showFieldError(emailInput, emailMessage, 'Email is required');
      emailInput.focus();
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, emailMessage, 'Invalid email address');
      emailInput.focus();
      isValid = false;
    }

    if (!password) {
      showFieldError(passwordInput, passwordMessage, 'Password is required');
      if (isValid) passwordInput.focus();
      isValid = false;
    }

    if (termsCheckbox && !termsCheckbox.checked) {
      showModal('Terms & Conditions', 'Please accept the Terms & Conditions to continue.');
      isValid = false;
    }

    if (!isValid) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showModal('Email Required', 'Please enter a valid email address.');
      } else if (!password) {
        showModal('Password Required', 'Please enter your password.');
      }
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Login';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor = 'not-allowed';
    }

    try {
      console.log('Sending login request for:', email);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', res.status);

      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        showModal('Server Error', 'The server returned an invalid response. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
        }
        return;
      }

      if (!res.ok || !data.success) {
        const msg = data?.error || 'Invalid email or password. Please try again.';
        showFieldError(emailInput, emailMessage, ' ');
        showFieldError(passwordInput, passwordMessage, msg);
        showModal('Login Failed', msg);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
        }
        return;
      }

      showSpinner();
      window.location.href = data.redirect || '/user';

    } catch (err) {
      console.error('Login error:', err);
      showModal('Connection Error', 'Could not reach the server. Please check your connection and try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    }
  });

  console.log('Form submit handler attached');
});

fetch('/api/test')
  .then(r => r.json())
  .then(data => console.log('API test:', data))
  .catch(err => console.error('API test failed:', err));