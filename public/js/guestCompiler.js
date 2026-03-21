document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== "undefined") lucide.createIcons();
});

const codeArea = document.getElementById("sourceCode"),
    lineNumbers = document.getElementById("lineNumbers"),
    themeText = document.getElementById("theme-text"),
    themeIcon = document.getElementById("theme-icon"),
    resizer = document.getElementById("resizer"),
    editorWrapper = document.getElementById("editor-wrapper"),
    previewWrapper = document.getElementById("preview-wrapper");
let isResizing = false,
    isWrapped = false;

showLandingPage = () => {
    window.location.href = '/';
};

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    if (document.body.classList.contains("light-mode")) {
        themeText.textContent = "Dark";
        themeIcon.setAttribute("data-lucide", "moon");
        localStorage.setItem("theme", "light");
    } else {
        themeText.textContent = "Light";
        themeIcon.setAttribute("data-lucide", "sun");
        localStorage.setItem("theme", "dark");
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function loadTheme() {
    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-mode");
        themeText.textContent = "Dark";
        themeIcon.setAttribute("data-lucide", "moon");
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function updateLineNumbers() {
    const lines = codeArea.value.split("\n").length;
    lineNumbers.textContent = Array.from(
        { length: lines },
        (_, i) => i + 1
    ).join("\n");
}

codeArea.addEventListener("input", () => {
    updateLineNumbers();
    runCode();
});

codeArea.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeArea.scrollTop;
});

codeArea.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        e.preventDefault();
        const start = codeArea.selectionStart,
            end = codeArea.selectionEnd,
            value = codeArea.value;
        codeArea.value =
            value.substring(0, start) + "  " + value.substring(end);
        codeArea.selectionStart = codeArea.selectionEnd = start + 2;
        updateLineNumbers();
        runCode();
    }
});

function extractTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() || "Untitled" : "Untitled";
}

function runCode() {
    const previewIframe = document.getElementById("preview");
    previewIframe.srcdoc = codeArea.value;
    const span = document.querySelector("#tabTitle span");
    if (span) span.textContent = extractTitle(codeArea.value);
}

function toggleLayout() {
    isWrapped = !isWrapped;
    document.body.classList.toggle("wrapped", isWrapped);
    localStorage.setItem("layout", isWrapped ? "wrapped" : "side-by-side");
    if (isWrapped) {
        editorWrapper.style.height = "50%";
        previewWrapper.style.height = "50%";
        editorWrapper.style.width = "100%";
        previewWrapper.style.width = "100%";
    } else {
        editorWrapper.style.width = "40%";
        previewWrapper.style.width = "60%";
        editorWrapper.style.height = "100%";
        previewWrapper.style.height = "100%";
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function loadLayout() {
    if (localStorage.getItem("layout") === "wrapped") {
        isWrapped = true;
        document.body.classList.add("wrapped");
        editorWrapper.style.height = "50%";
        previewWrapper.style.height = "50%";
    }
}

resizer.addEventListener("mousedown", () => {
    isResizing = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = isWrapped ? "row-resize" : "col-resize";
});

document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    if (isWrapped) {
        const h = (e.clientY / document.body.clientHeight) * 100;
        if (h >= 20 && h <= 80) {
            editorWrapper.style.height = h + "%";
            previewWrapper.style.height = 100 - h + "%";
        }
    } else {
        const w = (e.clientX / document.body.clientWidth) * 100;
        if (w >= 20 && w <= 80) {
            editorWrapper.style.width = w + "%";
            previewWrapper.style.width = 100 - w + "%";
        }
    }
});

document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
});

// ─── Default Boilerplate: Admin Dashboard ────────────────────────────────────
const DEFAULT_BOILERPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --surface2: #22263a;
      --border: #2e3250;
      --accent: #6c63ff;
      --accent2: #4ecca3;
      --text: #e2e8f0;
      --text-muted: #8892a4;
      --danger: #f56565;
      --success: #48bb78;
      --warning: #ed8936;
      --sidebar-w: 240px;
      --radius: 10px;
    }

    body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); display: flex; min-height: 100vh; overflow: hidden; }

    /* ── Sidebar ── */
    #sidebar {
      width: var(--sidebar-w); min-height: 100vh; background: var(--surface);
      border-right: 1px solid var(--border); display: flex; flex-direction: column;
      transition: width .25s ease; flex-shrink: 0; position: relative; z-index: 100;
    }
    #sidebar.collapsed { width: 64px; }
    #sidebar.collapsed .sidebar-label,
    #sidebar.collapsed .sidebar-email,
    #sidebar.collapsed .sidebar-role { display: none; }

    .sidebar-header {
      padding: 20px 16px; display: flex; align-items: center; gap: 10px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-logo { font-size: 20px; font-weight: 700; color: var(--accent); white-space: nowrap; }
    #sidebar-toggle {
      margin-left: auto; background: none; border: none; color: var(--text-muted);
      cursor: pointer; font-size: 18px; padding: 4px 6px; border-radius: 6px;
    }
    #sidebar-toggle:hover { background: var(--surface2); color: var(--text); }

    .sidebar-profile {
      padding: 16px; display: flex; align-items: center; gap: 10px;
      border-bottom: 1px solid var(--border);
    }
    .admin-avatar {
      width: 36px; height: 36px; border-radius: 50%; background: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; flex-shrink: 0;
    }
    .sidebar-email { font-size: 12px; color: var(--text); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sidebar-role  { font-size: 11px; color: var(--accent); text-transform: capitalize; margin-top: 2px; }

    .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-radius: var(--radius); cursor: pointer; color: var(--text-muted);
      font-size: 14px; transition: all .15s; white-space: nowrap;
    }
    .nav-item:hover, .nav-item.active { background: var(--surface2); color: var(--text); }
    .nav-item.active { border-left: 3px solid var(--accent); color: var(--accent); }
    .nav-icon { font-size: 16px; flex-shrink: 0; }

    .sidebar-footer { padding: 12px 8px; border-top: 1px solid var(--border); }
    #logout {
      width: 100%; padding: 10px 12px; background: none; border: 1px solid var(--border);
      border-radius: var(--radius); color: var(--danger); cursor: pointer; font-size: 14px;
      display: flex; align-items: center; gap: 8px; transition: all .15s;
    }
    #logout:hover { background: rgba(245,101,101,.1); }

    /* ── Main ── */
    #main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .topbar {
      padding: 14px 24px; background: var(--surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .topbar h1 { font-size: 18px; font-weight: 600; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    #date-display { font-size: 13px; color: var(--text-muted); }
    #refresh-btn {
      padding: 7px 16px; background: var(--accent); border: none; border-radius: var(--radius);
      color: #fff; cursor: pointer; font-size: 13px; font-weight: 600; transition: opacity .15s;
    }
    #refresh-btn:hover { opacity: .85; }

    /* ── Content ── */
    #dashboard-content { flex: 1; overflow-y: auto; padding: 24px; gap: 24px; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .stat-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 20px; display: flex; flex-direction: column; gap: 6px;
    }
    .stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--accent); }
    .stat-card:nth-child(2) .stat-value { color: var(--accent2); }
    .stat-card:nth-child(3) .stat-value { color: var(--warning); }
    .stat-card:nth-child(4) .stat-value { color: var(--text); }

    /* Table section */
    .table-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .table-header {
      padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 10px;
    }
    .table-title { font-size: 15px; font-weight: 600; }
    .table-actions { display: flex; align-items: center; gap: 10px; }
    #search-input {
      padding: 7px 12px; background: var(--surface2); border: 1px solid var(--border);
      border-radius: var(--radius); color: var(--text); font-size: 13px; width: 220px;
    }
    #search-input:focus { outline: none; border-color: var(--accent); }
    #search-input::placeholder { color: var(--text-muted); }
    #export-btn, #reload-btn {
      padding: 7px 14px; border-radius: var(--radius); cursor: pointer;
      font-size: 13px; font-weight: 600; transition: all .15s; border: none;
    }
    #export-btn { background: var(--accent2); color: #0f1117; }
    #export-btn:hover { opacity: .85; }
    #reload-btn { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
    #reload-btn:hover { border-color: var(--accent); color: var(--accent); }

    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted);
      background: var(--surface2); border-bottom: 1px solid var(--border);
    }
    tbody tr { border-bottom: 1px solid var(--border); transition: background .1s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: var(--surface2); }
    tbody td { padding: 12px 16px; color: var(--text); }
    .td-id    { font-family: monospace; font-size: 12px; color: var(--text-muted); }
    .td-email { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-date  { color: var(--text-muted); font-size: 12px; }
    .loading-row, .empty-row, .error-row { text-align: center; padding: 32px !important; color: var(--text-muted); }
    .error-row { color: var(--danger); }

    /* Badges */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .badge-admin    { background: rgba(108,99,255,.2); color: var(--accent); }
    .badge-user     { background: rgba(78,204,163,.15); color: var(--accent2); }
    .badge-active   { background: rgba(72,187,120,.15); color: var(--success); }
    .badge-inactive { background: rgba(245,101,101,.15); color: var(--danger); }

    /* Pagination */
    .table-footer {
      padding: 12px 20px; display: flex; align-items: center; justify-content: space-between;
      border-top: 1px solid var(--border); font-size: 13px; color: var(--text-muted); flex-wrap: wrap; gap: 8px;
    }
    .pagination { display: flex; align-items: center; gap: 8px; }
    .pagination button {
      padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--surface2); color: var(--text); cursor: pointer; font-size: 13px;
    }
    .pagination button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .pagination button:disabled { opacity: .4; cursor: not-allowed; }
    #page-info { font-size: 13px; }

    #loading { display: flex; align-items: center; justify-content: center; flex: 1; color: var(--text-muted); font-size: 15px; }

    @media (max-width: 768px) {
      #sidebar { position: fixed; left: -100%; top: 0; height: 100%; transition: left .25s; }
      #sidebar.mobile-open { left: 0; }
      #sidebarBackdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 99; }
      #sidebarBackdrop.show { display: block; }
      #dashboard-content { padding: 16px; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .table-actions { flex-wrap: wrap; }
      #search-input { width: 100%; }
    }
  </style>
</head>
<body>

<!-- Sidebar Backdrop (mobile) -->
<div id="sidebarBackdrop"></div>

<!-- Sidebar -->
<aside id="sidebar">
  <div class="sidebar-header">
    <span class="sidebar-logo">&#9670; AdminKit</span>
    <button id="sidebar-toggle" title="Toggle Sidebar">&#9776;</button>
  </div>
  <div class="sidebar-profile">
    <div class="admin-avatar" id="admin-avatar">A</div>
    <div>
      <div class="sidebar-email" id="sidebar-email">admin@example.com</div>
      <div class="sidebar-role"  id="sidebar-role">admin</div>
    </div>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-item active"><span class="nav-icon">&#128202;</span><span class="sidebar-label">Dashboard</span></div>
    <div class="nav-item"><span class="nav-icon">&#128100;</span><span class="sidebar-label">Users</span></div>
    <div class="nav-item"><span class="nav-icon">&#9881;</span><span class="sidebar-label">Settings</span></div>
    <div class="nav-item"><span class="nav-icon">&#128196;</span><span class="sidebar-label">Reports</span></div>
  </nav>
  <div class="sidebar-footer">
    <button id="logout">&#128275; <span class="sidebar-label">Logout</span></button>
  </div>
</aside>

<!-- Main -->
<div id="main">
  <!-- Topbar -->
  <header class="topbar">
    <h1>User Management</h1>
    <div class="topbar-right">
      <span id="date-display"></span>
      <button id="refresh-btn">&#8635; Refresh</button>
    </div>
  </header>

  <!-- Loading -->
  <div id="loading">Loading dashboard&hellip;</div>

  <!-- Dashboard Content -->
  <div id="dashboard-content" style="display:none; flex-direction:column; gap:24px;">

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Users</div>
        <div class="stat-value" id="stat-total">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active</div>
        <div class="stat-value" id="stat-active">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Admins</div>
        <div class="stat-value" id="stat-admins">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Regular</div>
        <div class="stat-value" id="stat-regular">0</div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-section">
      <div class="table-header">
        <span class="table-title">All Users &nbsp;<span id="user-count" style="font-weight:400;color:var(--text-muted);font-size:13px;"></span></span>
        <div class="table-actions">
          <input id="search-input" type="text" placeholder="&#128269; Search users..." />
          <button id="reload-btn">&#8635; Reload</button>
          <button id="export-btn">&#8595; Export CSV</button>
        </div>
      </div>
      <div class="table-wrap">
        <table id="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="table-footer">
        <span>Showing <strong id="showing-count">0</strong> of <strong id="total-count">0</strong> users</span>
        <div class="pagination">
          <button id="prev-btn" disabled>&#8592; Prev</button>
          <span id="page-info">Page 1 of 1</span>
          <button id="next-btn" disabled>Next &#8594;</button>
        </div>
      </div>
    </div>

  </div><!-- /dashboard-content -->
</div><!-- /main -->

<script>
  // ── Helpers ──────────────────────────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!target) { el.textContent = 0; return; }
    const duration = 600, start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ── Mock data ─────────────────────────────────────────────────────────────
  const MOCK_USERS = [
    { id: 'a1b2c3d4-0001', username: 'jdoe',      email: 'jdoe@example.com',     role: 'admin', active: true,  createdAt: '2024-01-10', lastLogin: '2025-03-18' },
    { id: 'a1b2c3d4-0002', username: 'asmith',    email: 'asmith@example.com',   role: 'user',  active: true,  createdAt: '2024-02-14', lastLogin: '2025-03-15' },
    { id: 'a1b2c3d4-0003', username: 'bwang',     email: 'bwang@example.com',    role: 'user',  active: false, createdAt: '2024-03-22', lastLogin: null },
    { id: 'a1b2c3d4-0004', username: 'clee',      email: 'clee@example.com',     role: 'user',  active: true,  createdAt: '2024-04-05', lastLogin: '2025-03-10' },
    { id: 'a1b2c3d4-0005', username: 'dmartinez', email: 'dmartinez@example.com',role: 'admin', active: true,  createdAt: '2024-05-01', lastLogin: '2025-03-19' },
    { id: 'a1b2c3d4-0006', username: 'ejohnson',  email: 'ejohnson@example.com', role: 'user',  active: true,  createdAt: '2024-06-18', lastLogin: '2025-02-28' },
    { id: 'a1b2c3d4-0007', username: 'ftaylor',   email: 'ftaylor@example.com',  role: 'user',  active: false, createdAt: '2024-07-30', lastLogin: null },
    { id: 'a1b2c3d4-0008', username: 'gwilson',   email: 'gwilson@example.com',  role: 'user',  active: true,  createdAt: '2024-08-12', lastLogin: '2025-03-01' },
    { id: 'a1b2c3d4-0009', username: 'hmoore',    email: 'hmoore@example.com',   role: 'user',  active: true,  createdAt: '2024-09-03', lastLogin: '2025-03-17' },
    { id: 'a1b2c3d4-0010', username: 'ithomas',   email: 'ithomas@example.com',  role: 'user',  active: false, createdAt: '2024-10-22', lastLogin: null },
    { id: 'a1b2c3d4-0011', username: 'kjackson',  email: 'kjackson@example.com', role: 'user',  active: true,  createdAt: '2024-11-08', lastLogin: '2025-03-20' },
    { id: 'a1b2c3d4-0012', username: 'lwhite',    email: 'lwhite@example.com',   role: 'admin', active: true,  createdAt: '2024-12-01', lastLogin: '2025-03-21' },
  ];

  const MOCK_STATS = {
    total:   MOCK_USERS.length,
    active:  MOCK_USERS.filter(u => u.active).length,
    admins:  MOCK_USERS.filter(u => u.role === 'admin').length,
    regular: MOCK_USERS.filter(u => u.role === 'user').length,
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let allUsers = [], filtered = [], currentPage = 1;
  const PAGE_SIZE = 10;

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Date
    const dateEl = document.getElementById('date-display');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });

    // Sidebar toggle
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

    // Logout (demo)
    document.getElementById('logout')?.addEventListener('click', () => {
      alert('Logout clicked! (Wire up your /api/auth/logout endpoint here.)');
    });

    // Buttons
    document.getElementById('refresh-btn')?.addEventListener('click', loadUsers);
    document.getElementById('reload-btn')?.addEventListener('click', loadUsers);

    // Search
    document.getElementById('search-input')?.addEventListener('input', e => {
      filterUsers(e.target.value.trim().toLowerCase());
    });

    // Export
    document.getElementById('export-btn')?.addEventListener('click', exportCSV);

    // Pagination
    document.getElementById('prev-btn')?.addEventListener('click', () => changePage(-1));
    document.getElementById('next-btn')?.addEventListener('click', () => changePage(1));

    loadDashboard();
  });

  // ── Dashboard init ────────────────────────────────────────────────────────
  function loadDashboard() {
    // Set profile
    setText('sidebar-email', 'admin@example.com');
    setText('sidebar-role',  'admin');
    const avatar = document.getElementById('admin-avatar');
    if (avatar) avatar.textContent = 'A';

    loadStats();
    loadUsers();

    document.getElementById('loading').style.display = 'none';
    const content = document.getElementById('dashboard-content');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  function loadStats() {
    const s = MOCK_STATS;
    animateCount('stat-total',   s.total);
    animateCount('stat-active',  s.active);
    animateCount('stat-admins',  s.admins);
    animateCount('stat-regular', s.regular);
    setText('user-count', '(' + s.total + ' total)');
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  function loadUsers() {
    allUsers    = MOCK_USERS;
    filtered    = [...allUsers];
    currentPage = 1;
    renderTable();
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
    filtered.slice(start, start + PAGE_SIZE).forEach(u => {
      const tr  = document.createElement('tr');
      const joined    = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';
      const lastLogin = u.lastLogin  ? new Date(u.lastLogin).toLocaleDateString('en-US',  { year:'numeric', month:'short', day:'numeric' }) : 'Never';
      const shortId   = String(u.id || '').substring(0, 8) + '...';

      tr.innerHTML = \`
        <td class="td-id" title="\${escHtml(String(u.id || ''))}">\${escHtml(shortId)}</td>
        <td class="td-username">\${escHtml(u.username || '—')}</td>
        <td class="td-email" title="\${escHtml(u.email)}">\${escHtml(u.email)}</td>
        <td><span class="badge badge-\${escHtml(u.role)}">\${escHtml(u.role)}</span></td>
        <td class="td-date">\${joined}</td>
        <td class="td-date">\${lastLogin}</td>
        <td><span class="badge \${u.active ? 'badge-active' : 'badge-inactive'}">\${u.active ? 'Active' : 'Inactive'}</span></td>
      \`;
      tbody.appendChild(tr);
    });

    updatePagination(filtered.length);
  }

  function updatePagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end   = Math.min(currentPage * PAGE_SIZE, total);

    setText('showing-count', total === 0 ? '0' : start + '–' + end);
    setText('total-count',   total);
    setText('page-info',     'Page ' + currentPage + ' of ' + (totalPages || 1));

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
    const rows = [['ID','Username','Email','Role','Joined','Last Login','Status']];
    filtered.forEach(u => rows.push([
      u.id || '', u.username || '', u.email, u.role,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
      u.active ? 'Active' : 'Inactive'
    ]));
    const csv  = rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'users-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
<\/script>
</body>
</html>`;

// ─── Compiler Init ────────────────────────────────────────────────────────────
function init() {
    codeArea.value = DEFAULT_BOILERPLATE;
    updateLineNumbers();
    runCode();
}

window.addEventListener("load", () => {
    loadTheme();
    loadLayout();
    init();
});