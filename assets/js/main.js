/* =========================================================
   سهل السفر — المؤثرات والحركة
   ========================================================= */
(function () {
  'use strict';
  const ET = window.EasyTravel;
  const html = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const introRunning = () => html.classList.contains('is-intro');
  const afterIntro = (callback) => (introRunning() ? document.addEventListener('intro:done', callback, { once: true }) : callback());
  // Wait for the preloader, then for the home intro (if any).
  const whenReady = (callback) => {
    if (html.classList.contains('is-loading')) document.addEventListener('preloader:done', () => whenReady(callback), { once: true });
    else afterIntro(callback);
  };
  const pageCovered = () => html.classList.contains('is-loading') || introRunning();

  /* ---------- Smooth scroll (Lenis) ---------- */
  if (!reduceMotion && window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    ET.lenis = lenis;
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (pageCovered()) { lenis.stop(); whenReady(() => lenis.start()); }
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      if (ET.lenis) ET.lenis.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Split headings into words (Arabic letters stay joined) ---------- */
  document.querySelectorAll('[data-split]').forEach((element) => {
    let index = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(part)); return; }
            const outer = document.createElement('span');
            outer.className = 'w';
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

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    [...group.children].forEach((child, index) => child.style.setProperty('--i', index));
  });

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  ET.observeReveal = (root = document) => root.querySelectorAll('[data-reveal], [data-split], [data-stagger], .checklist').forEach((element) => {
    if (!element.classList.contains('is-in')) revealObserver.observe(element);
  });
  whenReady(() => setTimeout(() => ET.observeReveal(), 50));

  /* ---------- Parallax ---------- */
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  if (!reduceMotion && parallaxItems.length) {
    let ticking = false;
    const update = () => {
      const viewport = window.innerHeight;
      parallaxItems.forEach((item) => {
        const rect = item.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewport) return;
        const speed = parseFloat(item.dataset.parallax);
        const offset = (rect.top + rect.height / 2 - viewport / 2) * speed;
        item.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)${item.dataset.scale ? ` scale(${item.dataset.scale})` : ''}`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Destinations slider (drag + arrows) ---------- */
  const scroller = document.getElementById('destScroller');
  if (scroller) {
    const step = () => (scroller.querySelector('.dest-card')?.offsetWidth || 300) + 22;
    document.getElementById('destNext')?.addEventListener('click', () => scroller.scrollBy({ left: -step(), behavior: 'smooth' }));
    document.getElementById('destPrev')?.addEventListener('click', () => scroller.scrollBy({ left: step(), behavior: 'smooth' }));
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
  }

  /* ---------- 3D tilt for boarding passes ---------- */
  if (finePointer && !reduceMotion) {
    document.addEventListener('pointermove', (event) => {
      const card = event.target.closest?.('.pass');
      document.querySelectorAll('.pass.tilting').forEach((other) => {
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

  /* ---------- Journey flight path ---------- */
  const journey = document.getElementById('journey');
  if (journey) {
    const svg = journey.querySelector('svg');
    const line = journey.querySelector('#journeyLine');
    const plane = journey.querySelector('#journeyPlane');
    const marksGroup = journey.querySelector('#journeyMarks');
    const steps = [...journey.querySelectorAll('.journey-step')];
    const length = line.getTotalLength();
    line.style.strokeDasharray = `${length}`;

    // Find the path length closest to each step's column center (RTL: first step on the right).
    const samples = Array.from({ length: 400 }, (_, i) => {
      const at = (i / 399) * length;
      return { at, point: line.getPointAtLength(at) };
    });
    const stepStops = steps.map((_, index) => {
      const targetX = 1000 - (index + 0.5) * (1000 / steps.length);
      const best = samples.reduce((closest, sample) => (Math.abs(sample.point.x - targetX) < Math.abs(closest.point.x - targetX) ? sample : closest));
      const mark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      mark.setAttribute('cx', best.point.x); mark.setAttribute('cy', best.point.y); mark.setAttribute('r', 9);
      mark.setAttribute('class', 'journey-mark');
      marksGroup.appendChild(mark);
      return { fraction: best.at / length, mark };
    });

    let target = 0, current = -1, animating = false;
    const measure = () => {
      const rect = svg.getBoundingClientRect();
      const viewport = window.innerHeight;
      target = clamp((viewport * 0.85 - rect.top) / (viewport * 0.6), 0, 1);
      if (!animating) { animating = true; requestAnimationFrame(render); }
    };
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
      stepStops.forEach((stop, index) => {
        const on = current >= stop.fraction - 0.02;
        stop.mark.classList.toggle('on', on);
        steps[index].classList.toggle('on', on);
      });
      if (animating) requestAnimationFrame(render);
    };
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  }

  /* ---------- Departure board (split-flap) ---------- */
  const board = document.querySelector('.board');
  if (board) {
    const DIGITS = '0123456789';
    board.querySelectorAll('.board-digits').forEach((holder) => {
      holder.innerHTML = [...holder.dataset.text].map((char) => `<span class="flap" data-final="${char}">${/\d/.test(char) ? '0' : char}</span>`).join('');
    });
    const clock = board.querySelector('.clock');
    if (clock) {
      const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }) + ' RUH'; };
      tick(); setInterval(tick, 30000);
    }
    const flip = () => {
      board.querySelectorAll('.flap').forEach((flap, index) => {
        const final = flap.dataset.final;
        if (!/\d/.test(final)) return;
        let rounds = 8 + index * 2;
        const timer = setInterval(() => {
          flap.classList.remove('tick'); void flap.offsetWidth; flap.classList.add('tick');
          flap.textContent = rounds <= 0 ? final : DIGITS[Math.floor(Math.random() * 10)];
          if (rounds-- <= 0) clearInterval(timer);
        }, reduceMotion ? 0 : 70);
      });
    };
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      flip(); observer.disconnect();
    }, { threshold: 0.4 }).observe(board);
  }

  /* ---------- Postcards stack ---------- */
  const stack = document.getElementById('postcards');
  if (stack) {
    const progress = document.querySelector('.testi-progress i');
    let timer = null;
    let busy = false;
    const next = () => {
      if (busy || stack.children.length < 2) return;
      busy = true;
      const top = stack.firstElementChild;
      top.classList.add('fly');
      setTimeout(() => {
        top.classList.remove('fly');
        stack.appendChild(top);
        busy = false;
      }, 650);
      restart();
    };
    const restart = () => {
      clearInterval(timer);
      if (progress) { progress.classList.remove('run'); void progress.offsetWidth; progress.classList.add('run'); }
      if (!reduceMotion) timer = setInterval(next, 5500);
    };
    stack.addEventListener('click', next);
    document.getElementById('testiNext')?.addEventListener('click', next);
    restart();
  }

  /* ---------- Passport ---------- */
  const passport = document.querySelector('.passport');
  if (passport) {
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => passport.classList.add('is-open'), 350);
      observer.disconnect();
    }, { threshold: 0.45 }).observe(passport);
  }
})();
