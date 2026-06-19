(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    initMenu();
    initSearchForms();
    initCardSearch();
    initFilterButtons();
    initHeroCarousel();
    initPlayers();
  });

  function initMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var menu = document.querySelector(".mobile-nav");
    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", function () {
      var opened = menu.hasAttribute("hidden");
      if (opened) {
        menu.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
        toggle.textContent = "×";
      } else {
        menu.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      }
    });
  }

  function initSearchForms() {
    var forms = document.querySelectorAll(".js-search-form");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector('input[name="q"]');
        if (!input) {
          return;
        }

        var query = input.value.trim();
        if (!query) {
          event.preventDefault();
          window.location.href = "./all-movies.html";
        }
      });
    });
  }

  function initCardSearch() {
    var input = document.querySelector("#movie-search");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
    var empty = document.querySelector(".no-results");

    if (!input || cards.length === 0) {
      applyQueryFromUrl();
      return;
    }

    var urlParams = new URLSearchParams(window.location.search);
    var query = urlParams.get("q") || "";
    if (query) {
      input.value = query;
    }

    var filterCards = function () {
      var term = input.value.trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = [
          card.dataset.title || "",
          card.dataset.tags || "",
          card.dataset.category || "",
          card.dataset.region || "",
          card.textContent || ""
        ].join(" ").toLowerCase();

        var matched = !term || haystack.indexOf(term) !== -1;
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    };

    input.addEventListener("input", filterCards);
    filterCards();
  }

  function applyQueryFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");
    if (!query) {
      return;
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
    cards.forEach(function (card) {
      var haystack = [
        card.dataset.title || "",
        card.dataset.tags || "",
        card.dataset.category || "",
        card.dataset.region || "",
        card.textContent || ""
      ].join(" ").toLowerCase();

      card.hidden = haystack.indexOf(query.toLowerCase()) === -1;
    });
  }

  function initFilterButtons() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter-button"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));

    if (buttons.length === 0 || cards.length === 0) {
      return;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (item) {
          item.classList.remove("is-active");
        });

        button.classList.add("is-active");
        var value = button.dataset.filter || "all";

        cards.forEach(function (card) {
          if (value === "all") {
            card.hidden = false;
            return;
          }

          card.hidden = (card.dataset.category || "") !== value;
        });
      });
    });
  }

  function initHeroCarousel() {
    var hero = document.querySelector(".hero");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var index = 0;

    if (slides.length <= 1) {
      return;
    }

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
      });
    });

    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".player-box"));
    if (players.length === 0) {
      return;
    }

    players.forEach(function (box) {
      var video = box.querySelector("video");
      var start = box.querySelector(".player-start");
      var stream = box.dataset.stream;

      if (!video || !stream) {
        return;
      }

      bindStream(video, stream);

      if (start) {
        start.addEventListener("click", function () {
          box.classList.add("is-playing");
          var attempt = video.play();
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(function () {
              box.classList.remove("is-playing");
            });
          }
        });
      }

      video.addEventListener("play", function () {
        box.classList.add("is-playing");
      });

      video.addEventListener("pause", function () {
        if (video.currentTime === 0 || video.ended) {
          box.classList.remove("is-playing");
        }
      });
    });
  }

  function bindStream(video, stream) {
    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(stream);
      hls.attachMedia(video);
      video._hlsInstance = hls;
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
      return;
    }

    video.src = stream;
  }
})();
