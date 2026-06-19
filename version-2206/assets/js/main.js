(function () {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');

    if (toggle && panel) {
        toggle.addEventListener('click', function () {
            panel.classList.toggle('open');
        });
    }

    var carousel = document.querySelector('[data-hero-carousel]');
    if (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var current = 0;
        var timer = null;

        function showSlide(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, itemIndex) {
                slide.classList.toggle('active', itemIndex === current);
            });
            dots.forEach(function (dot, itemIndex) {
                dot.classList.toggle('active', itemIndex === current);
            });
        }

        function startTimer() {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(function () {
                showSlide(current + 1);
            }, 5600);
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
                startTimer();
            });
        });

        if (slides.length > 1) {
            startTimer();
        }
    }

    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
    scopes.forEach(function (scope) {
        var input = scope.querySelector('[data-page-filter]');
        var region = scope.querySelector('[data-region-filter]');
        var list = document.querySelector('[data-filter-list]');

        if (!list) {
            return;
        }

        var items = Array.prototype.slice.call(list.children);
        var urlQuery = new URLSearchParams(window.location.search).get('q') || '';

        if (input && input.hasAttribute('data-query-input') && urlQuery) {
            input.value = urlQuery;
        }

        function normalize(value) {
            return String(value || '').toLowerCase().trim();
        }

        function filterItems() {
            var keyword = normalize(input ? input.value : '');
            var regionValue = normalize(region ? region.value : '');

            items.forEach(function (item) {
                var haystack = normalize([
                    item.getAttribute('data-title'),
                    item.getAttribute('data-region'),
                    item.getAttribute('data-year'),
                    item.getAttribute('data-genre'),
                    item.getAttribute('data-category'),
                    item.textContent
                ].join(' '));
                var itemRegion = normalize(item.getAttribute('data-region'));
                var keywordOk = !keyword || haystack.indexOf(keyword) !== -1;
                var regionOk = !regionValue || itemRegion === regionValue;
                item.classList.toggle('is-hidden', !(keywordOk && regionOk));
            });
        }

        if (input) {
            input.addEventListener('input', filterItems);
        }
        if (region) {
            region.addEventListener('change', filterItems);
        }
        filterItems();
    });
})();
