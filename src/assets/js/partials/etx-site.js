/* =========================================================
   سهل السفر — سلوك الهيدر والأزرار العائمة (كل الصفحات)
   ========================================================= */
const RING_LENGTH = 2 * Math.PI * 26;

function init() {
  const header = document.getElementById('etxHeader');
  const toTop = document.getElementById('etxToTop');
  const ring = document.getElementById('etxToTopRing');
  let lastScroll = 0;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) {
      const menuOpen = document.body.classList.contains('menu-opened');
      header.classList.toggle('is-scrolled', y > 40);
      if (y > 500 && y > lastScroll + 4 && !menuOpen) header.classList.add('is-hidden');
      if (y < lastScroll - 4 || y <= 500) header.classList.remove('is-hidden');
    }
    lastScroll = y;
    if (toTop) {
      toTop.classList.toggle('show', y > 500);
      if (ring) ring.style.strokeDashoffset = String(RING_LENGTH * (1 - (max > 0 ? y / max : 0)));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  toTop?.addEventListener('click', () => {
    toTop.classList.remove('launch');
    void toTop.offsetWidth;
    toTop.classList.add('launch');
    if (window.etxLenis) window.etxLenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
