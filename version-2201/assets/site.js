(function() {
  var toggle = document.querySelector('[data-mobile-toggle]');
  var panel = document.querySelector('[data-mobile-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function() {
      panel.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showHero(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() {
        showHero(i);
      });
    });

    if (slides.length > 1) {
      setInterval(function() {
        showHero(current + 1);
      }, 5200);
    }
  }

  var filterInput = document.querySelector('[data-filter-input]');
  var sortSelect = document.querySelector('[data-sort-select]');
  var cardList = document.querySelector('[data-card-list]');

  function normalize(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, '');
  }

  function applyFilterAndSort() {
    if (!cardList) {
      return;
    }
    var cards = Array.prototype.slice.call(cardList.querySelectorAll('.movie-card'));
    var query = normalize(filterInput ? filterInput.value : '');
    cards.forEach(function(card) {
      var hit = normalize(card.innerText).indexOf(query) !== -1;
      card.style.display = hit ? '' : 'none';
    });
    if (sortSelect) {
      var value = sortSelect.value;
      if (value !== 'rank') {
        cards.sort(function(a, b) {
          var ay = parseInt((a.querySelector('.card-year') || {}).textContent || '0', 10) || 0;
          var by = parseInt((b.querySelector('.card-year') || {}).textContent || '0', 10) || 0;
          var at = (a.querySelector('.card-title') || {}).textContent || '';
          var bt = (b.querySelector('.card-title') || {}).textContent || '';
          if (value === 'year-asc') {
            return ay - by;
          }
          if (value === 'title-asc') {
            return at.localeCompare(bt, 'zh-Hans-CN');
          }
          return by - ay;
        });
        cards.forEach(function(card) {
          cardList.appendChild(card);
        });
      }
    }
  }

  if (filterInput) {
    filterInput.addEventListener('input', applyFilterAndSort);
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilterAndSort);
  }

  var searchInput = document.querySelector('[data-search-page-input]');
  var results = document.querySelector('[data-search-results]');

  function cardHtml(item) {
    return [
      '<article class="movie-card">',
      '<a class="card-image" href="./movies/' + item.file + '">',
      '<img class="card-cover" src="./' + item.cover + '" alt="' + item.title.replace(/"/g, '&quot;') + '" loading="lazy" onerror="this.style.display=\'none\'">',
      '<span class="card-year">' + item.year + '</span>',
      '</a>',
      '<div class="card-body">',
      '<a class="card-title" href="./movies/' + item.file + '">' + item.title + '</a>',
      '<p class="card-meta">' + item.region + ' · ' + item.type + ' · ' + item.genre + '</p>',
      '<p class="card-line">' + item.oneLine + '</p>',
      '<div class="tag-row">' + item.tags.slice(0, 3).map(function(tag) { return '<span>' + tag + '</span>'; }).join('') + '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function runSearch() {
    if (!results || !window.SEARCH_DATA) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    if (searchInput) {
      searchInput.value = query;
    }
    var q = normalize(query);
    var items = window.SEARCH_DATA;
    if (q) {
      items = items.filter(function(item) {
        return normalize([
          item.title,
          item.region,
          item.type,
          item.genre,
          item.year,
          item.tags.join(','),
          item.oneLine
        ].join(' ')).indexOf(q) !== -1;
      });
    } else {
      items = items.slice(0, 60);
    }
    items = items.slice(0, 120);
    if (!items.length) {
      results.innerHTML = '<div class="empty-state">没有找到匹配影片</div>';
      return;
    }
    results.innerHTML = items.map(cardHtml).join('');
  }

  runSearch();
})();
