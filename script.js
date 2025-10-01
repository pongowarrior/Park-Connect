const API_URL = "https://sheetdb.io/api/v1/gsn1yzn8shex6";
const ADMIN_PASSWORD = "Park01admin";
// 🔑 IMGBB API Key for image hosting
const IMGBB_API_KEY = '9998758e30b37b78e736c467b94f2c5b'; 

let currentUser = { name: '', team: '', isAdmin: false };
let currentFilter = 'all';
let bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '[]');
let lastPostCount = 0;
let notificationsEnabled = false;
let currentPhotoBase64 = null; // Holds the Base64 Data URI for local preview and ImgBB upload

// Main categories accessible to everyone
const MAIN_CATEGORIES = ['all', 'shifts', 'events', 'lost&found', 'general'];

// Department mapping - matches team name to category
const DEPARTMENT_MAP = {
  'F&B': 'f&b',
  'Food & Beverage': 'f&b',
  'Maintenance': 'maintenance',
  'Cleaning': 'cleaning',
  'Admin': 'administration',
  'Administration': 'administration',
  'Security': 'security',
  'Entertainment': 'entertainment',
  'Shop': 'shop',
  'Guest Services': 'general',
  'Other': 'general'
};

// Categories that support photos
const PHOTO_CATEGORIES = ['maintenance', 'lost&found'];

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
const viewDashboardBtn = document.getElementById('viewDashboardBtn');
const bannedCount = document.getElementById('bannedCount');

// Photo upload elements
const photoInput = document.getElementById('photoInput');
const photoLabel = document.getElementById('photoLabel');
const photoPreview = document.getElementById('photoPreview');
const previewImage = document.getElementById('previewImage');
const removePhoto = document.getElementById('removePhoto');

// Notification elements
const notificationBanner = document.getElementById('notificationBanner');
const notificationText = document.getElementById('notificationText');
const closeNotification = document.getElementById('closeNotification');

// Modals
const editModal = document.getElementById('editModal');
const editCategory = document.getElementById('editCategory');
const editMessage = document.getElementById('editMessage');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const bannedModal = document.getElementById('bannedModal');
const bannedList = document.getElementById('bannedList');
const closeBannedBtn = document.getElementById('closeBannedBtn');
const dashboardModal = document.getElementById('dashboardModal');
const closeDashboardBtn = document.getElementById('closeDashboardBtn');
const imageModal = document.getElementById('imageModal');
const fullImage = document.getElementById('fullImage');
const closeImageBtn = document.getElementById('closeImageBtn');

let currentEditingPost = null;
let allPosts = [];

/**
 * Uploads a Base64 image string to ImgBB and returns the public URL.
 * @param {string} base64DataUri The Base64 image string including the data URI prefix.
 * @returns {Promise<string|null>} The direct image URL from ImgBB, or null on failure.
 */
async function uploadImageToImgBB(base64DataUri) {
  const url = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
  
  if (!IMGBB_API_KEY || IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY') {
    console.error('ImgBB API Key is not set. Cannot upload image.');
    return null;
  }
  
  // ImgBB API expects the raw Base64 string without the "data:image/..." prefix
  const cleanBase64 = base64DataUri.split(',')[1]; 

  const formData = new FormData();
  formData.append('image', cleanBase64); // The clean Base64 string

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData // Let the browser set the Content-Type for FormData
    });

    const data = await response.json();

    if (data.success && data.data && data.data.url) {
      console.log('ImgBB upload successful:', data.data.url);
      return data.data.url; // The direct link to the image
    } else {
      console.error('ImgBB upload failed:', data.error?.message || 'Unknown API error', data);
      return null;
    }
  } catch (error) {
    console.error('Error during ImgBB API call:', error);
    return null;
  }
}


// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

// Request notification permission
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    notificationsEnabled = permission === 'granted';
  } else if (Notification.permission === 'granted') {
    notificationsEnabled = true;
  }
}

// Show notification
function showNotification(title, body) {
  if (!notificationsEnabled || !('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'park-connect-notification'
    });
  }
}

// Show in-app notification banner
function showBanner(message) {
  notificationText.textContent = message;
  notificationBanner.style.display = 'flex';
  setTimeout(() => {
    notificationBanner.style.display = 'none';
  }, 5000);
}

closeNotification.addEventListener('click', () => {
  notificationBanner.style.display = 'none';
});

// Photo upload handling
photoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Check file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('Image size must be less than 2MB');
    photoInput.value = '';
    return;
  }
  
  // Read and convert to base64
  const reader = new FileReader();
  reader.onload = (event) => {
    currentPhotoBase64 = event.target.result;
    previewImage.src = currentPhotoBase64;
    photoPreview.style.display = 'block';
    photoLabel.classList.add('has-photo');
  };
  reader.readAsDataURL(file);
});

removePhoto.addEventListener('click', () => {
  currentPhotoBase64 = null;
  photoInput.value = '';
  photoPreview.style.display = 'none';
  photoLabel.classList.remove('has-photo');
});

// Update photo button visibility based on category
postCategory.addEventListener('change', () => {
  const category = postCategory.value;
  if (PHOTO_CATEGORIES.includes(category)) {
    photoLabel.style.display = 'flex';
  } else {
    photoLabel.style.display = 'none';
    // Clear photo if category changed
    if (currentPhotoBase64) {
      removePhoto.click();
    }
  }
});

// Image viewer
function viewImage(imageData) {
  fullImage.src = imageData;
  imageModal.style.display = 'flex';
}

closeImageBtn.addEventListener('click', () => {
  imageModal.style.display = 'none';
});

imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) {
    imageModal.style.display = 'none';
  }
});

// Toggle between regular and admin login
showAdminBtn.addEventListener('click', () => {
  regularLogin.style.display = 'none';
  adminLogin.style.display = 'block';
});

showRegularBtn.addEventListener('click', () => {
  adminLogin.style.display = 'none';
  regularLogin.style.display = 'block';
});

// Function to get user's allowed categories
function getAllowedCategories(user) {
  if (user.isAdmin) {
    return null;
  }
  
  const userDept = DEPARTMENT_MAP[user.team];
  const allowed = [...MAIN_CATEGORIES];
  
  if (userDept && userDept !== 'general') {
    allowed.push(userDept);
  }
  
  return allowed;
}

// Function to hide/show filter buttons based on permissions
function updateFilterButtons() {
  const allowedCategories = getAllowedCategories(currentUser);
  
  if (allowedCategories === null) {
    filterBtns.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    return;
  }
  
  filterBtns.forEach(btn => {
    const category = btn.dataset.filter;
    if (allowedCategories.includes(category)) {
      btn.style.display = 'inline-block';
    } else {
      btn.style.display = 'none';
    }
  });
}

// Function to update category dropdowns based on permissions
function updateCategoryDropdowns() {
  const allowedCategories = getAllowedCategories(currentUser);
  
  if (allowedCategories === null) {
    Array.from(postCategory.options).forEach(opt => {
      opt.style.display = 'block';
    });
    Array.from(editCategory.options).forEach(opt => {
      opt.style.display = 'block';
    });
    return;
  }
  
  [postCategory, editCategory].forEach(select => {
    Array.from(select.options).forEach(opt => {
      if (opt.value === '') {
        opt.style.display = 'block';
        return;
      }
      
      if (allowedCategories.includes(opt.value)) {
        opt.style.display = 'block';
      } else {
        opt.style.display = 'none';
      }
    });
  });
}

// Regular Login
loginBtn.addEventListener('click', async () => {
  const name = userName.value.trim();
  const team = userTeam.value;
  
  if (!name || !team) {
    alert('Please enter your name and select your team');
    return;
  }
  
  if (bannedUsers.includes(name.toLowerCase())) {
    alert('You have been banned from posting. Contact an administrator.');
    return;
  }
  
  currentUser = { name, team, isAdmin: false };
  displayName.textContent = `${name} (${team})`;
  
  loginScreen.classList.add('hidden');
  mainApp.classList.add('visible');
  
  updateFilterButtons();
  updateCategoryDropdowns();
  
  await requestNotificationPermission();
  await loadPosts();
});

// Admin Login
adminLoginBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const password = adminPassword.value.trim();
  
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
  
  updateFilterButtons();
  updateCategoryDropdowns();
  updateBannedCount();
  
  await requestNotificationPermission();
  await loadPosts();
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
  lastPostCount = 0;
  
  filterBtns.forEach(btn => {
    btn.style.display = 'inline-block';
  });
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const allowedCategories = getAllowedCategories(currentUser);
    const category = btn.dataset.filter;
    
    if (allowedCategories !== null && !allowedCategories.includes(category)) {
      alert('You do not have access to this category');
      return;
    }
    
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderWall();
  });
});

// Load posts
async function loadPosts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error("Failed to fetch posts:", res.statusText);
      return;
    }
    const newPosts = await res.json();
    
    // Check for new posts and notify
    if (lastPostCount > 0 && newPosts.length > lastPostCount) {
      const newPostsCount = newPosts.length - lastPostCount;
      // Get the last post, assuming the API returns them in a certain order or we sort it later.
      // Better to check for a new timestamp than relying on array order for notification.
      // Since renderWall reverses, we'll use the pre-reversed array for notification simplicity.
      
      // Find the last known post time
      const lastKnownPostTime = allPosts.length > 0 ? new Date([...allPosts].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp) : new Date(0);
      
      const trulyNewPosts = newPosts.filter(p => new Date(p.timestamp) > lastKnownPostTime);
      
      if (trulyNewPosts.length > 0) {
        const newestPost = trulyNewPosts.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        showBanner(`${trulyNewPosts.length} new post${trulyNewPosts.length > 1 ? 's' : ''}!`);
        showNotification(
          'New post on Park Connect',
          `${newestPost.name}: ${newestPost.message.substring(0, 50)}...`
        );
      }
    }
    
    lastPostCount = newPosts.length;
    allPosts = newPosts;
    renderWall();
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// Render wall with filter AND permissions
function renderWall() {
  wall.innerHTML = "";
  
  const allowedCategories = getAllowedCategories(currentUser);
  
  let filtered = currentFilter === 'all' 
    ? allPosts 
    : allPosts.filter(p => p.category === currentFilter);
  
  if (allowedCategories !== null) {
    filtered = filtered.filter(p => {
      return allowedCategories.includes(p.category);
    });
  }
  
  if (filtered.length === 0) {
    wall.innerHTML = '<div class="empty-state"><h2>No posts yet</h2><p>Be the first to post!</p></div>';
    return;
  }
  
  // Sort by timestamp descending before reversing for rendering order (newest at bottom)
  // Reversing twice is unnecessary complexity; sort descending and iterate.
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  filtered.forEach((p, index) => {
    const note = document.createElement('div');
    note.classList.add('sticky');
    note.dataset.category = p.category || 'general';
    // Use the index for filtering context, although deleting relies on timestamp/row_id
    note.dataset.index = index; 
    note.style.setProperty('--rand', Math.random());
    
    let photoHtml = '';
    // p.photo now contains the URL from ImgBB
    if (p.photo && p.photo.startsWith('http')) { 
      photoHtml = `<img src="${escapeHtml(p.photo)}" alt="Post photo" class="sticky-photo" onclick="viewImage('${escapeHtml(p.photo)}')" />`;
    }
    
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
        ${photoHtml}
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

// Helper to get the post currently being viewed/edited based on filter/permissions
function getPostByIndex(index) {
  const allowedCategories = getAllowedCategories(currentUser);
  
  let filteredPosts = currentFilter === 'all' 
    ? [...allPosts] 
    : allPosts.filter(p => p.category === currentFilter);
  
  if (allowedCategories !== null) {
    filteredPosts = filteredPosts.filter(p => allowedCategories.includes(p.category));
  }
  
  // Apply the same descending sort used in renderWall
  filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return filteredPosts[index];
}

// Edit Post
window.editPost = function(index) {
  const post = getPostByIndex(index);
  if (!post) return;
  
  currentEditingPost = post;
  
  editCategory.value = post.category;
  editMessage.value = post.message;
  editModal.style.display = 'flex';
};

// Save Edit (replaces old post with new one - SheetDB workaround)
saveEditBtn.addEventListener('click', async () => {
  const newMessage = editMessage.value.trim();
  const newCategory = editCategory.value;
  
  if (!newMessage || !newCategory) {
    alert('Please fill in all fields');
    return;
  }
  
  // This logic is fragile but necessary for SheetDB without a true 'row_id'
  const oldTimestamp = encodeURIComponent(currentEditingPost.timestamp);
  
  try {
    // 1. Delete the old post
    const deleteRes = await fetch(`${API_URL}/timestamp/${oldTimestamp}`, {
      method: 'DELETE'
    });
    
    if (!deleteRes.ok) {
       console.error('Delete failed:', deleteRes.statusText);
       // Attempt to proceed, but warn the user
       // We don't block the post entirely as it's possible SheetDB already deleted it but didn't return 200/204
    }
    
    // 2. Add the new post
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          message: newMessage,
          category: newCategory,
          name: currentEditingPost.name,
          team: currentEditingPost.team,
          timestamp: new Date().toISOString(), // New timestamp to ensure uniqueness
          photo: currentEditingPost.photo || '' // Keep the original photo URL
        }]
      })
    });
    
    alert('Post updated successfully!');
    editModal.style.display = 'none';
    await loadPosts();
  } catch (err) {
    console.error('Error updating post:', err);
    alert('Failed to update post.');
  }
});

cancelEditBtn.addEventListener('click', () => {
  editModal.style.display = 'none';
  currentEditingPost = null;
});

// Delete Post
window.deletePost = async function(index) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  
  const post = getPostByIndex(index);
  if (!post) return;
  
  try {
    const res = await fetch(`${API_URL}/timestamp/${encodeURIComponent(post.timestamp)}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      alert('Post deleted successfully');
      await loadPosts();
    } else {
      alert('Failed to delete post.');
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

// Admin Dashboard
viewDashboardBtn.addEventListener('click', () => {
  renderDashboard();
  dashboardModal.style.display = 'flex';
});

closeDashboardBtn.addEventListener('click', () => {
  dashboardModal.style.display = 'none';
});

function renderDashboard() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Total posts
  document.getElementById('totalPosts').textContent = allPosts.length;
  
  // Posts today
  const postsToday = allPosts.filter(p => new Date(p.timestamp) >= todayStart).length;
  document.getElementById('postsToday').textContent = postsToday;
  
  // Active users (unique users in last 7 days)
  const recentPosts = allPosts.filter(p => new Date(p.timestamp) >= weekAgo);
  const uniqueUsers = new Set(recentPosts.map(p => p.name));
  document.getElementById('activeUsers').textContent = uniqueUsers.size;
  
  // Posts with photos (checking for a valid URL start)
  const withPhotos = allPosts.filter(p => p.photo && p.photo.length > 0 && p.photo.startsWith('http')).length;
  document.getElementById('withPhotos').textContent = withPhotos;
  
  // Posts by category
  const categoryCount = {};
  allPosts.forEach(p => {
    const cat = p.category || 'general';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  const categoryStatsHtml = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `
      <div class="category-stat-item">
        <span class="category-stat-name">${escapeHtml(cat)}</span>
        <span class="category-stat-count">${count}</span>
      </div>
    `).join('');
  document.getElementById('categoryStats').innerHTML = categoryStatsHtml;
  
  // Most active users (last 7 days)
  const userCount = {};
  recentPosts.forEach(p => {
    userCount[p.name] = (userCount[p.name] || 0) + 1;
  });
  
  const userStatsHtml = Object.entries(userCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `
      <div class="user-stat-item">
        <span class="user-stat-name">${escapeHtml(name)}</span>
        <span class="user-stat-badge">${count} posts</span>
      </div>
    `).join('');
  document.getElementById('userStats').innerHTML = userStatsHtml || '<div class="empty-banned">No activity in the last 7 days</div>';
}

// Submit post - MODIFIED FOR IMGBB UPLOAD
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = postInput.value.trim();
  const category = postCategory.value;
  
  if (!text || !category) {
    alert('Please select a category and write a message');
    return;
  }
  
  const allowedCategories = getAllowedCategories(currentUser);
  if (allowedCategories !== null && !allowedCategories.includes(category)) {
    alert('You do not have permission to post to this category');
    return;
  }
  
  const btn = postForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Posting...';
  
  let photoUrl = ''; // This will hold the ImgBB URL

  // 1. Handle Image Upload if base64 data exists and category supports photos
  if (currentPhotoBase64 && PHOTO_CATEGORIES.includes(category)) {
      console.log('Attempting to upload image to ImgBB...');
      photoUrl = await uploadImageToImgBB(currentPhotoBase64);

      if (!photoUrl) {
          alert('🚨 Failed to upload image. Post cancelled.');
          btn.disabled = false;
          btn.textContent = 'Post';
          return;
      }
  } else if (currentPhotoBase64 && !PHOTO_CATEGORIES.includes(category)) {
       console.warn(`Photo attached but category '${category}' does not support photos. Sending post without image.`);
       // Since the input should be hidden, this is a safety check. photoUrl remains ''
  }

  // 2. Post to SheetDB using the generated photoUrl
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
          timestamp: new Date().toISOString(),
          photo: photoUrl || '' // Send the ImgBB URL or an empty string
        }]
      })
    });
    
    if (!res.ok) console.error("Failed to post:", res.statusText);
    
    postInput.value = "";
    postCategory.value = "";
    
    // Clear photo
    if (currentPhotoBase64) {
      removePhoto.click();
    }
    
    await loadPosts();
  } catch (err) {
    console.error("Error posting:", err);
  }
  
  btn.disabled = false;
  btn.textContent = 'Post';
});

// Auto-refresh every 30 seconds
setInterval(loadPosts, 30000);

// Make viewImage global
window.viewImage = viewImage;