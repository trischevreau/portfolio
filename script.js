let allProjects = [];
let activeTags = new Set();

async function loadProjects() {
  const res = await fetch('projects.json');
  allProjects = await res.json();
  displayProjects(allProjects);
  displayTags();
}

function displayProjects(projects) {
  const container = document.getElementById('projects');
  container.innerHTML = '';

  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow p-4 hover:shadow-lg transition';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}" class="rounded-xl mb-3">
      <h2 class="text-xl font-semibold">${p.title}</h2>
      <p class="text-gray-600 text-sm mb-2">${p.description}</p>
      <div class="flex flex-wrap gap-1 mb-3">
        ${p.tags.map(t => `<span class="tag bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">${t}</span>`).join('')}
      </div>
      <a href="${p.link}" target="_blank" class="text-blue-600 hover:underline text-sm">Voir le projet →</a>
    `;
    container.appendChild(card);
  });
}

function displayTags() {
  const allTags = [...new Set(allProjects.flatMap(p => p.tags))];
  const tagContainer = document.getElementById('tags');
  tagContainer.innerHTML = '';

  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'px-3 py-1 rounded-full border text-sm hover:bg-blue-100';
    btn.textContent = tag;
    btn.addEventListener('click', () => toggleTag(tag, btn));
    tagContainer.appendChild(btn);
  });
}

function toggleTag(tag, btn) {
  if (activeTags.has(tag)) {
    activeTags.delete(tag);
    btn.classList.remove('bg-blue-600', 'text-white');
  } else {
    activeTags.add(tag);
    btn.classList.add('bg-blue-600', 'text-white');
  }

  const filtered = activeTags.size
    ? allProjects.filter(p => p.tags.some(t => activeTags.has(t)))
    : allProjects;

  displayProjects(filtered);
}

loadProjects();
