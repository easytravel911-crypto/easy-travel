/* =========================================================
   سهل السفر — سلوك الهيدر والأزرار العائمة (كل الصفحات)
   ========================================================= */
const RING_LENGTH = 2 * Math.PI * 26;

function init() {
  const header = document.getElementById('etxHeader');
  const toTop = document.getElementById('etxToTop');
  const ring = document.getElementById('etxToTopRing');
  const space = document.querySelector('.etx-header-space');
  // The spacer matches the real header height so breadcrumbs never sit under the fixed bar.
  const fitSpace = () => { if (header && space) space.style.height = `${header.offsetHeight}px`; };
  fitSpace();
  window.addEventListener('load', fitSpace);
  window.addEventListener('resize', fitSpace);
  if (header && window.ResizeObserver) new ResizeObserver(() => { if (!header.classList.contains('is-scrolled')) fitSpace(); }).observe(header);
  let lastScroll = 0;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) {
      const menuOpen = document.body.classList.contains('etx-menu-open');
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

  initMenu(header);
}

/* ---------- Full-screen menu (all screen sizes) ---------- */
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function initMenu(header) {
  const toggle = document.getElementById('etxMenuToggle');
  const menu = document.getElementById('etxMenu');
  const list = document.getElementById('etxMenuList');
  if (!toggle || !menu || !list) return;
  const body = document.body;

  const setOpen = (open) => {
    body.classList.toggle('etx-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (window.etxLenis) open ? window.etxLenis.stop() : window.etxLenis.start();
    if (open) header?.classList.remove('is-hidden');
  };
  toggle.addEventListener('click', () => setOpen(!body.classList.contains('etx-menu-open')));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && body.classList.contains('etx-menu-open')) setOpen(false); });
  menu.addEventListener('click', (event) => { if (event.target.closest('a[href]')) setOpen(false); });

  document.getElementById('etxMenuAccount')?.addEventListener('click', () => {
    setOpen(false);
    if (salla.config.isGuest()) salla.event.dispatch('login::open');
    else window.location.href = salla.url.get('customer/profile');
  });

  // Links come from the store's header menu, so the merchant manages them from the Salla dashboard.
  const render = (menus) => {
    const items = (menus || []).filter((item) => item && item.title && item.url);
    if (!items.length) return;
    let index = 1;
    list.insertAdjacentHTML('beforeend', items.map((item) => {
      const children = (item.children || []).filter((child) => child.title && child.url);
      const i = index++;
      if (!children.length) {
        return `<li style="--i:${i}"><a href="${escapeHtml(item.url)}"><span class="etx-mn-ico"><i class="sicon-airplane" aria-hidden="true"></i></span>${escapeHtml(item.title)}</a></li>`;
      }
      return `<li style="--i:${i}"><details class="etx-mn-group">
        <summary><span class="etx-mn-ico"><i class="sicon-airplane" aria-hidden="true"></i></span>${escapeHtml(item.title)}<i class="sicon-keyboard_arrow_down etx-mn-caret" aria-hidden="true"></i></summary>
        <ul>
          <li><a href="${escapeHtml(item.url)}">${escapeHtml(salla.lang.get('blocks.home.display_all') || 'عرض الكل')}</a></li>
          ${children.map((child) => `<li><a href="${escapeHtml(child.url)}">${escapeHtml(child.title)}</a></li>`).join('')}
        </ul>
      </details></li>`;
    }).join(''));
    const account = menu.querySelector('.etx-menu-account');
    if (account) account.style.setProperty('--i', String(index));
  };

  const load = () => salla.api.component.getMenus()
    .then(({ data }) => render(data))
    .catch((error) => salla.logger?.error?.('etx-menu: could not load menus', error));
  if (window.salla?.onReady) salla.onReady().then(() => salla.lang.onLoaded()).then(load);
  else document.addEventListener('theme::ready', load, { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
