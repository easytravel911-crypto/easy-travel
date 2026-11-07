import "lite-youtube-embed";
import BasePage from "./base-page";
import Lightbox from "fslightbox";
import Lenis from "lenis";
import { playIntro } from "./partials/etx-intro";
window.fslightbox = Lightbox;

const html = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PLANE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const wingsMark = (id) => `
  <svg class="etx-mark" viewBox="0 0 80 56" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--wing-a)"/><stop offset="1" stop-color="#F39237"/></linearGradient></defs>
    <g fill="none" stroke="url(#${id})" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M38 44C24 40 10 26 8 4c10 12 20 18 30 22"/><path d="M36 35c-10-3-18-10-21-20"/><path d="M42 44c14-4 28-18 30-40-10 12-20 18-30 22"/><path d="M44 35c10-3 18-10 21-20"/><path d="M27 51c6-6 20-6 26 0"/>
    </g>
  </svg>`;

const introRunning = () => html.classList.contains('is-intro');
const afterIntro = (callback) => (introRunning() ? document.addEventListener('intro:done', callback, { once: true }) : callback());
// Wait for the preloader, then for the intro (if any).
const whenReady = (callback) => {
  if (html.classList.contains('is-loading')) document.addEventListener('preloader:done', () => whenReady(callback), { once: true });
  else afterIntro(callback);
};

class Home extends BasePage {
  onReady() {
    this.initFeaturedTabs();
    playIntro();
    this.initSmoothScroll();
    this.splitHeadings(document);
    this.initReveal();
    this.initParallax();
    this.initPlanner();
    this.initJourney();
    this.initBoard();
    this.loadStoreContent();
  }

  /** used in views/components/home/featured-products-style*.twig */
  initFeaturedTabs() {
    app.all('.tab-trigger', el => {
      el.addEventListener('click', ({ currentTarget: btn }) => {
        let id = btn.dataset.componentId;
        app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'is-active opacity-0 translate-y-3', 'inactive', tab => tab.id == btn.dataset.target)
          .toggleClassIf(`#${id} .tab-trigger`, 'is-active', 'inactive', tabBtn => tabBtn == btn);
        setTimeout(() => app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'opacity-100 translate-y-0', 'opacity-0 translate-y-3', tab => tab.id == btn.dataset.target), 100);
      })
    });
    document.querySelectorAll('.s-block-tabs').forEach(block => block.classList.add('tabs-initialized'));
  }

  initSmoothScroll() {
    if (reduceMotion) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    this.lenis = lenis;
    window.etxLenis = lenis;
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (html.classList.contains('is-loading') || introRunning()) { lenis.stop(); whenReady(() => lenis.start()); }
    document.querySelectorAll('.etx-scope a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
  }

  /** Splits headings into words; Arabic letters stay joined inside each word. */
  splitHeadings(root) {
    root.querySelectorAll('[data-split]:not([data-split-done])').forEach((element) => {
      element.setAttribute('data-split-done', '');
      let index = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const fragment = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(part)); return; }
              const outer = document.createElement('span');
              outer.className = 'etx-w';
              const inner = document.createElement('span');
              inner.textContent = part;
              inner.style.setProperty('--i', index++);
              outer.appendChild(inner);
              fragment.appendChild(outer);
            });
            child.replaceWith(fragment);
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
            walk(child);
          }
        });
      };
      walk(element);
    });
  }

  initReveal() {
    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        this.revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    this.revealReady = false;
    whenReady(() => setTimeout(() => { this.revealReady = true; this.observeReveal(document); }, 50));
  }

  observeReveal(root) {
    if (!this.revealReady) return;
    root.querySelectorAll('[data-stagger]').forEach((group) => [...group.children].forEach((child, i) => child.style.setProperty('--i', i)));
    root.querySelectorAll('[data-reveal], [data-split], [data-stagger]').forEach((element) => {
      if (!element.classList.contains('is-in')) this.revealObserver.observe(element);
    });
  }

  initParallax() {
    if (reduceMotion) return;
    let ticking = false;
    const update = () => {
      const viewport = window.innerHeight;
      document.querySelectorAll('[data-parallax]').forEach((item) => {
        const rect = item.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewport) return;
        const offset = (rect.top + rect.height / 2 - viewport / 2) * parseFloat(item.dataset.parallax);
        item.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Planner: sends the request to WhatsApp ---------- */
  initPlanner() {
    const form = document.getElementById('etxPlanner');
    if (!form) return;
    const month = document.getElementById('etxPlannerMonth');
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      month.insertAdjacentHTML('beforeend', `<option>${formatter.format(new Date(now.getFullYear(), now.getMonth() + i, 1))}</option>`);
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const message = [
        'السلام عليكم 👋',
        'أرغب بتخطيط رحلة مع سهل السفر:',
        `• الوجهة: ${data.get('destination')}`,
        `• موعد السفر: ${data.get('month') || 'مرن'}`,
        `• عدد المسافرين: ${data.get('travelers')}`,
      ].join('\n');
      const number = String(window.et_whatsapp || '').replace(/\D/g, '');
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });
  }

  /* ---------- Journey: the plane follows the path as you scroll ---------- */
  initJourney() {
    const journey = document.getElementById('etxJourney');
    if (!journey) return;
    const svg = journey.querySelector('svg');
    const line = journey.querySelector('#etxJourneyLine');
    const plane = journey.querySelector('#etxJourneyPlane');
    const marksGroup = journey.querySelector('#etxJourneyMarks');
    const steps = [...journey.querySelectorAll('.etx-journey-step')];
    const length = line.getTotalLength();
    line.style.strokeDasharray = `${length}`;
    const samples = Array.from({ length: 400 }, (_, i) => {
      const at = (i / 399) * length;
      return { at, point: line.getPointAtLength(at) };
    });
    // RTL: the first step is on the right.
    const stops = steps.map((_, index) => {
      const targetX = 1000 - (index + 0.5) * (1000 / steps.length);
      const best = samples.reduce((a, b) => (Math.abs(b.point.x - targetX) < Math.abs(a.point.x - targetX) ? b : a));
      const mark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      mark.setAttribute('cx', best.point.x); mark.setAttribute('cy', best.point.y); mark.setAttribute('r', 9);
      mark.setAttribute('class', 'etx-journey-mark');
      marksGroup.appendChild(mark);
      return { fraction: best.at / length, mark };
    });
    let target = 0, current = -1, animating = false;
    const render = () => {
      if (current < 0) current = target;
      current += (target - current) * (reduceMotion ? 1 : 0.08);
      if (Math.abs(target - current) < 0.0005) { current = target; animating = false; }
      const at = length * current;
      const point = line.getPointAtLength(at);
      const ahead = line.getPointAtLength(Math.min(at + 1, length));
      const behind = line.getPointAtLength(Math.max(at - 1, 0));
      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
      line.style.strokeDashoffset = `${length - at}`;
      plane.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle + 90})`);
      stops.forEach((stop, index) => {
        const on = current >= stop.fraction - 0.02;
        stop.mark.classList.toggle('on', on);
        steps[index].classList.toggle('on', on);
      });
      if (animating) requestAnimationFrame(render);
    };
    const measure = () => {
      const rect = svg.getBoundingClientRect();
      const viewport = window.innerHeight;
      target = clamp((viewport * 0.85 - rect.top) / (viewport * 0.6), 0, 1);
      if (!animating) { animating = true; requestAnimationFrame(render); }
    };
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  }

  /* ---------- Departure board (split-flap) ---------- */
  initBoard() {
    const board = document.querySelector('.etx-board');
    if (!board) return;
    board.querySelectorAll('.etx-board-digits').forEach((holder) => {
      holder.innerHTML = [...holder.dataset.text].map((char) => `<span class="etx-flap" data-final="${escapeHtml(char)}">${/\d/.test(char) ? '0' : escapeHtml(char)}</span>`).join('');
    });
    const clock = board.querySelector('.etx-clock');
    const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }) + ' RUH'; };
    tick(); setInterval(tick, 30000);
    const flip = () => {
      board.querySelectorAll('.etx-flap').forEach((flap, index) => {
        const final = flap.dataset.final;
        if (!/\d/.test(final)) return;
        let rounds = 8 + index * 2;
        const timer = setInterval(() => {
          flap.classList.remove('tick'); void flap.offsetWidth; flap.classList.add('tick');
          flap.textContent = rounds <= 0 ? final : '0123456789'[Math.floor(Math.random() * 10)];
          if (rounds-- <= 0) clearInterval(timer);
        }, reduceMotion ? 0 : 70);
      });
    };
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      flip(); observer.disconnect();
    }, { threshold: 0.4 }).observe(board);
  }

  /* ---------- Store content: trips, packages, reviews ---------- */
  async loadStoreContent() {
    const keyword = (window.et_packages_keyword || 'باقة').trim();
    let products = [];
    try {
      const response = await salla.api.product.fetch({ source: 'latest', limit: 30 });
      products = (response && response.data) || [];
    } catch (error) {
      app.log('Easy Travel: products could not be loaded', error);
    }
    const isPackage = (product) => keyword && String(product.name || '').includes(keyword);
    const packages = products.filter(isPackage).slice(0, 3);
    const trips = products.filter((product) => !isPackage(product));

    this.renderPasses(packages);
    this.renderDestinations(trips);
    this.renderPlannerOptions(trips.length ? trips : products);
    this.renderMarquee(trips);
    this.renderMosaic(trips.length ? trips : products);
    this.observeReveal(document);
    this.loadReviews();
  }

  imageOf(product) {
    return product?.image?.url || product?.thumbnail || product?.images?.[0]?.url || '';
  }

  bookingAttrs(product) {
    return `data-et-booking data-name="${escapeHtml(product.name)}" data-url="${escapeHtml(product.url)}" href="https://wa.me/${escapeHtml(String(window.et_whatsapp || '').replace(/\D/g, ''))}" target="_blank" rel="noopener"`;
  }

  renderPasses(packages) {
    const grid = document.getElementById('etxPassGrid');
    if (!grid) return;
    if (!packages.length) { grid.closest('section').hidden = true; return; }
    const featuredIndex = packages.length === 3 ? 1 : -1;
    const gates = ['A1', 'B7', 'VIP'];
    const seats = ['14C', '3A', '1A'];
    grid.innerHTML = packages.map((product, index) => {
      const featured = index === featuredIndex;
      const summary = product.subtitle || product.promotion_title || '';
      return `
      <article class="etx-pass ${featured ? 'featured' : ''}" data-reveal style="--d:${index * 140}">
        ${featured ? '<span class="etx-pass-ribbon">★ الأكثر طلباً</span>' : ''}
        <div class="etx-pass-main">
          <div class="etx-pass-top">
            <span class="etx-pass-airline">${wingsMark(`etx-wing-pass-${product.id}`)} سهل السفر</span>
            <span class="etx-pass-class">${['ECONOMY+', 'BUSINESS', 'FIRST'][index] || 'ECONOMY+'}</span>
          </div>
          <h3>${escapeHtml(product.name)}</h3>
          ${summary ? `<p class="etx-pass-desc">${escapeHtml(summary)}</p>` : ''}
          <div class="etx-pass-route">
            <div><b>RUH</b><small>الرياض</small></div>
            <div class="etx-pass-line">${PLANE}</div>
            <div style="text-align:left"><b>ANY</b><small>وجهتك</small></div>
          </div>
          <ul class="etx-pass-features">
            <li>${CHECK}<span>طيران وإقامة وتنقلات مرتبة لك</span></li>
            <li>${CHECK}<span>برنامج يومي يناسب وقتك</span></li>
            <li>${CHECK}<span>دعم على واتساب طوال الرحلة</span></li>
          </ul>
          <div class="etx-pass-meta">
            <div><small>الحجز</small><b>واتساب</b></div>
            <div><small>البوابة</small><b>${gates[index] || 'A1'}</b></div>
            <div><small>المقعد</small><b>${seats[index] || '1A'}</b></div>
          </div>
        </div>
        <div class="etx-pass-tear" aria-hidden="true"></div>
        <div class="etx-pass-stub">
          <div class="etx-pass-price">
            <div><small>السعر</small><b class="etx-pass-ask">حسب الموعد</b></div>
            <div class="etx-barcode" aria-hidden="true"></div>
          </div>
          <div class="etx-pass-actions">
            <a class="etx-btn ${featured ? 'etx-btn-primary' : 'etx-btn-dark'}" ${this.bookingAttrs(product)}><i class="sicon-whatsapp" aria-hidden="true"></i> احجز عبر واتساب</a>
            <a class="etx-btn etx-btn-outline etx-icon-only" href="${escapeHtml(product.url)}" aria-label="تفاصيل ${escapeHtml(product.name)}"><i class="sicon-arrow-left" aria-hidden="true"></i></a>
          </div>
        </div>
      </article>`;
    }).join('');
    this.initTilt();
  }

  initTilt() {
    if (!finePointer || reduceMotion || this.tiltReady) return;
    this.tiltReady = true;
    document.addEventListener('pointermove', (event) => {
      const card = event.target.closest?.('.etx-pass');
      document.querySelectorAll('.etx-pass.tilting').forEach((other) => {
        if (other !== card) { other.classList.remove('tilting'); other.style.removeProperty('--rx'); other.style.removeProperty('--ry'); }
      });
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.classList.add('tilting');
      card.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
    });
  }

  renderDestinations(trips) {
    const scroller = document.getElementById('etxDestScroller');
    if (!scroller || !trips.length) return;
    scroller.innerHTML = trips.map((trip) => {
      const place = String(trip.name).split(/\s+/)[0];
      const summary = trip.subtitle || trip.promotion_title || '';
      return `
      <a class="etx-dest-card" href="${escapeHtml(trip.url)}" draggable="false">
        <img src="${escapeHtml(this.imageOf(trip))}" alt="${escapeHtml(trip.name)}" loading="lazy" draggable="false">
        <span class="etx-dest-stamp" aria-hidden="true">سهل السفر<b>${escapeHtml(place)}</b>✈</span>
        <div class="etx-dest-body">
          <span class="etx-dest-country"><i class="sicon-location" aria-hidden="true"></i> ${escapeHtml(place)}</span>
          <h3>${escapeHtml(trip.name)}</h3>
          ${summary ? `<p>${escapeHtml(summary)}</p>` : ''}
          <div class="etx-dest-meta"><span>اكتشف البرنامج</span><span class="etx-dest-go"><i class="sicon-arrow-left" aria-hidden="true"></i></span></div>
        </div>
      </a>`;
    }).join('');
    scroller.closest('section').hidden = false;
    this.initDestSlider(scroller);
  }

  initDestSlider(scroller) {
    const step = () => (scroller.querySelector('.etx-dest-card')?.offsetWidth || 300) + 22;
    document.getElementById('etxDestNext')?.addEventListener('click', () => scroller.scrollBy({ left: -step(), behavior: 'smooth' }));
    document.getElementById('etxDestPrev')?.addEventListener('click', () => scroller.scrollBy({ left: step(), behavior: 'smooth' }));
    let startX = 0, startScroll = 0, moved = false, pointerDown = false;
    scroller.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse') return;
      pointerDown = true; moved = false;
      startX = event.clientX; startScroll = scroller.scrollLeft;
    });
    window.addEventListener('pointermove', (event) => {
      if (!pointerDown) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 5 && !moved) { moved = true; scroller.classList.add('dragging'); }
      if (moved) scroller.scrollLeft = startScroll - delta;
    });
    window.addEventListener('pointerup', () => {
      if (!pointerDown) return;
      pointerDown = false;
      setTimeout(() => scroller.classList.remove('dragging'), 0);
    });
    // A drag must not open the trip under the cursor.
    scroller.addEventListener('click', (event) => { if (moved) { event.preventDefault(); moved = false; } }, true);
  }

  renderPlannerOptions(trips) {
    const select = document.getElementById('etxPlannerDestination');
    if (!select || !trips.length) return;
    select.insertAdjacentHTML('afterbegin', trips.map((trip) => `<option>${escapeHtml(trip.name)}</option>`).join(''));
    select.selectedIndex = 0;
  }

  renderMarquee(trips) {
    const track = document.getElementById('etxMarqueeTrips');
    if (!track || trips.length < 3) return;
    const line = trips.map((trip) => escapeHtml(String(trip.name).split(/\s+/)[0])).join(' ✈ ') + ' ✈';
    track.innerHTML = `<span>${line}</span><span>${line}</span>`;
  }

  renderMosaic(products) {
    const mosaic = document.getElementById('etxMosaic');
    const items = products.filter((product) => this.imageOf(product)).slice(0, 6);
    if (!mosaic || items.length < 3) return;
    mosaic.innerHTML = items.map((product) => `
      <figure><a href="${escapeHtml(product.url)}"><img src="${escapeHtml(this.imageOf(product))}" alt="${escapeHtml(product.name)}" loading="lazy"></a><figcaption>${escapeHtml(String(product.name).split(/\s+/)[0])}</figcaption></figure>`).join('');
    document.getElementById('etxMosaicSection').hidden = false;
  }

  async loadReviews() {
    const section = document.getElementById('etxTesti');
    const stack = document.getElementById('etxPostcards');
    if (!section || !salla.api.component?.getReviews) return;
    let reviews = [];
    try {
      const response = await salla.api.component.getReviews({ source: 'all', source_value: [], limit: 8 });
      reviews = ((response && response.data) || []).filter((review) => review.content);
    } catch (error) {
      return;
    }
    if (!reviews.length) return;
    stack.innerHTML = reviews.map((review) => {
      const name = review.customer?.name || review.name || 'مسافر';
      const rating = Math.round(Number(review.stars || review.rating || 5));
      const about = review.product?.name || 'سهل السفر';
      const image = this.imageOf(review.product);
      return `
      <article class="etx-postcard">
        <div>
          <div class="etx-stars-rate" aria-label="${rating} نجوم">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
          <blockquote>${escapeHtml(review.content)}</blockquote>
          <div class="etx-who"><span class="etx-initial">${escapeHtml(name.charAt(0))}</span><div><b>${escapeHtml(name)}</b><small>${escapeHtml(about)}</small></div></div>
        </div>
        <div class="etx-postcard-side" aria-hidden="true">
          <div class="etx-stamp">${image ? `<img src="${escapeHtml(image)}" alt="">` : ''}</div>
          <div class="etx-postmark">سهل السفر<br>✈</div>
          <div class="etx-postcard-lines"><span></span><span></span><span></span></div>
        </div>
      </article>`;
    }).join('');
    section.hidden = false;
    this.splitHeadings(section);
    this.observeReveal(section);
    this.initPostcards(stack);
  }

  initPostcards(stack) {
    const progress = document.querySelector('.etx-testi-progress i');
    let timer = null;
    let busy = false;
    const restart = () => {
      clearInterval(timer);
      if (progress) { progress.classList.remove('run'); void progress.offsetWidth; progress.classList.add('run'); }
      if (!reduceMotion) timer = setInterval(next, 5500);
    };
    const next = () => {
      if (busy || stack.children.length < 2) return;
      busy = true;
      const top = stack.firstElementChild;
      top.classList.add('fly');
      setTimeout(() => { top.classList.remove('fly'); stack.appendChild(top); busy = false; }, 650);
      restart();
    };
    stack.addEventListener('click', next);
    document.getElementById('etxTestiNext')?.addEventListener('click', next);
    restart();
  }
}

Home.initiateWhenReady(['index']);
