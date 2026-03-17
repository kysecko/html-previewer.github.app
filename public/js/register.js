// ── register.js ──
// Handles registration form. Uses relative /api paths — no Railway, no external host.

if (typeof lucide !== 'undefined') lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
  const form                 = document.getElementById('registerForm');
  const successModal         = document.getElementById('successModal');
  const usernameInput        = document.getElementById('username');
  const emailInput           = document.getElementById('email');
  const passwordInput        = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const termsCheckbox        = document.getElementById('terms');
  const emailMessage         = document.getElementById('emailMessage');
  const passwordMessage      = document.getElementById('passwordMessage');
  const confirmPasswordMessage = document.getElementById('confirmPasswordMessage');

  // ── Error toast modal ──
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 50px;
    z-index: 9999; opacity: 0; pointer-events: none;
    transition: opacity 0.25s ease;
  `;

  const modalBox = document.createElement('div');
  modalBox.style.cssText = `
    background: #1a1a1a; border: 1px solid #ff4d4d; border-radius: 14px;
    padding: 28px; width: 90%; max-width: 360px; text-align: center;
    transform: scale(0.92); transition: transform 0.25s ease;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  `;

  const modalTitle = document.createElement('p');
  modalTitle.style.cssText = `color: #ff4d4d; font-size: 15px; font-weight: 700; margin-bottom: 6px; font-family: inherit;`;

  const modalMessage = document.createElement('p');
  modalMessage.style.cssText = `color: #ffaaaa; font-size: 13px; line-height: 1.6; margin: 0; font-family: inherit;`;

  modalBox.appendChild(modalTitle);
  modalBox.appendChild(modalMessage);
  modal.appendChild(modalBox);
  document.body.appendChild(modal);

  let autoCloseTimer;

  const closeModal = () => {
    modal.style.opacity      = '0';
    modal.style.pointerEvents = 'none';
    modalBox.style.transform  = 'scale(0.92)';
  };

  const showModal = (title, msg) => {
    clearTimeout(autoCloseTimer);
    modalTitle.textContent   = title;
    modalMessage.textContent = msg;
    modal.style.opacity      = '1';
    modal.style.pointerEvents = 'all';
    modalBox.style.transform  = 'scale(1)';
    autoCloseTimer = setTimeout(closeModal, 2500);
  };

  // ── Field helpers ──
  const showFieldError = (input, msgDiv, errorMsg) => {
    if (msgDiv)  { msgDiv.textContent = errorMsg; msgDiv.style.color = '#FF0000'; msgDiv.style.display = 'block'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '#FF0000';
  };

  const clearFieldError = (input, msgDiv) => {
    if (msgDiv)  { msgDiv.textContent = ''; msgDiv.style.display = 'none'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '';
  };

  const showFieldSuccess = (input, msgDiv, successMsg = '') => {
    if (msgDiv)  { msgDiv.textContent = successMsg; msgDiv.style.color = '#2ecc71'; msgDiv.style.display = successMsg ? 'block' : 'none'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '#2ecc71';
  };

  const clearAllFieldErrors = () => {
    clearFieldError(emailInput, emailMessage);
    clearFieldError(passwordInput, passwordMessage);
    clearFieldError(confirmPasswordInput, confirmPasswordMessage);
    if (usernameInput?.parentElement) usernameInput.parentElement.style.borderColor = '';
  };

  // ── Real-time validation ──
  usernameInput?.addEventListener('input', () => {
    const v = usernameInput.value.trim();
    if (!usernameInput.parentElement) return;
    if (v.length === 0)  usernameInput.parentElement.style.borderColor = '';
    else if (v.length < 3) usernameInput.parentElement.style.borderColor = '#FF0000';
    else                 usernameInput.parentElement.style.borderColor = '#2ecc71';
  });

  emailInput?.addEventListener('input', () => {
    const v  = emailInput.value.trim();
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!v)            clearFieldError(emailInput, emailMessage);
    else if (!re.test(v)) showFieldError(emailInput, emailMessage, 'Please enter a valid email address');
    else               showFieldSuccess(emailInput, emailMessage, 'Valid email');
  });

  passwordInput?.addEventListener('input', () => {
    const v = passwordInput.value;
    if (!v)               clearFieldError(passwordInput, passwordMessage);
    else if (v.length < 8)  showFieldError(passwordInput, passwordMessage, 'Password must be at least 8 characters');
    else if (!/(?=.*[a-z])/.test(v)) showFieldError(passwordInput, passwordMessage, 'Password must contain a lowercase letter');
    else if (!/(?=.*[A-Z])/.test(v)) showFieldError(passwordInput, passwordMessage, 'Password must contain an uppercase letter');
    else if (!/(?=.*\d)/.test(v))    showFieldError(passwordInput, passwordMessage, 'Password must contain a number');
    else                  showFieldSuccess(passwordInput, passwordMessage, 'Strong password');
    if (confirmPasswordInput?.value.length > 0) validateConfirmPassword();
  });

  const validateConfirmPassword = () => {
    const v = confirmPasswordInput.value;
    if (!v)                         clearFieldError(confirmPasswordInput, confirmPasswordMessage);
    else if (v !== passwordInput.value) showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Passwords do not match');
    else                            showFieldSuccess(confirmPasswordInput, confirmPasswordMessage, 'Passwords match');
  };

  confirmPasswordInput?.addEventListener('input', validateConfirmPassword);

  // ── Form submit ──
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors();

    const username        = usernameInput.value.trim();
    const email           = emailInput.value.trim();
    const password        = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 1. Username
    if (!username) {
      usernameInput.parentElement.style.borderColor = '#FF0000';
      usernameInput.focus();
      return showModal('Username Required', 'Please enter a username to continue.');
    }
    if (username.length < 3) {
      usernameInput.parentElement.style.borderColor = '#FF0000';
      usernameInput.focus();
      return showModal('Username Too Short', 'Username must be at least 3 characters long.');
    }

    // 2. Email
    if (!email) {
      showFieldError(emailInput, emailMessage, 'Email is required');
      emailInput.focus();
      return showModal('Email Required', 'Please enter your email address.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, emailMessage, 'Invalid email address');
      emailInput.focus();
      return showModal('Invalid Email', 'Please enter a valid email address.');
    }

    // 3. Password
    if (!password) {
      showFieldError(passwordInput, passwordMessage, 'Password is required');
      passwordInput.focus();
      return showModal('Password Required', 'Please create a password to continue.');
    }
    if (password.length < 8) {
      showFieldError(passwordInput, passwordMessage, 'Too short');
      passwordInput.focus();
      return showModal('Password Too Short', 'Your password must be at least 8 characters long.');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      showFieldError(passwordInput, passwordMessage, 'Missing lowercase');
      passwordInput.focus();
      return showModal('Weak Password', 'Password must contain at least one lowercase letter.');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      showFieldError(passwordInput, passwordMessage, 'Missing uppercase');
      passwordInput.focus();
      return showModal('Weak Password', 'Password must contain at least one uppercase letter.');
    }
    if (!/(?=.*\d)/.test(password)) {
      showFieldError(passwordInput, passwordMessage, 'Missing number');
      passwordInput.focus();
      return showModal('Weak Password', 'Password must contain at least one number.');
    }

    // 4. Confirm password
    if (!confirmPassword) {
      showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Confirmation required');
      confirmPasswordInput.focus();
      return showModal('Confirm Your Password', 'Please re-enter your password to confirm.');
    }
    if (password !== confirmPassword) {
      showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Passwords do not match');
      confirmPasswordInput.focus();
      return showModal('Passwords Do Not Match', 'The passwords you entered are not the same. Please try again.');
    }

    // 5. Terms
    if (!termsCheckbox.checked) {
      termsCheckbox.focus();
      return showModal('Terms & Conditions', 'Please accept the Terms & Conditions and Privacy Policy of CodePreviewer to continue.');
    }

    const submitBtn    = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const resetBtn = () => {
      submitBtn.disabled    = false;
      submitBtn.textContent = originalText;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor  = 'pointer';
    };

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Creating your account...';
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor  = 'not-allowed';

    try {
      // POST to relative /api/auth/register — no Railway, no API_BASE
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, email, password })
      });

      let data;
      try   { data = await res.json(); }
      catch { showModal('Server Error', 'The server returned an invalid response. Please try again.'); resetBtn(); return; }

      if (!res.ok) {
        showModal('Registration Failed', data.error || 'Something went wrong. Please try again.');
        resetBtn();
        return;
      }

      // Show success then redirect to login
      if (successModal) {
        successModal.style.display     = 'flex';
        successModal.style.alignItems  = 'center';
        successModal.style.justifyContent = 'center';
      }
      setTimeout(() => { window.location.href = '/login.html'; }, 2000);

    } catch (err) {
      console.error('Register error:', err);
      showModal('Connection Error', 'Something went wrong. Please check your connection and try again.');
      resetBtn();
    }
  });
});