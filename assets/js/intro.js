/* =========================================================
   سهل السفر — شاشة الافتتاح
   طائرة تعبر فوق المحيط وقت الغروب ← خيط الطائرة يكتب الشعار ← سحب ← الشعار ← الموقع
   ========================================================= */
(function () {
  'use strict';
  const html = document.documentElement;
  const intro = document.getElementById('intro');
  if (!intro) return;
  if (!html.classList.contains('is-intro')) { intro.remove(); return; }
  try { sessionStorage.setItem('et-intro', '1'); } catch (error) { /* ignore */ }

  const HORIZON = 600;
  const wavePath = (y, amplitude, length) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < 2400; x += length) d += ` q${length / 4} ${-amplitude} ${length / 2} 0 t${length / 2} 0`;
    return `${d} V900 H0 Z`;
  };
  const reflections = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const width = 240 - i * 28;
    return `<rect class="shimmer" x="${800 - width / 2}" y="${HORIZON + 14 + i * 22}" width="${width}" height="3" rx="1.5" fill="#FFD9A0" opacity="${0.75 - i * 0.08}" style="animation-delay:${i * 0.25}s"/>`;
  }).join('');
  const stars = Array.from({ length: 40 }, () => {
    const x = Math.random() * 1600;
    const y = Math.random() * 260;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(Math.random() * 1.4 + 0.4).toFixed(1)}" fill="#fff" opacity="${(Math.random() * 0.6 + 0.2).toFixed(2)}"/>`;
  }).join('');
  const planeShape = `
    <path d="M0 -6 L30 -6 L12 -28 L2 -28 Z" fill="#1A2342"/>
    <path d="M-70 0 C-68 -8 -55 -10 -40 -10 L50 -9 C58 -9 66 -14 72 -32 L81 -32 L77 -8 C81 -6 83 -3 83 0 C83 4 77 6 66 6 L-40 8 C-56 8 -68 6 -70 0 Z" fill="#0D1630"/>
    <path d="M-8 2 L28 2 L2 36 L-10 36 Z" fill="#0D1630"/>
    <path d="M58 0 L82 0 L75 12 L67 12 Z" fill="#0D1630"/>
    <circle cx="79" cy="-30" r="2.2" fill="#FF5A5A"><animate attributeName="opacity" values="1;0.1;1" dur="1s" repeatCount="indefinite"/></circle>`;

  intro.innerHTML = `
    <svg class="intro-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="introSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0D1630"/><stop offset=".42" stop-color="#2B2B58"/>
          <stop offset=".7" stop-color="#9A4E6A"/><stop offset=".88" stop-color="#F39237"/><stop offset="1" stop-color="#FFC77D"/>
        </linearGradient>
        <linearGradient id="introSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4A3556"/><stop offset=".35" stop-color="#1F2448"/><stop offset="1" stop-color="#0B1226"/>
        </linearGradient>
        <radialGradient id="introSun"><stop offset="0" stop-color="#FFF1CF"/><stop offset=".6" stop-color="#FFC56E"/><stop offset="1" stop-color="#F39237"/></radialGradient>
        <radialGradient id="introGlow"><stop offset="0" stop-color="#FFB45C" stop-opacity=".55"/><stop offset="1" stop-color="#FFB45C" stop-opacity="0"/></radialGradient>
        <filter id="introBlur"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="1600" height="${HORIZON}" fill="url(#introSky)"/>
      ${stars}
      <circle cx="800" cy="${HORIZON}" r="420" fill="url(#introGlow)"/>
      <circle cx="800" cy="${HORIZON - 6}" r="150" fill="url(#introSun)"/>
      <path d="M1040 ${HORIZON} q50 -26 110 -12 q40 -24 92 -2 q34 -12 66 14 z" fill="#2A2547" opacity=".85"/>
      <path d="M260 ${HORIZON} q40 -16 90 -6 q30 -12 64 6 z" fill="#2A2547" opacity=".7"/>
      <rect y="${HORIZON}" width="1600" height="${900 - HORIZON}" fill="url(#introSea)"/>
      ${reflections}
      <path class="wave" d="${wavePath(HORIZON + 40, 5, 200)}" fill="#2A2850" opacity=".55" style="--dur:7s"/>
      <path class="wave" d="${wavePath(HORIZON + 110, 8, 400)}" fill="#1A1F42" opacity=".6" style="--dur:10s"/>
      <path class="wave" d="${wavePath(HORIZON + 200, 12, 400)}" fill="#0F1530" opacity=".85" style="--dur:6s"/>
      <path id="introTrail" class="intro-trail" d="M1820 520 C 1300 470, 700 470, -220 330"/>
      <g opacity=".22" filter="url(#introBlur)"><g id="introPlaneReflection">${planeShape}</g></g>
      <g id="introPlane">${planeShape}</g>
    </svg>
    <div class="intro-text">العالم أقرب إليك<span class="intro-sub">احجز رحلتك حول العالم</span></div>
    <div class="intro-clouds">
      <span style="--x:18%;--y:30%;--s:75vmax;--dl:0ms"></span>
      <span style="--x:82%;--y:24%;--s:80vmax;--dl:90ms"></span>
      <span style="--x:50%;--y:62%;--s:95vmax;--dl:160ms"></span>
      <span style="--x:8%;--y:82%;--s:70vmax;--dl:220ms"></span>
      <span style="--x:92%;--y:84%;--s:80vmax;--dl:260ms"></span>
      <span style="--x:50%;--y:10%;--s:65vmax;--dl:120ms"></span>
    </div>
    <div class="intro-logo"><img src="assets/img/logo.jpg" alt="سهل السفر - Easy Travel"></div>
    <button class="intro-skip" type="button">تخطي ←</button>`;

  const trail = intro.querySelector('#introTrail');
  const plane = intro.querySelector('#introPlane');
  const reflection = intro.querySelector('#introPlaneReflection');
  const trailLength = trail.getTotalLength();
  trail.style.strokeDasharray = `${trailLength}`;
  trail.style.strokeDashoffset = `${trailLength}`;

  const FLIGHT_MS = 3000;
  const easeInOut = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  let startTime = null;
  let finished = false;
  const timers = [];

  const frame = (now) => {
    if (finished) return;
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / FLIGHT_MS, 1);
    const length = trailLength * easeInOut(progress);
    const point = trail.getPointAtLength(length);
    const ahead = trail.getPointAtLength(Math.min(length + 2, trailLength));
    const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI - 180;
    plane.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle}) scale(1.5)`);
    reflection.setAttribute('transform', `translate(${point.x} ${2 * HORIZON - point.y}) scale(1.5 -1.5) rotate(${angle})`);
    trail.style.strokeDashoffset = `${trailLength - length}`;
    if (progress < 1) requestAnimationFrame(frame);
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    intro.classList.add('s-lift');
    html.classList.remove('is-intro');
    document.dispatchEvent(new CustomEvent('intro:done'));
    setTimeout(() => intro.remove(), 1200);
  };

  intro.querySelector('.intro-skip').addEventListener('click', finish);
  requestAnimationFrame(frame);
  timers.push(setTimeout(() => intro.classList.add('s-text'), 600));
  timers.push(setTimeout(() => intro.classList.add('s-clouds'), 3100));
  timers.push(setTimeout(() => intro.classList.add('s-logo'), 3700));
  timers.push(setTimeout(finish, 5300));
})();
