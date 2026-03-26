// Bootstrap Lucide Icons
lucide.createIcons();

// Global State Variables
// These are the variables used throughout the entire application
let projects = [];            // List of all projects
let currentId = null;         // ID of the currently open project
let saveTimeout = null;       // Timer for auto-save
let _modalMode = 'create';    // Modal mode: 'create', 'rename-current', 'rename-sidebar'
let _renameTargetId = null;   // ID of the project to rename from the sidebar
let isMaximized = false;      // Desktop: is the preview panel maximized?
let isEditorExpanded = false; // Desktop: is the editor panel expanded?
let isResizing = false;       // Is the divider currently being resized?

// DOM References
// Gets the elements from the HTML to be used in JS
const editor          = document.getElementById('codeEditor');
const preview         = document.getElementById('previewFrame');
const projectList     = document.getElementById('projectItems');
const currentTitle    = document.getElementById('currentTitle');
const projectCount    = document.getElementById('projectCount');
const status          = document.getElementById('status');
const modal           = document.getElementById('myModal');
const maximizeBtn     = document.getElementById('maximizeBtn');
const expandEditorBtn = document.getElementById('expandEditorBtn');
const editorArea      = document.getElementById('editorArea');
const lineNumbers     = document.getElementById('lineNumbers');
const sidebar         = document.getElementById('sidebar');
const divider         = document.getElementById('divider');
const fileInput       = document.getElementById('fileInput');
const uploadBtn       = document.getElementById('uploadBtn');

// Sidebar Toggle
// Hides or shows the sidebar, especially on mobile
function toggleSidebar() {
  const backdrop = document.getElementById('sidebarBackdrop');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('expanded');
    backdrop.classList.toggle('show', sidebar.classList.contains('expanded'));
  }
}

// Close Sidebar
// Closes the sidebar (used by the backdrop click on mobile)
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('expanded');
  document.getElementById('sidebarBackdrop').classList.remove('show');
}

// Error Modal (Red)
// Builds the error modal that displays error messages
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

// Close Error Modal
// Timer that automatically closes the error modal after 3 seconds
let errorModalTimer;
const closeErrorModal = () => {
  errorModal.style.opacity = '0';
  errorModal.style.pointerEvents = 'none';
  errorModalBox.style.transform = 'scale(0.92)';
};
errorModal.addEventListener('click', closeErrorModal);

// Show Error Modal
// Displays the error modal with a title and message
const showErrorModal = (title, msg) => {
  clearTimeout(errorModalTimer);
  errorModalTitle.textContent = title;
  errorModalMessage.textContent = msg;
  errorModal.style.opacity = '1';
  errorModal.style.pointerEvents = 'all';
  errorModalBox.style.transform = 'scale(1)';
  errorModalTimer = setTimeout(closeErrorModal, 3000);
};

// Success Modal (Green)
// Builds the success modal for successful actions
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

// Close Success Modal
// Timer that automatically closes the success modal after 3 seconds
let successModalTimer;
const closeSuccessModal = () => {
  successModal2.style.opacity = '0';
  successModal2.style.pointerEvents = 'none';
  successModalBox.style.transform = 'scale(0.92)';
};
successModal2.addEventListener('click', closeSuccessModal);

// Show Success Modal
// Displays the success modal with a title and message
const showSuccessModal = (title, msg) => {
  clearTimeout(successModalTimer);
  successModalTitle.textContent = title;
  successModalMessage.textContent = msg;
  successModal2.style.opacity = '1';
  successModal2.style.pointerEvents = 'all';
  successModalBox.style.transform = 'scale(1)';
  successModalTimer = setTimeout(closeSuccessModal, 3000);
};

// Confirm Modal (General Confirmation)
// Builds the confirm modal for dangerous actions like delete
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

// Show Confirm Modal
// Returns a Promise — true if the user confirmed, false if cancelled
function showConfirmModal(title, msg, confirmLabel = 'Confirm', confirmColor = '#fff') {
  return new Promise((resolve) => {
    confirmModalTitle.textContent = title;
    confirmModalMessage.innerHTML = msg;
    confirmModalConfirm.textContent = confirmLabel;
    confirmModalConfirm.style.background = confirmColor;
    confirmModal.style.display = 'grid';
    const cleanup = (result) => { confirmModal.style.display = 'none'; resolve(result); };
    confirmModalConfirm.onclick = () => cleanup(true);
    confirmModalCancel.onclick  = () => cleanup(false);
    confirmModal.onclick = (e) => { if (e.target === confirmModal) cleanup(false); };
  });
}

// Get Project Content
// Returns the code content of a project
function getProjectContent(project) { return project.code || ''; }

// Get Project Date
// Formats the project date for display
function getProjectDate(project) {
  const dateStr = project.updated_at || project.created_at || Date.now();
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Escape HTML
// Escapes HTML characters to prevent XSS attacks
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show Status
// Displays a small status message at the top of the screen
function showStatus(msg, isError = false) {
  status.textContent = msg;
  status.classList.toggle('error', isError);
  status.classList.add('show');
  setTimeout(() => status.classList.remove('show'), 2200);
}

// Update Line Numbers
// Updates the line number count on the left side of the editor
function updateLineNumbers() {
  const lines = editor.value.split('\n').length;
  lineNumbers.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

// Update Preview
// Updates the preview iframe based on the current code in the editor
function updatePreview() {
  try {
    preview.srcdoc = editor.value ||
      '<!DOCTYPE html><html><body style="background:#f0f0f0;display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;"><div style="color:#666;text-align:center;"><h1>Code Previewer</h1><p>Start typing HTML code in the editor on the left.</p></div></body></html>';
    updateLineNumbers();
  } catch (error) {
    console.error('Preview update error:', error);
  }
}

// Maximize Preview Panel (Desktop)
// Expands the preview panel to fullscreen — desktop only
maximizeBtn.addEventListener('click', () => {
  if (window.innerWidth <= 768) return; // Mobile maximize is handled separately
  isMaximized = !isMaximized;
  editorArea.classList.toggle('preview-maximized', isMaximized);
  maximizeBtn.innerHTML = isMaximized
    ? '<i data-lucide="minimize" class="icon"></i>'
    : '<i data-lucide="maximize" class="icon"></i>';
  lucide.createIcons();
});

// Expand Editor Panel (Desktop)
// Expands the editor panel to fullscreen — desktop only
expandEditorBtn.addEventListener('click', () => {
  if (window.innerWidth <= 768) return; // Mobile maximize is handled separately
  isEditorExpanded = !isEditorExpanded;
  editorArea.classList.toggle('editor-expanded', isEditorExpanded);
  expandEditorBtn.innerHTML = isEditorExpanded
    ? '<i data-lucide="minimize" class="icon"></i>'
    : '<i data-lucide="maximize" class="icon"></i>';
  lucide.createIcons();
});

// Mobile Panel Maximize / Minimize
// On mobile, either panel can be fullscreened by clicking its maximize button
// Default is a 50/50 split — clicking maximize fills the screen, clicking again restores the split
function initMobilePanelMaximize() {
  if (window.innerWidth > 768) return; // This only runs on mobile

  // Clicking the editor maximize button
  expandEditorBtn.addEventListener('click', () => {
    const isAlreadyFull = editorArea.classList.contains('mobile-editor-full');
    // Remove all fullscreen states first
    editorArea.classList.remove('mobile-editor-full', 'mobile-preview-full');
    // If not yet fullscreen, make it fullscreen
    if (!isAlreadyFull) editorArea.classList.add('mobile-editor-full');
    updateMobilePanelIcons();
  });

  // Clicking the preview maximize button
  maximizeBtn.addEventListener('click', () => {
    const isAlreadyFull = editorArea.classList.contains('mobile-preview-full');
    // Remove all fullscreen states first
    editorArea.classList.remove('mobile-editor-full', 'mobile-preview-full');
    // If not yet fullscreen, make it fullscreen
    if (!isAlreadyFull) editorArea.classList.add('mobile-preview-full');
    updateMobilePanelIcons();
  });
}

// Update Mobile Panel Icons
// Syncs the maximize/minimize button icons to match the current panel state on mobile
function updateMobilePanelIcons() {
  if (window.innerWidth > 768) return;
  const editorFull  = editorArea.classList.contains('mobile-editor-full');
  const previewFull = editorArea.classList.contains('mobile-preview-full');

  // Show minimize icon if editor is fullscreen, otherwise show maximize
  expandEditorBtn.innerHTML = editorFull
    ? '<i data-lucide="minimize" class="icon"></i>'
    : '<i data-lucide="maximize" class="icon"></i>';

  // Show minimize icon if preview is fullscreen, otherwise show maximize
  maximizeBtn.innerHTML = previewFull
    ? '<i data-lucide="minimize" class="icon"></i>'
    : '<i data-lucide="maximize" class="icon"></i>';

  lucide.createIcons();
}

// Check Authentication
// Checks if the user is logged in; if not, redirects to the login page
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

// Open Logout Modal
// Opens the logout confirmation modal
function openModal() { modal.style.display = 'grid'; }

// Cancel Logout
// Closes the logout modal without logging out
function cancel() { modal.style.display = 'none'; }

// Logout
// Executes logout — clears all data and redirects to the login page
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace('/login');
}

// Open Create Modal
// Opens the modal for creating a new project
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

// Open Rename Current Modal
// Opens the modal to rename the currently open project
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

// Open Rename Sidebar Modal
// Opens the modal to rename a project directly from the sidebar
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

// Close Create Modal
// Closes the create/rename modal
function closeCreateModal() {
  document.getElementById('createProjectModal').style.display = 'none';
}

// Confirm Create Modal
// Accepts input from the modal and executes the correct action based on the current mode
async function confirmCreateModal() {
  const input = document.getElementById('newProjectTitleInput');
  const title = input.value.trim();
  // If no name is entered, show a red border as an error indicator
  if (!title) {
    input.style.border = '1px solid #e53e3e';
    setTimeout(() => input.style.border = '1px solid #444', 1500);
    return;
  }
  closeCreateModal();
  if (_modalMode === 'create')              await createProject(title);
  else if (_modalMode === 'rename-current') await renameCurrentProject(title);
  else if (_modalMode === 'rename-sidebar') await renameProjectById(_renameTargetId, title);
}

// Modal Keyboard Shortcuts
// Enter to confirm and Escape to cancel inside the create/rename modal
document.getElementById('newProjectTitleInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  confirmCreateModal();
  if (e.key === 'Escape') closeCreateModal();
});

// Load Projects
// Fetches all of the user's projects from the server
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

// Create Project
// Creates a new project on the server and immediately opens it
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

// Save Project
// Saves the current project to the server
// If no project is open, it opens the create modal instead
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
    return updated;
  } catch (error) {
    showErrorModal('Save Failed', 'Failed to save your project: ' + error.message);
    return null;
  }
}

// Rename Current Project
// Renames the currently open project
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

// Rename Project By ID
// Renames a project using its ID (triggered from the sidebar)
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

// Delete Project From DB
// Deletes the project from the database
// If it's currently open, the editor will be cleared
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

// Load Project From DB
// Fetches a project from the server and opens it in the editor
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

// Render Project List
// Displays all projects in the sidebar
function renderList() {
  // Updates the project count in the sidebar footer
  projectCount.textContent = projects.length + ' project' + (projects.length !== 1 ? 's' : '');

  // If there are no projects, show an empty state
  if (projects.length === 0) {
    projectList.innerHTML = '<div class="loading" style="color:#666;padding:40px 20px;"><i data-lucide="folder-open" class="icon"></i><br>No projects yet.<br><small>Click "New Project" to start!</small></div>';
    lucide.createIcons();
    return;
  }

  // Clear the list before re-rendering
  projectList.innerHTML = '';
  projects.forEach(function (p) {
    const div = document.createElement('div');
    div.className = 'project-item';
    // Highlight the currently open project
    if (currentId === p.id) div.classList.add('active');

    const updatedDate = getProjectDate(p);
    // Show a code preview (first 50 characters only)
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

    // Clicking the project item (not the buttons) opens the project
    div.addEventListener('click', function (e) {
      if (!e.target.closest('button')) loadProject(p.id);
    });

    projectList.appendChild(div);
  });

  // Attach event listeners to the rename, download, and delete buttons
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

// Current Title Click — Rename
// Clicking the project title in the topbar opens the rename modal
currentTitle.style.cursor = 'pointer';
currentTitle.addEventListener('click', () => { if (currentId) openRenameCurrentModal(); });

// Topbar Button Events
// New Project and Save buttons in the topbar
document.getElementById('newBtn').addEventListener('click', () => openCreateModal());
document.getElementById('saveBtn').addEventListener('click', saveProject);

// Editor Input Events
// Every keystroke in the editor updates the preview and schedules an auto-save
editor.addEventListener('input', function () {
  updatePreview();
  updateLineNumbers();
  // Auto-save after 2 seconds of no typing
  if (currentId) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveProject(), 2000);
  }
});

// Editor Scroll Sync
// Syncs the line numbers scroll position with the editor scroll
editor.addEventListener('scroll', function () {
  lineNumbers.scrollTop = editor.scrollTop;
});

// Clear Editor
// Clears the editor and resets the current project
// Shows a confirmation prompt first if the editor has content
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

// Upload Button
// Clicking the upload button opens the file picker
uploadBtn.addEventListener('click', () => fileInput.click());

// File Input Change
// When a file is selected, it is read and loaded into the editor
fileInput.addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (event) {
    // If the editor has content, ask the user before replacing it
    if (editor.value.trim()) {
      const confirmed = await showConfirmModal('Replace Content?', 'Loading this file will replace your current editor content. Continue?', 'Replace', '#ffac1c');
      if (!confirmed) { fileInput.value = ''; return; }
    }
    try {
      showStatus('Uploading file...');
      const fileContent = event.target.result;
      editor.value = fileContent;
      updatePreview();

      // If a project is open, save the file into it; otherwise create a new one
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
        // No project open — create a new one using the filename as the title
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
      // Reset the file input so the same file can be uploaded again
      fileInput.value = '';
    }
  };

  reader.onerror = function () {
    showErrorModal('Read Failed', 'Failed to read the file. Please try again.');
    fileInput.value = '';
  };

  // Read the file as plain text
  reader.readAsText(file);
});

// Load Project
// Loads a project from the database using its ID
function loadProject(id) { loadProjectFromDB(id); }

// Download Project
// Downloads the project's HTML file to the user's device
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

// Delete Project
// Deletes a project after the user confirms
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

// Divider / Resizer (Desktop)
// Allows the user to resize the editor and preview panels on desktop
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

// Divider Mouse Move
// While the divider is being dragged, adjusts the width of the editor panel
document.addEventListener('mousemove', function (e) {
  if (!isResizing) return;
  const container = document.getElementById('editorArea');
  const width = e.clientX - container.getBoundingClientRect().left;
  if (width > 220 && width < container.offsetWidth - 220) {
    document.getElementById('editorPanel').style.flex = '0 0 ' + width + 'px';
  }
});

// HTML Autocomplete Suggestions
// Snippets that automatically appear while the user types HTML tags
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

// Build Autocomplete Box
// Creates and appends the autocomplete dropdown element to the DOM
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

// Autocomplete State Variables
// Tracks the current suggestions list, selected index, and typed word
let acItems = [], acIndex = -1, acWord = '';

// Get Word Before Cursor
// Returns the word currently being typed before the cursor position
function getWordBefore(el) {
  const val = el.value.substring(0, el.selectionStart);
  const match = val.match(/([a-zA-Z0-9!]+)$/);
  return match ? match[1] : '';
}

// Hide Autocomplete
// Hides the autocomplete dropdown and resets its state
function hideAutocomplete() {
  autocompleteBox.style.display = 'none';
  acItems = []; acIndex = -1;
}

// Show Autocomplete
// Displays the autocomplete dropdown with a list of matching suggestions
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

  // Calculate dropdown position based on the cursor position in the editor
  const rect = editor.getBoundingClientRect();
  const lineHeight = 20;
  const lines = editor.value.substring(0, editor.selectionStart).split('\n');
  const currentLine = lines.length;
  const approxTop  = rect.top + (currentLine * lineHeight) - editor.scrollTop + 4;
  const approxLeft = rect.left + 40;
  autocompleteBox.style.display = 'flex';
  autocompleteBox.style.top  = Math.min(approxTop,  window.innerHeight - 220) + 'px';
  autocompleteBox.style.left = Math.min(approxLeft, window.innerWidth  - 200) + 'px';
}

// Highlight Autocomplete Item
// Highlights the currently selected item in the autocomplete dropdown
function highlightItem() {
  Array.from(autocompleteBox.children).forEach((el, i) => {
    el.style.background = i === acIndex ? '#094771' : 'transparent';
    el.style.color      = i === acIndex ? '#fff'    : '#d4d4d4';
  });
}

// Apply Autocomplete
// Inserts the selected suggestion snippet into the editor
function applyAutocomplete(key) {
  const snippet = suggestions[key];
  const start = editor.selectionStart;

  // Select the typed word so it gets replaced by the snippet
  editor.selectionStart = start - acWord.length;
  editor.selectionEnd   = start;

  // Use execCommand so the browser's undo/redo works natively
  document.execCommand('insertText', false, snippet);

  // Place the cursor between the opening and closing tags
  const newPos = editor.selectionStart - snippet.length + snippet.indexOf('><') + 1;
  if (snippet.indexOf('><') !== -1) {
    editor.selectionStart = editor.selectionEnd = newPos;
  }

  hideAutocomplete();
  updatePreview();
  updateLineNumbers();
  // Schedule auto-save after applying the autocomplete
  if (currentId) { clearTimeout(saveTimeout); saveTimeout = setTimeout(() => saveProject(), 2000); }
  editor.focus();
}

// Autocomplete Keyboard Navigation
// Arrow keys to navigate, Enter/Tab to select, Escape to close the dropdown
editor.addEventListener('keydown', function (e) {
  if (autocompleteBox.style.display === 'flex') {
    if (e.key === 'ArrowDown') { e.preventDefault(); acIndex = Math.min(acIndex + 1, acItems.length - 1); highlightItem(); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); acIndex = Math.max(acIndex - 1, 0);                  highlightItem(); return; }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (acIndex >= 0)              applyAutocomplete(acItems[acIndex]);
      else if (acItems.length === 1) applyAutocomplete(acItems[0]);
      else                           hideAutocomplete();
      return;
    }
    if (e.key === 'Escape') { hideAutocomplete(); return; }
  }
});

// Autocomplete Input Listener
// While the user types, searches for matching tag suggestions
editor.addEventListener('input', function () {
  const word = getWordBefore(editor);
  if (word.length < 1) { hideAutocomplete(); return; }
  const matches = Object.keys(suggestions).filter(k => k.startsWith(word) && k !== word);
  showAutocomplete(matches, word);
});

// Hide Autocomplete on Blur / Scroll
// Hides the autocomplete when the editor loses focus or the page scrolls
editor.addEventListener('blur',   () => setTimeout(hideAutocomplete, 150));
document.addEventListener('scroll', hideAutocomplete, true);

// Initialization
// Entry point — checks auth, loads projects, and sets up all features
async function init() {
  // First, check if the user is logged in
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  // Load all of the user's projects
  await loadProjects();

  // If the editor is empty, insert the default boilerplate code
  if (!editor.value.trim()) {
    editor.value =
      '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      margin: 0;\n      padding: 20px;\n      background: #f0f0f0;\n    }\n    .container {\n      max-width: 800px;\n      margin: 0 auto;\n      background: white;\n      padding: 30px;\n      border-radius: 10px;\n      box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n    }\n    h1 { color: #333; }\n    .btn {\n      background: #FFAC1C;\n      color: white;\n      border: none;\n      padding: 10px 20px;\n      border-radius: 5px;\n      cursor: pointer;\n    }\n    .btn:hover { background: #eba52d; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h1>Welcome to Code Previewer</h1>\n    <p>This is your live preview area.</p>\n    <button class="btn" onclick="alert(\'Uyy! Gumana boi.\')">Click Me</button>\n  </div>\n</body>\n</html>';
    updatePreview();
  }

  // Initialize Lucide icons and line numbers
  lucide.createIcons();
  updateLineNumbers();

  // Initialize the mobile panel maximize feature
  initMobilePanelMaximize();

  // Show a success message once the dashboard has loaded
  setTimeout(() => showSuccessModal('Dashboard Loaded!', 'Your projects have been retrieved successfully.'), 500);
}

// DOMContentLoaded
// Everything starts here once the DOM has fully loaded
document.addEventListener('DOMContentLoaded', init);