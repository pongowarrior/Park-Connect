const form = document.getElementById('postForm');
const input = document.getElementById('postInput');
const wall = document.getElementById('wall');

const API_URL = "https://sheetdb.io/api/v1/gsn1yzn8shex6";

// Load posts
async function loadPosts() {
  wall.innerHTML = "";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) { console.error("Failed to fetch posts:", res.statusText); return; }
    const posts = await res.json();
    posts.reverse().forEach(p => {
      const el = document.createElement('p');
      el.innerHTML = `${p.message}<span class="timestamp">${new Date(p.timestamp).toLocaleTimeString()}</span>`;
      el.style.setProperty('--rand', Math.random());
      wall.appendChild(el);
    });
  } catch (err) { console.error("Error loading posts:", err); }
}

// Submit new post
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  
  const btn = form.querySelector('button');
  btn.disabled = true;
  
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ message: text, timestamp: new Date().toISOString() }] })
    });
  } catch (err) { console.error("Error posting:", err); }
  
  input.value = "";
  btn.disabled = false;
  loadPosts();
});

// Initial load
loadPosts();