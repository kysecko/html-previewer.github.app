lucide.createIcons();
// ===== SAFETY CHECK - Add at the very top =====
if (typeof API_BASE === 'undefined') {
  console.error("❌ config.js was not loaded! API_BASE is undefined.");
  alert("Configuration error: config.js failed to load. Please refresh the page.");
}
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const termsCheckbox = document.getElementById('terms');

  const emailMessage = document.getElementById('emailMessage');
  const passwordMessage = document.getElementById('passwordMessage');
  const spinner = document.getElementById('redirectSpinner');

  /* ─── Error Modal */
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
  modalTitle.style.cssText = `
    color: #ff4d4d; font-size: 15px; font-weight: 700;
margin-bottom: 6px; font-family: inherit;
  `;

  const modalMessage = document.createElement('p');
  modalMessage.style.cssText = `
    color: #ffaaaa; font-size: 13px; line-height: 1.6;
margin: 0; font-family: inherit;
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
    autoCloseTimer = setTimeout(closeModal, 2500);
  };

  /* ─── Field Helpers ──────────────────────────────────── */
  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const showFieldError = (input, msgDiv, msg) => {
    if (msgDiv) { msgDiv.textContent = msg; msgDiv.style.display = 'block'; msgDiv.style.color = '#ff4d4d'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '#ff4d4d';
  };

  const showFieldSuccess = (input, msgDiv, msg = '') => {
    if (msgDiv) { msgDiv.textContent = msg; msgDiv.style.display = msg ? 'block' : 'none'; msgDiv.style.color = '#22c55e'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '#22c55e';
  };

  const clearField = (input, msgDiv) => {
    if (msgDiv) { msgDiv.textContent = ''; msgDiv.style.display = 'none'; }
    if (input?.parentElement) input.parentElement.style.borderColor = '';
  };

  /* ─── Real-time Validation ───────────────────────────── */
  emailInput.addEventListener('input', () => {
    const val = emailInput.value.trim();
    if (!val) clearField(emailInput, emailMessage);
    else if (!isValidEmail(val)) showFieldError(emailInput, emailMessage, 'Invalid email');
    else showFieldSuccess(emailInput, emailMessage, 'Valid email');
  });

  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    if (!val) clearField(passwordInput, passwordMessage);
    else if (val.length < 8) showFieldError(passwordInput, passwordMessage, 'Minimum 8 characters');
    else showFieldSuccess(passwordInput, passwordMessage, 'Valid password');
  });

  /* ─── Form Submit ────────────────────────────────────── */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    clearField(emailInput, emailMessage);
    clearField(passwordInput, passwordMessage);

    // 1. Email
    if (!email) {
      showFieldError(emailInput, emailMessage, 'Required');
      emailInput.focus();
      return showModal('Email Required', 'Please enter your email address.');
    }
    if (!isValidEmail(email)) {
      showFieldError(emailInput, emailMessage, 'Invalid email');
      emailInput.focus();
      return showModal('Invalid Email', 'Please enter a valid email address.');
    }

    // 2. Password
    if (!password) {
      showFieldError(passwordInput, passwordMessage, 'Required');
      passwordInput.focus();
      return showModal('Password Required', 'Please enter your password.');
    }
    if (password.length < 8) {
      showFieldError(passwordInput, passwordMessage, 'Minimum 8 characters');
      passwordInput.focus();
      return showModal('Password Too Short', 'Your password must be at least 8 characters long.');
    }

    // 3. Terms
    if (!termsCheckbox.checked) {
      termsCheckbox.focus();
      return showModal('Terms & Conditions', 'Please accept the Terms & Conditions and Privacy Policy of CodePreviewer to continue.');
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    submitBtn.style.opacity = '0.6';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Invalid credentials');

      spinner.style.display = 'flex';
      setTimeout(() => { window.location.href = data.redirect || '/user'; }, 500);

    } catch (err) {
      showModal('Login Failed', 'Invalid email or password. Please check your credentials and try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
      submitBtn.style.opacity = '1';
    }
  });
});