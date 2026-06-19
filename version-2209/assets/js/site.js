(function () {
    function initializeSite() {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function activateSlide(index) {
        if (!slides.length) {
            return;
        }

        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('is-active', dotIndex === current);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            activateSlide(index);
        });
    });

    if (slides.length > 1) {
        setInterval(function () {
            activateSlide(current + 1);
        }, 5200);
    }

    document.querySelectorAll('[data-player]').forEach(function (shell) {
        var button = shell.querySelector('[data-play-button]');
        var video = shell.querySelector('video');
        var source = shell.getAttribute('data-src');

        if (!button || !video || !source) {
            return;
        }

        function loadAndPlay() {
            shell.classList.add('is-playing');

            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls();
                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    video.play();
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                video.addEventListener('loadedmetadata', function () {
                    video.play();
                }, { once: true });
            } else {
                video.src = source;
                video.play();
            }
        }

        button.addEventListener('click', loadAndPlay);
    });

    var searchResults = document.querySelector('[data-search-results]');
    var searchTitle = document.querySelector('[data-search-title]');

    if (searchResults && window.MOVIE_SEARCH_DATA) {
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        var normalized = query.toLowerCase();
        var data = window.MOVIE_SEARCH_DATA;
        var results = normalized ? data.filter(function (movie) {
            return movie.keywords.toLowerCase().indexOf(normalized) !== -1;
        }) : data.slice(0, 120);

        if (searchTitle) {
            searchTitle.textContent = query ? '“' + query + '”的搜索结果' : '全部影片';
        }

        searchResults.innerHTML = results.slice(0, 240).map(function (movie) {
            return '<article class="movie-card grid">' +
                '<a class="poster-link" href="' + movie.href + '" aria-label="' + escapeHtml(movie.title) + '">' +
                    '<img src="./' + movie.cover + '.jpg" alt="' + escapeHtml(movie.title) + '" loading="lazy" />' +
                    '<span class="poster-gradient"></span>' +
                    '<strong class="poster-year">' + movie.year + '</strong>' +
                '</a>' +
                '<div class="movie-info">' +
                    '<a class="category-pill" href="category-' + movie.categorySlug + '.html">' + escapeHtml(movie.category) + '</a>' +
                    '<h3><a href="' + movie.href + '">' + escapeHtml(movie.title) + '</a></h3>' +
                    '<p>' + escapeHtml(movie.description) + '</p>' +
                    '<div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.genre) + '</span></div>' +
                '</div>' +
            '</article>';
        }).join('');

        if (!results.length) {
            searchResults.innerHTML = '<article class="content-card"><h2>没有找到匹配影片</h2><p>可以尝试输入片名、年份、地区、类型或标签继续查找。</p></article>';
        }
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"]/g, function (mark) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            }[mark];
        });
    }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSite);
    } else {
        initializeSite();
    }
})();
