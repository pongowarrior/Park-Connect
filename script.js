const form = document.getElementById('postForm');
const input = document.getElementById('postInput');
const wall = document.getElementById('wall');

// Use your SheetDB API endpoint
const API_URL = "https://sheetdb.io/api/v1/gsn1yzn8shex6";

// Fetch & display posts
async function loadPosts() {
  wall.innerHTML = "";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error("Failed to fetch posts:", res.status, res.statusText);
      return;
    }
    const posts = await res.json();
    // posts is an array of objects { message: "...", timestamp: "..." }
    posts.reverse().forEach(p => {
      const el = document.createElement('p');
      el.textContent = p.message;
      wall.appendChild(el);
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

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: [
          {
            message: text,
            timestamp: new Date().toISOString()
          }
        ]
      })
    });
    if (!res.ok) {
      console.error("Failed to post:", res.status, res.statusText);
    }
  } catch (err) {
    console.error("Error posting:", err);
  }
  
  input.value = "";
  loadPosts();
});

// Load posts when page loads
loadPosts();