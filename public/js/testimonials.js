// Utilities  
function getInitials(username) {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function buildCard(fb, delay) {
  const card = document.createElement('div');
  card.className = 'testimonial-card fade-in';
  card.style.animationDelay = `${delay}ms`;
  card.innerHTML = `
    <div class="testimonial-content">${escapeHtml(fb.message)}</div>
    <div class="testimonial-author">
      <div class="author-avatar">${getInitials(fb.username)}</div>
      <div class="author-info">
        <strong>${escapeHtml(fb.username)}</strong>
      </div>
    </div>`;
  return card;
}

async function getLoggedInUser() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Load 3 random feedbacks  
async function loadFeedback() {
  const grid = document.getElementById('testimonialsGrid');
  try {
    const res  = await fetch('/api/feedback/random');
    const data = await res.json();
    grid.innerHTML = '';
    if (!data.length) {
      grid.innerHTML = `
        <p style="color:#5a5a5a;text-align:center;grid-column:1/-1;padding:40px 0;">
          No feedback yet — be the first!
        </p>`;
      return;
    }
    data.forEach((fb, i) => grid.appendChild(buildCard(fb, i * 120)));
  } catch {
    grid.innerHTML = `
      <p style="color:#5a5a5a;text-align:center;grid-column:1/-1;padding:40px 0;">
        Could not load feedback.
      </p>`;
  }
}

// Status helper
function showStatus(msg, type) {
  const el = document.getElementById('fbStatus');
  el.textContent = msg;
  el.className   = `fb-status ${type}`;
  el.classList.remove('hidden');
}

function hideStatus() {
  const el = document.getElementById('fbStatus');
  el.classList.add('hidden');
  el.className = 'fb-status hidden';
}

// Init  
let currentUser = null;
const overlay   = document.getElementById('feedbackOverlay');

(async () => {
  loadFeedback();
  currentUser = await getLoggedInUser();

  if (currentUser) {
    document.getElementById('feedbackCta').classList.remove('hidden');
    document.getElementById('modalAvatar').textContent   = getInitials(currentUser.username);
    document.getElementById('modalUsername').textContent = currentUser.username;
    document.getElementById('modalRole').textContent     = currentUser.role || 'User';
  } else {
    document.getElementById('feedbackNudge').classList.remove('hidden');
  }

  lucide.createIcons();
})();

// Modal open / close  
document.getElementById('openFeedbackBtn').addEventListener('click', () => {
  overlay.classList.remove('hidden');
  lucide.createIcons();
});

document.getElementById('closeFeedbackBtn').addEventListener('click', () => {
  overlay.classList.add('hidden');
});

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.classList.add('hidden');
});

// ── Char counter ───────────────────────────────────────────
document.getElementById('fbMessage').addEventListener('input', function () {
  this.value = this.value.slice(0, 300);
  document.getElementById('fbCharCount').textContent = `${this.value.length} / 300`;
});

// ── Submit ─────────────────────────────────────────────────
document.getElementById('submitFeedbackBtn').addEventListener('click', async () => {
  const message = document.getElementById('fbMessage').value.trim();
  const btn     = document.getElementById('submitFeedbackBtn');

  hideStatus();

  if (!message) {
    showStatus('Please write your feedback before submitting.', 'error');
    return;
  }

  if (!currentUser) {
    showStatus('You must be logged in to submit feedback.', 'error');
    return;
  }

  btn.disabled   = true;
  btn.innerHTML  = '<i data-lucide="loader-2" style="width:16px;height:16px;"></i> Sending…';
  lucide.createIcons();

  try {
    const res  = await fetch('/api/feedback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ user_id: currentUser.id, message }),
    });
    const data = await res.json();

    if (res.ok) {
      showStatus('Thanks for your feedback!', 'success');
      document.getElementById('fbMessage').value       = '';
      document.getElementById('fbCharCount').textContent = '0 / 300';
      setTimeout(() => {
        overlay.classList.add('hidden');
        hideStatus();
        loadFeedback();
      }, 1500);
    } else {
      showStatus(data.error || 'Something went wrong.', 'error');
    }
  } catch {
    showStatus('Network error. Please try again.', 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i data-lucide="send" style="width:16px;height:16px;"></i> Submit Feedback';
    lucide.createIcons();
  }
});