(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setupMobileNavigation() {
    var button = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-main-nav]');

    if (!button || !nav) {
      return;
    }

    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupImageFallbacks() {
    var images = document.querySelectorAll('img[data-fallback-title]');

    function markMissing(image) {
      var wrapper = image.closest('.poster-wrap') || image.parentElement;

      image.classList.add('is-missing');

      if (wrapper) {
        wrapper.classList.add('image-missing');
        wrapper.setAttribute('data-title', image.getAttribute('data-fallback-title') || '');
      }
    }

    images.forEach(function (image) {
      image.addEventListener('error', function () {
        markMissing(image);
      });

      if (image.complete && image.naturalWidth === 0) {
        markMissing(image);
      }
    });
  }

  function setupHeroCarousel() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var index = 0;
    var timer = null;

    if (slides.length < 2) {
      return;
    }

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    show(0);
    start();
  }

  function setupCardFilters() {
    var filterRoot = document.querySelector('[data-filter-root]');

    if (!filterRoot) {
      return;
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
    var keyword = filterRoot.querySelector('[data-filter-keyword]');
    var year = filterRoot.querySelector('[data-filter-year]');
    var region = filterRoot.querySelector('[data-filter-region]');
    var genre = filterRoot.querySelector('[data-filter-genre]');
    var sort = filterRoot.querySelector('[data-filter-sort]');
    var count = document.querySelector('[data-result-count]');
    var empty = document.querySelector('[data-no-results]');

    function getText(card) {
      return [
        card.getAttribute('data-title'),
        card.getAttribute('data-year'),
        card.getAttribute('data-region'),
        card.getAttribute('data-genre'),
        card.textContent
      ].join(' ').toLowerCase();
    }

    function apply() {
      var query = (keyword && keyword.value ? keyword.value : '').trim().toLowerCase();
      var selectedYear = year && year.value ? year.value : '';
      var selectedRegion = region && region.value ? region.value : '';
      var selectedGenre = genre && genre.value ? genre.value : '';
      var visible = [];

      cards.forEach(function (card) {
        var text = getText(card);
        var match = true;

        if (query && text.indexOf(query) === -1) {
          match = false;
        }

        if (selectedYear && card.getAttribute('data-year') !== selectedYear) {
          match = false;
        }

        if (selectedRegion && card.getAttribute('data-region') !== selectedRegion) {
          match = false;
        }

        if (selectedGenre && card.getAttribute('data-genre').indexOf(selectedGenre) === -1) {
          match = false;
        }

        card.style.display = match ? '' : 'none';

        if (match) {
          visible.push(card);
        }
      });

      if (sort && sort.value) {
        var parent = cards[0] ? cards[0].parentElement : null;

        visible.sort(function (a, b) {
          if (sort.value === 'year-desc') {
            return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
          }

          if (sort.value === 'year-asc') {
            return Number(a.getAttribute('data-year')) - Number(b.getAttribute('data-year'));
          }

          return a.getAttribute('data-title').localeCompare(b.getAttribute('data-title'), 'zh-Hans-CN');
        });

        if (parent) {
          visible.forEach(function (card) {
            parent.appendChild(card);
          });
        }
      }

      if (count) {
        count.textContent = '当前显示 ' + visible.length + ' 部 / 共 ' + cards.length + ' 部';
      }

      if (empty) {
        empty.hidden = visible.length !== 0;
      }
    }

    [keyword, year, region, genre, sort].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }

  function setupSearchPage() {
    var root = document.querySelector('[data-search-page]');

    if (!root || !window.MOVIE_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var input = root.querySelector('[data-search-input]');
    var year = root.querySelector('[data-search-year]');
    var category = root.querySelector('[data-search-category]');
    var results = root.querySelector('[data-search-results]');
    var total = root.querySelector('[data-search-total]');

    if (input) {
      input.value = params.get('q') || '';
    }

    function render() {
      var query = (input && input.value ? input.value : '').trim().toLowerCase();
      var selectedYear = year && year.value ? year.value : '';
      var selectedCategory = category && category.value ? category.value : '';
      var matched = window.MOVIE_INDEX.filter(function (movie) {
        var text = [movie.title, movie.year, movie.region, movie.genre, movie.tags, movie.oneLine, movie.categoryName].join(' ').toLowerCase();

        if (query && text.indexOf(query) === -1) {
          return false;
        }

        if (selectedYear && movie.year !== selectedYear) {
          return false;
        }

        if (selectedCategory && movie.categorySlug !== selectedCategory) {
          return false;
        }

        return true;
      }).slice(0, 120);

      if (total) {
        total.textContent = '找到 ' + matched.length + ' 条结果';
      }

      if (!results) {
        return;
      }

      if (!matched.length) {
        results.innerHTML = '<div class="search-empty">没有找到匹配影片，换一个片名、年份或题材试试。</div>';
        return;
      }

      results.innerHTML = matched.map(function (movie) {
        return '' +
          '<article class="movie-card">' +
          '<a href="' + movie.url + '" class="movie-link">' +
          '<div class="poster-wrap">' +
          '<img src="' + movie.poster + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" data-fallback-title="' + escapeHtml(movie.title) + '">' +
          '<span class="play-mark">▶</span>' +
          '<span class="quality-mark">高清</span>' +
          '</div>' +
          '<div class="movie-card-body">' +
          '<div class="movie-meta-line"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.categoryName) + '</span></div>' +
          '<h3>' + escapeHtml(movie.title) + '</h3>' +
          '<p>' + escapeHtml(movie.oneLine) + '</p>' +
          '<div class="tag-row"><span>' + escapeHtml(movie.genre.split(/[，,、/]/)[0] || movie.categoryName) + '</span></div>' +
          '</div>' +
          '</a>' +
          '</article>';
      }).join('');

      setupImageFallbacks();
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    [input, year, category].forEach(function (control) {
      if (control) {
        control.addEventListener('input', render);
        control.addEventListener('change', render);
      }
    });

    render();
  }

  ready(function () {
    setupMobileNavigation();
    setupImageFallbacks();
    setupHeroCarousel();
    setupCardFilters();
    setupSearchPage();
  });
}());
