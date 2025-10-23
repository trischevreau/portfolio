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
    
    // Préfixer le chemin de l'image
    const imagePath = (src) => `assets/images/${src}`;

    // If p.image is an array -> create carousel structure
    if (Array.isArray(p.image) && p.image.length > 0) {
      card.innerHTML = `
      <div class="carousel relative overflow-hidden rounded-xl mb-3" style="position:relative;">
        <div class="carousel-track" style="display:flex; width:100%; transition:transform 0.5s ease;">
        ${p.image.map(src => `<img src="${imagePath(src)}" alt="${p.title}" style="width:100%; flex-shrink:0; object-fit:cover;">`).join('')}
        </div>
        <button class="carousel-prev" aria-label="Prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.4);color:#fff;border:none;padding:6px 8px;border-radius:9999px;cursor:pointer;">‹</button>
        <button class="carousel-next" aria-label="Next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.4);color:#fff;border:none;padding:6px 8px;border-radius:9999px;cursor:pointer;">›</button>
        <div class="carousel-dots" style="position:absolute;right:8px;bottom:8px;display:flex;gap:6px;"></div>
      </div>
      <h2 class="text-xl flex justify-between items-center">
        <span class="font-semibold">${p.title}</span>
        <span class="text-sm italic font-normal">${p.date}</span>
      </h2>
      <p class="text-gray-600 text-sm mb-2">${p.description}</p>
      <div class="flex flex-wrap gap-1 mb-3">
        ${p.tags.map(t => `<span class="tag bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">${t}</span>`).join('')}
      </div>
      ${p.link ? `<a href="${p.link}" target="_blank" class="text-blue-600 hover:underline text-sm">Voir le projet →</a>` : ''}
      `;
    } else {
      // single image or missing
      const imgSrc = Array.isArray(p.image) ? (p.image[0] || '') : (p.image || '');
      card.innerHTML = `
      <img src="${imagePath(imgSrc)}" alt="${p.title}" class="rounded-xl mb-3">
      <h2 class="text-xl flex justify-between items-center">
        <span class="font-semibold">${p.title}</span>
        <span class="text-sm italic font-normal">${p.date}</span>
      </h2>
      <p class="text-gray-600 text-sm mb-2">${p.description}</p>
      <div class="flex flex-wrap gap-1 mb-3">
        ${p.tags.map(t => `<span class="tag bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">${t}</span>`).join('')}
      </div>
      ${p.link ? `<a href="${p.link}" target="_blank" class="text-blue-600 hover:underline text-sm">Voir le projet →</a>` : ''}
      `;
    }

    container.appendChild(card);

    // initialize carousel if necessary
    if (Array.isArray(p.image) && p.image.length > 0) {
      initCarousel(card.querySelector('.carousel'), p.image);
    }
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
    dot.className = 'dot';
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${index === 0 ? '#000' : '#ccc'};
      border: none;
      cursor: pointer;
    `;
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  const updateDots = () => {
    dotsContainer.childNodes.forEach((dot, index) => {
      dot.style.background = index === currentIndex ? '#000' : '#ccc';
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
