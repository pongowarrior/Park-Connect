const form = document.getElementById('postForm');
const input = document.getElementById('postInput');
const wall = document.getElementById('wall');

const API_URL = "https://sheetdb.io/api/v1/gsn1yzn8shex6";

// Load posts from SheetDB
async function loadPosts() {
  wall.innerHTML = "";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) { console.error("Failed to fetch posts:", res.statusText); return; }
    const posts = await res.json();
    posts.reverse().forEach(p => {
      // Sticky note container
      const postDiv = document.createElement('div');
      postDiv.classList.add('sticky');
      
      // Post text
      const msg = document.createElement('p');
      msg.textContent = p.message;
      postDiv.appendChild(msg);
      
      // Random rotation and offset
      postDiv.style.setProperty('--rand', Math.random());
      postDiv.style.setProperty('--rand2', Math.random());
      
      wall.appendChild(postDiv);
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
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          { message: text, timestamp: new Date().toISOString() }
        ]
      })
    });
    if (!res.ok) console.error("Failed to post:", res.statusText);
  } catch (err) { console.error("Error posting:", err); }
  
  input.value = "";
  btn.disabled = false;
  loadPosts();
});

// Initial load
loadPosts();