let allProjects = [];
const filterCategories = [
  { key: 'type', label: 'Type', className: 'type' },
  { key: 'tools_used', label: 'Outils', className: 'tool' },
  { key: 'themes', label: 'Thèmes', className: 'theme' }
];
const activeFilters = Object.fromEntries(
  filterCategories.map(({ key }) => [key, new Set()])
);

async function loadProjects() {
  const res = await fetch('projects.json');
  allProjects = await res.json();
  displayProjects(allProjects);
  displayTags();
}
function displayProjects(projects) {
  const container = document.getElementById('projects');
  container.innerHTML = '';

  // Sort projects by year (most recent first)
  projects.sort((a, b) => {
    const yearA = parseInt(a.date.slice(-4), 10);
    const yearB = parseInt(b.date.slice(-4), 10);
    return yearB - yearA;
  });

  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card';

    const imagePath = (src) => `assets/images/${src}`;
    const renderLinks = (links) => links.map(link => `
      <a href="${link.url}" target="_blank" class="project-link">
      Voir ${link.label} →
      </a>
    `).join('');

    const renderMetadata = () => filterCategories.map(({ key, label, className }) => {
      const values = key === 'type' ? [p.type] : p[key];
      return `
        <div class="project-meta-group">
          <span class="project-meta-label">${label}</span>
          <div class="project-tags">
            ${values.map(value => `<span class="project-tag project-tag--${className}">${value}</span>`).join('')}
          </div>
        </div>
      `;
    }).join('');

    const renderCarousel = (images) => `
      <div class="carousel">
        <div class="carousel-track">
          ${images.map(src => `<img src="${imagePath(src)}" alt="${p.title}" class="carousel-image">`).join('')}
        </div>
        <button class="carousel-control carousel-prev" aria-label="Prev">‹</button>
        <button class="carousel-control carousel-next" aria-label="Next">›</button>
        <div class="carousel-dots"></div>
      </div>
    `;

    const renderImage = (image) => `
      <img src="${imagePath(image)}" alt="${p.title}" class="project-image">
    `;

    card.innerHTML = `
      ${Array.isArray(p.image) && p.image.length > 0 ? renderCarousel(p.image) : renderImage(p.image || '')}
      <h2 class="project-heading">
        <span class="project-title">${p.title}</span>
        <span class="project-date">${p.date}</span>
      </h2>
      <p class="project-description">${p.description}</p>
      <div class="project-metadata">
        ${renderMetadata()}
      </div>
      ${p.links ? renderLinks(p.links) : ''}
    `;

    container.appendChild(card);

    if (Array.isArray(p.image) && p.image.length > 0) {
      initCarousel(card.querySelector('.carousel'), p.image);
    }
  });
}


function displayTags() {
  const tagContainer = document.getElementById('tags');
  tagContainer.innerHTML = '<span class="filter-label">Filtrer les projets</span>';

  filterCategories.forEach(({ key, label, className }) => {
    const values = [...new Set(allProjects.flatMap(project =>
      key === 'type' ? [project.type] : project[key]
    ))].sort((a, b) => a.localeCompare(b, 'fr'));
    const group = document.createElement('div');
    group.className = `filter-group filter-group--${className}`;
    group.setAttribute('aria-label', `Filtrer par ${label.toLowerCase()}`);

    const groupLabel = document.createElement('span');
    groupLabel.className = 'filter-group-label';
    groupLabel.textContent = label;
    group.appendChild(groupLabel);

    const options = document.createElement('div');
    options.className = 'filter-options';
    values.forEach(value => {
      const btn = document.createElement('button');
      btn.className = 'filter-button';
      btn.append(document.createTextNode(value));
      const count = allProjects.filter(project => {
        const projectValues = key === 'type' ? [project.type] : project[key];
        return projectValues.includes(value);
      }).length;
      const countLabel = document.createElement('span');
      countLabel.className = 'filter-count';
      countLabel.textContent = ` (${count})`;
      btn.appendChild(countLabel);
      btn.setAttribute('aria-pressed', String(activeFilters[key].has(value)));
      btn.classList.toggle('is-active', activeFilters[key].has(value));
      btn.addEventListener('click', () => toggleFilter(key, value));
      options.appendChild(btn);
    });
    group.appendChild(options);
    tagContainer.appendChild(group);
  });

  if (filterCategories.some(({ key }) => activeFilters[key].size)) {
    const clearButton = document.createElement('button');
    clearButton.className = 'filter-clear';
    clearButton.textContent = 'Effacer les filtres';
    clearButton.addEventListener('click', clearFilters);
    tagContainer.appendChild(clearButton);
  }
}

function toggleFilter(category, value) {
  const selected = activeFilters[category];
  if (selected.has(value)) {
    selected.delete(value);
  } else {
    selected.add(value);
  }
  updateFilteredProjects();
}

function clearFilters() {
  filterCategories.forEach(({ key }) => activeFilters[key].clear());
  updateFilteredProjects();
}

function updateFilteredProjects() {
  displayTags();
  const filtered = allProjects.filter(project =>
    filterCategories.every(({ key }) => {
      const selected = activeFilters[key];
      if (!selected.size) return true;
      const values = key === 'type' ? [project.type] : project[key];
      return values.some(value => selected.has(value));
    })
  );
  displayProjects(filtered);
}
function initCarousel(carousel, images) {
  const track = carousel.querySelector('.carousel-track');
  const prevButton = carousel.querySelector('.carousel-prev');
  const nextButton = carousel.querySelector('.carousel-next');
  const dotsContainer = carousel.querySelector('.carousel-dots');

  let currentIndex = 0;
  let autoSlideInterval;

  // Create dots for each image
  images.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = index === 0 ? 'carousel-dot is-active' : 'carousel-dot';
    dot.setAttribute('aria-label', `Image ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  const updateDots = () => {
    dotsContainer.childNodes.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === currentIndex);
    });
  };

  const goToSlide = (index) => {
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots();
  };

  const startAutoSlide = () => {
    autoSlideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      goToSlide(currentIndex);
    }, 5000);
  };

  const stopAutoSlide = () => {
    clearInterval(autoSlideInterval);
  };

  prevButton.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    goToSlide(currentIndex);
  });

  nextButton.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % images.length;
    goToSlide(currentIndex);
  });

  // Start auto-slide and handle mouse events
  startAutoSlide();
  carousel.addEventListener('mouseenter', stopAutoSlide);
  carousel.addEventListener('mouseleave', startAutoSlide);
}


loadProjects();
