document.addEventListener('DOMContentLoaded', () => {
  // Date
  const dateEl = document.getElementById('date-display');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  // Sidebar toggle desktop
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const backdrop  = document.getElementById('sidebarBackdrop');

  toggleBtn?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('show');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });

  backdrop?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('show');
  });

  // Logout
  document.getElementById('logout')?.addEventListener('click', async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
    window.location.href = '/login.html';
  });

  // Refresh / Reload
  document.getElementById('refresh-btn')?.addEventListener('click', loadUsers);
  document.getElementById('reload-btn')?.addEventListener('click', loadUsers);

  // Search
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    filterUsers(e.target.value.trim().toLowerCase());
  });

  // Export
  document.getElementById('export-btn')?.addEventListener('click', exportCSV);

  // Pagination
  document.getElementById('prev-btn')?.addEventListener('click', () => changePage(-1));
  document.getElementById('next-btn')?.addEventListener('click', () => changePage(1));

  loadDashboard();
});

let allUsers = [], filtered = [], currentPage = 1;
const PAGE_SIZE = 10;

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

    // Set avatar initial
    const avatar = document.querySelector('.admin-avatar');
    if (avatar) avatar.textContent = (data.email || 'A')[0].toUpperCase();

    await Promise.all([loadStats(), loadUsers()]);

    document.getElementById('loading').style.display        = 'none';
    document.getElementById('dashboard-content').style.display = 'flex';
    document.getElementById('dashboard-content').style.flexDirection = 'column';

  } catch (err) {
    console.error('Dashboard error:', err);
    window.location.href = '/login.html';
  }
}

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

async function loadUsers() {
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Loading users...</td></tr>';

  try {
    const res  = await fetch('/api/users', { credentials: 'include' });
    const data = await res.json();

    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="7" class="error-row">Error: ${escHtml(data.error)}</td></tr>`;
      return;
    }

    allUsers    = data.users;
    filtered    = [...allUsers];
    currentPage = 1;
    renderTable();

  } catch (err) {
    console.error('Users error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="error-row">Could not load users.</td></tr>';
  }
}

function renderTable() {
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No users found.</td></tr>';
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
    const shortId = String(u.id || '').substring(0, 8) + '...';

    tr.innerHTML = `
      <td class="td-id" title="${escHtml(String(u.id || ''))}">${escHtml(shortId)}</td>
      <td class="td-username">${escHtml(u.username || '—')}</td>
      <td class="td-email" title="${escHtml(u.email)}">${escHtml(u.email)}</td>
      <td><span class="badge badge-${escHtml(u.role)}">${escHtml(u.role)}</span></td>
      <td class="td-date">${joined}</td>
      <td class="td-date">${lastLogin}</td>
      <td><span class="badge ${u.active ? 'badge-active' : 'badge-inactive'}">${u.active ? 'Active' : 'Inactive'}</span></td>
    `;
    tbody.appendChild(tr);
  });

  updatePagination(filtered.length);
}

function updatePagination(total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end   = Math.min(currentPage * PAGE_SIZE, total);

  setText('showing-count', total === 0 ? '0' : `${start}–${end}`);
  setText('total-count',   total);
  setText('page-info',     `Page ${currentPage} of ${totalPages || 1}`);

  const prev = document.getElementById('prev-btn');
  const next = document.getElementById('next-btn');
  if (prev) prev.disabled = currentPage <= 1;
  if (next) next.disabled = currentPage >= totalPages;
}

function changePage(dir) {
  currentPage = Math.max(1, Math.min(currentPage + dir, Math.ceil(filtered.length / PAGE_SIZE)));
  renderTable();
}

function filterUsers(query) {
  filtered = query
    ? allUsers.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query) ||
        String(u.id || '').toLowerCase().includes(query)
      )
    : [...allUsers];
  currentPage = 1;
  renderTable();
}

function exportCSV() {
  const rows = [['ID', 'Username', 'Email', 'Role', 'Joined', 'Last Login', 'Status']];
  filtered.forEach(u => rows.push([
    u.id || '',
    u.username || '',
    u.email,
    u.role,
    u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
    u.active ? 'Active' : 'Inactive'
  ]));

  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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
  if (!el || !target) { if (el) el.textContent = target || 0; return; }
  const duration = 600;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}