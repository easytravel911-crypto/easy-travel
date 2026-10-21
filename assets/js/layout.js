/* =========================================================
   سهل السفر — الهيكل المشترك
   الهيدر · الفوتر · الأزرار العائمة · السلة · واتساب
   ========================================================= */
(function () {
  'use strict';
  const ET = window.EasyTravel;
  const { ICONS, storage, wingsMark, whatsappLink } = ET;
  const body = document.body;
  const currentPage = body.dataset.page || '';

  /* ---------- Cart & wishlist state ---------- */
  const CART_KEY = 'et-cart';
  const WISH_KEY = 'et-wishlist';
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener());

  const cart = {
    items: () => storage.get(CART_KEY, []),
    save(items) { storage.set(CART_KEY, items); notify(); },
    add(productId, options = {}) {
      const items = cart.items();
      const travelers = Math.max(1, options.travelers || 1);
      const month = options.month || '';
      const existing = items.find((item) => item.id === productId && item.month === month);
      if (existing) existing.travelers += travelers;
      else items.push({ id: productId, travelers, month });
      cart.save(items);
    },
    update(index, changes) {
      const items = cart.items();
      if (!items[index]) return;
      Object.assign(items[index], changes);
      cart.save(items);
    },
    remove(index) {
      const items = cart.items();
      items.splice(index, 1);
      cart.save(items);
    },
    clear() { cart.save([]); },
    count: () => cart.items().length,
    lines() {
      return cart.items()
        .map((item, index) => ({ ...item, index, product: ET.findProduct(item.id) }))
        .filter((line) => line.product)
        .map((line) => ({ ...line, total: line.product.price * line.travelers }));
    },
    total: () => cart.lines().reduce((sum, line) => sum + line.total, 0),
    onChange: (listener) => listeners.add(listener),
  };

  const wishlist = {
    ids: () => storage.get(WISH_KEY, []),
    has: (id) => wishlist.ids().includes(id),
    toggle(id) {
      const ids = wishlist.ids();
      const next = ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
      storage.set(WISH_KEY, next);
      return next.includes(id);
    },
  };

  const user = {
    get: () => storage.get('et-user', null),
    set: (value) => storage.set('et-user', value),
    clear: () => storage.set('et-user', null),
  };

  ET.cart = cart;
  ET.wishlist = wishlist;
  ET.user = user;

  /* ---------- Header ---------- */
  const NAV_LINKS = [
    { href: 'index.html', label: 'الرئيسية', page: 'home', hint: 'Home' },
    { href: 'packages.html', label: 'الباقات والرحلات', page: 'packages', hint: 'Packages' },
    { href: 'about.html', label: 'من نحن', page: 'about', hint: 'About' },
    { href: 'guarantee.html', label: 'الضمان', page: 'guarantee', hint: 'Guarantee' },
    { href: 'contact.html', label: 'تواصل معنا', page: 'contact', hint: 'Contact' },
  ];
  const accountHref = () => (user.get() ? 'account.html' : 'login.html');

  const headerHtml = `
    <header class="site-header ${body.dataset.header === 'solid' ? 'is-solid' : ''}" id="siteHeader">
      <div class="container header-inner">
        <a class="brand" href="index.html" aria-label="سهل السفر - الرئيسية">
          ${wingsMark('wing-header')}
          <span class="brand-name">سهل السفر<small>Easy Travel</small></span>
        </a>
        <nav class="nav" aria-label="القائمة الرئيسية">
          ${NAV_LINKS.map((link) => `<a href="${link.href}" class="${link.page === currentPage ? 'is-active' : ''}">${link.label}</a>`).join('')}
        </nav>
        <div class="header-actions">
          <a class="icon-btn" href="${accountHref()}" aria-label="حسابي">${ICONS.user}</a>
          <a class="icon-btn" href="cart.html" aria-label="السلة" id="cartIcon">${ICONS.cart}<span class="cart-count" id="cartCount"></span></a>
          <a class="btn btn-primary btn-sm header-cta" data-wa="السلام عليكم، أرغب بحجز رحلة مع سهل السفر ✈️">احجز رحلتك</a>
          <button class="icon-btn menu-toggle" id="menuToggle" aria-label="فتح القائمة" aria-expanded="false"><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>
    <nav class="mobile-nav" id="mobileNav" aria-label="قائمة الجوال">
      ${NAV_LINKS.map((link, index) => `<a href="${link.href}" style="--i:${index}">${link.label}<small>${link.hint}</small></a>`).join('')}
      <a href="${accountHref()}" style="--i:${NAV_LINKS.length}">حسابي<small>Account</small></a>
      <span class="btn btn-wa btn-lg" style="--i:7" data-wa="السلام عليكم، أرغب بحجز رحلة مع سهل السفر ✈️">${ICONS.whatsapp} احجز عبر واتساب</span>
    </nav>`;

  /* ---------- Footer ---------- */
  const footerTrips = ET.PRODUCTS.filter((product) => product.type === 'trip').slice(0, 5);
  const footerHtml = `
    <footer class="site-footer">
      <div class="footer-big" aria-hidden="true">رحلة بلا عناء</div>
      <div class="container">
        <div class="footer-grid">
          <div class="footer-about">
            <a class="brand footer-brand" href="index.html">${wingsMark('wing-footer')}<span class="brand-name">سهل السفر<small>Easy Travel</small></span></a>
            <p>نصمم رحلتك من البداية إلى النهاية: الطيران والفنادق والجولات والدعم طوال الطريق. أنت تستمتع، ونحن نهتم بالتفاصيل.</p>
            <div class="pay-row"><span>mada</span><span>VISA</span><span>Mastercard</span><span>Apple Pay</span><span>STC Pay</span><span>Tabby</span><span>Tamara</span></div>
          </div>
          <div>
            <h4>روابط سريعة</h4>
            <ul>${NAV_LINKS.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join('')}</ul>
          </div>
          <div>
            <h4>وجهات مختارة</h4>
            <ul>${footerTrips.map((trip) => `<li><a href="product.html?id=${trip.id}">${trip.name}</a></li>`).join('')}</ul>
          </div>
          <div>
            <h4>تواصل معنا</h4>
            <ul>
              <li><a data-wa="السلام عليكم، لدي استفسار عن رحلة.">واتساب: <span dir="ltr">+966 50 869 5674</span></a></li>
              <li><a href="tel:+966508695674">اتصال: <span dir="ltr">+966 50 869 5674</span></a></li>
              <li><a href="account.html">طلباتي</a></li>
              <li><a href="guarantee.html">سياسة الضمان والاسترجاع</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} سهل السفر. جميع الحقوق محفوظة.</span>
          <span>العالم أقرب إليك ✈</span>
        </div>
      </div>
    </footer>`;

  /* ---------- Floating buttons ---------- */
  const floatsHtml = `
    <a class="fab-wa" data-wa="السلام عليكم، أرغب بالاستفسار عن رحلة مع سهل السفر ✈️" aria-label="تواصل عبر واتساب">${ICONS.whatsapp}</a>
    <div class="wa-bubble" id="waBubble" role="status">
      <button type="button" aria-label="إغلاق">×</button>
      <b>تحتاج مساعدة في رحلتك؟ 👋</b>
      مستشار السفر جاهز يرد عليك على واتساب.
    </div>
    <button class="to-top" id="toTop" type="button" aria-label="العودة إلى الأعلى">
      <svg class="ring" viewBox="0 0 58 58" aria-hidden="true"><circle class="bg" cx="29" cy="29" r="26"/><circle class="fg" id="toTopRing" cx="29" cy="29" r="26"/></svg>
      <span class="ico">${ICONS.plane}</span>
    </button>
    <div class="toast-stack" id="toastStack" aria-live="polite"></div>`;

  /* ---------- Inline icons: <i data-icon="whatsapp"></i> ---------- */
  document.querySelectorAll('i[data-icon]').forEach((placeholder) => {
    const template = document.createElement('template');
    template.innerHTML = ICONS[placeholder.dataset.icon] || '';
    const svg = template.content.firstElementChild;
    if (!svg) return;
    if (placeholder.className) svg.classList.add(...placeholder.classList);
    placeholder.replaceWith(svg);
  });

  body.insertAdjacentHTML('afterbegin', headerHtml);
  if (body.dataset.footer !== 'none') document.querySelector('main')?.insertAdjacentHTML('afterend', footerHtml);
  body.insertAdjacentHTML('beforeend', floatsHtml);

  /* ---------- WhatsApp links ---------- */
  ET.bindWhatsapp = (root = document) => {
    root.querySelectorAll('[data-wa]').forEach((element) => {
      const href = whatsappLink(element.dataset.wa);
      if (element.tagName === 'A') {
        element.href = href;
        element.target = '_blank';
        element.rel = 'noopener';
      } else if (!element.dataset.waBound) {
        element.dataset.waBound = '1';
        element.setAttribute('role', 'link');
        element.tabIndex = 0;
        element.addEventListener('click', () => window.open(whatsappLink(element.dataset.wa), '_blank', 'noopener'));
      }
    });
  };
  ET.bindWhatsapp();

  /* ---------- Header behaviour ---------- */
  const header = document.getElementById('siteHeader');
  const toTop = document.getElementById('toTop');
  const toTopRing = document.getElementById('toTopRing');
  const RING_LENGTH = 2 * Math.PI * 26;
  let lastScroll = 0;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > 500 && y > lastScroll + 4 && !body.classList.contains('menu-open'));
    if (y < lastScroll - 4) header.classList.remove('is-hidden');
    lastScroll = y;
    toTop.classList.toggle('show', y > 500);
    toTopRing.style.strokeDashoffset = String(RING_LENGTH * (1 - (max > 0 ? y / max : 0)));
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => {
    toTop.classList.remove('launch');
    void toTop.offsetWidth;
    toTop.classList.add('launch');
    if (ET.lenis) ET.lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const menuToggle = document.getElementById('menuToggle');
  menuToggle.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    if (ET.lenis) open ? ET.lenis.stop() : ET.lenis.start();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  });

  /* ---------- WhatsApp bubble ---------- */
  const bubble = document.getElementById('waBubble');
  let bubbleDismissed = false;
  try { bubbleDismissed = sessionStorage.getItem('et-bubble') === '1'; } catch (error) { /* ignore */ }
  if (!bubbleDismissed) {
    setTimeout(() => bubble.classList.add('show'), 9000);
    setTimeout(() => bubble.classList.remove('show'), 21000);
  }
  bubble.querySelector('button').addEventListener('click', () => {
    bubble.classList.remove('show');
    try { sessionStorage.setItem('et-bubble', '1'); } catch (error) { /* ignore */ }
  });

  /* ---------- Cart badge ---------- */
  const cartCount = document.getElementById('cartCount');
  const renderCount = (bump) => {
    const count = cart.count();
    cartCount.textContent = count;
    cartCount.classList.toggle('has', count > 0);
    if (bump) {
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth;
      cartCount.classList.add('bump');
    }
  };
  renderCount(false);
  cart.onChange(() => renderCount(true));

  /* ---------- Toasts ---------- */
  ET.toast = ({ img, title, text, link }) => {
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `${img ? `<img src="${ET.unsplash(img, 120)}" alt="">` : ''}
      <div class="t-body"><b>${title}</b>${text || ''}</div>${link ? `<a href="${link.href}">${link.label}</a>` : ''}`;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3800);
  };

  /* ---------- Fly to cart ---------- */
  ET.flyToCart = (imageId, fromElement) => {
    const target = document.getElementById('cartIcon');
    if (!target || !fromElement || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    header.classList.remove('is-hidden');
    const from = fromElement.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dot = document.createElement('img');
    dot.className = 'fly-dot';
    dot.src = ET.unsplash(imageId, 120);
    dot.alt = '';
    dot.style.left = `${from.left + from.width / 2 - 28}px`;
    dot.style.top = `${from.top + from.height / 2 - 28}px`;
    body.appendChild(dot);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    dot.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 120}px) scale(.9)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.3 },
    ], { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => dot.remove();
  };

  /* ---------- Planner form (home) ---------- */
  const planner = document.getElementById('plannerForm');
  planner?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(planner);
    const message = [
      'السلام عليكم 👋',
      'أرغب بتخطيط رحلة مع سهل السفر:',
      `• الوجهة: ${data.get('destination')}`,
      `• موعد السفر: ${data.get('month') || 'مرن'}`,
      `• عدد المسافرين: ${data.get('travelers')}`,
    ].join('\n');
    window.open(whatsappLink(message), '_blank', 'noopener');
  });

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const lines = [
      'السلام عليكم 👋',
      `الاسم: ${data.get('name')}`,
      `الجوال: ${data.get('phone')}`,
      `الموضوع: ${data.get('topic')}`,
    ];
    if (data.get('destination')) lines.push(`الوجهة: ${data.get('destination')}`);
    lines.push('', data.get('message'));
    const message = lines.join('\n');
    window.open(whatsappLink(message), '_blank', 'noopener');
  });
})();
