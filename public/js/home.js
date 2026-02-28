lucide.createIcons();

let projects = [];
let currentId = null;
let saveTimeout = null;

const editor = document.getElementById('codeEditor');
const preview = document.getElementById('previewFrame');
const projectList = document.getElementById('projectItems');
const currentTitle = document.getElementById('currentTitle');
const projectCount = document.getElementById('projectCount');
const status = document.getElementById('status');
const modal = document.getElementById('myModal');
const maximizeBtn = document.getElementById("maximizeBtn");
const editorArea = document.getElementById("editorArea");
const lineNumbers = document.getElementById('lineNumbers');


// Helper function to get project content
function getProjectContent(project) {
    return project.code || '';
}

// Helper function to get date
function getProjectDate(project) {
    const dateStr = project.updated_at || project.created_at || Date.now();
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

let isMaximized = false;

maximizeBtn.addEventListener("click", () => {
    isMaximized = !isMaximized;

    editorArea.classList.toggle("preview-maximized", isMaximized);

    maximizeBtn.innerHTML = isMaximized
        ? '<i data-lucide="minimize" class="icon"></i>'
        : '<i data-lucide="maximize" class="icon"></i>';

    lucide.createIcons(); // re-render icon
});

// ==================== AUTH ====================
async function checkAuth() {
    try {
        const res = await fetch('/auth/verify', {
            credentials: 'include'
        });

        if (!res.ok) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}

function openModal() {
    modal.style.display = 'grid';
}

function cancel() {
    modal.style.display = 'none';
}

async function logout() {
    try {
        await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout failed:', error);
        showStatus('Logout failed', true);
    }
}

// ==================== API CALLS ====================
async function loadProjects() {
    try {
        console.log('Loading projects...');

        const res = await fetch('/api/projects', {
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Failed to load projects');
        }

        const data = await res.json();
        console.log('Loaded ' + data.length + ' projects');
        projects = data;
        renderList();
        return data;
    } catch (error) {
        console.error('Load projects error:', error);
        showStatus('Failed to load projects', true);
        projectList.innerHTML = '<div class="loading" style="color:#dc3545; padding: 20px; text-align: center;"><i data-lucide="alert-circle" class="icon"></i><br>Error loading projects<br><small>' + error.message + '</small></div>';
        return [];
    }
}

async function createProject(title) {
    try {
        if (!title || title.trim() === '') {
            showStatus('Project name cannot be empty', true);
            return;
        }

        console.log('Creating project: ' + title);

        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                title: title,
                code: editor.value
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to create project');
        }

        const newProject = await res.json();
        console.log('Project created successfully:', newProject);

        // Reload projects list
        await loadProjects();

        // Load the new project
        loadProject(newProject.id);
        showStatus('Project created successfully!');
        return newProject;
    } catch (error) {
        console.error('Create project error:', error);
        showStatus('Failed to create project: ' + error.message, true);
        return null;
    }
}

//  PROJECT OPERATIONS (LOAD, SAVE, DELETE)
function openCreateModal() {
    const modal = document.getElementById('createProjectModal');
    const input = document.getElementById('newProjectTitleInput');
    input.value = '';
    modal.style.display = 'grid';
    setTimeout(() => input.focus(), 50);
}

function closeCreateModal() {
    document.getElementById('createProjectModal').style.display = 'none';
}

async function confirmCreateProject() {
    const input = document.getElementById('newProjectTitleInput');
    const title = input.value.trim();
    if (!title) {
        input.style.border = '1px solid #e53e3e';
        setTimeout(() => input.style.border = '1px solid #444', 1500);
        return;
    }
    closeCreateModal();
    await createProject(title);
}

// Updated saveProject 
async function saveProject() {
    if (!currentId) {
        openCreateModal();
        return;
    }

    try {
        console.log('Saving project: ' + currentId);

        const res = await fetch('/api/projects/' + currentId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: currentTitle.textContent,
                code: editor.value
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to save');
        }

        const updated = await res.json();
        console.log('Project updated successfully:', updated);

        const index = projects.findIndex(p => p.id === currentId);
        if (index !== -1) projects[index] = updated;

        renderList();
        showStatus('Project saved successfully!');
        return updated;
    } catch (error) {
        console.error('Save project error:', error);
        showStatus('Failed to save: ' + error.message, true);
        return null;
    }
}

// Rename project title on click
// ── Inline title editing ──────────────────────────────────────────────────────
function makeCurrentTitleEditable() {
    const titleEl = document.getElementById('currentTitle');

    // Avoid double-binding
    if (titleEl.dataset.editable) return;
    titleEl.dataset.editable = 'true';

    // Style as editable
    titleEl.style.cursor = 'text';
    titleEl.title = 'Click to rename';

    titleEl.addEventListener('click', () => {
        if (!currentId) return; // no project loaded yet

        const original = titleEl.textContent;
        titleEl.contentEditable = 'true';
        titleEl.style.outline = '1px solid #FFAC1C';
        titleEl.style.borderRadius = '4px';
        titleEl.style.padding = '2px 6px';
        titleEl.focus();

        // Select all text
        const range = document.createRange();
        range.selectNodeContents(titleEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        const finish = async (save) => {
            titleEl.contentEditable = 'false';
            titleEl.style.outline = '';
            titleEl.style.padding = '';

            const newTitle = titleEl.textContent.trim();
            if (!save || !newTitle || newTitle === original) {
                titleEl.textContent = original; // revert if empty or unchanged
                return;
            }

            // Persist immediately
            try {
                const res = await fetch('/api/projects/' + currentId, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ title: newTitle, code: editor.value })
                });
                if (!res.ok) throw new Error('Failed to rename');
                const updated = await res.json();
                const index = projects.findIndex(p => p.id === currentId);
                if (index !== -1) projects[index] = updated;
                renderList();
                showStatus('Project renamed!');
            } catch (err) {
                titleEl.textContent = original;
                showStatus('Failed to rename: ' + err.message, true);
            }
        };

        titleEl.addEventListener('blur', () => finish(true), { once: true });
        titleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); finish(true); }
            if (e.key === 'Escape') { titleEl.textContent = original; finish(false); }
        }, { once: true });
    });
}

// Call this once after the DOM is ready (e.g. at the bottom of your init code):
// makeCurrentTitleEditable();
async function deleteProjectFromDB(id) {
    try {
        console.log('Deleting project: ' + id);

        const res = await fetch('/api/projects/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Failed to delete');
        }

        // Remove from local array
        projects = projects.filter(p => p.id !== id);

        // If deleting current project, clear editor
        if (currentId === id) {
            currentId = null;
            editor.value = '';
            currentTitle.textContent = 'Untitled Project';
            updatePreview();
        }

        renderList();
        showStatus('Project deleted successfully!');
        return true;
    } catch (error) {
        console.error('Delete project error:', error);
        showStatus('Failed to delete: ' + error.message, true);
        return false;
    }
}

async function loadProjectFromDB(id) {
    try {
        console.log('Loading project: ' + id);

        const res = await fetch('/api/projects/' + id, {
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Failed to load');
        }

        const project = await res.json();
        console.log('Project loaded successfully:', project);

        currentId = project.id;
        editor.value = getProjectContent(project);
        currentTitle.textContent = project.title || 'Untitled Project';
        updatePreview();
        renderList();
        return project;
    } catch (error) {
        console.error('Load project error:', error);
        showStatus('Failed to load project: ' + error.message, true);
        return null;
    }
}

// ==================== UI FUNCTIONS ====================
function updateLineNumbers() {
    const lines = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from(
        { length: lines },
        (_, i) => i + 1
    ).join('\n');
}

function showStatus(msg, isError = false) {
    status.textContent = msg;
    status.classList.toggle('error', isError);
    status.classList.add('show');
    setTimeout(function () {
        status.classList.remove('show');
    }, 2200);
}

function renderList() {
    projectCount.textContent = projects.length + ' project' + (projects.length !== 1 ? 's' : '');

    if (projects.length === 0) {
        projectList.innerHTML = '<div class="loading" style="color:#666; padding: 40px 20px;"><i data-lucide="folder-open" class="icon"></i><br>No projects yet.<br><small>Click "New Project" to start!</small></div>';
        lucide.createIcons();
        return;
    }

    projectList.innerHTML = '';
    projects.forEach(function (p) {
        const div = document.createElement('div');
        div.className = 'project-item';
        if (currentId === p.id) div.classList.add('active');

        const updatedDate = getProjectDate(p);
        const codePreview = p.code ?
            p.code.substring(0, 50).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, ' ') +
            (p.code.length > 50 ? '...' : '') :
            '<span style="color: #666; font-style: italic;">(empty project)</span>';

        div.innerHTML = '<div class="project-name">' + escapeHtml(p.title || 'Untitled') + '</div>' +
            '<div class="project-date">' + escapeHtml(updatedDate) + '</div>' +
            '<div style="font-size: 11px; color: #888; margin: 4px 0; font-family: \'Courier New\', monospace; line-height: 1.3;">' +
            codePreview +
            '</div>' +
            '<div class="project-buttons">' +
            '<button class="load-btn" data-id="' + p.id + '" title="Open">' +
            '<i data-lucide="folder-open" class="icon"></i>' +
            '</button>' +
            '<button class="download-btn" data-id="' + p.id + '" title="Download">' +
            '<i data-lucide="download" class="icon"></i>' +
            '</button>' +
            '<button class="delete-btn" data-id="' + p.id + '" title="Delete" style="color:#ff6b6b;">' +
            '<i data-lucide="trash-2" class="icon"></i>' +
            '</button>' +
            '</div>';

        // Add click handler to load project when clicking anywhere on the item
        div.addEventListener('click', function (e) {
            if (!e.target.closest('button')) {
                loadProject(p.id);
            }
        });

        projectList.appendChild(div);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.load-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            loadProject(btn.dataset.id);
        });
    });

    document.querySelectorAll('.download-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            downloadProject(btn.dataset.id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteProject(btn.dataset.id);
        });
    });

    lucide.createIcons();
}

function updatePreview() {
    try {
        const code = editor.value;
        preview.srcdoc = code || '<!DOCTYPE html><html><body style="background: #f0f0f0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial;"><div style="color: #666; text-align: center;"><h1> Code Previewer</h1><p>Start typing HTML in the editor at the LEFT side.</p></div></body></html>';
        updateLineNumbers();
    } catch (error) {
        console.error('Preview update error:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== EVENT HANDLERS ====================
document.getElementById('newBtn').addEventListener('click', async function () {
    const title = prompt('Enter project name:');
    if (title && title.trim()) {
        await createProject(title.trim());
    }
});

document.getElementById('saveBtn').addEventListener('click', saveProject);

editor.addEventListener('input', function () {
    updatePreview();
    updateLineNumbers();
    if (currentId) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function () {
            saveProject();
        }, 2000);
    }
});

// Sync line numbers scroll with editor scroll
editor.addEventListener('scroll', function () {
    lineNumbers.scrollTop = editor.scrollTop;
});

document.getElementById('clearBtn').addEventListener('click', function () {
    if (editor.value.trim() && !confirm('Clear the editor? Unsaved changes will be lost.')) {
        return;
    }
    currentId = null;
    editor.value = '';
    currentTitle.textContent = 'Untitled Project';
    updatePreview();
    renderList();
});

// ==================== FILE UPLOAD ====================
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

uploadBtn.addEventListener('click', function () {
    fileInput.click();
});

fileInput.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
        // Warn if there's unsaved content
        if (editor.value.trim() && !confirm('Loading a file will replace current content. Continue?')) {
            fileInput.value = ''; // Reset file input
            return;
        }

        try {
            // Show loading status
            showStatus('Uploading file...');

            // Load the file content into the editor
            const fileContent = event.target.result;
            editor.value = fileContent;

            // Update title with filename (without extension)
            const filename = file.name.replace(/\.[^/.]+$/, '');
            const projectTitle = filename || 'Untitled Project';
            currentTitle.textContent = projectTitle;

            // Update preview immediately
            updatePreview();

            // Automatically save to database
            console.log('Auto-saving uploaded file to database...');

            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: projectTitle,
                    code: fileContent
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save uploaded file');
            }

            const newProject = await res.json();
            console.log('Uploaded file saved to database');

            // Set the current project ID
            currentId = newProject.id;

            // Reload projects list to show the new upload
            await loadProjects();

            // Show success message
            showStatus('File uploaded and saved: ' + file.name);

        } catch (error) {
            console.error('Upload and save error:', error);
            showStatus('File loaded but failed to save: ' + error.message, true);
            // File is still in editor even if save failed
            currentId = null;
        } finally {
            // Reset file input
            fileInput.value = '';
        }
    };

    reader.onerror = function () {
        showStatus('Failed to read file', true);
        fileInput.value = '';
    };

    reader.readAsText(file);
});

function loadProject(id) {
    loadProjectFromDB(id);
}

function downloadProject(id) {
    const p = projects.find(function (proj) { return proj.id === id; });
    if (!p) return;

    const code = getProjectContent(p);
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (p.title || 'project').replace(/[^a-z0-9]/gi, '_') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Project downloading: ' + p.title);
}

function deleteProject(id) {
    const p = projects.find(function (proj) { return proj.id === id; });
    if (!p) return;

    if (confirm('Are you sure to delete this project "' + (p.title || 'Untitled') + '"? This cannot be undone.')) {
        deleteProjectFromDB(id);
    }
}

// ==================== RESIZER ====================
const divider = document.getElementById('divider');
let isResizing = false;

divider.addEventListener('mousedown', function () {
    isResizing = true;
    document.body.style.userSelect = 'none';
});

document.addEventListener('mouseup', function () {
    isResizing = false;
    document.body.style.userSelect = '';
});

document.addEventListener('mousemove', function (e) {
    if (!isResizing) return;
    const container = document.getElementById('editorArea');
    const width = e.clientX - container.getBoundingClientRect().left;
    if (width > 220 && width < container.offsetWidth - 220) {
        document.getElementById('editorPanel').style.flex = '0 0 ' + width + 'px';
    }
});

// ==================== INIT ====================
async function init() {
    console.log('Initializing your dashboard...');

    // Check authentication
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        console.log('Not authenticated');
        return;
    }

    // Load projects
    await loadProjects();

    // Set up simple starter template if editor is empty
    if (!editor.value.trim()) {
        editor.value = '<!DOCTYPE html>\n' +
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
            '    h1 {\n' +
            '      color: #333;\n' +
            '    }\n' +
            '    .btn {\n' +
            '      background: #FFAC1C;\n' +
            '      color: white;\n' +
            '      border: none;\n' +
            '      padding: 10px 20px;\n' +
            '      border-radius: 5px;\n' +
            '      cursor: pointer;\n' +
            '    }\n' +
            '    .btn:hover {\n' +
            '      background: #eba52d;\n' +
            '    }\n' +
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

    // Initialize icons
    lucide.createIcons();
    console.log('Dashboard initialized');

    // Initialize line numbers
    updateLineNumbers();

    // Show welcome message
    setTimeout(function () {
        showStatus('Dashboard loaded successfully!');
    }, 500);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);