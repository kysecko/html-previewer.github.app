console.log('register.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
    console.log('Lucide icons initialized');
  }

  const form = document.getElementById('registerForm');
  console.log('Form element:', form);

  if (!form) {
    console.error('Register form not found!');
    return;
  }

  const usernameInput          = document.getElementById('username');
  const emailInput             = document.getElementById('email');
  const passwordInput          = document.getElementById('password');
  const confirmPasswordInput   = document.getElementById('confirm-password');
  const termsCheckbox          = document.getElementById('terms');
  const emailMessage           = document.getElementById('emailMessage');
  const passwordMessage        = document.getElementById('passwordMessage');
  const confirmPasswordMessage = document.getElementById('confirmPasswordMessage');
  const successModal           = document.getElementById('successModal');

  if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
    console.error('One or more inputs not found');
    return;
  }

  // ── Error toast modal ──
  const modal = document.createElement('div');
  const modalBox = document.createElement('div');
  const modalTitle = document.createElement('p');
  const modalMessage = document.createElement('p');
  const modalClose = document.createElement('button');

  modal.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 50px;
    z-index: 9999; opacity: 0; pointer-events: none;
    transition: opacity 0.25s ease;
    cursor: pointer;
  `;
  modalBox.style.cssText = `
    background: #1a1a1a; border: 1px solid #ff4d4d; border-radius: 14px;
    padding: 28px; width: 90%; max-width: 360px; text-align: center;
    transform: scale(0.92); transition: transform 0.25s ease;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    cursor: default; position: relative;
  `;
  modalTitle.style.cssText = `color: #ff4d4d; font-size: 15px; font-weight: 700; margin-bottom: 6px; font-family: inherit;`;
  modalMessage.style.cssText = `color: #ffaaaa; font-size: 13px; line-height: 1.6; margin: 0; font-family: inherit;`;
  modalClose.textContent = '✕';
  modalClose.style.cssText = `
    position: absolute; top: 10px; right: 14px;
    background: none; border: none; color: #ff4d4d;
    font-size: 16px; cursor: pointer; padding: 4px 8px;
    line-height: 1; font-family: inherit;
    min-width: 32px; min-height: 32px;
  `;

  modalBox.appendChild(modalClose);
  modalBox.appendChild(modalTitle);
  modalBox.appendChild(modalMessage);
  modal.appendChild(modalBox);
  document.body.appendChild(modal);

  let autoCloseTimer;

  const closeModal = () => {
    clearTimeout(autoCloseTimer);
    modal.style.opacity       = '0';
    modal.style.pointerEvents = 'none';
    modalBox.style.transform  = 'scale(0.92)';
  };

  const showModal = (title, msg) => {
    clearTimeout(autoCloseTimer);
    modalTitle.textContent    = title;
    modalMessage.textContent  = msg;
    modal.style.opacity       = '1';
    modal.style.pointerEvents = 'all';
    modalBox.style.transform  = 'scale(1)';
    autoCloseTimer = setTimeout(closeModal, 3000);
  };

  // Close on backdrop click/tap
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  // Close button
  modalClose.addEventListener('click', closeModal);
  // Close on Escape (desktop)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // ── Field helpers ──
  const showFieldError = (input, msgDiv, errorMsg) => {
    if (msgDiv) { msgDiv.textContent = errorMsg; msgDiv.style.color = '#FF0000'; msgDiv.style.display = 'block'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '#FF0000';
  };
  const clearFieldError = (input, msgDiv) => {
    if (msgDiv) { msgDiv.textContent = ''; msgDiv.style.display = 'none'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '';
  };
  const showFieldSuccess = (input, msgDiv, successMsg = '') => {
    if (msgDiv) { msgDiv.textContent = successMsg; msgDiv.style.color = '#2ecc71'; msgDiv.style.display = successMsg ? 'block' : 'none'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '#2ecc71';
  };

  // ── Real-time validation ──
  usernameInput.addEventListener('input', () => {
    const v = usernameInput.value.trim();
    if (!usernameInput.parentElement) return;
    if (v.length === 0)    usernameInput.parentElement.style.borderColor = '';
    else if (v.length < 3) usernameInput.parentElement.style.borderColor = '#FF0000';
    else                   usernameInput.parentElement.style.borderColor = '#2ecc71';
  });
  emailInput.addEventListener('input', () => {
    const v  = emailInput.value.trim();
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!v)               clearFieldError(emailInput, emailMessage);
    else if (!re.test(v)) showFieldError(emailInput, emailMessage, 'Please enter a valid email address');
    else                  showFieldSuccess(emailInput, emailMessage, 'Valid email');
  });
  passwordInput.addEventListener('input', () => {
    const v = passwordInput.value;
    if (!v)                          clearFieldError(passwordInput, passwordMessage);
    else if (v.length < 8)           showFieldError(passwordInput, passwordMessage, 'Password must be at least 8 characters');
    else if (!/(?=.*[a-z])/.test(v)) showFieldError(passwordInput, passwordMessage, 'Password must contain a lowercase letter');
    else if (!/(?=.*[A-Z])/.test(v)) showFieldError(passwordInput, passwordMessage, 'Password must contain an uppercase letter');
    else if (!/(?=.*\d)/.test(v))    showFieldError(passwordInput, passwordMessage, 'Password must contain a number');
    else                             showFieldSuccess(passwordInput, passwordMessage, 'Strong password');
    if (confirmPasswordInput.value.length > 0) validateConfirmPassword();
  });
  const validateConfirmPassword = () => {
    const v = confirmPasswordInput.value;
    if (!v)                            clearFieldError(confirmPasswordInput, confirmPasswordMessage);
    else if (v !== passwordInput.value) showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Passwords do not match');
    else                               showFieldSuccess(confirmPasswordInput, confirmPasswordMessage, 'Passwords match');
  };
  confirmPasswordInput.addEventListener('input', validateConfirmPassword);

  // ── Form submit ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    clearFieldError(emailInput, emailMessage);
    clearFieldError(passwordInput, passwordMessage);
    clearFieldError(confirmPasswordInput, confirmPasswordMessage);
    if (usernameInput.parentElement) usernameInput.parentElement.style.borderColor = '';

    const username        = usernameInput.value.trim();
    const email           = emailInput.value.trim();
    const password        = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let isValid = true;

    if (!username || username.length < 3) {
      usernameInput.parentElement.style.borderColor = '#FF0000';
      usernameInput.focus();
      isValid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, emailMessage, 'Invalid email address');
      if (isValid) emailInput.focus();
      isValid = false;
    }
    if (!password || password.length < 8) {
      showFieldError(passwordInput, passwordMessage, 'Password must be at least 8 characters');
      if (isValid) passwordInput.focus();
      isValid = false;
    }
    if (password !== confirmPassword) {
      showFieldError(confirmPasswordInput, confirmPasswordMessage, 'Passwords do not match');
      if (isValid) confirmPasswordInput.focus();
      isValid = false;
    }
    if (termsCheckbox && !termsCheckbox.checked) {
      showModal('Terms & Conditions', 'Please accept the Terms & Conditions to continue.');
      isValid = false;
    }

    if (!isValid) {
      if (!username || username.length < 3) {
        showModal('Username Required', 'Username must be at least 3 characters.');
      } else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showModal('Email Required', 'Please enter a valid email address.');
      } else if (!password || password.length < 8) {
        showModal('Password Too Short', 'Password must be at least 8 characters.');
      } else if (password !== confirmPassword) {
        showModal('Passwords Do Not Match', 'The passwords you entered are not the same.');
      }
      return;
    }

    const submitBtn    = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Create Account';

    if (submitBtn) {
      submitBtn.disabled      = true;
      submitBtn.textContent   = 'Creating your account...';
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor  = 'not-allowed';
    }

    try {
      console.log('Sending register request for:', email);
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, email, password })
      });
      console.log('Response status:', res.status);

      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        showModal('Server Error', 'The server returned an invalid response. Please try again.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; submitBtn.style.opacity = '1'; submitBtn.style.cursor = 'pointer'; }
        return;
      }

      if (!res.ok || !data.success) {
        const msg = data?.error || 'Something went wrong. Please try again.';
        showModal('Registration Failed', msg);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; submitBtn.style.opacity = '1'; submitBtn.style.cursor = 'pointer'; }
        return;
      }

      // Show success modal then redirect
      if (successModal) {
        successModal.style.display        = 'flex';
        successModal.style.alignItems     = 'center';
        successModal.style.justifyContent = 'center';
      }
      setTimeout(() => { window.location.href = '/login.html'; }, 2500);

    } catch (err) {
      console.error('Register error:', err);
      showModal('Connection Error', 'Could not reach the server. Please check your connection and try again.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; submitBtn.style.opacity = '1'; submitBtn.style.cursor = 'pointer'; }
    }
  });

  console.log('Form submit handler attached');
});

fetch('/api/test')
  .then(r => r.json())
  .then(data => console.log('API test:', data))
  .catch(err => console.error('API test failed:', err));