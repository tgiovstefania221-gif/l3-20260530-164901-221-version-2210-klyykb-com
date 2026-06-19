(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let active = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));

    const setActive = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === active);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    };

    if (slides.length > 1) {
      prev?.addEventListener('click', () => setActive(active - 1));
      next?.addEventListener('click', () => setActive(active + 1));
      dots.forEach((dot, dotIndex) => {
        dot.addEventListener('click', () => setActive(dotIndex));
      });
      window.setInterval(() => setActive(active + 1), 5000);
    }
  }

  const filterInput = document.querySelector('[data-card-filter]');
  const cardList = document.querySelector('[data-card-list]');

  if (filterInput && cardList) {
    const cards = Array.from(cardList.querySelectorAll('[data-search]'));
    filterInput.addEventListener('input', () => {
      const keyword = filterInput.value.trim().toLowerCase();
      cards.forEach((card) => {
        const content = card.getAttribute('data-search').toLowerCase();
        card.hidden = keyword && !content.includes(keyword);
      });
    });
  }

  const video = document.getElementById('movieVideo');
  const playButton = document.getElementById('playButton');

  if (video && playButton) {
    let hlsReady = false;
    const stream = video.getAttribute('data-stream');

    const loadStream = () => {
      if (!stream || hlsReady || video.src) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        hlsReady = true;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(stream);
        hls.attachMedia(video);
        hlsReady = true;
        return;
      }

      video.src = stream;
      hlsReady = true;
    };

    const startVideo = () => {
      loadStream();
      playButton.classList.add('is-hidden');
      const played = video.play();
      if (played && typeof played.catch === 'function') {
        played.catch(() => {});
      }
    };

    playButton.addEventListener('click', startVideo);
    video.addEventListener('click', loadStream, { once: true });
    video.addEventListener('play', () => playButton.classList.add('is-hidden'));
  }

  const searchResults = document.querySelector('[data-search-results]');
  const searchInput = document.querySelector('[data-search-input]');
  const searchPanel = document.querySelector('[data-search-panel]');
  const typeSelect = document.querySelector('[data-search-type]');
  const yearSelect = document.querySelector('[data-search-year]');

  if (searchResults && window.SEARCH_INDEX) {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';

    if (searchInput) {
      searchInput.value = initialQuery;
    }

    const render = () => {
      const query = (searchInput?.value || '').trim().toLowerCase();
      const typeValue = typeSelect?.value || '';
      const yearValue = yearSelect?.value || '';
      const list = window.SEARCH_INDEX.filter((movie) => {
        const text = `${movie.title} ${movie.region} ${movie.type} ${movie.year} ${movie.genre} ${movie.tags}`.toLowerCase();
        const queryOk = !query || text.includes(query);
        const typeOk = !typeValue || movie.type.includes(typeValue) || movie.genre.includes(typeValue);
        const yearOk = !yearValue || movie.year === yearValue;
        return queryOk && typeOk && yearOk;
      }).slice(0, 120);

      searchResults.innerHTML = list.map((movie) => `
        <article class="movie-card" data-search="${escapeHtml(`${movie.title} ${movie.region} ${movie.type} ${movie.year} ${movie.genre}`)}">
          <a href="movies/${movie.file}" title="${escapeHtml(movie.title)}">
            <div class="poster-frame">
              <img src="./${movie.image}.jpg" alt="${escapeHtml(movie.title)}" loading="lazy">
              <span class="type-badge">${escapeHtml(movie.type)}</span>
              <span class="rating-badge">★ ${movie.rating}</span>
              <span class="play-hover">▶</span>
            </div>
            <div class="card-body">
              <h3>${escapeHtml(movie.title)}</h3>
              <p class="card-meta">${escapeHtml(movie.region)} · ${movie.year} · ${escapeHtml(movie.genre)}</p>
              <p class="card-desc">${escapeHtml(movie.desc)}</p>
            </div>
          </a>
        </article>
      `).join('');
    };

    const escapeHtml = (value) => String(value || '').replace(/[&<>"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[char]));

    searchPanel?.addEventListener('submit', (event) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      const value = searchInput?.value || '';
      if (value) {
        url.searchParams.set('q', value);
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url.toString());
      render();
    });

    searchInput?.addEventListener('input', render);
    typeSelect?.addEventListener('change', render);
    yearSelect?.addEventListener('change', render);
    render();
  }
})();
