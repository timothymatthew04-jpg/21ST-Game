// The menu is designed at 1920x1080 and scaled to cover any window, so the video and the live
// page look identical. Buttons get a click ripple when the page is used live.
(function () {
  const stage = document.getElementById('stage');
  function fit() {
    const s = Math.max(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener('resize', fit);
  fit();

  document.querySelectorAll('.item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const rect = item.getBoundingClientRect();
      const scale = rect.width / item.offsetWidth;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${(e.clientX - rect.left) / scale}px`;
      ripple.style.top = `${(e.clientY - rect.top) / scale}px`;
      item.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
})();
