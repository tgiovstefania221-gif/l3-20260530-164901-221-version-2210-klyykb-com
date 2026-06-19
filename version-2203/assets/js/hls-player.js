(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setStatus(shell, message) {
    var status = shell.parentElement.querySelector('[data-player-status]');

    if (status) {
      status.textContent = message;
    }
  }

  function startPlayer(shell) {
    var video = shell.querySelector('video');
    var overlay = shell.querySelector('[data-video-overlay]');
    var source = shell.getAttribute('data-video-url');
    var title = shell.getAttribute('data-video-title') || '影片';

    if (!video || !source) {
      setStatus(shell, '未找到可用播放地址。');
      return;
    }

    if (overlay) {
      overlay.style.display = 'none';
    }

    setStatus(shell, '正在加载《' + title + '》播放源...');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', function () {
        video.play();
      }, { once: true });
      setStatus(shell, '已使用浏览器原生 HLS 播放。');
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
        setStatus(shell, '播放源加载完成，正在播放。');
        video.play();
      });

      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setStatus(shell, '播放源加载失败，请刷新页面或稍后重试。');
          hls.destroy();
        }
      });

      shell._hls = hls;
      return;
    }

    setStatus(shell, '当前浏览器未启用 HLS 支持，请使用新版 Chrome、Edge、Safari 或 Firefox。');
  }

  ready(function () {
    var players = document.querySelectorAll('[data-video-url]');

    players.forEach(function (shell) {
      var button = shell.querySelector('[data-play-button]');
      var overlay = shell.querySelector('[data-video-overlay]');

      if (button) {
        button.addEventListener('click', function () {
          startPlayer(shell);
        });
      }

      if (overlay) {
        overlay.addEventListener('dblclick', function () {
          startPlayer(shell);
        });
      }
    });
  });
}());
