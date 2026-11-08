import { useEffect, useRef, useState } from 'react';
import { opening, prefersReducedMotion, syncOpeningLock } from './motion';
import logoUrl from '../../assets/logo.png?url';

/**
 * Home page only: the preloader (plane circling the logo with a percentage), then
 * the cinematic intro (a plane crossing the sea at sunset → clouds → logo) when the
 * visitor arrives from outside the store. Both lock the page while they play and
 * announce the end with `preloader:done` / `intro:done` events on `document`.
 */
export function EtxOpening() {
  return (
    <>
      <EtxPreloader />
      <EtxIntro />
    </>
  );
}

const MIN_VISIBLE_MS = 1300;

// Once per page load: a remount (fast refresh, a suspended sibling) must not replay the opening.
let preloaderPlayed = false;
let introPlayed = false;

function EtxPreloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(() => preloaderPlayed);

  useEffect(() => {
    if (preloaderPlayed) return;
    opening.loading = true;
    syncOpeningLock();
    const startedAt = Date.now();
    let value = 0;
    let loaded = document.readyState === 'complete';
    const onLoad = () => (loaded = true);
    window.addEventListener('load', onLoad);
    const failsafe = window.setTimeout(() => (loaded = true), 4500); // never hold visitors on a slow file
    const timer = window.setInterval(() => {
      value = loaded ? Math.min(100, value + 6) : value + (90 - value) * 0.05;
      setProgress(value);
      if (value >= 100 && Date.now() - startedAt >= MIN_VISIBLE_MS) {
        window.clearInterval(timer);
        window.setTimeout(() => {
          setDone(true);
          preloaderPlayed = true;
          opening.loading = false;
          syncOpeningLock();
          document.dispatchEvent(new Event('preloader:done'));
          window.setTimeout(() => setGone(true), 1100);
        }, 150);
      }
    }, 50);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(failsafe);
      window.removeEventListener('load', onLoad);
      opening.loading = false;
      syncOpeningLock();
    };
  }, []);

  if (gone) return null;
  return (
    <div className={`etx-preloader${done ? ' done' : ''}`} role="status" aria-label="جارٍ التحميل">
      <div className="etx-pl-inner">
        <div className="etx-pl-orbit">
          <div className="etx-pl-plane" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
            </svg>
          </div>
          <img className="etx-pl-logo" src={logoUrl} alt="" />
        </div>
        <div className="etx-pl-name">
          سهل السفر<small>EASY TRAVEL</small>
        </div>
        <div className="etx-pl-bar">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="etx-pl-pct">{Math.round(progress)}%</div>
      </div>
    </div>
  );
}

const HORIZON = 600;
const PLANE_SHAPE = `
  <path d="M0 -6 L30 -6 L12 -28 L2 -28 Z" fill="#1A2342"/>
  <path d="M-70 0 C-68 -8 -55 -10 -40 -10 L50 -9 C58 -9 66 -14 72 -32 L81 -32 L77 -8 C81 -6 83 -3 83 0 C83 4 77 6 66 6 L-40 8 C-56 8 -68 6 -70 0 Z" fill="#0D1630"/>
  <path d="M-8 2 L28 2 L2 36 L-10 36 Z" fill="#0D1630"/>
  <path d="M58 0 L82 0 L75 12 L67 12 Z" fill="#0D1630"/>
  <circle cx="79" cy="-30" r="2.2" fill="#FF5A5A"><animate attributeName="opacity" values="1;0.1;1" dur="1s" repeatCount="indefinite"/></circle>`;

const wavePath = (y: number, amplitude: number, length: number) => {
  let d = `M0 ${y}`;
  for (let x = 0; x < 2400; x += length) d += ` q${length / 4} ${-amplitude} ${length / 2} 0 t${length / 2} 0`;
  return `${d} V900 H0 Z`;
};

/** The static parts of the sunset scene, built once as SVG markup. */
function sceneMarkup(): string {
  const reflections = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const width = 240 - i * 28;
      return `<rect class="etx-shimmer" x="${800 - width / 2}" y="${HORIZON + 14 + i * 22}" width="${width}" height="3" rx="1.5" fill="#FFD9A0" opacity="${0.75 - i * 0.08}" style="animation-delay:${i * 0.25}s"/>`;
    })
    .join('');
  const stars = Array.from({ length: 40 }, (_, i) => {
    // Deterministic positions: the same sky on every visit.
    const x = (i * 397) % 1600;
    const y = (i * 131) % 260;
    return `<circle cx="${x}" cy="${y}" r="${(0.4 + ((i * 7) % 14) / 10).toFixed(1)}" fill="#fff" opacity="${(0.2 + ((i * 3) % 6) / 10).toFixed(2)}"/>`;
  }).join('');
  return `
    <defs>
      <linearGradient id="etxIntroSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0D1630"/><stop offset=".42" stop-color="#2B2B58"/>
        <stop offset=".7" stop-color="#9A4E6A"/><stop offset=".88" stop-color="#F39237"/><stop offset="1" stop-color="#FFC77D"/>
      </linearGradient>
      <linearGradient id="etxIntroSea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4A3556"/><stop offset=".35" stop-color="#1F2448"/><stop offset="1" stop-color="#0B1226"/>
      </linearGradient>
      <radialGradient id="etxIntroSun"><stop offset="0" stop-color="#FFF1CF"/><stop offset=".6" stop-color="#FFC56E"/><stop offset="1" stop-color="#F39237"/></radialGradient>
      <radialGradient id="etxIntroGlow"><stop offset="0" stop-color="#FFB45C" stop-opacity=".55"/><stop offset="1" stop-color="#FFB45C" stop-opacity="0"/></radialGradient>
      <filter id="etxIntroBlur"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <rect width="1600" height="${HORIZON}" fill="url(#etxIntroSky)"/>
    ${stars}
    <circle cx="800" cy="${HORIZON}" r="420" fill="url(#etxIntroGlow)"/>
    <circle cx="800" cy="${HORIZON - 6}" r="150" fill="url(#etxIntroSun)"/>
    <path d="M1040 ${HORIZON} q50 -26 110 -12 q40 -24 92 -2 q34 -12 66 14 z" fill="#2A2547" opacity=".85"/>
    <path d="M260 ${HORIZON} q40 -16 90 -6 q30 -12 64 6 z" fill="#2A2547" opacity=".7"/>
    <rect y="${HORIZON}" width="1600" height="${900 - HORIZON}" fill="url(#etxIntroSea)"/>
    ${reflections}
    <path class="etx-wave" d="${wavePath(HORIZON + 40, 5, 200)}" fill="#2A2850" opacity=".55" style="--dur:7s"/>
    <path class="etx-wave" d="${wavePath(HORIZON + 110, 8, 400)}" fill="#1A1F42" opacity=".6" style="--dur:10s"/>
    <path class="etx-wave" d="${wavePath(HORIZON + 200, 12, 400)}" fill="#0F1530" opacity=".85" style="--dur:6s"/>
    <path id="etxIntroTrail" class="etx-intro-trail" d="M1820 520 C 1300 470, 700 470, -220 330"/>
    <g opacity=".22" filter="url(#etxIntroBlur)"><g id="etxIntroPlaneReflection">${PLANE_SHAPE}</g></g>
    <g id="etxIntroPlane">${PLANE_SHAPE}</g>`;
}

const CLOUDS = [
  { x: '18%', y: '30%', s: '75vmax', dl: '0ms' },
  { x: '82%', y: '24%', s: '80vmax', dl: '90ms' },
  { x: '50%', y: '62%', s: '95vmax', dl: '160ms' },
  { x: '8%', y: '82%', s: '70vmax', dl: '220ms' },
  { x: '92%', y: '84%', s: '80vmax', dl: '260ms' },
  { x: '50%', y: '10%', s: '65vmax', dl: '120ms' },
];

type Stage = 'off' | 'play' | 'text' | 'clouds' | 'logo' | 'lift' | 'gone';

/** Plays when the visitor arrives from outside the store (not when returning home from another page). */
function EtxIntro() {
  const [stage, setStage] = useState<Stage>('off');
  const svgRef = useRef<SVGSVGElement>(null);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (introPlayed) return;
    let fromInside = false;
    try {
      fromInside = document.referrer.startsWith(window.location.origin);
    } catch {
      /* ignore */
    }
    if (fromInside) return;
    opening.intro = true;
    syncOpeningLock();
    const timers: number[] = [];
    let finished = false;
    let frame = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      introPlayed = true;
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(frame);
      setStage('lift');
      opening.intro = false;
      syncOpeningLock();
      document.dispatchEvent(new Event('intro:done'));
      timers.push(window.setTimeout(() => setStage('gone'), 1200));
    };
    finishRef.current = finish;

    const play = () => {
      setStage('play');
      const calm = prefersReducedMotion();
      if (calm) {
        timers.push(window.setTimeout(() => setStage('text'), 50));
        timers.push(window.setTimeout(() => setStage('clouds'), 1200));
        timers.push(window.setTimeout(() => setStage('logo'), 1400));
        timers.push(window.setTimeout(finish, 2800));
        return;
      }
      // Fly the plane along its trail.
      requestAnimationFrame(() => {
        const svg = svgRef.current;
        const trail = svg?.querySelector<SVGPathElement>('#etxIntroTrail');
        const plane = svg?.querySelector<SVGGElement>('#etxIntroPlane');
        const reflection = svg?.querySelector<SVGGElement>('#etxIntroPlaneReflection');
        if (!trail || !plane || !reflection) return;
        const length = trail.getTotalLength();
        trail.style.strokeDasharray = `${length}`;
        trail.style.strokeDashoffset = `${length}`;
        const FLIGHT_MS = 3000;
        const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
        let start: number | null = null;
        const step = (now: number) => {
          if (finished) return;
          if (start === null) start = now;
          const p = Math.min((now - start) / FLIGHT_MS, 1);
          const at = length * ease(p);
          const point = trail.getPointAtLength(at);
          const ahead = trail.getPointAtLength(Math.min(at + 2, length));
          const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI - 180;
          plane.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle}) scale(1.5)`);
          reflection.setAttribute('transform', `translate(${point.x} ${2 * HORIZON - point.y}) scale(1.5 -1.5) rotate(${angle})`);
          trail.style.strokeDashoffset = `${length - at}`;
          if (p < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      });
      timers.push(window.setTimeout(() => setStage('text'), 600));
      timers.push(window.setTimeout(() => setStage('clouds'), 3100));
      timers.push(window.setTimeout(() => setStage('logo'), 3700));
      timers.push(window.setTimeout(finish, 5300));
    };

    // The preloader covers the page first; the intro plays once it has gone.
    if (opening.loading) document.addEventListener('preloader:done', play, { once: true });
    else play();
    // Failsafe: never keep the page locked.
    timers.push(window.setTimeout(finish, 16000));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(frame);
      document.removeEventListener('preloader:done', play);
      if (!finished) {
        opening.intro = false;
        syncOpeningLock();
      }
    };
  }, []);

  if (stage === 'off' || stage === 'gone') return null;
  const reached = (s: Stage) => {
    const order: Stage[] = ['play', 'text', 'clouds', 'logo', 'lift'];
    return order.indexOf(stage) >= order.indexOf(s);
  };
  const classes = [
    'etx-intro',
    reached('text') && 's-text',
    reached('clouds') && 's-clouds',
    reached('logo') && 's-logo',
    stage === 'lift' && 's-lift',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} aria-hidden="true">
      <svg
        ref={svgRef}
        className="etx-intro-scene"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        dangerouslySetInnerHTML={{ __html: sceneMarkup() }}
      />
      <div className="etx-intro-text">
        العالم أقرب إليك<span className="etx-intro-sub">احجز رحلتك حول العالم</span>
      </div>
      <div className="etx-intro-clouds">
        {CLOUDS.map((c) => (
          <span
            key={c.x + c.y}
            style={{ ['--x' as string]: c.x, ['--y' as string]: c.y, ['--s' as string]: c.s, ['--dl' as string]: c.dl }}
          />
        ))}
      </div>
      <div className="etx-intro-logo">
        <img src={logoUrl} alt="سهل السفر - Easy Travel" />
      </div>
      <button className="etx-intro-skip" type="button" onClick={() => finishRef.current()}>
        تخطي ←
      </button>
    </div>
  );
}
