async function testAPI() {
  try {
    const res = await fetch('/api/test');
    const data = await res.json();
    console.log('API Test:', data);
  } catch (err) {
    console.error('API Test Failed:', err);
  }
}
testAPI();
document.addEventListener('DOMContentLoaded', () => {

  if (typeof lucide !== 'undefined') lucide.createIcons();

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const termsCheckbox = document.getElementById('terms');
  const emailMessage = document.getElementById('emailMessage');
  const passwordMessage = document.getElementById('passwordMessage');

  // Guard — if form not found the listener can't attach
  if (!form) {
    console.error('[login.js] ❌ #loginForm not found in DOM.');
    return;
  }
  if (!emailInput || !passwordInput) {
    console.error('[login.js] ❌ #email or #password input not found.');
    return;
  }

  console.log('[login.js] ✅ Form ready.');

  // ── Error toast modal ──
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
  modalTitle.style.cssText = `color: #ff4d4d; font-size: 15px; font-weight: 700; margin-bottom: 6px; font-family: inherit;`;
  modalMessage.style.cssText = `color: #ffaaaa; font-size: 13px; line-height: 1.6; margin: 0; font-family: inherit;`;

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

  // ── Field helpers ──
  const showFieldError = (input, msgDiv, errorMsg) => {
    if (msgDiv) { msgDiv.textContent = errorMsg; msgDiv.style.color = '#FF0000'; msgDiv.style.display = 'block'; }
    if (input?.parentElement) { input.parentElement.style.borderColor = '#FF0000'; }
  };

  const clearFieldError = (input, msgDiv) => {
    if (msgDiv) { msgDiv.textContent = ''; msgDiv.style.display = 'none'; }
    if (input?.parentElement) { input.parentElement.style.borderColor = ''; }
  };

  const showFieldSuccess = (input, msgDiv, successMsg = '') => {
    if (msgDiv) { msgDiv.textContent = successMsg; msgDiv.style.color = '#2ecc71'; msgDiv.style.display = successMsg ? 'block' : 'none'; }
    if (input?.parentElement) { input.parentElement.style.borderColor = '#2ecc71'; }
  };

  // ── Real-time validation ──
  emailInput.addEventListener('input', () => {
    const v = emailInput.value.trim();
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!v) clearFieldError(emailInput, emailMessage);
    else if (!re.test(v)) showFieldError(emailInput, emailMessage, 'Please enter a valid email address');
    else showFieldSuccess(emailInput, emailMessage, '✓ Valid email');
  });

  passwordInput.addEventListener('input', () => {
    const v = passwordInput.value;
    if (!v) clearFieldError(passwordInput, passwordMessage);
    else if (v.length < 8) showFieldError(passwordInput, passwordMessage, 'Password must be at least 8 characters');
    else showFieldSuccess(passwordInput, passwordMessage);
  });

  // ── Form submit ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    clearFieldError(emailInput, emailMessage);
    clearFieldError(passwordInput, passwordMessage);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Client-side validation
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
    if (!password) {
      showFieldError(passwordInput, passwordMessage, 'Password is required');
      passwordInput.focus();
      return showModal('Password Required', 'Please enter your password.');
    }
    if (termsCheckbox && !termsCheckbox.checked) {
      return showModal('Terms & Conditions', 'Please accept the Terms & Conditions to continue.');
    }

    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor = 'not-allowed';
    }

    try {
      console.log('Sending login request for:', email); // Debug log

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', res.status); // Debug log

      let data;
      try {
        data = await res.json();
        console.log('Response data:', data); // Debug log
      } catch {
        showModal('Server Error', 'The server returned an invalid response. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
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
          submitBtn.textContent = 'Login';
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
        }
        return;
      }

      // Success - redirect
      window.location.href = data.redirect || '/user';

    } catch (err) {
      console.error('[login.js] Network error:', err);
      showModal('Connection Error', 'Could not reach the server. Please check your connection and try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    }
  });

});