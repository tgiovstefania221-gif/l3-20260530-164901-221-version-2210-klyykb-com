(function () {
    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function initNavigation() {
        var toggle = document.querySelector(".nav-toggle");
        var nav = document.querySelector(".site-nav");

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener("click", function () {
            var open = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");

        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function setActive(nextIndex) {
            if (!slides.length) {
                return;
            }

            index = (nextIndex + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }

            timer = window.setInterval(function () {
                setActive(index + 1);
            }, 5600);
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                setActive(dotIndex);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                setActive(index - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                setActive(index + 1);
                restart();
            });
        }

        hero.addEventListener("mouseenter", function () {
            if (timer) {
                window.clearInterval(timer);
            }
        });

        hero.addEventListener("mouseleave", restart);
        setActive(0);
        restart();
    }

    function initFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

        panels.forEach(function (panel) {
            var scope = panel.closest("section") || document;
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-filter-item]"));
            var textInput = panel.querySelector("[data-filter-text]");
            var typeSelect = panel.querySelector("[data-filter-type]");
            var yearSelect = panel.querySelector("[data-filter-year]");
            var categorySelect = panel.querySelector("[data-filter-category]");
            var empty = scope.querySelector("[data-empty-state]");
            var params = new URLSearchParams(window.location.search);
            var query = params.get("q");

            if (query && textInput) {
                textInput.value = query;
            }

            function matches(card) {
                var textNeedle = normalize(textInput ? textInput.value : "");
                var typeNeedle = normalize(typeSelect ? typeSelect.value : "");
                var yearNeedle = normalize(yearSelect ? yearSelect.value : "");
                var categoryNeedle = normalize(categorySelect ? categorySelect.value : "");
                var haystack = normalize([
                    card.dataset.title,
                    card.dataset.region,
                    card.dataset.type,
                    card.dataset.year,
                    card.dataset.category,
                    card.dataset.tags
                ].join(" "));

                if (textNeedle && haystack.indexOf(textNeedle) === -1) {
                    return false;
                }

                if (typeNeedle && normalize(card.dataset.type) !== typeNeedle) {
                    return false;
                }

                if (yearNeedle && normalize(card.dataset.year) !== yearNeedle) {
                    return false;
                }

                if (categoryNeedle && normalize(card.dataset.category) !== categoryNeedle) {
                    return false;
                }

                return true;
            }

            function apply() {
                var visible = 0;

                cards.forEach(function (card) {
                    var show = matches(card);
                    card.hidden = !show;

                    if (show) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            [textInput, typeSelect, yearSelect, categorySelect].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });

            apply();
        });
    }

    function playVideo(video, shell, button) {
        var source = video.dataset.stream;

        if (!source) {
            return;
        }

        shell.classList.add("is-playing");

        if (button) {
            button.setAttribute("aria-hidden", "true");
        }

        if (video.dataset.ready === "1") {
            video.play().catch(function () {});
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                video.dataset.ready = "1";
                video.play().catch(function () {});
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                    hls.destroy();
                    video.src = source;
                    video.dataset.ready = "1";
                    video.play().catch(function () {});
                }
            });
        } else {
            video.src = source;
            video.dataset.ready = "1";
            video.play().catch(function () {});
        }
    }

    function initPlayers() {
        var shells = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

        shells.forEach(function (shell) {
            var video = shell.querySelector("video[data-stream]");
            var button = shell.querySelector("[data-play]");

            if (!video) {
                return;
            }

            if (button) {
                button.addEventListener("click", function (event) {
                    event.preventDefault();
                    playVideo(video, shell, button);
                });
            }

            shell.addEventListener("click", function (event) {
                if (event.target.closest("button") || event.target.closest("video")) {
                    return;
                }

                playVideo(video, shell, button);
            });
        });
    }

    onReady(function () {
        initNavigation();
        initHero();
        initFilters();
        initPlayers();
    });
})();
