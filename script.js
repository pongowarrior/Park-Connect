const API_URL = "https://sheetdb.io/api/v1/gsn1yzn8shex6";

let currentUser = { name: '', team: '' };
let currentFilter = 'all';

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userTeam = document.getElementById('userTeam');
const displayName = document.getElementById('displayName');
const wall = document.getElementById('wall');
const postForm = document.getElementById('postForm');
const postInput = document.getElementById('postInput');
const postCategory = document.getElementById('postCategory');
const filterBtns = document.querySelectorAll('.filter-btn');

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

// Login
loginBtn.addEventListener('click', () => {
  const name = userName.value.trim();
  const team = userTeam.value;
  
  if (!name || !team) {
    alert('Please enter your name and select your team');
    return;
  }
  
  currentUser = { name, team };
  displayName.textContent = `${name} (${team})`;
  
  loginScreen.classList.add('hidden');
  mainApp.classList.add('visible');
  
  loadPosts();
});

// Logout
logoutBtn.addEventListener('click', () => {
  currentUser = { name: '', team: '' };
  userName.value = '';
  userTeam.value = '';
  loginScreen.classList.remove('hidden');
  mainApp.classList.remove('visible');
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
  
  const filtered = currentFilter === 'all' ?
    allPosts :
    allPosts.filter(p => p.category === currentFilter);
  
  if (filtered.length === 0) {
    wall.innerHTML = '<div class="empty-state"><h2>No posts yet</h2><p>Be the first to post!</p></div>';
    return;
  }
  
  filtered.reverse().forEach(p => {
    const note = document.createElement('div');
    note.classList.add('sticky');
    note.dataset.category = p.category || 'general';
    note.style.setProperty('--rand', Math.random());
    
    note.innerHTML = `
      <div class="sticky-content">
        <div class="sticky-category">${p.category || 'general'}</div>
        <div class="sticky-message">${escapeHtml(p.message)}</div>
      </div>
      <div class="sticky-footer">
        ${escapeHtml(p.name)} (${escapeHtml(p.team)})<br>
        ${formatDate(p.timestamp)}
      </div>
    `;
    
    wall.appendChild(note);
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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