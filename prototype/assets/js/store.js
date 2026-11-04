/* =========================================================
   سهل السفر — عرض البيانات وصفحات المتجر
   ========================================================= */
(function () {
  'use strict';
  const ET = window.EasyTravel;
  const { ICONS, PRODUCTS, CATEGORIES, TESTIMONIALS, unsplash, wingsMark, formatMoney, formatMoneyText, whatsappLink, findProduct, cart, wishlist, user, storage } = ET;
  const params = new URLSearchParams(location.search);
  const $ = (selector, root = document) => root.querySelector(selector);

  const packageMessage = (product) => `السلام عليكم 👋\nأرغب بحجز «${product.name}» من سهل السفر.\nأرجو تزويدي بالتفاصيل والوجهات المتاحة.`;
  const hotelLabel = (product) => ({ launch: '4 نجوم', explore: '5 نجوم', elite: 'منتجعات فاخرة' }[product.id] || '4–5 نجوم');
  const daysLabel = (days) => `${days} أيام`;
  // Arabic number agreement: 3–10 take the plural, everything else the singular.
  const travelersLabel = (count) => `${count} ${count >= 3 && count <= 10 ? 'مسافرين' : 'مسافر'}`;
  const tripsLabel = (count) => `${count} ${count >= 3 && count <= 10 ? 'رحلات متاحة' : 'رحلة متاحة'}`;

  const upcomingMonths = () => {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(now.getFullYear(), now.getMonth() + i + 1, 1)));
  };

  /* ---------- Templates ---------- */
  const passTemplate = (product, index) => {
    const gates = ['A1', 'B7', 'VIP'];
    const seats = ['14C', '3A', '1A'];
    return `
    <article class="pass ${product.featured ? 'featured' : ''}" data-reveal style="--d:${index * 140}">
      ${product.featured ? `<span class="pass-ribbon">★ ${product.badge}</span>` : ''}
      <div class="pass-main">
        <div class="pass-top">
          <span class="pass-airline">${wingsMark(`wing-pass-${product.id}`)} سهل السفر</span>
          <span class="pass-class">${product.code}</span>
        </div>
        <h3>${product.name}</h3>
        <p class="pass-desc">${product.summary}</p>
        <div class="pass-route">
          <div><b>RUH</b><small>الرياض</small></div>
          <div class="pass-line">${ICONS.plane}</div>
          <div style="text-align:left"><b>${product.to}</b><small>وجهتك</small></div>
        </div>
        <ul class="pass-features">${product.features.map((feature) => `<li>${ICONS.check}<span>${feature}</span></li>`).join('')}</ul>
        <div class="pass-meta">
          <div><small>المدة</small><b>${daysLabel(product.days)}</b></div>
          <div><small>البوابة</small><b>${gates[index] || 'A1'}</b></div>
          <div><small>المقعد</small><b>${seats[index] || '1A'}</b></div>
        </div>
      </div>
      <div class="pass-tear" aria-hidden="true"></div>
      <div class="pass-stub">
        <div class="pass-price">
          <div><small>تبدأ من / للشخص</small><b>${formatMoney(product.price)}</b></div>
          <div class="barcode" aria-hidden="true"></div>
        </div>
        <div class="pass-actions">
          <a class="btn ${product.featured ? 'btn-primary' : 'btn-dark'}" data-wa="${packageMessage(product)}">${ICONS.whatsapp} احجز عبر واتساب</a>
          <a class="btn btn-outline icon-only" href="product.html?id=${product.id}" aria-label="تفاصيل ${product.name}">${ICONS.arrowLeft}</a>
        </div>
      </div>
    </article>`;
  };

  const destinationTemplate = (trip) => `
    <a class="dest-card" href="product.html?id=${trip.id}" draggable="false">
      <img src="${unsplash(trip.img, 700)}" alt="${trip.name}" loading="lazy" draggable="false">
      <span class="dest-stamp" aria-hidden="true">${trip.to}<b>${trip.country}</b>✈</span>
      <div class="dest-body">
        <span class="dest-country">${ICONS.pin} ${trip.country}</span>
        <h3>${trip.name}</h3>
        <p>${trip.summary}</p>
        <div class="dest-meta"><span>${daysLabel(trip.days)} · من <b>${formatMoneyText(trip.price)}</b></span><span class="dest-go">${ICONS.arrowLeft}</span></div>
      </div>
    </a>`;

  const postcardTemplate = (testimonial) => `
    <article class="postcard">
      <div>
        <div class="stars-rate" aria-label="5 نجوم">★★★★★</div>
        <blockquote>${testimonial.text}</blockquote>
        <div class="who"><span class="initial">${testimonial.name.charAt(0)}</span><div><b>${testimonial.name}</b><small>${testimonial.trip}</small></div></div>
      </div>
      <div class="postcard-side" aria-hidden="true">
        <div class="stamp"><img src="${unsplash(testimonial.img, 240)}" alt=""></div>
        <div class="postmark">سهل السفر<br>${testimonial.place}<br>✈</div>
        <div class="postcard-lines"><span></span><span></span><span></span></div>
      </div>
    </article>`;

  const productCardTemplate = (product, index = 0) => `
    <article class="product-card" style="--i:${index}">
      <a class="pc-media" href="product.html?id=${product.id}">
        <img src="${unsplash(product.img, 700)}" alt="${product.name}" loading="lazy">
        <span class="pc-dur">${ICONS.clock} ${daysLabel(product.days)}</span>
      </a>
      <div class="pc-badges">
        ${product.type === 'package' ? '<span class="badge dark">باقة</span>' : ''}
        ${product.badge ? `<span class="badge ${product.featured || product.oldPrice ? 'hot' : ''}">${product.badge}</span>` : ''}
      </div>
      <button class="pc-wish ${wishlist.has(product.id) ? 'on' : ''}" type="button" data-wish="${product.id}" aria-label="أضف ${product.name} إلى المفضلة" aria-pressed="${wishlist.has(product.id)}">${ICONS.heart}</button>
      <div class="pc-body">
        <span class="pc-route">${ICONS.plane} ${product.route}</span>
        <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
        <p>${product.summary}</p>
        <div class="pc-foot">
          <div class="price"><small>يبدأ من / للشخص</small><b>${formatMoney(product.price)}</b>${product.oldPrice ? `<del>${formatMoneyText(product.oldPrice)}</del>` : ''}</div>
          <button class="add-btn" type="button" data-add="${product.id}" aria-label="أضف ${product.name} إلى السلة">${ICONS.cartAdd}</button>
        </div>
      </div>
    </article>`;

  /* ---------- Global actions: add to cart / wishlist ---------- */
  document.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add]');
    if (addButton) {
      event.preventDefault();
      const product = findProduct(addButton.dataset.add);
      if (!product) return;
      cart.add(product.id, { travelers: 1 });
      ET.flyToCart(product.img, addButton);
      ET.toast({ img: product.img, title: 'أُضيفت إلى السلة ✈', text: product.name, link: { href: 'cart.html', label: 'عرض السلة' } });
      return;
    }
    const wishButton = event.target.closest('[data-wish]');
    if (wishButton) {
      event.preventDefault();
      const on = wishlist.toggle(wishButton.dataset.wish);
      document.querySelectorAll(`[data-wish="${wishButton.dataset.wish}"]`).forEach((button) => {
        button.classList.toggle('on', on);
        button.setAttribute('aria-pressed', String(on));
      });
      if (on) ET.toast({ title: 'أُضيفت إلى المفضلة ♥', text: findProduct(wishButton.dataset.wish)?.name });
    }
  });

  /* ---------- Home ---------- */
  const renderHome = () => {
    const passGrid = $('#passGrid');
    if (passGrid) passGrid.innerHTML = PRODUCTS.filter((product) => product.type === 'package').map(passTemplate).join('');
    const scroller = $('#destScroller');
    if (scroller) scroller.innerHTML = PRODUCTS.filter((product) => product.type === 'trip').map(destinationTemplate).join('');
    const postcards = $('#postcards');
    if (postcards) postcards.innerHTML = TESTIMONIALS.map(postcardTemplate).join('');
    document.querySelectorAll('[data-destination-select]').forEach((select) => {
      select.insertAdjacentHTML('beforeend', PRODUCTS.filter((product) => product.type === 'trip').map((trip) => `<option>${trip.country} — ${trip.name}</option>`).join('') + '<option>وجهة أخرى / ساعدوني في الاختيار</option>');
    });
    const plannerMonth = $('#plannerMonth');
    if (plannerMonth) plannerMonth.innerHTML = '<option value="">تاريخ مرن</option>' + upcomingMonths().map((month) => `<option>${month}</option>`).join('');
  };

  /* ---------- Packages listing ---------- */
  const renderListing = () => {
    const grid = $('#productGrid');
    if (!grid) return;
    const chips = $('#filterChips');
    const sortSelect = $('#sortSelect');
    const resultCount = $('#resultCount');
    let category = CATEGORIES.some((item) => item.id === params.get('cat')) ? params.get('cat') : 'all';

    chips.innerHTML = CATEGORIES.map((item) => {
      const count = item.id === 'all' ? PRODUCTS.length : PRODUCTS.filter((product) => product.cats.includes(item.id)).length;
      return `<button type="button" data-cat="${item.id}" class="${item.id === category ? 'is-active' : ''}">${item.name}<span>${count}</span></button>`;
    }).join('');

    const draw = () => {
      let list = PRODUCTS.filter((product) => category === 'all' || product.cats.includes(category));
      const sort = sortSelect.value;
      if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
      if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
      if (sort === 'days') list = [...list].sort((a, b) => a.days - b.days);
      grid.innerHTML = list.length ? list.map(productCardTemplate).join('') : '<p class="empty-filter">لا توجد رحلات في هذا التصنيف حالياً.</p>';
      resultCount.textContent = tripsLabel(list.length);
    };
    const redraw = () => {
      grid.querySelectorAll('.product-card').forEach((card) => card.classList.add('is-hiding'));
      setTimeout(draw, 280);
    };

    chips.addEventListener('click', (event) => {
      const button = event.target.closest('[data-cat]');
      if (!button || button.dataset.cat === category) return;
      category = button.dataset.cat;
      chips.querySelectorAll('button').forEach((chip) => chip.classList.toggle('is-active', chip === button));
      history.replaceState(null, '', category === 'all' ? 'packages.html' : `packages.html?cat=${category}`);
      redraw();
    });
    sortSelect.addEventListener('change', redraw);
    draw();
  };

  /* ---------- Product page ---------- */
  const renderProduct = () => {
    const root = $('#productRoot');
    if (!root) return;
    const product = findProduct(params.get('id')) || PRODUCTS[1];
    document.title = `${product.name} | سهل السفر`;
    const months = upcomingMonths();
    const related = PRODUCTS.filter((item) => item.id !== product.id && item.cats.some((cat) => product.cats.includes(cat))).slice(0, 3);

    root.innerHTML = `
      <nav class="breadcrumb" aria-label="مسار التنقل"><a href="index.html">الرئيسية</a><span>/</span><a href="packages.html">الباقات والرحلات</a><span>/</span><span>${product.name}</span></nav>
      <div class="product-layout">
        <div class="gallery">
          <div class="gallery-main" id="galleryMain">
            <img src="${unsplash(product.gallery[0], 1400)}" alt="${product.name}">
            <div class="pc-badges">${product.type === 'package' ? '<span class="badge dark">باقة</span>' : ''}${product.badge ? `<span class="badge hot">${product.badge}</span>` : ''}</div>
          </div>
          <div class="gallery-thumbs">
            ${product.gallery.map((id, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" data-image="${id}" aria-label="صورة ${index + 1}"><img src="${unsplash(id, 300)}" alt=""></button>`).join('')}
          </div>
        </div>
        <div class="product-info">
          <span class="pc-route">${ICONS.plane} ${product.route}</span>
          <h1>${product.name}</h1>
          <p class="summary">${product.summary}</p>
          <div class="facts">
            <div class="fact">${ICONS.clock}<small>المدة</small><b>${daysLabel(product.days)}</b></div>
            <div class="fact">${ICONS.pin}<small>الوجهة</small><b>${product.country || 'حسب اختيارك'}</b></div>
            <div class="fact">${ICONS.hotel}<small>الإقامة</small><b>${hotelLabel(product)}</b></div>
          </div>
          <form class="buy-box" id="buyForm">
            <div class="buy-price">
              <div><small>السعر للشخص</small><b>${formatMoney(product.price)}</b>${product.oldPrice ? ` <del class="price">${formatMoneyText(product.oldPrice)}</del>` : ''}</div>
              <div class="buy-total"><small>الإجمالي</small><b id="buyTotal"></b></div>
            </div>
            <div class="option-row">
              <div class="field"><label id="travelersLabel">عدد المسافرين</label>
                <div class="stepper" role="group" aria-labelledby="travelersLabel"><button type="button" data-step="1" aria-label="زيادة">+</button><output id="travelersOut">2</output><button type="button" data-step="-1" aria-label="إنقاص">−</button></div>
              </div>
              <div class="field"><label for="travelMonth">شهر السفر</label>
                <select id="travelMonth"><option value="">تاريخ مرن</option>${months.map((month) => `<option>${month}</option>`).join('')}</select>
              </div>
            </div>
            <div class="buy-actions">
              <button class="btn btn-primary btn-lg" type="submit" id="addToCart">${ICONS.cartAdd} أضف إلى السلة</button>
              <button class="wish-big ${wishlist.has(product.id) ? 'on' : ''}" type="button" data-wish="${product.id}" aria-label="أضف إلى المفضلة" aria-pressed="${wishlist.has(product.id)}">${ICONS.heart}</button>
              <a class="btn btn-wa btn-lg" id="buyWhatsapp" target="_blank" rel="noopener">${ICONS.whatsapp} احجز مباشرة عبر واتساب</a>
            </div>
            <div class="assure"><span>${ICONS.shield} ضمان سهل السفر</span><span>${ICONS.lock} دفع آمن</span><span>${ICONS.headset} دعم على مدار الساعة</span></div>
          </form>
        </div>
      </div>

      <div class="tabs">
        <div class="tab-list" role="tablist">
          <span class="tab-ink" aria-hidden="true"></span>
          <button role="tab" aria-selected="true" aria-controls="tab-plan" id="t-plan">البرنامج اليومي</button>
          <button role="tab" aria-selected="false" aria-controls="tab-incl" id="t-incl">ما تشمله الرحلة</button>
          <button role="tab" aria-selected="false" aria-controls="tab-terms" id="t-terms">الشروط</button>
        </div>
        <div class="tab-panel" role="tabpanel" id="tab-plan" aria-labelledby="t-plan">
          <ol class="itinerary">${product.itinerary.map(([title, text], index) => `<li><small>اليوم ${index + 1}</small><h4>${title}</h4><p>${text}</p></li>`).join('')}</ol>
        </div>
        <div class="tab-panel" role="tabpanel" id="tab-incl" aria-labelledby="t-incl" hidden>
          <div class="incl-grid">
            <div class="incl-box yes"><h4>${ICONS.check} تشمل</h4><ul>${product.includes.map((item) => `<li>${ICONS.check}${item}</li>`).join('')}</ul></div>
            <div class="incl-box no"><h4>${ICONS.x} لا تشمل</h4><ul>${product.excludes.map((item) => `<li>${ICONS.x}${item}</li>`).join('')}</ul></div>
          </div>
        </div>
        <div class="tab-panel" role="tabpanel" id="tab-terms" aria-labelledby="t-terms" hidden>
          <ul class="terms">
            <li>الأسعار للشخص الواحد في غرفة مزدوجة، وقد تتغير حسب الموسم وتوفر المقاعد.</li>
            <li>يُؤكَّد الحجز بعد استلام الدفعة والتأكد من توفر الطيران والفنادق.</li>
            <li>سياسة الإلغاء والاسترجاع موضحة في <a href="guarantee.html" style="color:var(--orange)">صفحة الضمان</a> وفي عقد الحجز.</li>
            <li>يجب أن يكون جواز السفر صالحاً لمدة 6 أشهر على الأقل من تاريخ السفر.</li>
          </ul>
        </div>
      </div>

      ${related.length ? `<div style="margin-top:90px"><div class="section-head"><span class="kicker">قد تعجبك أيضاً</span><h2>رحلات مشابهة</h2></div><div class="product-grid">${related.map(productCardTemplate).join('')}</div></div>` : ''}`;

    // Gallery
    const galleryMain = $('#galleryMain');
    root.querySelector('.gallery-thumbs').addEventListener('click', (event) => {
      const button = event.target.closest('[data-image]');
      if (!button || button.classList.contains('is-active')) return;
      root.querySelectorAll('.gallery-thumbs button').forEach((thumb) => thumb.classList.toggle('is-active', thumb === button));
      const previous = galleryMain.querySelector('img');
      const next = document.createElement('img');
      next.src = unsplash(button.dataset.image, 1400);
      next.alt = product.name;
      next.style.opacity = '0';
      galleryMain.insertBefore(next, previous.nextSibling);
      next.onload = () => { requestAnimationFrame(() => { next.style.opacity = '1'; previous.classList.add('is-leaving'); setTimeout(() => previous.remove(), 600); }); };
    });

    // Buy box
    let travelers = 2;
    const output = $('#travelersOut');
    const monthSelect = $('#travelMonth');
    const totalElement = $('#buyTotal');
    const whatsappButton = $('#buyWhatsapp');
    const stickyBuy = $('#stickyBuy');
    const update = () => {
      output.textContent = travelers;
      totalElement.innerHTML = formatMoney(product.price * travelers);
      whatsappButton.href = whatsappLink([
        'السلام عليكم 👋',
        `أرغب بحجز: ${product.name}`,
        `• عدد المسافرين: ${travelers}`,
        `• شهر السفر: ${monthSelect.value || 'مرن'}`,
        `• السعر التقديري: ${formatMoneyText(product.price * travelers)}`,
      ].join('\n'));
      if (stickyBuy) stickyBuy.querySelector('b').innerHTML = formatMoney(product.price * travelers);
    };
    root.querySelector('.stepper').addEventListener('click', (event) => {
      const button = event.target.closest('[data-step]');
      if (!button) return;
      travelers = Math.min(20, Math.max(1, travelers + Number(button.dataset.step)));
      update();
    });
    monthSelect.addEventListener('change', update);
    const addToCart = (event) => {
      event?.preventDefault();
      cart.add(product.id, { travelers, month: monthSelect.value });
      ET.flyToCart(product.img, $('#addToCart'));
      ET.toast({ img: product.img, title: 'أُضيفت إلى السلة ✈', text: `${product.name} · ${travelersLabel(travelers)}`, link: { href: 'cart.html', label: 'عرض السلة' } });
    };
    $('#buyForm').addEventListener('submit', addToCart);
    update();

    // Tabs
    const tabList = root.querySelector('.tab-list');
    const ink = tabList.querySelector('.tab-ink');
    const moveInk = (tab) => { ink.style.left = `${tab.offsetLeft}px`; ink.style.width = `${tab.offsetWidth}px`; };
    tabList.addEventListener('click', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (!tab) return;
      tabList.querySelectorAll('[role="tab"]').forEach((other) => {
        const selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
      });
      moveInk(tab);
    });
    requestAnimationFrame(() => moveInk(tabList.querySelector('[aria-selected="true"]')));
    window.addEventListener('resize', () => moveInk(tabList.querySelector('[aria-selected="true"]')));

    // Sticky mobile buy bar
    if (stickyBuy) {
      stickyBuy.querySelector('button').addEventListener('click', addToCart);
      new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        stickyBuy.classList.toggle('show', show);
        document.body.classList.toggle('has-sticky-buy', show && getComputedStyle(stickyBuy).display !== 'none');
      }).observe($('#buyForm'));
      update();
    }
  };

  /* ---------- Cart ---------- */
  const COUPONS = { SAHL10: 0.1 };
  const renderCart = () => {
    const root = $('#cartRoot');
    if (!root) return;
    let discountRate = storage.get('et-coupon', 0);

    const draw = () => {
      const lines = cart.lines();
      if (!lines.length) {
        root.innerHTML = `
          <div class="empty-cart">
            <svg class="suitcase" viewBox="0 0 200 180" aria-hidden="true">
              <rect x="40" y="50" width="120" height="110" rx="18" fill="#1B2A4A"/>
              <rect x="78" y="26" width="44" height="30" rx="10" fill="none" stroke="#1B2A4A" stroke-width="8"/>
              <rect x="40" y="96" width="120" height="10" fill="#F39237"/>
              <circle cx="66" cy="166" r="8" fill="#1B2A4A"/><circle cx="134" cy="166" r="8" fill="#1B2A4A"/>
              <rect x="112" y="64" width="34" height="22" rx="5" fill="#F7B267" transform="rotate(-10 129 75)"/>
              <path d="M58 70 L58 140" stroke="rgba(255,255,255,.18)" stroke-width="4" stroke-linecap="round"/>
            </svg>
            <h2>حقيبتك ما زالت فارغة</h2>
            <p>العالم ينتظرك. اختر وجهتك وابدأ رحلتك القادمة.</p>
            <a class="btn btn-primary btn-lg" href="packages.html">${ICONS.compass} استكشف الرحلات</a>
          </div>`;
        return;
      }
      const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
      const discount = subtotal * discountRate;
      const total = subtotal - discount;
      root.innerHTML = `
        <ol class="cart-steps"><li class="current" data-n="1">السلة</li><li data-n="2">بيانات المسافرين</li><li data-n="3">الدفع</li><li data-n="4">التأكيد</li></ol>
        <div class="cart-layout">
          <div class="cart-list">
            ${lines.map((line) => `
              <article class="cart-item" data-index="${line.index}">
                <a class="thumb" href="product.html?id=${line.product.id}"><img src="${unsplash(line.product.img, 300)}" alt="${line.product.name}"></a>
                <div>
                  <h3>${line.product.name}</h3>
                  <div class="meta"><span>${ICONS.clock}${daysLabel(line.product.days)}</span><span>${ICONS.calendar}${line.month || 'تاريخ مرن'}</span><span>${ICONS.plane}${line.product.route}</span></div>
                  <div class="stepper" role="group" aria-label="عدد المسافرين"><button type="button" data-qty="1" aria-label="زيادة">+</button><output>${travelersLabel(line.travelers)}</output><button type="button" data-qty="-1" aria-label="إنقاص">−</button></div>
                </div>
                <div class="line-total"><b>${formatMoney(line.total)}</b><button class="remove-btn" type="button" data-remove>${ICONS.trash} حذف</button></div>
              </article>`).join('')}
          </div>
          <aside class="summary-card">
            <h3>ملخص الحجز</h3>
            <div class="sum-row"><span>المجموع الفرعي</span><span>${formatMoneyText(subtotal)}</span></div>
            ${discount ? `<div class="sum-row"><span>الخصم</span><span>− ${formatMoneyText(discount)}</span></div>` : ''}
            <div class="sum-row"><span>رسوم الخدمة</span><span>مجاناً</span></div>
            <form class="coupon" id="couponForm"><input name="code" placeholder="كود الخصم" aria-label="كود الخصم" autocomplete="off"><button type="submit">تطبيق</button></form>
            <p class="coupon-msg" id="couponMsg" role="status">${discountRate ? 'تم تطبيق الخصم ✓' : ''}</p>
            <div class="sum-row total"><span>الإجمالي<br><small style="font-size:12px;color:#8794B3">شامل ضريبة القيمة المضافة</small></span><b>${formatMoneyText(total)}</b></div>
            <button class="btn btn-primary btn-lg btn-block" type="button" id="checkoutBtn">${ICONS.lock} إتمام الطلب</button>
            <a class="btn btn-wa btn-block" id="cartWhatsapp" target="_blank" rel="noopener">${ICONS.whatsapp} أرسل الطلب عبر واتساب</a>
            <div class="secure">${ICONS.shield} دفع آمن ومشفّر عبر سلة</div>
          </aside>
        </div>`;

      $('#cartWhatsapp').href = whatsappLink([
        'السلام عليكم 👋 أرغب بتأكيد الحجز التالي:',
        ...lines.map((line) => `• ${line.product.name} — ${travelersLabel(line.travelers)} — ${line.month || 'تاريخ مرن'}`),
        `الإجمالي التقديري: ${formatMoneyText(total)}`,
      ].join('\n'));

      $('#couponForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const code = event.target.code.value.trim().toUpperCase();
        if (COUPONS[code]) { discountRate = COUPONS[code]; storage.set('et-coupon', discountRate); draw(); }
        else $('#couponMsg').textContent = 'الكود غير صالح، تأكد منه وحاول مرة أخرى.';
      });

      $('#checkoutBtn').addEventListener('click', () => {
        const order = {
          number: `ET-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString(),
          items: lines.map((line) => ({ id: line.product.id, name: line.product.name, img: line.product.img, travelers: line.travelers, month: line.month, total: line.total })),
          total,
          status: 'pending',
        };
        storage.set('et-orders', [order, ...storage.get('et-orders', [])]);
        storage.set('et-coupon', 0);
        cart.clear();
        location.href = `thank-you.html?order=${order.number}`;
      });
    };

    root.addEventListener('click', (event) => {
      const item = event.target.closest('.cart-item');
      if (!item) return;
      const index = Number(item.dataset.index);
      const qtyButton = event.target.closest('[data-qty]');
      if (qtyButton) {
        const line = cart.items()[index];
        cart.update(index, { travelers: Math.min(20, Math.max(1, line.travelers + Number(qtyButton.dataset.qty))) });
        draw();
      }
      if (event.target.closest('[data-remove]')) {
        item.classList.add('removing');
        setTimeout(() => { cart.remove(index); draw(); }, 450);
      }
    });
    draw();
  };

  /* ---------- Login (OTP) ---------- */
  const renderLogin = () => {
    const phoneForm = $('#phoneForm');
    if (!phoneForm) return;
    const otpForm = $('#otpForm');
    const otpInputs = [...otpForm.querySelectorAll('.otp input')];
    const phoneError = $('#phoneError');
    let phone = '';

    phoneForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = phoneForm.phone.value.replace(/\D/g, '').replace(/^0/, '');
      if (!/^5\d{8}$/.test(value)) { phoneError.textContent = 'أدخل رقم جوال سعودي صحيح يبدأ بـ 5 (9 أرقام).'; return; }
      phoneError.textContent = '';
      phone = `+966${value}`;
      $('#otpPhone').textContent = phone;
      phoneForm.closest('.auth-step').hidden = true;
      otpForm.closest('.auth-step').hidden = false;
      otpInputs[0].focus();
    });

    const tryComplete = () => {
      const code = otpInputs.map((input) => input.value).join('');
      if (code.length !== otpInputs.length) return;
      user.set({ phone, name: storage.get('et-user', null)?.name || '' });
      location.href = params.get('next') || 'account.html';
    };
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(-1);
        input.classList.toggle('filled', !!input.value);
        if (input.value && otpInputs[index + 1]) otpInputs[index + 1].focus();
        tryComplete();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !input.value && otpInputs[index - 1]) otpInputs[index - 1].focus();
      });
      input.addEventListener('paste', (event) => {
        const digits = (event.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, otpInputs.length);
        if (!digits) return;
        event.preventDefault();
        digits.split('').forEach((digit, i) => { otpInputs[i].value = digit; otpInputs[i].classList.add('filled'); });
        tryComplete();
      });
    });
    otpForm.addEventListener('submit', (event) => { event.preventDefault(); tryComplete(); });
    $('#changePhone').addEventListener('click', () => {
      otpForm.closest('.auth-step').hidden = true;
      phoneForm.closest('.auth-step').hidden = false;
      phoneForm.phone.focus();
    });
  };

  /* ---------- Account ---------- */
  const renderAccount = () => {
    const root = $('#accountRoot');
    if (!root) return;
    const current = user.get();
    if (!current) { location.replace('login.html?next=account.html'); return; }
    const orders = storage.get('et-orders', []);
    const wished = wishlist.ids().map(findProduct).filter(Boolean);
    const dateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });

    root.innerHTML = `
      <div class="account-layout">
        <aside class="account-side">
          <div class="account-user"><span class="avatar">${(current.name || 'م').charAt(0)}</span><div><b>${current.name || 'مسافرنا العزيز'}</b><small>${current.phone}</small></div></div>
          <nav class="account-nav" aria-label="قائمة الحساب">
            <button type="button" class="is-active" data-panel="orders">${ICONS.ticket} طلباتي <span style="margin-inline-start:auto">${orders.length}</span></button>
            <button type="button" data-panel="wishlist">${ICONS.heart} المفضلة <span style="margin-inline-start:auto">${wished.length}</span></button>
            <button type="button" data-panel="profile">${ICONS.user} بياناتي</button>
            <button type="button" class="logout" id="logoutBtn">${ICONS.logout} تسجيل الخروج</button>
          </nav>
        </aside>
        <div class="account-main">
          <section class="account-panel" data-panel="orders">
            <h2>طلباتي ✈</h2>
            ${orders.length ? orders.map((order) => `
              <article class="order-pass">
                <div class="op-main"><img src="${unsplash(order.items[0].img, 200)}" alt="">
                  <div><h3>${order.items.map((item) => item.name).join(' + ')}</h3>
                  <div class="meta"><span>${dateFormatter.format(new Date(order.date))}</span><span>${travelersLabel(order.items.reduce((sum, item) => sum + item.travelers, 0))}</span><span>${order.items[0].month || 'تاريخ مرن'}</span></div></div>
                </div>
                <div class="op-stub"><span class="status ${order.status}">${order.status === 'pending' ? 'بانتظار التأكيد' : 'مؤكد'}</span><b>${formatMoneyText(order.total)}</b><small>${order.number}</small></div>
              </article>`).join('') : `<div class="empty-state">${ICONS.ticket}<p>لا توجد طلبات بعد. رحلتك الأولى معنا تنتظرك!</p><a class="btn btn-primary" href="packages.html">تصفح الرحلات</a></div>`}
          </section>
          <section class="account-panel" data-panel="wishlist" hidden>
            <h2>المفضلة ♥</h2>
            ${wished.length ? `<div class="product-grid">${wished.map(productCardTemplate).join('')}</div>` : `<div class="empty-state">${ICONS.heart}<p>لم تضف أي رحلة إلى المفضلة بعد.</p><a class="btn btn-primary" href="packages.html">اكتشف الوجهات</a></div>`}
          </section>
          <section class="account-panel" data-panel="profile" hidden>
            <h2>بياناتي</h2>
            <form class="profile-form" id="profileForm">
              <div class="form-grid">
                <div class="field"><label for="pName">الاسم الكامل</label><input id="pName" name="name" value="${current.name || ''}" autocomplete="name"></div>
                <div class="field"><label for="pPhone">رقم الجوال</label><input id="pPhone" value="${current.phone}" disabled dir="ltr"></div>
                <div class="field full"><label for="pEmail">البريد الإلكتروني</label><input id="pEmail" name="email" type="email" value="${current.email || ''}" autocomplete="email" dir="ltr"></div>
              </div>
              <button class="btn btn-dark" type="submit" style="margin-top:20px">حفظ التغييرات</button>
            </form>
          </section>
        </div>
      </div>`;

    root.querySelector('.account-nav').addEventListener('click', (event) => {
      const button = event.target.closest('[data-panel]');
      if (!button) return;
      root.querySelectorAll('.account-nav [data-panel]').forEach((other) => other.classList.toggle('is-active', other === button));
      root.querySelectorAll('.account-panel').forEach((panel) => { panel.hidden = panel.dataset.panel !== button.dataset.panel; });
    });
    $('#logoutBtn').addEventListener('click', () => { user.clear(); location.href = 'index.html'; });
    $('#profileForm').addEventListener('submit', (event) => {
      event.preventDefault();
      user.set({ ...current, name: event.target.name.value.trim(), email: event.target.email.value.trim() });
      ET.toast({ title: 'تم حفظ بياناتك ✓' });
      setTimeout(renderAccount, 300);
    });
  };

  /* ---------- Thank you ---------- */
  const renderThanks = () => {
    const root = $('#ticketRoot');
    if (!root) return;
    const orders = storage.get('et-orders', []);
    const order = orders.find((item) => item.number === params.get('order')) || orders[0];
    const confetti = $('#confetti');
    if (confetti && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const colors = ['#F39237', '#F7B267', '#1B2A4A', '#4ADE80', '#8FA6D6'];
      confetti.innerHTML = Array.from({ length: 70 }, () => `<i style="left:${Math.random() * 100}%;background:${colors[Math.floor(Math.random() * colors.length)]};--t:${(2.5 + Math.random() * 2.5).toFixed(2)}s;--d:${(3 + Math.random() * 1.5).toFixed(2)}s"></i>`).join('');
    }
    if (!order) {
      root.innerHTML = '';
      return;
    }
    const dateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
    root.innerHTML = `
      <div class="ticket">
        <div class="ticket-head"><span>بطاقة الحجز</span><small>${order.number}</small></div>
        <div class="ticket-body">
          <div><small>التاريخ</small><b>${dateFormatter.format(new Date(order.date))}</b></div>
          <div><small>الحالة</small><b>بانتظار التأكيد</b></div>
          <div><small>الإجمالي</small><b>${formatMoneyText(order.total)}</b></div>
        </div>
        <div class="ticket-items">${order.items.map((item) => `<div><span>${item.name} · ${travelersLabel(item.travelers)}</span><span>${formatMoneyText(item.total)}</span></div>`).join('')}</div>
      </div>`;
    const confirm = $('#confirmWhatsapp');
    if (confirm) {
      confirm.href = whatsappLink([
        `السلام عليكم 👋 أرسلت طلب الحجز رقم ${order.number}`,
        ...order.items.map((item) => `• ${item.name} — ${travelersLabel(item.travelers)}`),
        `الإجمالي: ${formatMoneyText(order.total)}`,
        'أرجو التأكيد وإرسال الخطوات التالية.',
      ].join('\n'));
    }
  };

  renderHome();
  renderListing();
  renderProduct();
  renderCart();
  renderLogin();
  renderAccount();
  renderThanks();
  ET.bindWhatsapp();
})();
