const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupMobileMenu() {
  const toggle = $("[data-menu-toggle]");
  const nav = $("[data-mobile-nav]");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });
}

function setupImageFallbacks() {
  $$('img[data-fallback-image]').forEach((image) => {
    image.addEventListener("error", () => {
      const holder = image.closest(".poster-wrap, .hero-bg, .ranking-thumb, .category-cover, .category-overview-cover");

      if (holder) {
        holder.classList.add("image-missing");
      }

      image.remove();
    }, { once: true });
  });
}

function setupHero() {
  const hero = $("[data-hero]");

  if (!hero) {
    return;
  }

  const slides = $$('[data-hero-slide]', hero);
  const dots = $$('[data-hero-dot]', hero);
  const prev = $('[data-hero-prev]', hero);
  const next = $('[data-hero-next]', hero);
  let current = 0;
  let timer = null;

  function render(index) {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === current);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(() => render(current + 1), 5200);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      render(Number(dot.dataset.heroDot || 0));
      start();
    });
  });

  if (prev) {
    prev.addEventListener("click", () => {
      render(current - 1);
      start();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      render(current + 1);
      start();
    });
  }

  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", start);
  render(0);
  start();
}

function setupLocalFilters() {
  $$('[data-list-page]').forEach((page) => {
    const input = $('[data-local-filter-input]', page);
    const sort = $('[data-local-sort]', page);
    const list = $('[data-local-list]', page);
    const chips = $$('[data-filter-chip]', page);

    if (!input || !list) {
      return;
    }

    const cards = $$('.movie-card', list).map((card, index) => ({
      card,
      index,
      title: card.dataset.title || "",
      year: card.dataset.year || "",
      region: card.dataset.region || "",
      genre: card.dataset.genre || "",
      rating: Number((card.querySelector('.movie-meta span')?.textContent || '').replace(/[^0-9.]/g, '')) || 0,
      text: card.textContent || ""
    }));

    let chipValue = "";

    function applyFilter() {
      const keyword = input.value.trim().toLowerCase();
      const sortValue = sort ? sort.value : "default";
      const sorted = cards.slice().sort((a, b) => {
        if (sortValue === "rating") {
          return b.rating - a.rating;
        }

        if (sortValue === "year") {
          return Number(b.year) - Number(a.year);
        }

        if (sortValue === "title") {
          return a.title.localeCompare(b.title, "zh-Hans-CN");
        }

        return a.index - b.index;
      });

      sorted.forEach((item) => {
        const haystack = `${item.title} ${item.year} ${item.region} ${item.genre} ${item.text}`.toLowerCase();
        const matchKeyword = !keyword || haystack.includes(keyword);
        const matchChip = !chipValue || haystack.includes(chipValue.toLowerCase());
        item.card.hidden = !(matchKeyword && matchChip);
        list.appendChild(item.card);
      });
    }

    input.addEventListener("input", applyFilter);

    if (sort) {
      sort.addEventListener("change", applyFilter);
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chipValue = chip.dataset.filterChip || "";
        chips.forEach((button) => button.classList.toggle("is-active", button === chip));
        applyFilter();
      });
    });
  });
}

function posterPath(movie) {
  return `./${movie.poster_index}.jpg`;
}

function movieCardTemplate(movie) {
  const tags = (movie.tags || movie.genre || "")
    .split(/[,，/、|;；\s]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((tag) => `<span>${escapeHTML(tag)}</span>`)
    .join("");

  return `
    <article class="movie-card" data-title="${escapeHTML(movie.title)}" data-year="${escapeHTML(movie.year)}" data-region="${escapeHTML(movie.region)}" data-genre="${escapeHTML(movie.genre)}">
      <a class="poster-wrap" href="movies/${escapeHTML(movie.file)}" data-title="${escapeHTML(movie.title)}">
        <img src="${posterPath(movie)}" alt="${escapeHTML(movie.title)}" loading="lazy" data-fallback-image>
        <span class="poster-badge">${escapeHTML(movie.type)}</span>
        <span class="play-chip">▶</span>
      </a>
      <div class="movie-card-body">
        <a class="movie-title" href="movies/${escapeHTML(movie.file)}">${escapeHTML(movie.title)}</a>
        <p class="movie-line">${escapeHTML(movie.one_line)}</p>
        <div class="movie-meta">
          <span>⭐ ${escapeHTML(movie.rating)}</span>
          <span>${escapeHTML(movie.year)}</span>
          <span>${escapeHTML(movie.region)}</span>
        </div>
        <div class="tag-row">${tags}</div>
      </div>
    </article>
  `;
}

function setupSearchPage() {
  const input = $('#searchInput');
  const category = $('#categoryFilter');
  const sort = $('#sortFilter');
  const results = $('#searchResults');
  const summary = $('#resultSummary');

  if (!input || !results || !Array.isArray(window.MOVIES)) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';

  input.value = initialQuery;

  function render() {
    const keyword = input.value.trim().toLowerCase();
    const categoryValue = category ? category.value : '';
    const sortValue = sort ? sort.value : 'relevance';

    let list = window.MOVIES.filter((movie) => {
      const haystack = `${movie.title} ${movie.region} ${movie.type} ${movie.year} ${movie.genre} ${movie.tags} ${movie.one_line}`.toLowerCase();
      const matchKeyword = !keyword || haystack.includes(keyword);
      const matchCategory = !categoryValue || movie.category_slug === categoryValue;
      return matchKeyword && matchCategory;
    });

    list = list.sort((a, b) => {
      if (sortValue === 'rating') {
        return Number(b.rating) - Number(a.rating);
      }

      if (sortValue === 'year') {
        return Number(b.year) - Number(a.year);
      }

      if (sortValue === 'views') {
        return Number(b.views) - Number(a.views);
      }

      return Number(a.id) - Number(b.id);
    });

    const limited = list.slice(0, 120);
    results.innerHTML = limited.map(movieCardTemplate).join('');

    if (summary) {
      summary.textContent = `共找到 ${list.length} 条结果，当前显示 ${limited.length} 条。`;
    }

    setupImageFallbacks();
  }

  input.addEventListener('input', render);

  if (category) {
    category.addEventListener('change', render);
  }

  if (sort) {
    sort.addEventListener('change', render);
  }

  $$('[data-search-keyword]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.searchKeyword || '';
      render();
    });
  });

  render();
}

async function setupPlayerInstance(player) {
  const video = $('video', player);
  const cover = $('[data-player-play]', player);
  const status = $('[data-player-status]', player);
  const hlsSource = player.dataset.hls || '';
  const mp4Source = player.dataset.mp4 || '';
  let initialized = false;
  let hls = null;

  if (!video || !cover) {
    return;
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  async function initialize() {
    if (initialized) {
      return;
    }

    initialized = true;
    setStatus('正在初始化播放器...');

    if (hlsSource && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSource;
      setStatus('播放源已加载');
      return;
    }

    if (hlsSource) {
      try {
        const module = await import('./player-dru42stk.js');
        const Hls = module.H;

        if (Hls && Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hls.loadSource(hlsSource);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setStatus('播放源已加载');
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              setStatus('网络错误，正在尝试重新加载');
              hls.startLoad();
              return;
            }

            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              setStatus('媒体错误，正在恢复播放');
              hls.recoverMediaError();
              return;
            }

            setStatus('播放异常，正在切换备用源');
            hls.destroy();
            hls = null;
            video.src = mp4Source || hlsSource;
          });
          return;
        }
      } catch (error) {
        setStatus('正在切换备用播放源');
      }
    }

    if (mp4Source) {
      video.src = mp4Source;
      setStatus('备用播放源已启用');
    } else if (hlsSource) {
      video.src = hlsSource;
      setStatus('播放源已加载');
    } else {
      setStatus('未检测到播放源');
    }
  }

  cover.addEventListener('click', async () => {
    await initialize();
    cover.classList.add('is-hidden');

    try {
      await video.play();
      setStatus('正在播放');
    } catch (error) {
      setStatus('请再次点击视频区域开始播放');
    }
  });

  video.addEventListener('play', () => setStatus('正在播放'));
  video.addEventListener('pause', () => setStatus('已暂停'));
  video.addEventListener('ended', () => setStatus('播放结束'));

  window.addEventListener('pagehide', () => {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
}

function setupPlayers() {
  $$('[data-player]').forEach(setupPlayerInstance);
}

setupMobileMenu();
setupImageFallbacks();
setupHero();
setupLocalFilters();
setupSearchPage();
setupPlayers();
