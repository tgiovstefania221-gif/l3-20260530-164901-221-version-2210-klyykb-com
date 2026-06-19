
(function () {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function debounce(fn, wait = 120) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  function initSearch() {
    qsa('[data-search-input]').forEach((input) => {
      const scope = input.closest('[data-search-scope]') || document;
      const selector = input.getAttribute('data-search-input');
      const cards = qsa(selector, scope);
      const empty = qs('[data-search-empty]', scope);
      const run = debounce(() => {
        const q = input.value.trim().toLowerCase();
        let visible = 0;
        cards.forEach((card) => {
          const blob = (card.getAttribute('data-search') || '').toLowerCase();
          const show = !q || blob.includes(q);
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (empty) empty.style.display = visible ? 'none' : '';
      }, 100);
      input.addEventListener('input', run);
      run();
    });
    qsa('[data-chip-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const scope = chip.closest('[data-search-scope]') || document;
        const input = qs('[data-search-input]', scope);
        if (!input) return;
        const val = chip.getAttribute('data-chip-filter') || '';
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        qsa('[data-chip-filter]', scope).forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  }
  function initCarousel() {
    qsa('[data-carousel]').forEach((carousel) => {
      const slides = qsa('[data-slide]', carousel);
      const dots = qsa('[data-dot]', carousel);
      const prev = qs('[data-prev]', carousel);
      const next = qs('[data-next]', carousel);
      if (!slides.length) return;
      let index = 0;
      let timer = null;
      const show = (i) => {
        index = (i + slides.length) % slides.length;
        slides.forEach((slide, n) => slide.classList.toggle('active', n === index));
        dots.forEach((dot, n) => dot.classList.toggle('active', n === index));
      };
      const start = () => {
        stop();
        timer = setInterval(() => show(index + 1), 5200);
      };
      const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };
      if (prev) prev.addEventListener('click', () => { show(index - 1); start(); });
      if (next) next.addEventListener('click', () => { show(index + 1); start(); });
      dots.forEach((dot, n) => dot.addEventListener('click', () => { show(n); start(); }));
      carousel.addEventListener('mouseenter', stop);
      carousel.addEventListener('mouseleave', start);
      show(0);
      start();
    });
  }
  function initPlayer() {
    qsa('[data-player]').forEach((wrap) => {
      const video = qs('video', wrap);
      const overlay = qs('[data-player-overlay]', wrap);
      const source = wrap.getAttribute('data-player') || '';
      const title = wrap.getAttribute('data-player-title') || '';
      const caption = qs('[data-player-caption]', wrap);
      if (caption && title) caption.textContent = title;
      if (!video || !source) return;
      const start = () => {
        if (overlay) overlay.classList.add('hidden');
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
      };
      const nativeSetup = () => {
        video.src = source;
        video.load();
      };
      if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
        const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (_, data) {
          if (data && data.fatal) nativeSetup();
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        nativeSetup();
      } else {
        nativeSetup();
      }
      if (overlay) overlay.addEventListener('click', start);
      wrap.addEventListener('click', (e) => { if (e.target === video) start(); });
      video.addEventListener('play', () => { if (overlay) overlay.classList.add('hidden'); });
      video.addEventListener('pause', () => { if (!video.currentTime && overlay) overlay.classList.remove('hidden'); });
    });
  }
  function initReveal() {
    const items = qsa('[data-reveal]');
    if (!('IntersectionObserver' in window) || !items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    items.forEach((item) => io.observe(item));
  }
  document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initCarousel();
    initPlayer();
    initReveal();
  });
})();
