const form = document.getElementById('postForm');
const input = document.getElementById('postInput');
const wall = document.getElementById('wall');

const API_URL = "https://sheetdb.io/api/v1/gsn1yzn8shex6";

// Load posts
async function loadPosts() {
  wall.innerHTML = "";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error("Failed to fetch posts:", res.status, res.statusText);
      return;
    }
    const posts = await res.json();
    posts.reverse().forEach(p => {
      const el = document.createElement('p');
      el.innerHTML = `${p.message}<span class="timestamp">${new Date(p.timestamp).toLocaleTimeString()}</span>`;
      el.style.setProperty('--rand', Math.random());
      wall.appendChild(el);
      makeDraggable(el);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// Submit new post
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const btn = form.querySelector('button');
  btn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          { message: text, timestamp: new Date().toISOString() }
        ]
      })
    });
    if (!res.ok) console.error("Failed to post:", res.status, res.statusText);
  } catch (err) {
    console.error("Error posting:", err);
  }

  input.value = "";
  btn.disabled = false;
  loadPosts();
});

// Make posts draggable
function makeDraggable(el) {
  let isDragging = false, startX, startY, origX, origY;

  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = el.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
    el.style.position = 'absolute';
    el.style.zIndex = 1000;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = `${origX + dx}px`;
    el.style.top = `${origY + dy}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    el.style.zIndex = '';
  });
}

// Initial load
loadPosts();