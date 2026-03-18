document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

  // Date display
  const dateEl = document.getElementById('date-display');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  // Sidebar toggle (desktop)
  const sidebar    = document.getElementById('sidebar');
  const toggleBtn  = document.getElementById('sidebar-toggle');
  toggleBtn?.addEventListener('click', () => sidebar?.classList.toggle('collapsed'));

  // Sidebar toggle (mobile)
  const mobileBtn  = document.getElementById('mobile-menu-btn');
  const overlay    = document.getElementById('sidebar-overlay');
  mobileBtn?.addEventListener('click', () => {
    sidebar?.classList.add('mobile-open');
    if (overlay) overlay.style.display = 'block';
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('mobile-open');
    overlay.style.display = 'none';
  });

  // Logout
  document.getElementById('logout')?.addEventListener('click', async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
    window.location.href = '/login.html';
  });

  // Refresh / Reload buttons
  document.getElementById('refresh-btn')?.addEventListener('click', () => loadUsers());
  document.getElementById('reload-btn')?.addEventListener('click', () => loadUsers());

  // Search
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    filterUsers(e.target.value.trim().toLowerCase());
  });

  // Export CSV
  document.getElementById('export-btn')?.addEventListener('click', exportCSV);

  // Pagination
  document.getElementById('prev-btn')?.addEventListener('click', () => changePage(-1));
  document.getElementById('next-btn')?.addEventListener('click', () => changePage(1));

  loadDashboard();
});

// ── State ──
let allUsers    = [];
let filtered    = [];
let currentPage = 1;
const PAGE_SIZE = 10;

// ── Load Dashboard ──
async function loadDashboard() {
  try {
    const res  = await fetch('/api/auth/verify', { credentials: 'include' });
    const data = await res.json();

    if (!data.success || data.role !== 'admin') {
      window.location.href = '/login.html';
      return;
    }

    setText('sidebar-email', data.email);
    setText('sidebar-role',  data.role);

    await Promise.all([loadStats(), loadUsers()]);

    document.getElementById('loading').style.display       = 'none';
    document.getElementById('dashboard-stats').style.display = 'block';

    // Animate stat cards
    document.querySelectorAll('.stat-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 100);
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    window.location.href = '/login.html';
  }
}

// ── Load Stats ──
async function loadStats() {
  try {
    const res  = await fetch('/api/users/stats', { credentials: 'include' });
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    animateCount('stat-total',   s.total);
    animateCount('stat-active',  s.active);
    animateCount('stat-admins',  s.admins);
    animateCount('stat-regular', s.regular);
    setText('user-count', s.total);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ── Load Users ──
async function loadUsers() {
  const tbody   = document.querySelector('#users-table tbody');
  const section = document.getElementById('users-section');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Loading users...</td></tr>';

  try {
    const res  = await fetch('/api/users', { credentials: 'include' });
    const data = await res.json();

    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="6" class="error-row">Error: ${escHtml(data.error)}</td></tr>`;
      return;
    }

    allUsers = data.users;
    filtered = [...allUsers];
    currentPage = 1;
    renderTable();

    if (section) section.style.display = 'block';

  } catch (err) {
    console.error('Users error:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="error-row">Could not load users.</td></tr>';
  }
}

// ── Render Table ──
function renderTable() {
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No users found.</td></tr>';
    updatePagination(0);
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filtered.slice(start, start + PAGE_SIZE);

  page.forEach(u => {
    const tr = document.createElement('tr');
    const joined = u.createdAt
      ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
    const lastLogin = u.lastLogin
      ? new Date(u.lastLogin).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Never';

    tr.innerHTML = `
      <td class="td-username">${escHtml(u.username || '—')}</td>
      <td class="td-email" title="${escHtml(u.email)}">${escHtml(u.email)}</td>
      <td><span class="badge-role badge-${escHtml(u.role)}">${escHtml(u.role)}</span></td>
      <td class="td-date">${joined}</td>
      <td class="td-date">${lastLogin}</td>
      <td><span class="badge-status ${u.active ? 'badge-active' : 'badge-inactive'}">${u.active ? 'Active' : 'Inactive'}</span></td>
    `;
    tbody.appendChild(tr);
  });

  updatePagination(filtered.length);
}

// ── Pagination ──
function updatePagination(total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start      = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end        = Math.min(currentPage * PAGE_SIZE, total);

  setText('showing-count', total === 0 ? '0' : `${start}–${end}`);
  setText('total-count',   total);
  setText('page-info',     `Page ${currentPage} of ${totalPages || 1}`);

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

function changePage(dir) {
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  currentPage = Math.max(1, Math.min(currentPage + dir, totalPages));
  renderTable();
}

// ── Search Filter ──
function filterUsers(query) {
  if (!query) {
    filtered = [...allUsers];
  } else {
    filtered = allUsers.filter(u =>
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  }
  currentPage = 1;
  renderTable();
}

// ── Export CSV ──
function exportCSV() {
  const rows = [['Username', 'Email', 'Role', 'Joined', 'Last Login', 'Status']];
  filtered.forEach(u => {
    rows.push([
      u.username || '',
      u.email,
      u.role,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
      u.active ? 'Active' : 'Inactive'
    ]);
  });

  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ──
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 800;
  const start    = performance.now();
  const from     = 0;
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * ease);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}