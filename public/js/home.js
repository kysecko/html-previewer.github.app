lucide.createIcons();

let projects = [];
let currentId = null;
let saveTimeout = null;
let _modalMode = 'create';
let _renameTargetId = null;
let isMaximized = false;
let isEditorExpanded = false;
let isResizing = false;

const editor = document.getElementById('codeEditor');
const preview = document.getElementById('previewFrame');
const projectList = document.getElementById('projectItems');
const currentTitle = document.getElementById('currentTitle');
const projectCount = document.getElementById('projectCount');
const status = document.getElementById('status');
const modal = document.getElementById('myModal');
const maximizeBtn = document.getElementById('maximizeBtn');
const expandEditorBtn = document.getElementById('expandEditorBtn');
const editorArea = document.getElementById('editorArea');
const lineNumbers = document.getElementById('lineNumbers');
const sidebar = document.getElementById('sidebar');
const divider = document.getElementById('divider');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

function toggleSidebar() {
  const backdrop = document.getElementById('sidebarBackdrop');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('expanded');
    backdrop.classList.toggle('show', sidebar.classList.contains('expanded'));
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('expanded');
  document.getElementById('sidebarBackdrop').classList.remove('show');
}

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
errorModalTitle.style.cssText = `color: #ff4d4d; font-size: 15px; font-weight: 700; margin-bottom: 6px; font-family: inherit;`;
const errorModalMessage = document.createElement('p');
errorModalMessage.style.cssText = `color: #ffaaaa; font-size: 13px; line-height: 1.6; margin: 0; font-family: inherit;`;
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
errorModal.addEventListener('click', closeErrorModal);

const showErrorModal = (title, msg) => {
  clearTimeout(errorModalTimer);
  errorModalTitle.textContent = title;
  errorModalMessage.textContent = msg;
  errorModal.style.opacity = '1';
  errorModal.style.pointerEvents = 'all';
  errorModalBox.style.transform = 'scale(1)';
  errorModalTimer = setTimeout(closeErrorModal, 3000);
};

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
successModalTitle.style.cssText = `color: #2ecc71; font-size: 15px; font-weight: 700; margin-bottom: 6px; font-family: inherit;`;
const successModalMessage = document.createElement('p');
successModalMessage.style.cssText = `color: #a8f0c6; font-size: 13px; line-height: 1.6; margin: 0; font-family: inherit;`;
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
successModal2.addEventListener('click', closeSuccessModal);

const showSuccessModal = (title, msg) => {
  clearTimeout(successModalTimer);
  successModalTitle.textContent = title;
  successModalMessage.textContent = msg;
  successModal2.style.opacity = '1';
  successModal2.style.pointerEvents = 'all';
  successModalBox.style.transform = 'scale(1)';
  successModalTimer = setTimeout(closeSuccessModal, 3000);
};

const confirmModal = document.createElement('div');
confirmModal.style.cssText = `
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: none; place-items: center;
  z-index: 9999;
`;
const confirmModalBox = document.createElement('div');
confirmModalBox.style.cssText = `
  background: #1a1a1a; border: 1px solid #444; border-radius: 14px;
  padding: 28px; width: 90%; max-width: 380px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
`;
const confirmModalTitle = document.createElement('p');
confirmModalTitle.style.cssText = `color: #f0f0f0; font-size: 16px; font-weight: 700; margin-bottom: 8px; font-family: inherit; text-align: left`;
const confirmModalMessage = document.createElement('p');
confirmModalMessage.style.cssText = `color: #aaa; font-size: 13px; line-height: 1.6; margin: 0 0 24px; font-family: inherit;text-align: left`;
const confirmModalBtns = document.createElement('div');
confirmModalBtns.style.cssText = `display: flex; gap: 12px; justify-content: end;`;
const confirmModalCancel = document.createElement('button');
confirmModalCancel.textContent = 'Cancel';
confirmModalCancel.style.cssText = `padding: 10px 24px; background: #2a2a2a; color: #ccc; border: 1px solid #444; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 13px;`;
const confirmModalConfirm = document.createElement('button');
confirmModalConfirm.style.cssText = `padding: 10px 24px; background: #e53e3e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600;`;
confirmModalBtns.appendChild(confirmModalCancel);
confirmModalBtns.appendChild(confirmModalConfirm);
confirmModalBox.appendChild(confirmModalTitle);
confirmModalBox.appendChild(confirmModalMessage);
confirmModalBox.appendChild(confirmModalBtns);
confirmModal.appendChild(confirmModalBox);
document.body.appendChild(confirmModal);

function showConfirmModal(title, msg, confirmLabel = 'Confirm', confirmColor = '#fff') {
  return new Promise((resolve) => {
    confirmModalTitle.textContent = title;
    confirmModalMessage.innerHTML = msg;   // change textContent to innerHTML
    confirmModalConfirm.textContent = confirmLabel;
    confirmModalConfirm.style.background = confirmColor;
    confirmModal.style.display = 'grid';
    const cleanup = (result) => { confirmModal.style.display = 'none'; resolve(result); };
    confirmModalConfirm.onclick = () => cleanup(true);
    confirmModalCancel.onclick = () => cleanup(false);
    confirmModal.onclick = (e) => { if (e.target === confirmModal) cleanup(false); };
  });
}

function getProjectContent(project) { return project.code || ''; }

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
    preview.srcdoc = editor.value || '<!DOCTYPE html><html><body style="background:#f0f0f0;display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;"><div style="color:#666;text-align:center;"><h1>Code Previewer</h1><p>Start typing HTML code in the editor on the left.</p></div></body></html>';
    updateLineNumbers();
  } catch (error) {
    console.error('Preview update error:', error);
  }
}

maximizeBtn.addEventListener('click', () => {
  isMaximized = !isMaximized;
  editorArea.classList.toggle('preview-maximized', isMaximized);
  maximizeBtn.innerHTML = isMaximized
    ? '<i data-lucide="minimize" class="icon"></i>'
    : '<i data-lucide="maximize" class="icon"></i>';
  lucide.createIcons();
});

expandEditorBtn.addEventListener('click', () => {
  isEditorExpanded = !isEditorExpanded;
  editorArea.classList.toggle('editor-expanded', isEditorExpanded);
  expandEditorBtn.innerHTML = isEditorExpanded
    ? '<i data-lucide="minimize" class="icon"></i>'
    : '<i data-lucide="maximize" class="icon"></i>';
  lucide.createIcons();
});

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) { window.location.replace('/login'); return false; }
    return true;
  } catch (error) {
    window.location.replace('/login');
    return false;
  }
}

function openModal() { modal.style.display = 'grid'; }
function cancel() { modal.style.display = 'none'; }

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace('/login');
}

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
  if (_modalMode === 'create') await createProject(title);
  else if (_modalMode === 'rename-current') await renameCurrentProject(title);
  else if (_modalMode === 'rename-sidebar') await renameProjectById(_renameTargetId, title);
}

document.getElementById('newProjectTitleInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmCreateModal();
  if (e.key === 'Escape') closeCreateModal();
});

async function loadProjects() {
  try {
    const res = await fetch('/api/projects', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load projects');
    const data = await res.json();
    projects = data;
    renderList();
    return data;
  } catch (error) {
    showErrorModal('Load Failed', 'Failed to load your projects. Please refresh the page.');
    projectList.innerHTML = '<div class="loading" style="color:#dc3545;padding:20px;text-align:center;"><i data-lucide="alert-circle" class="icon"></i><br>Error loading projects<br><small>' + error.message + '</small></div>';
    return [];
  }
}

async function createProject(title) {
  try {
    if (!title || title.trim() === '') { showErrorModal('Invalid Name', 'Project name cannot be empty.'); return; }
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, code: editor.value })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to create project'); }
    const newProject = await res.json();
    await loadProjects();
    loadProject(newProject.id);
    showSuccessModal('Project Created', '"' + title + '" has been created successfully.');
    return newProject;
  } catch (error) {
    showErrorModal('Create Failed', 'Failed to create project: ' + error.message);
    return null;
  }
}

async function saveProject() {
  if (!currentId) { openCreateModal(); return; }
  try {
    const res = await fetch('/api/projects/' + currentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: currentTitle.textContent, code: editor.value })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to save'); }
    const updated = await res.json();
    const index = projects.findIndex(p => p.id === currentId);
    if (index !== -1) projects[index] = updated;
    renderList();
    // showSuccessModal('Project Saved', 'Your changes have been saved successfully.');
    return updated;
  } catch (error) {
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
    showErrorModal('Load Failed', 'Failed to load the project: ' + error.message);
    return null;
  }
}

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

  document.querySelectorAll('.rename-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openRenameSidebarModal(btn.dataset.id, btn.dataset.title); });
  });

  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); downloadProject(btn.dataset.id); });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteProject(btn.dataset.id); });
  });

  lucide.createIcons();
}

currentTitle.style.cursor = 'pointer';
currentTitle.addEventListener('click', () => { if (currentId) openRenameCurrentModal(); });

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

document.getElementById('clearBtn').addEventListener('click', async function () {
  if (editor.value.trim()) {
    const confirmed = await showConfirmModal('Clear Editor?', 'This will remove all your current code. Unsaved changes will be lost.', 'Clear', '#e53e3e');
    if (!confirmed) return;
  }
  currentId = null;
  editor.value = '';
  currentTitle.textContent = 'Untitled Project';
  updatePreview();
  renderList();
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (event) {
    if (editor.value.trim()) {
      const confirmed = await showConfirmModal('Replace Content?', 'Loading this file will replace your current editor content. Continue?', 'Replace', '#ffac1c');
      if (!confirmed) { fileInput.value = ''; return; }
    }
    try {
      showStatus('Uploading file...');
      const fileContent = event.target.result;
      editor.value = fileContent;
      updatePreview();

      // ✅ If a project is already open, save INTO it instead of creating a new one
      if (currentId) {
        const res = await fetch('/api/projects/' + currentId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: currentTitle.textContent, code: fileContent })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to save file into project'); }
        const updated = await res.json();
        const index = projects.findIndex(p => p.id === currentId);
        if (index !== -1) projects[index] = updated;
        renderList();
        showSuccessModal('File Uploaded', '"' + file.name + '" has been loaded into your current project.');
      } else {
        // No project open — create a new one
        const filename = file.name.replace(/\.[^/.]+$/, '');
        const projectTitle = filename || 'Untitled Project';
        currentTitle.textContent = projectTitle;
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: projectTitle, code: fileContent })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to save uploaded file'); }
        const newProject = await res.json();
        currentId = newProject.id;
        await loadProjects();
        showSuccessModal('File Uploaded', '"' + file.name + '" has been uploaded and saved as a new project.');
      }
    } catch (error) {
      showErrorModal('Upload Failed', 'File loaded but failed to save: ' + error.message);
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

function loadProject(id) { loadProjectFromDB(id); }

function downloadProject(id) {
  const p = projects.find(proj => proj.id === id);
  if (!p) return;
  const blob = new Blob([getProjectContent(p)], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (p.title || 'project').replace(/[^a-z0-9]/gi, '_') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function deleteProject(id) {
  const p = projects.find(proj => proj.id === id);
  if (!p) return;

  const confirmed = await showConfirmModal(
    'Delete Project?',
    '<span style="color: #ffac1c; font-weight: 700;">"' + escapeHtml(p.title || 'Untitled') + '"</span> will be permanently deleted. This cannot be undone.',
    'Delete',
    '#e53e3e'
  );
  if (confirmed) deleteProjectFromDB(id);
}

divider.addEventListener('mousedown', () => {
  isResizing = true;
  divider.classList.add('active');
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  divider.classList.remove('active');
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
});

document.addEventListener('mousemove', function (e) {
  if (!isResizing) return;
  const container = document.getElementById('editorArea');
  const width = e.clientX - container.getBoundingClientRect().left;
  if (width > 220 && width < container.offsetWidth - 220) {
    document.getElementById('editorPanel').style.flex = '0 0 ' + width + 'px';
  }
});

async function init() {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  await loadProjects();

  if (!editor.value.trim()) {
    editor.value =
      '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      margin: 0;\n      padding: 20px;\n      background: #f0f0f0;\n    }\n    .container {\n      max-width: 800px;\n      margin: 0 auto;\n      background: white;\n      padding: 30px;\n      border-radius: 10px;\n      box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n    }\n    h1 { color: #333; }\n    .btn {\n      background: #FFAC1C;\n      color: white;\n      border: none;\n      padding: 10px 20px;\n      border-radius: 5px;\n      cursor: pointer;\n    }\n    .btn:hover { background: #eba52d; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h1>Welcome to Code Previewer</h1>\n    <p>This is your live preview area.</p>\n    <button class="btn" onclick="alert(\'Uyy! Gumana boi.\')">Click Me</button>\n  </div>\n</body>\n</html>';
    updatePreview();
  }

  lucide.createIcons();
  updateLineNumbers();
  setTimeout(() => showSuccessModal('Dashboard Loaded!', 'Your projects have been retrieved successfully.'), 500);
}
const suggestions = {
  'h1': '<h1></h1>', 'h2': '<h2></h2>', 'h3': '<h3></h3>',
  'h4': '<h4></h4>', 'h5': '<h5></h5>', 'h6': '<h6></h6>',
  'div': '<div></div>', 'span': '<span></span>', 'p': '<p></p>',
  'a': '<a href=""></a>', 'img': '<img src="" alt="">',
  'ul': '<ul>\n  <li></li>\n</ul>', 'ol': '<ol>\n  <li></li>\n</ol>',
  'li': '<li></li>', 'table': '<table>\n  <tr>\n    <td></td>\n  </tr>\n</table>',
  'form': '<form action="" method="post"></form>', 'label': '<label for=""></label>',
  'input': '<input type="text" placeholder="">',
  'button': '<button></button>', 'textarea': '<textarea></textarea>',
  'select': '<select>\n  <option value=""></option>\n</select>',
  'nav': '<nav></nav>', 'header': '<header></header>',
  'footer': '<footer></footer>', 'section': '<section></section>',
  'article': '<article></article>', 'main': '<main></main>',
  'style': '<style>\n  \n</style>', 'script': '<script>\n  \n<\/script>',
  'link': '<link rel="stylesheet" href="">',
  'meta': '<meta name="" content="">',
  'html': '<!DOCTYPE html>\n<html>\n<head>\n  <title></title>\n</head>\n<body>\n  \n</body>\n</html>',
};

const autocompleteBox = document.createElement('div'); 
autocompleteBox.id = 'autocomplete-box';
autocompleteBox.style.cssText = `
  position: fixed; z-index: 99999;
  background: #1e1e1e; border: 1px solid #444; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  display: none; flex-direction: column;
  min-width: 180px; max-height: 200px; overflow-y: auto;
  font-family: 'Courier New', monospace; font-size: 13px;
`;
document.body.appendChild(autocompleteBox);

let acItems = [], acIndex = -1, acWord = '';

function getWordBefore(el) {
  const val = el.value.substring(0, el.selectionStart);
  const match = val.match(/([a-zA-Z0-9!]+)$/);
  return match ? match[1] : '';
}

function hideAutocomplete() {
  autocompleteBox.style.display = 'none';
  acItems = []; acIndex = -1;
}

function showAutocomplete(matches, word) {
  if (!matches.length) { hideAutocomplete(); return; }
  acItems = matches; acIndex = -1; acWord = word;
  autocompleteBox.innerHTML = '';
  matches.forEach((m, i) => {
    const item = document.createElement('div');
    item.style.cssText = `padding: 7px 14px; cursor: pointer; color: #d4d4d4; display: flex; justify-content: space-between; gap: 16px; align-items: center;`;
    item.innerHTML = `<span style="color:#4ec9b0;">${m}</span><span style="color:#666;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;">${suggestions[m].replace(/\n/g, ' ')}</span>`;
    item.addEventListener('mousedown', e => { e.preventDefault(); applyAutocomplete(m); });
    item.addEventListener('mouseenter', () => { acIndex = i; highlightItem(); });
    autocompleteBox.appendChild(item);
  });
  const rect = editor.getBoundingClientRect();
  const lineHeight = 20;
  const lines = editor.value.substring(0, editor.selectionStart).split('\n');
  const currentLine = lines.length;
  const approxTop = rect.top + (currentLine * lineHeight) - editor.scrollTop + 4;
  const approxLeft = rect.left + 40;
  autocompleteBox.style.display = 'flex';
  autocompleteBox.style.top = Math.min(approxTop, window.innerHeight - 220) + 'px';
  autocompleteBox.style.left = Math.min(approxLeft, window.innerWidth - 200) + 'px';
}

function highlightItem() {
  Array.from(autocompleteBox.children).forEach((el, i) => {
    el.style.background = i === acIndex ? '#094771' : 'transparent';
    el.style.color = i === acIndex ? '#fff' : '#d4d4d4';
  });
}

function applyAutocomplete(key) {
  const snippet = suggestions[key];
  const start = editor.selectionStart;

  // Select the typed word so execCommand replaces it
  editor.selectionStart = start - acWord.length;
  editor.selectionEnd = start;

  // Insert using execCommand so undo/redo works natively
  document.execCommand('insertText', false, snippet);

  // Place cursor inside the tag (between > and <)
  const newPos = editor.selectionStart - snippet.length + snippet.indexOf('><') + 1;
  if (snippet.indexOf('><') !== -1) {
    editor.selectionStart = editor.selectionEnd = newPos;
  }

  hideAutocomplete();
  updatePreview();
  updateLineNumbers();
  if (currentId) { clearTimeout(saveTimeout); saveTimeout = setTimeout(() => saveProject(), 2000); }
  editor.focus();
}

editor.addEventListener('keydown', function (e) {
  if (autocompleteBox.style.display === 'flex') {
    if (e.key === 'ArrowDown') { e.preventDefault(); acIndex = Math.min(acIndex + 1, acItems.length - 1); highlightItem(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); acIndex = Math.max(acIndex - 1, 0); highlightItem(); return; }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (acIndex >= 0) applyAutocomplete(acItems[acIndex]); else if (acItems.length === 1) applyAutocomplete(acItems[0]); else hideAutocomplete(); return; }
    if (e.key === 'Escape') { hideAutocomplete(); return; }
  }
});

editor.addEventListener('input', function () {
  const word = getWordBefore(editor);
  if (word.length < 1) { hideAutocomplete(); return; }
  const matches = Object.keys(suggestions).filter(k => k.startsWith(word) && k !== word);
  showAutocomplete(matches, word);
});

editor.addEventListener('blur', () => setTimeout(hideAutocomplete, 150));
document.addEventListener('scroll', hideAutocomplete, true);

document.addEventListener('DOMContentLoaded', init);