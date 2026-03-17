lucide.createIcons();

let projects = [];
let currentId = null;
let saveTimeout = null;

// modal mode: 'create' | 'rename-current' | 'rename-sidebar'
let _modalMode = 'create';
let _renameTargetId = null;

const editor = document.getElementById('codeEditor');
const preview = document.getElementById('previewFrame');
const projectList = document.getElementById('projectItems');
const currentTitle = document.getElementById('currentTitle');
const projectCount = document.getElementById('projectCount');
const status = document.getElementById('status');
const modal = document.getElementById('myModal');
const maximizeBtn = document.getElementById('maximizeBtn');
const editorArea = document.getElementById('editorArea');
const lineNumbers = document.getElementById('lineNumbers');
const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

// toggle sidebar
toggleBtn.addEventListener("click", () => {
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("active");
  } else {
    sidebar.classList.toggle("collapsed");
  }
});

/* ─── Error Modal (red) ──────────────────────────────── */
const errorModal = document.createElement('div');
errorModal.style.cssText = `
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 24px;
  z-index: 9999; opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease;
`;

const errorModalBox = document.createElement('div');
errorModalBox.style.cssText = `
  background: #1a1a1a; border: 1px solid #ff4d4d; border-radius: 14px;
  padding: 28px; width: 90%; max-width: 360px; text-align: center;
  transform: scale(0.92); transition: transform 0.25s ease;
  box-shadow: 0 12px 40px rgba(255,77,77,0.15);
`;

const errorModalTitle = document.createElement('p');
errorModalTitle.style.cssText = `
  color: #ff4d4d; font-size: 15px; font-weight: 700;
  margin-bottom: 6px; font-family: inherit;
`;

const errorModalMessage = document.createElement('p');
errorModalMessage.style.cssText = `
  color: #ffaaaa; font-size: 13px; line-height: 1.6;
  margin: 0; font-family: inherit;
`;

errorModalBox.appendChild(errorModalTitle);
errorModalBox.appendChild(errorModalMessage);
errorModal.appendChild(errorModalBox);
document.body.appendChild(errorModal);

let errorModalTimer;

const closeErrorModal = () => {
  errorModal.style.opacity = '0';
  errorModal.style.pointerEvents = 'none';
  errorModalBox.style.transform = 'scale(0.92)';
};

const showErrorModal = (title, msg) => {
  clearTimeout(errorModalTimer);
  errorModalTitle.textContent = title;
  errorModalMessage.textContent = msg;
  errorModal.style.opacity = '1';
  errorModal.style.pointerEvents = 'all';
  errorModalBox.style.transform = 'scale(1)';
  errorModalTimer = setTimeout(closeErrorModal, 3000);
};

/* ─── Success Modal (green) ──────────────────────────── */
const successModal2 = document.createElement('div');
successModal2.style.cssText = `
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 24px;
  z-index: 9999; opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease;
`;

const successModalBox = document.createElement('div');
successModalBox.style.cssText = `
  background: #1a1a1a; border: 1px solid #2ecc71; border-radius: 14px;
  padding: 28px; width: 90%; max-width: 360px; text-align: center;
  transform: scale(0.92); transition: transform 0.25s ease;
  box-shadow: 0 12px 40px rgba(46,204,113,0.15);
`;

const successModalTitle = document.createElement('p');
successModalTitle.style.cssText = `
  color: #2ecc71; font-size: 15px; font-weight: 700;
  margin-bottom: 6px; font-family: inherit;
`;

const successModalMessage = document.createElement('p');
successModalMessage.style.cssText = `
  color: #a8f0c6; font-size: 13px; line-height: 1.6;
  margin: 0; font-family: inherit;
`;

successModalBox.appendChild(successModalTitle);
successModalBox.appendChild(successModalMessage);
successModal2.appendChild(successModalBox);
document.body.appendChild(successModal2);

let successModalTimer;

const closeSuccessModal = () => {
  successModal2.style.opacity = '0';
  successModal2.style.pointerEvents = 'none';
  successModalBox.style.transform = 'scale(0.92)';
};

const showSuccessModal = (title, msg) => {
  clearTimeout(successModalTimer);
  successModalTitle.textContent = title;
  successModalMessage.textContent = msg;
  successModal2.style.opacity = '1';
  successModal2.style.pointerEvents = 'all';
  successModalBox.style.transform = 'scale(1)';
  successModalTimer = setTimeout(closeSuccessModal, 3000);
};

/* ─── Helpers ────────────────────────────────────────── */
function getProjectContent(project) {
  return project.code || '';
}

function getProjectDate(project) {
  const dateStr = project.updated_at || project.created_at || Date.now();
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showStatus(msg, isError = false) {
  status.textContent = msg;
  status.classList.toggle('error', isError);
  status.classList.add('show');
  setTimeout(() => status.classList.remove('show'), 2200);
}

function updateLineNumbers() {
  const lines = editor.value.split('\n').length;
  lineNumbers.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

function updatePreview() {
  try {
    const code = editor.value;
    preview.srcdoc = code || '<!DOCTYPE html><html><body style="background:#f0f0f0;display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;"><div style="color:#666;text-align:center;"><h1>Code Previewer</h1><p>Start typing HTML in the editor on the left.</p></div></body></html>';
    updateLineNumbers();
  } catch (error) {
    console.error('Preview update error:', error);
  }
}

/* ─── Maximize ───────────────────────────────────────── */
let isMaximized = false;

maximizeBtn.addEventListener('click', () => {
  isMaximized = !isMaximized;
  editorArea.classList.toggle('preview-maximized', isMaximized);
  maximizeBtn.innerHTML = isMaximized
    ? '<i data-lucide="minimize" class="icon"></i>'
    : '<i data-lucide="maximize" class="icon"></i>';
  lucide.createIcons();
});

/* ─── Auth ───────────────────────────────────────────── */
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) { window.location.href = '/login.html'; return false; }
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login.html';
    return false;
  }
}

function openModal() { modal.style.display = 'grid'; }
function cancel() { modal.style.display = 'none'; }

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout failed:', error);
    showErrorModal('Logout Failed', 'Something went wrong while logging out. Please try again.');
  }
}

/* ─── Create / Rename Modal ──────────────────────────── */
function openCreateModal() {
  _modalMode = 'create';
  _renameTargetId = null;

  document.getElementById('createModalHeading').textContent = 'New Project';
  document.getElementById('createModalSubtext').textContent = 'Enter a name for your project';
  document.getElementById('createModalConfirmBtn').textContent = 'Create';

  const input = document.getElementById('newProjectTitleInput');
  input.value = '';
  input.style.border = '1px solid #444';

  document.getElementById('createProjectModal').style.display = 'grid';
  setTimeout(() => input.focus(), 50);
}

function openRenameCurrentModal() {
  if (!currentId) return;
  _modalMode = 'rename-current';
  _renameTargetId = null;

  document.getElementById('createModalHeading').textContent = 'Rename Project';
  document.getElementById('createModalSubtext').textContent = 'Enter a new name for this project';
  document.getElementById('createModalConfirmBtn').textContent = 'Rename';

  const input = document.getElementById('newProjectTitleInput');
  input.value = currentTitle.textContent;
  input.style.border = '1px solid #444';

  document.getElementById('createProjectModal').style.display = 'grid';
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

function openRenameSidebarModal(id, currentName) {
  _modalMode = 'rename-sidebar';
  _renameTargetId = id;

  document.getElementById('createModalHeading').textContent = 'Rename Project';
  document.getElementById('createModalSubtext').textContent = 'Enter a new name for this project';
  document.getElementById('createModalConfirmBtn').textContent = 'Rename';

  const input = document.getElementById('newProjectTitleInput');
  input.value = currentName;
  input.style.border = '1px solid #444';

  document.getElementById('createProjectModal').style.display = 'grid';
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

function closeCreateModal() {
  document.getElementById('createProjectModal').style.display = 'none';
}

async function confirmCreateModal() {
  const input = document.getElementById('newProjectTitleInput');
  const title = input.value.trim();

  if (!title) {
    input.style.border = '1px solid #e53e3e';
    setTimeout(() => input.style.border = '1px solid #444', 1500);
    return;
  }

  closeCreateModal();

  if (_modalMode === 'create') {
    await createProject(title);
  } else if (_modalMode === 'rename-current') {
    await renameCurrentProject(title);
  } else if (_modalMode === 'rename-sidebar') {
    await renameProjectById(_renameTargetId, title);
  }
}

document.getElementById('newProjectTitleInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmCreateModal();
  if (e.key === 'Escape') closeCreateModal();
});

/* ─── API Calls ──────────────────────────────────────── */
async function loadProjects() {
  try {
    const res = await fetch('/api/projects', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load projects');
    const data = await res.json();
    projects = data;
    renderList();
    return data;
  } catch (error) {
    console.error('Load projects error:', error);
    showErrorModal('Load Failed', 'Failed to load your projects. Please refresh the page.');
    projectList.innerHTML = '<div class="loading" style="color:#dc3545;padding:20px;text-align:center;"><i data-lucide="alert-circle" class="icon"></i><br>Error loading projects<br><small>' + error.message + '</small></div>';
    return [];
  }
}

async function createProject(title) {
  try {
    if (!title || title.trim() === '') {
      showErrorModal('Invalid Name', 'Project name cannot be empty.');
      return;
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: title, code: editor.value })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create project');
    }

    const newProject = await res.json();
    await loadProjects();
    loadProject(newProject.id);
    showSuccessModal('Project Created', '"' + title + '" has been created successfully.');
    return newProject;
  } catch (error) {
    console.error('Create project error:', error);
    showErrorModal('Create Failed', 'Failed to create project: ' + error.message);
    return null;
  }
}

async function saveProject() {
  if (!currentId) {
    openCreateModal();
    return;
  }

  try {
    const res = await fetch('/api/projects/' + currentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: currentTitle.textContent, code: editor.value })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save');
    }

    const updated = await res.json();
    const index = projects.findIndex(p => p.id === currentId);
    if (index !== -1) projects[index] = updated;
    renderList();
    showSuccessModal('Project Saved', 'Your changes have been saved successfully.');
    return updated;
  } catch (error) {
    console.error('Save project error:', error);
    showErrorModal('Save Failed', 'Failed to save your project: ' + error.message);
    return null;
  }
}

async function renameCurrentProject(newTitle) {
  if (!currentId) return;
  try {
    const res = await fetch('/api/projects/' + currentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: newTitle, code: editor.value })
    });
    if (!res.ok) throw new Error('Failed to rename');
    const updated = await res.json();
    currentTitle.textContent = updated.title || newTitle;
    const index = projects.findIndex(p => p.id === currentId);
    if (index !== -1) projects[index] = updated;
    renderList();
    showSuccessModal('Project Renamed', 'Your project has been renamed to "' + newTitle + '".');
  } catch (err) {
    showErrorModal('Rename Failed', 'Failed to rename your project: ' + err.message);
  }
}

async function renameProjectById(id, newTitle) {
  const project = projects.find(p => p.id === id);
  if (!project) return;
  try {
    const res = await fetch('/api/projects/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: newTitle, code: project.code || '' })
    });
    if (!res.ok) throw new Error('Failed to rename');
    const updated = await res.json();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) projects[index] = updated;
    if (currentId === id) currentTitle.textContent = updated.title || newTitle;
    renderList();
    showSuccessModal('Project Renamed', 'Your project has been renamed to "' + newTitle + '".');
  } catch (err) {
    showErrorModal('Rename Failed', 'Failed to rename your project: ' + err.message);
  }
}

async function deleteProjectFromDB(id) {
  try {
    const res = await fetch('/api/projects/' + id, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to delete');

    projects = projects.filter(p => p.id !== id);

    if (currentId === id) {
      currentId = null;
      editor.value = '';
      currentTitle.textContent = 'Untitled Project';
      updatePreview();
    }

    renderList();
    showSuccessModal('Project Deleted', 'Your project has been deleted successfully.');
    return true;
  } catch (error) {
    console.error('Delete project error:', error);
    showErrorModal('Delete Failed', 'Failed to delete your project: ' + error.message);
    return false;
  }
}

async function loadProjectFromDB(id) {
  try {
    const res = await fetch('/api/projects/' + id, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load');

    const project = await res.json();
    currentId = project.id;
    editor.value = getProjectContent(project);
    currentTitle.textContent = project.title || 'Untitled Project';
    updatePreview();
    renderList();
    return project;
  } catch (error) {
    console.error('Load project error:', error);
    showErrorModal('Load Failed', 'Failed to load the project: ' + error.message);
    return null;
  }
}

/* ─── Render List ────────────────────────────────────── */
function renderList() {
  projectCount.textContent = projects.length + ' project' + (projects.length !== 1 ? 's' : '');

  if (projects.length === 0) {
    projectList.innerHTML = '<div class="loading" style="color:#666;padding:40px 20px;"><i data-lucide="folder-open" class="icon"></i><br>No projects yet.<br><small>Click "New Project" to start!</small></div>';
    lucide.createIcons();
    return;
  }

  projectList.innerHTML = '';
  projects.forEach(function (p) {
    const div = document.createElement('div');
    div.className = 'project-item';
    if (currentId === p.id) div.classList.add('active');

    const updatedDate = getProjectDate(p);
    const codePreview = p.code
      ? p.code.substring(0, 50).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, ' ') + (p.code.length > 50 ? '...' : '')
      : '<span style="color:#666;font-style:italic;">(empty project)</span>';

    div.innerHTML =
      '<div class="project-name">' + escapeHtml(p.title || 'Untitled') + '</div>' +
      '<div class="project-date">' + escapeHtml(updatedDate) + '</div>' +
      '<div style="font-size:11px;color:#888;margin:4px 0;font-family:\'Courier New\',monospace;line-height:1.3;">' + codePreview + '</div>' +
      '<div class="project-buttons">' +
      '<button class="rename-btn" data-id="' + p.id + '" data-title="' + escapeHtml(p.title || 'Untitled') + '" title="Rename"><i data-lucide="pencil" class="icon"></i></button>' +
      '<button class="download-btn" data-id="' + p.id + '" title="Download"><i data-lucide="download" class="icon"></i></button>' +
      '<button class="delete-btn" data-id="' + p.id + '" title="Delete" style="color:#ff6b6b;"><i data-lucide="trash-2" class="icon"></i></button>' +
      '</div>';

    div.addEventListener('click', function (e) {
      if (!e.target.closest('button')) loadProject(p.id);
    });

    projectList.appendChild(div);
  });

  document.querySelectorAll('.load-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); loadProject(btn.dataset.id); });
  });

  document.querySelectorAll('.rename-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openRenameSidebarModal(btn.dataset.id, btn.dataset.title);
    });
  });

  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); downloadProject(btn.dataset.id); });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteProject(btn.dataset.id); });
  });

  lucide.createIcons();
}

/* ─── Title Click to Rename ──────────────────────────── */
currentTitle.style.cursor = 'pointer';
currentTitle.addEventListener('click', () => {
  if (currentId) openRenameCurrentModal();
});

/* ─── Event Handlers ─────────────────────────────────── */
document.getElementById('newBtn').addEventListener('click', () => openCreateModal());
document.getElementById('saveBtn').addEventListener('click', saveProject);

editor.addEventListener('input', function () {
  updatePreview();
  updateLineNumbers();
  if (currentId) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveProject(), 2000);
  }
});

editor.addEventListener('scroll', function () {
  lineNumbers.scrollTop = editor.scrollTop;
});

document.getElementById('clearBtn').addEventListener('click', function () {
  if (editor.value.trim() && !confirm('Clear the editor? Unsaved changes will be lost.')) return;
  currentId = null;
  editor.value = '';
  currentTitle.textContent = 'Untitled Project';
  updatePreview();
  renderList();
});

/* ─── File Upload ────────────────────────────────────── */
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (event) {
    if (editor.value.trim() && !confirm('Loading a file will replace current content. Continue?')) {
      fileInput.value = '';
      return;
    }

    try {
      showStatus('Uploading file...');
      const fileContent = event.target.result;
      editor.value = fileContent;

      const filename = file.name.replace(/\.[^/.]+$/, '');
      const projectTitle = filename || 'Untitled Project';
      currentTitle.textContent = projectTitle;
      updatePreview();

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: projectTitle, code: fileContent })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save uploaded file');
      }

      const newProject = await res.json();
      currentId = newProject.id;
      await loadProjects();
      showSuccessModal('File Uploaded', '"' + file.name + '" has been uploaded and saved successfully.');
    } catch (error) {
      console.error('Upload and save error:', error);
      showErrorModal('Upload Failed', 'File loaded but failed to save: ' + error.message);
      currentId = null;
    } finally {
      fileInput.value = '';
    }
  };

  reader.onerror = function () {
    showErrorModal('Read Failed', 'Failed to read the file. Please try again.');
    fileInput.value = '';
  };

  reader.readAsText(file);
});

/* ─── Project Helpers ────────────────────────────────── */
function loadProject(id) { loadProjectFromDB(id); }

function downloadProject(id) {
  const p = projects.find(proj => proj.id === id);
  if (!p) return;
  const blob = new Blob([getProjectContent(p)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (p.title || 'project').replace(/[^a-z0-9]/gi, '_') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function deleteProject(id) {
  const p = projects.find(proj => proj.id === id);
  if (!p) return;
  if (confirm('Delete "' + (p.title || 'Untitled') + '"? This cannot be undone.')) {
    deleteProjectFromDB(id);
  }
}

/* ─── Resizer ────────────────────────────────────────── */
const divider = document.getElementById('divider');
let isResizing = false;

divider.addEventListener('mousedown', () => { isResizing = true; document.body.style.userSelect = 'none'; });
document.addEventListener('mouseup', () => { isResizing = false; document.body.style.userSelect = ''; });
document.addEventListener('mousemove', function (e) {
  if (!isResizing) return;
  const container = document.getElementById('editorArea');
  const width = e.clientX - container.getBoundingClientRect().left;
  if (width > 220 && width < container.offsetWidth - 220) {
    document.getElementById('editorPanel').style.flex = '0 0 ' + width + 'px';
  }
});

/* ─── Init ───────────────────────────────────────────── */
async function init() {
  console.log('Initializing your dashboard...');

  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) { console.log('Not authenticated'); return; }

  await loadProjects();

  if (!editor.value.trim()) {
    editor.value =
      '<!DOCTYPE html>\n' +
      '<html>\n' +
      '<head>\n' +
      '  <title>My Project</title>\n' +
      '  <style>\n' +
      '    body {\n' +
      '      font-family: Arial, sans-serif;\n' +
      '      margin: 0;\n' +
      '      padding: 20px;\n' +
      '      background: #f0f0f0;\n' +
      '    }\n' +
      '    .container {\n' +
      '      max-width: 800px;\n' +
      '      margin: 0 auto;\n' +
      '      background: white;\n' +
      '      padding: 30px;\n' +
      '      border-radius: 10px;\n' +
      '      box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n' +
      '    }\n' +
      '    h1 { color: #333; }\n' +
      '    .btn {\n' +
      '      background: #FFAC1C;\n' +
      '      color: white;\n' +
      '      border: none;\n' +
      '      padding: 10px 20px;\n' +
      '      border-radius: 5px;\n' +
      '      cursor: pointer;\n' +
      '    }\n' +
      '    .btn:hover { background: #eba52d; }\n' +
      '  </style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div class="container">\n' +
      '    <h1>Welcome to Code Previewer</h1>\n' +
      '    <p>This is your live preview area.</p>\n' +
      '    <button class="btn" onclick="alert(\'Uyy! Gumana boi.\')">Click Me</button>\n' +
      '  </div>\n' +
      '</body>\n' +
      '</html>';
    updatePreview();
  }

  lucide.createIcons();
  updateLineNumbers();
  setTimeout(() => showSuccessModal('Dashboard Loaded!', ' Your projects have been retrieved successfully.'), 500);
}

document.addEventListener('DOMContentLoaded', init);