(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupGlobalSearch() {
    document.querySelectorAll("[data-global-search]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        if (!value) {
          return;
        }
        event.preventDefault();
        var target = form.getAttribute("action") || "search.html";
        window.location.href = target + "?q=" + encodeURIComponent(value);
      });
    });
  }

  function setupHero() {
    var carousel = document.querySelector("[data-hero]");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      start();
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function setupCategoryFilter() {
    var input = document.querySelector("[data-category-search]");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card[data-search]"));
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-kind-filter]"));
    if (!input && !chips.length) {
      return;
    }
    var currentKind = "all";

    function apply() {
      var keyword = normalize(input ? input.value : "");
      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-search"));
        var kind = card.getAttribute("data-kind") || "";
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchKind = currentKind === "all" || kind.indexOf(currentKind) !== -1 || haystack.indexOf(normalize(currentKind)) !== -1;
        card.style.display = matchKeyword && matchKind ? "" : "none";
      });
    }

    if (input) {
      input.addEventListener("input", apply);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        currentKind = chip.getAttribute("data-kind-filter") || "all";
        chips.forEach(function (item) {
          item.classList.toggle("is-active", item === chip);
        });
        apply();
      });
    });
  }

  function setupSearchPage() {
    var mount = document.querySelector("[data-search-results]");
    var input = document.querySelector("[data-search-input]");
    var empty = document.querySelector("[data-no-result]");
    if (!mount || !input || typeof SITE_MOVIES === "undefined") {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function render() {
      var keyword = normalize(input.value);
      var list = SITE_MOVIES.filter(function (movie) {
        var text = normalize(movie.title + movie.region + movie.type + movie.year + movie.genre + movie.tags + movie.oneLine);
        return !keyword || text.indexOf(keyword) !== -1;
      }).slice(0, 96);

      mount.innerHTML = list.map(function (movie) {
        return [
          '<article class="movie-card">',
          '  <a href="' + movie.url + '" aria-label="' + escapeHtml(movie.title) + '">',
          '    <div class="poster-frame">',
          '      <img src="' + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
          '      <span class="poster-badge">' + escapeHtml(movie.type) + '</span>',
          '      <span class="poster-year">' + escapeHtml(movie.year) + '</span>',
          '      <span class="play-dot">▶</span>',
          '    </div>',
          '    <div class="movie-card-body">',
          '      <h3>' + escapeHtml(movie.title) + '</h3>',
          '      <p>' + escapeHtml(movie.oneLine) + '</p>',
          '      <div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.genre) + '</span></div>',
          '    </div>',
          '  </a>',
          '</article>'
        ].join("\n");
      }).join("\n");

      if (empty) {
        empty.style.display = list.length ? "none" : "block";
      }
    }

    input.addEventListener("input", render);
    render();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[char];
    });
  }

  window.initVideoPlayer = function (playlistUrl) {
    var player = document.querySelector("[data-player]");
    if (!player) {
      return;
    }
    var video = player.querySelector("video");
    var overlay = player.querySelector(".video-overlay");
    var button = player.querySelector(".big-play");
    var loaded = false;
    var hls = null;

    function load() {
      if (loaded || !video) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playlistUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(playlistUrl);
        hls.attachMedia(video);
      } else {
        video.src = playlistUrl;
      }
    }

    function start(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      load();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener("click", start);
    }
    if (overlay) {
      overlay.addEventListener("click", start);
    }
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
    video.addEventListener("ended", function () {
      if (overlay) {
        overlay.classList.remove("is-hidden");
      }
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupGlobalSearch();
    setupHero();
    setupCategoryFilter();
    setupSearchPage();
  });
})();
