/* =========================================================
   سهل السفر — الكرة الأرضية التفاعلية (Canvas 2D بدون مكتبات)
   نقاط على كرة + مسارات طيران مضيئة من الرياض إلى الوجهات
   ========================================================= */
(function () {
  'use strict';
  const canvas = document.getElementById('globe');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const DEG = Math.PI / 180;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const HOME = { lat: 24.71, lon: 46.68, name: 'الرياض' };
  const DESTINATIONS = [
    { lat: 41.01, lon: 28.98, name: 'إسطنبول' },
    { lat: 48.86, lon: 2.35, name: 'باريس' },
    { lat: 46.82, lon: 8.23, name: 'سويسرا', labelBelow: true },
    { lat: 41.72, lon: 44.79, name: 'تبليسي' },
    { lat: 4.18, lon: 73.51, name: 'المالديف' },
    { lat: -8.41, lon: 115.19, name: 'بالي' },
    { lat: 3.14, lon: 101.69, name: 'كوالالمبور' },
  ];

  const toVector = (lat, lon) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];

  // Fibonacci sphere dots
  const DOT_COUNT = 1400;
  const dots = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < DOT_COUNT; i++) {
    const y = 1 - (i / (DOT_COUNT - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    dots.push([Math.cos(golden * i) * radius, y, Math.sin(golden * i) * radius]);
  }

  // Great-circle arcs lifted above the surface
  const homeVector = toVector(HOME.lat, HOME.lon);
  const arcs = DESTINATIONS.map((destination, index) => {
    const target = toVector(destination.lat, destination.lon);
    const dot = homeVector[0] * target[0] + homeVector[1] * target[1] + homeVector[2] * target[2];
    const omega = Math.acos(Math.min(1, Math.max(-1, dot)));
    const points = [];
    const SAMPLES = 60;
    for (let s = 0; s <= SAMPLES; s++) {
      const t = s / SAMPLES;
      const a = Math.sin((1 - t) * omega) / Math.sin(omega);
      const b = Math.sin(t * omega) / Math.sin(omega);
      const lift = 1 + Math.sin(Math.PI * t) * (0.08 + omega * 0.18);
      points.push([(a * homeVector[0] + b * target[0]) * lift, (a * homeVector[1] + b * target[1]) * lift, (a * homeVector[2] + b * target[2]) * lift]);
    }
    return { destination, target, points, offset: index * 0.37 };
  });

  let width = 0, height = 0, radius = 0, centerX = 0, centerY = 0;
  const resize = () => {
    // clientWidth ignores CSS transforms (e.g. the zoom-in reveal), unlike getBoundingClientRect.
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = width * ratio; canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    radius = Math.min(width, height) * 0.4;
    centerX = width / 2; centerY = height / 2;
  };

  let rotationY = -55 * DEG;
  let tilt = 0.42;
  let dragVelocity = 0;
  let dragging = false;
  let lastPointerX = 0;

  const rotate = ([x, y, z]) => {
    const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const cosX = Math.cos(tilt), sinX = Math.sin(tilt);
    return [x1, y * cosX - z1 * sinX, y * sinX + z1 * cosX];
  };
  const project = (vector) => {
    const [x, y, z] = rotate(vector);
    return { x: centerX + x * radius, y: centerY - y * radius, z, visible: z > 0 };
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);

    // Sphere body
    const body = context.createRadialGradient(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.1, centerX, centerY, radius);
    body.addColorStop(0, 'rgba(70, 104, 180, .55)');
    body.addColorStop(0.7, 'rgba(22, 36, 74, .75)');
    body.addColorStop(1, 'rgba(13, 22, 48, .95)');
    context.fillStyle = body;
    context.beginPath(); context.arc(centerX, centerY, radius, 0, Math.PI * 2); context.fill();

    // Atmosphere rim
    const rim = context.createRadialGradient(centerX, centerY, radius * 0.92, centerX, centerY, radius * 1.18);
    rim.addColorStop(0, 'rgba(120, 160, 255, .35)');
    rim.addColorStop(1, 'rgba(120, 160, 255, 0)');
    context.fillStyle = rim;
    context.beginPath(); context.arc(centerX, centerY, radius * 1.18, 0, Math.PI * 2); context.fill();

    // Dots
    for (const dot of dots) {
      const [x, y, z] = rotate(dot);
      if (z <= 0.02) continue;
      context.fillStyle = `rgba(190, 210, 255, ${0.12 + z * 0.55})`;
      const size = 0.6 + z * 1.1;
      context.fillRect(centerX + x * radius - size / 2, centerY - y * radius - size / 2, size, size);
    }

    // Arcs
    const cycle = (time / 2600) % 1;
    for (const arc of arcs) {
      const projected = arc.points.map(project);
      context.lineWidth = 1.2;
      context.strokeStyle = 'rgba(247, 178, 103, .28)';
      context.beginPath();
      projected.forEach((point, index) => {
        if (!point.visible) return;
        const previous = projected[index - 1];
        if (index === 0 || !previous.visible) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.stroke();

      // Travelling comet
      const head = ((cycle + arc.offset) % 1) * 1.25;
      const tailLength = 0.22;
      for (let i = 1; i < projected.length; i++) {
        const t = i / (projected.length - 1);
        if (t > head || t < head - tailLength) continue;
        const a = projected[i - 1], b = projected[i];
        if (!a.visible || !b.visible) continue;
        const strength = 1 - (head - t) / tailLength;
        context.strokeStyle = `rgba(255, 190, 110, ${strength})`;
        context.lineWidth = 1 + strength * 2;
        context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
      }

      // Destination marker + label
      const end = project(arc.target);
      if (end.z > 0) {
        const pulse = (time / 1400 + arc.offset) % 1;
        context.strokeStyle = `rgba(247, 178, 103, ${1 - pulse})`;
        context.lineWidth = 1.5;
        context.beginPath(); context.arc(end.x, end.y, 3 + pulse * 10, 0, Math.PI * 2); context.stroke();
        context.fillStyle = '#F7B267';
        context.beginPath(); context.arc(end.x, end.y, 3, 0, Math.PI * 2); context.fill();
        context.globalAlpha = Math.min(1, end.z * 2);
        context.font = '600 12px "IBM Plex Sans Arabic", sans-serif';
        context.fillStyle = '#E6ECFA';
        context.textAlign = 'center';
        context.fillText(arc.destination.name, end.x, arc.destination.labelBelow ? end.y + 20 : end.y - 12);
        context.globalAlpha = 1;
      }
    }

    // Home marker
    const home = project(homeVector);
    if (home.z > 0) {
      const glow = context.createRadialGradient(home.x, home.y, 0, home.x, home.y, 22);
      glow.addColorStop(0, 'rgba(243, 146, 55, .9)');
      glow.addColorStop(1, 'rgba(243, 146, 55, 0)');
      context.fillStyle = glow;
      context.beginPath(); context.arc(home.x, home.y, 22, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#fff';
      context.beginPath(); context.arc(home.x, home.y, 4, 0, Math.PI * 2); context.fill();
      context.font = '700 13px "Alexandria", sans-serif';
      context.textAlign = 'center';
      context.fillText(HOME.name, home.x, home.y + 24);
    }
  };

  let running = false;
  let previousTime = 0;
  const loop = (time) => {
    if (!running) return;
    const delta = Math.min(time - previousTime, 50);
    previousTime = time;
    if (!dragging) {
      dragVelocity *= 0.94;
      rotationY += 0.00006 * delta + dragVelocity;
    }
    draw(time);
    requestAnimationFrame(loop);
  };

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true; lastPointerX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const delta = (event.clientX - lastPointerX) * 0.006;
    rotationY += delta;
    dragVelocity = delta;
    lastPointerX = event.clientX;
  });
  const endDrag = () => { dragging = false; canvas.style.cursor = ''; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  resize();
  new ResizeObserver(() => {
    resize();
    if (!running) draw(performance.now());
  }).observe(canvas);
  if (reduceMotion) { draw(0); return; }

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) { running = true; previousTime = performance.now(); requestAnimationFrame(loop); }
    else if (!entry.isIntersecting) running = false;
  }).observe(canvas);
})();
