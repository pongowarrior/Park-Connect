const API_URL = "https://sheetdb.io/api/v1/gsn1yzn8shex6";
const ADMIN_PASSWORD = "Park01admin";

let currentUser = { name: '', team: '', isAdmin: false };
let currentFilter = 'all';
let bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '[]');

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const regularLogin = document.getElementById('regularLogin');
const adminLogin = document.getElementById('adminLogin');
const showAdminBtn = document.getElementById('showAdminBtn');
const showRegularBtn = document.getElementById('showRegularBtn');
const loginBtn = document.getElementById('loginBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userTeam = document.getElementById('userTeam');
const adminPassword = document.getElementById('adminPassword');
const displayName = document.getElementById('displayName');
const wall = document.getElementById('wall');
const postForm = document.getElementById('postForm');
const postInput = document.getElementById('postInput');
const postCategory = document.getElementById('postCategory');
const filterBtns = document.querySelectorAll('.filter-btn');
const adminPanel = document.getElementById('adminPanel');
const viewBannedBtn = document.getElementById('viewBannedBtn');
const bannedCount = document.getElementById('bannedCount');

// Modals
const editModal = document.getElementById('editModal');
const editCategory = document.getElementById('editCategory');
const editMessage = document.getElementById('editMessage');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const bannedModal = document.getElementById('bannedModal');
const bannedList = document.getElementById('bannedList');
const closeBannedBtn = document.getElementById('closeBannedBtn');

let currentEditingPost = null;

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

// Toggle between regular and admin login
showAdminBtn.addEventListener('click', () => {
  regularLogin.style.display = 'none';
  adminLogin.style.display = 'block';
});

showRegularBtn.addEventListener('click', () => {
  adminLogin.style.display = 'none';
  regularLogin.style.display = 'block';
});

// Regular Login
loginBtn.addEventListener('click', () => {
  const name = userName.value.trim();
  const team = userTeam.value;
  
  if (!name || !team) {
    alert('Please enter your name and select your team');
    return;
  }
  
  // Check if user is banned
  if (bannedUsers.includes(name.toLowerCase())) {
    alert('You have been banned from posting. Contact an administrator.');
    return;
  }
  
  currentUser = { name, team, isAdmin: false };
  displayName.textContent = `${name} (${team})`;
  
  loginScreen.classList.add('hidden');
  mainApp.classList.add('visible');
  
  loadPosts();
});

// Admin Login
adminLoginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  
  const password = adminPassword.value.trim();
  
  console.log('Admin login attempt');
  console.log('Password entered:', password);
  console.log('Expected:', ADMIN_PASSWORD);
  
  if (password !== ADMIN_PASSWORD) {
    alert('Incorrect admin password');
    adminPassword.value = '';
    return;
  }
  
  currentUser = { name: 'Admin', team: 'Administration', isAdmin: true };
  displayName.innerHTML = 'Admin <span class="admin-badge">ADMIN</span>';
  
  loginScreen.classList.add('hidden');
  mainApp.classList.add('visible');
  adminPanel.style.display = 'block';
  updateBannedCount();
  
  loadPosts();
});

// Logout
logoutBtn.addEventListener('click', () => {
  currentUser = { name: '', team: '', isAdmin: false };
  userName.value = '';
  userTeam.value = '';
  adminPassword.value = '';
  loginScreen.classList.remove('hidden');
  mainApp.classList.remove('visible');
  adminPanel.style.display = 'none';
  regularLogin.style.display = 'block';
  adminLogin.style.display = 'none';
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderWall();
  });
});

let allPosts = [];

// Load posts
async function loadPosts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error("Failed to fetch posts:", res.statusText);
      return;
    }
    allPosts = await res.json();
    renderWall();
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// Render wall with filter
function renderWall() {
  wall.innerHTML = "";
  
  const filtered = currentFilter === 'all' 
    ? allPosts 
    : allPosts.filter(p => p.category === currentFilter);
  
  if (filtered.length === 0) {
    wall.innerHTML = '<div class="empty-state"><h2>No posts yet</h2><p>Be the first to post!</p></div>';
    return;
  }
  
  filtered.reverse().forEach((p, index) => {
    const note = document.createElement('div');
    note.classList.add('sticky');
    note.dataset.category = p.category || 'general';
    note.dataset.index = index;
    note.style.setProperty('--rand', Math.random());
    
    let adminControls = '';
    if (currentUser.isAdmin) {
      adminControls = `
        <div class="post-admin-controls">
          <button class="btn-edit" onclick="editPost(${index})">Edit</button>
          <button class="btn-delete" onclick="deletePost(${index})">Delete</button>
          <button class="btn-ban" onclick="banUser('${escapeHtml(p.name)}')">Ban User</button>
        </div>
      `;
    }
    
    note.innerHTML = `
      <div class="sticky-content">
        <div class="sticky-category">${escapeHtml(p.category || 'general')}</div>
        <div class="sticky-message">${escapeHtml(p.message)}</div>
      </div>
      <div class="sticky-footer">
        ${escapeHtml(p.name)} (${escapeHtml(p.team)})<br>
        ${formatDate(p.timestamp)}
      </div>
      ${adminControls}
    `;
    
    wall.appendChild(note);
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Edit Post
window.editPost = function(index) {
  const reversedPosts = [...allPosts].reverse();
  const filteredPosts = currentFilter === 'all' 
    ? reversedPosts 
    : reversedPosts.filter(p => p.category === currentFilter);
  
  const post = filteredPosts[index];
  currentEditingPost = post;
  
  editCategory.value = post.category;
  editMessage.value = post.message;
  editModal.style.display = 'flex';
};

saveEditBtn.addEventListener('click', async () => {
  const newMessage = editMessage.value.trim();
  const newCategory = editCategory.value;
  
  if (!newMessage || !newCategory) {
    alert('Please fill in all fields');
    return;
  }
  
  try {
    // Delete old post
    await fetch(`${API_URL}/timestamp/${encodeURIComponent(currentEditingPost.timestamp)}`, {
      method: 'DELETE'
    });
    
    // Add updated post
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          message: newMessage,
          category: newCategory,
          name: currentEditingPost.name,
          team: currentEditingPost.team,
          timestamp: new Date().toISOString()
        }]
      })
    });
    
    alert('Post updated successfully!');
    editModal.style.display = 'none';
    await loadPosts();
  } catch (err) {
    console.error('Error updating post:', err);
    alert('Failed to update post. Make sure SheetDB allows DELETE operations.');
  }
});

cancelEditBtn.addEventListener('click', () => {
  editModal.style.display = 'none';
  currentEditingPost = null;
});

// Delete Post
window.deletePost = async function(index) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  
  const reversedPosts = [...allPosts].reverse();
  const filteredPosts = currentFilter === 'all' 
    ? reversedPosts 
    : reversedPosts.filter(p => p.category === currentFilter);
  
  const post = filteredPosts[index];
  
  try {
    const res = await fetch(`${API_URL}/timestamp/${encodeURIComponent(post.timestamp)}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      alert('Post deleted successfully');
      await loadPosts();
    } else {
      alert('Failed to delete post. Make sure SheetDB allows DELETE operations.');
    }
  } catch (err) {
    console.error('Error deleting post:', err);
    alert('Error deleting post');
  }
};

// Ban User
window.banUser = function(username) {
  if (!confirm(`Ban user "${username}"? They won't be able to post anymore.`)) return;
  
  const lowerName = username.toLowerCase();
  if (!bannedUsers.includes(lowerName)) {
    bannedUsers.push(lowerName);
    localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
    alert(`${username} has been banned`);
    updateBannedCount();
  }
};

// View Banned Users
viewBannedBtn.addEventListener('click', () => {
  renderBannedList();
  bannedModal.style.display = 'flex';
});

closeBannedBtn.addEventListener('click', () => {
  bannedModal.style.display = 'none';
});

function renderBannedList() {
  if (bannedUsers.length === 0) {
    bannedList.innerHTML = '<div class="empty-banned">No banned users</div>';
    return;
  }
  
  bannedList.innerHTML = bannedUsers.map(user => `
    <div class="banned-user-item">
      <strong>${escapeHtml(user)}</strong>
      <button onclick="unbanUser('${escapeHtml(user)}')">Unban</button>
    </div>
  `).join('');
}

window.unbanUser = function(username) {
  bannedUsers = bannedUsers.filter(u => u !== username);
  localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
  renderBannedList();
  updateBannedCount();
  alert(`${username} has been unbanned`);
};

function updateBannedCount() {
  bannedCount.textContent = bannedUsers.length;
}

// Submit post
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = postInput.value.trim();
  const category = postCategory.value;
  
  if (!text || !category) {
    alert('Please select a category and write a message');
    return;
  }
  
  const btn = postForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Posting...';
  
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          message: text,
          category: category,
          name: currentUser.name,
          team: currentUser.team,
          timestamp: new Date().toISOString()
        }]
      })
    });
    
    if (!res.ok) console.error("Failed to post:", res.statusText);
    
    postInput.value = "";
    postCategory.value = "";
    await loadPosts();
  } catch (err) {
    console.error("Error posting:", err);
  }
  
  btn.disabled = false;
  btn.textContent = 'Post';
});

// Auto-refresh every 30 seconds
setInterval(loadPosts, 30000);