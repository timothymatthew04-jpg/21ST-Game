// The menu is designed at 1920x1080 and scaled to cover any window, so the live page and the
// exported video look the same.
(function () {
  const stage = document.getElementById('stage');
  function fit() {
    const s = Math.max(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener('resize', fit);
  fit();
})();
