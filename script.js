const form = document.getElementById('postForm');
const input = document.getElementById('postInput');
const wall = document.getElementById('wall');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    const post = document.createElement('p');
    post.textContent = text;
    wall.prepend(post); // newest at top
    input.value = '';
  }
});