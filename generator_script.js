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

    const renderTags = (tags) => tags.map(t => `
      <span class="project-tag">${t}</span>
    `).join('');

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
      <div class="project-tags">
        ${renderTags(p.tags)}
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
  const allTags = [...new Set(allProjects.flatMap(p => p.tags))];
  const tagContainer = document.getElementById('tags');
  tagContainer.innerHTML = '<span class="filter-label">Filtrer par tags</span>';

  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-button';
    btn.textContent = tag;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => toggleTag(tag, btn));
    tagContainer.appendChild(btn);
  });
}

function toggleTag(tag, btn) {
  if (activeTags.has(tag)) {
    activeTags.delete(tag);
    btn.classList.remove('is-active');
    btn.setAttribute('aria-pressed', 'false');
  } else {
    activeTags.add(tag);
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');
  }

  const filtered = activeTags.size
    ? allProjects.filter(p => p.tags.some(t => activeTags.has(t)))
    : allProjects;

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
