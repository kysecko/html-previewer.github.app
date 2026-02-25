// ==== LUCIDE ICONS ====
const icons = {
  "file-code": `<svg ...>...</svg>`,
  "sun": `<svg ...>...</svg>`,
  "eye": `<svg ...>...</svg>`,
  "columns": `<svg ...>...</svg>`,
  "file-text": `<svg ...>...</svg>`,
  "at-sign": `<svg ...>...</svg>`,
  "lock-keyhole": `<svg ...>...</svg>`,
  "user-round": `<svg ...>...</svg>`,
  "check-check": `<svg ...>...</svg>`
};

// Helper
function createElement(svgString){
  const template = document.createElement('template');
  template.innerHTML = svgString.trim();
  return template.content.firstChild;
}
function replaceLucideIcons(){
  document.querySelectorAll('i[data-lucide]').forEach(el => {
    const name = el.getAttribute('data-lucide');
    if(icons[name]){
      el.replaceWith(createElement(icons[name]));
    }
  });
}
document.addEventListener('DOMContentLoaded', replaceLucideIcons);

// ==== DASHBOARD LOGIC ====
async function loadDashboard() {
  try {
    const res = await fetch('/auth/verify', { credentials: 'include' });
    const data = await res.json();

    if(!data.success || data.role !== 'admin'){
      window.location.href = '/login.html';
      return;
    }

    document.getElementById('email').textContent = data.email;
    document.getElementById('role').textContent = data.role;
    document.getElementById('userId').textContent = data.id;
    document.getElementById('sidebar-email').textContent = data.email;
    document.getElementById('sidebar-role').textContent = data.role;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard-stats').style.display = 'block';
    document.getElementById('dashboard-info').style.display = 'block';

    await loadUsersList();
  } catch(err){
    console.error(err);
    window.location.href = '/login.html';
  }
}

async function loadUsersList(){
  try{
    const res = await fetch('/api/users', { credentials: 'include' });
    const users = await res.json();
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    if(!users.length) tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
    users.forEach(u=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
        <td>${u.active ? 'Active' : 'Inactive'}</td>
        <td><button onclick="alert('Edit ${u.id}')">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById('users-section').style.display = 'block';
  } catch(err){
    console.error(err);
  }
}

// Logout
document.getElementById('logout').addEventListener('click', async ()=>{
  try{
    await fetch('/logout',{method:'POST',credentials:'include'});
  }catch(err){ console.error(err); }
  window.location.href = '/login.html';
});

loadDashboard();
