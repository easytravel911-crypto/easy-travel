import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { product as productApi } from '@salla.sa/twilight-theme-engine/api/product';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { EtxOpening } from './EtxOpening';
import { Reveal, SplitHeading, Stagger, isCovered, prefersReducedMotion, useInView } from './motion';
import { placeOf, readAgencySettings, whatsappLink, whatsappMessage } from '../../lib/easyTravel';
import heroPosterUrl from '../../assets/hero-poster.jpg?url';
import heroVideoUrl from '../../assets/hero.mp4?url';
import ctaSkyUrl from '../../assets/cta-sky.jpg?url';

const PLANE_PATH =
  'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z';

type Lenis = { raf(t: number): void; stop(): void; start(): void; scrollTo(target: unknown, o?: object): void; destroy(): void };

const imageOf = (p?: Partial<Product> | null): string =>
  (p?.image as { url?: string } | undefined)?.url ||
  (p?.images?.[0] as { url?: string } | undefined)?.url ||
  '';

/**
 * Easy Travel home page. The hero stays as the agency designed it; every section
 * below it is filled from the store's own products, so the merchant manages the
 * content from the Salla dashboard. `children` are the merchant's home blocks.
 */
export function EtxHome({ children }: { children?: ReactNode }) {
  const { theme } = useTwilight();
  const agency = readAgencySettings(theme?.settings);
  useSmoothScroll();

  const { data } = useQuery(productApi.queries.list({ source: 'latest' }));
  // The API lists newest first; the store's own order (oldest first) reads better.
  const products = useMemo(() => ((data?.items ?? []) as Product[]).slice().reverse(), [data]);
  const keyword = agency.packagesKeyword;
  const packages = products.filter((p) => keyword && p.name?.includes(keyword)).slice(0, 3);
  const trips = products.filter((p) => !(keyword && p.name?.includes(keyword)));

  return (
    <>
      <EtxOpening />
      <div className="et-home etx-scope">
        <Hero whatsapp={agency.whatsapp} videoUrl={agency.heroVideoUrl || heroVideoUrl} />
        <Planner whatsapp={agency.whatsapp} options={products.map((p) => p.name)} />
        <Marquee names={trips.map((p) => placeOf(p.name))} />
        {trips.length > 0 && <Destinations trips={trips} />}
        {packages.length > 0 && <Passes packages={packages} whatsapp={agency.whatsapp} />}
        <Journey />
        {agency.stats.length > 0 && <Board stats={agency.stats} />}
        <Testimonials />
        {/* The merchant's blocks load lazily; their own boundary keeps the rest of the page mounted. */}
        <Suspense fallback={null}>{children}</Suspense>
        <Mosaic items={(trips.length >= 3 ? trips : products).filter((p) => imageOf(p)).slice(0, 6)} />
        <Cta whatsapp={agency.whatsapp} />
      </div>
    </>
  );
}

/** Smooth wheel scrolling on the home page; paused while the preloader or intro covers it. */
function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let lenis: Lenis | null = null;
    let frame = 0;
    let cancelled = false;
    import('lenis').then(({ default: LenisCtor }) => {
      if (cancelled) return;
      lenis = new LenisCtor({ duration: 1.15, smoothWheel: true }) as unknown as Lenis;
      (window as unknown as { etxLenis?: Lenis }).etxLenis = lenis;
      const raf = (t: number) => {
        lenis?.raf(t);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
      if (isCovered()) {
        lenis.stop();
        const resume = () => !isCovered() && lenis?.start();
        document.addEventListener('preloader:done', resume);
        document.addEventListener('intro:done', resume);
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
      delete (window as unknown as { etxLenis?: Lenis }).etxLenis;
    };
  }, []);
}

function scrollToId(event: ReactMouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const lenis = (window as unknown as { etxLenis?: Lenis }).etxLenis;
  if (lenis) lenis.scrollTo(target, { offset: -90 });
  else target.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- Hero: kept exactly as the agency's current design ---------- */
function Hero({ whatsapp, videoUrl }: { whatsapp: string; videoUrl: string }) {
  return (
    <>
      <section className="et-hero-video" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="auto" disablePictureInPicture poster={heroPosterUrl}>
          <source src={videoUrl} type="video/mp4" />
        </video>
      </section>
      <section className="et-hero" aria-labelledby="et-hero-title">
        <div className="container et-hero__inner">
          <span className="et-eyebrow">
            رحلة بلا عناء <span aria-hidden="true">✦</span> Effortless Journey
          </span>
          <h2 id="et-hero-title">
            رحلتك القادمة <em>تبدأ من هنا</em>
          </h2>
          <p>اختر وجهتك، ودعنا نرتب لك رحلة متكاملة من الطيران والإقامة إلى أجمل التجارب.</p>
          <div className="et-hero__actions">
            <a className="et-button et-button--primary" href="#travel-packages" onClick={(e) => scrollToId(e, 'travel-packages')}>
              اكتشف الرحلات <span aria-hidden="true">←</span>
            </a>
            <a className="et-button et-button--whatsapp" href={whatsappLink(whatsapp)} target="_blank" rel="noopener">
              <i className="sicon-whatsapp" aria-hidden="true" /> احجز عبر واتساب
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Planner: sends the visitor's plan to WhatsApp ---------- */
function Planner({ whatsapp, options }: { whatsapp: string; options: string[] }) {
  const months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(now.getFullYear(), now.getMonth() + i + 1, 1)));
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      'السلام عليكم 👋',
      'أرغب بتخطيط رحلة مع سهل السفر:',
      `• الوجهة: ${data.get('destination')}`,
      `• موعد السفر: ${data.get('month') || 'مرن'}`,
      `• عدد المسافرين: ${data.get('travelers')}`,
    ].join('\n');
    window.open(whatsappMessage(whatsapp, message), '_blank', 'noopener');
  };

  return (
    <section className="etx-planner" id="planner">
      <div className="etx-container">
        <Reveal as="div">
          <form className="etx-planner-card" onSubmit={submit}>
            <div className="etx-planner-title">
              <b>خطط رحلتك في 30 ثانية</b>
              <small>ونرسل لك عرضاً على واتساب</small>
            </div>
            <div className="etx-field">
              <label htmlFor="etxPlannerDestination">إلى أين؟</label>
              <select id="etxPlannerDestination" name="destination" key={options.length}>
                {[...new Set(options.filter(Boolean))].map((name) => (
                  <option key={name}>{name}</option>
                ))}
                <option>وجهة أخرى / ساعدوني في الاختيار</option>
              </select>
            </div>
            <div className="etx-field">
              <label htmlFor="etxPlannerMonth">متى؟</label>
              <select id="etxPlannerMonth" name="month" defaultValue="">
                <option value="">تاريخ مرن</option>
                {months.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="etx-field">
              <label htmlFor="etxPlannerTravelers">كم مسافر؟</label>
              <select id="etxPlannerTravelers" name="travelers" defaultValue="2">
                {['1', '2', '3', '4', '5', '6 أو أكثر'].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <button className="etx-btn etx-btn-primary etx-btn-lg" type="submit">
              <i className="sicon-whatsapp" aria-hidden="true" /> أرسل طلبي
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Marquee: two tilted strips ---------- */
const DEFAULT_PLACES = ['إسطنبول', 'المالديف', 'سويسرا', 'باريس', 'بالي', 'جورجيا', 'كبادوكيا', 'ماليزيا'];
const SLOGANS = ['رحلة بلا عناء', 'العالم أقرب إليك', 'احجز رحلتك حول العالم'];

function MarqueeGroup({ items, sep }: { items: string[]; sep: string }) {
  return (
    <span className="etx-mq-group">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} style={{ display: 'contents' }}>
          <b>{item}</b>
          <i aria-hidden="true">{sep}</i>
        </span>
      ))}
    </span>
  );
}

/** Repeats a list until it is long enough to fill a wide screen without a gap. */
const fill = (list: string[], min: number) => {
  const base = list.length ? list : DEFAULT_PLACES;
  let out = base;
  while (out.length < min) out = out.concat(base);
  return out;
};

function Marquee({ names }: { names: string[] }) {
  const places = fill([...new Set(names.filter(Boolean))].length >= 3 ? [...new Set(names)] : DEFAULT_PLACES, 16);
  const slogans = fill(SLOGANS, 12);
  return (
    <div className="etx-marquee-wrap" aria-hidden="true">
      <div className="etx-marquee etx-marquee--navy">
        <div className="etx-marquee-track">
          <MarqueeGroup items={places} sep="✈" />
          <MarqueeGroup items={places} sep="✈" />
        </div>
      </div>
      <div className="etx-marquee etx-marquee--orange">
        <div className="etx-marquee-track">
          <MarqueeGroup items={slogans} sep="✦" />
          <MarqueeGroup items={slogans} sep="✦" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Destinations: a draggable slider of trips ---------- */
function Destinations({ trips }: { trips: Product[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ down: false, moved: false, startX: 0, startScroll: 0 });

  const step = () => (scroller.current?.querySelector<HTMLElement>('.etx-dest-card')?.offsetWidth || 300) + 22;
  const by = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * step(), behavior: 'smooth' });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const d = drag.current;
      if (!d.down || !scroller.current) return;
      const delta = event.clientX - d.startX;
      if (Math.abs(delta) > 5 && !d.moved) {
        d.moved = true;
        setDragging(true);
      }
      if (d.moved) scroller.current.scrollLeft = d.startScroll - delta;
    };
    const up = () => {
      if (!drag.current.down) return;
      drag.current.down = false;
      window.setTimeout(() => setDragging(false), 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <section className="etx-section" id="destinations">
      <div className="etx-container etx-dest-head">
        <div className="etx-section-head">
          <span className="etx-kicker">وجهات تنتظرك</span>
          <SplitHeading text="أين ستكون" accent="رحلتك القادمة؟" />
          <p>اسحب واستكشف. كل وجهة برنامج جاهز يمكن تخصيصه لك بالكامل.</p>
        </div>
        <div className="etx-slider-nav">
          <button type="button" aria-label="السابق" onClick={() => by(1)}>
            <i className="sicon-arrow-right" aria-hidden="true" />
          </button>
          <button type="button" aria-label="التالي" onClick={() => by(-1)}>
            <i className="sicon-arrow-left" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className={`etx-dest-scroller${dragging ? ' dragging' : ''}`}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || !scroller.current) return;
          drag.current = { down: true, moved: false, startX: event.clientX, startScroll: scroller.current.scrollLeft };
        }}
        onClickCapture={(event) => {
          // A drag must not open the trip under the cursor.
          if (drag.current.moved) {
            event.preventDefault();
            drag.current.moved = false;
          }
        }}
      >
        {trips.map((trip) => {
          const place = placeOf(trip.name);
          return (
            <a key={trip.id} className="etx-dest-card" href={trip.url} draggable={false}>
              {imageOf(trip) && <img src={imageOf(trip)} alt={trip.name} loading="lazy" draggable={false} />}
              <span className="etx-dest-stamp" aria-hidden="true">
                سهل السفر<b>{place}</b>✈
              </span>
              <div className="etx-dest-body">
                <span className="etx-dest-country">
                  <i className="sicon-location" aria-hidden="true" /> {place}
                </span>
                <h3>{trip.name}</h3>
                {trip.subtitle && <p>{trip.subtitle}</p>}
                <div className="etx-dest-meta">
                  <span>اكتشف البرنامج</span>
                  <span className="etx-dest-go">
                    <i className="sicon-arrow-left" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Packages as boarding passes ---------- */
function WingsMark({ id }: { id: string }) {
  return (
    <svg className="etx-mark" viewBox="0 0 80 56" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--wing-a)' }} />
          <stop offset="1" stopColor="#F39237" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${id})`} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M38 44C24 40 10 26 8 4c10 12 20 18 30 22" />
        <path d="M36 35c-10-3-18-10-21-20" />
        <path d="M42 44c14-4 28-18 30-40-10 12-20 18-30 22" />
        <path d="M44 35c10-3 18-10 21-20" />
        <path d="M27 51c6-6 20-6 26 0" />
      </g>
    </svg>
  );
}

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

function Passes({ packages, whatsapp }: { packages: Product[]; whatsapp: string }) {
  // Three passes: the middle one is featured. A single pass is featured and centred.
  const featuredIndex = packages.length === 3 ? 1 : packages.length === 1 ? 0 : -1;
  const classes = ['ECONOMY+', 'BUSINESS', 'FIRST'];
  const gates = ['A1', 'B7', 'VIP'];
  const seats = ['14C', '3A', '1A'];
  const tilt = useTilt();

  return (
    <section className="etx-section etx-packages" id="travel-packages">
      <div className="etx-container">
        <div className="etx-section-head center">
          <span className="etx-kicker">باقاتنا</span>
          <SplitHeading text="اختر" accent="بطاقة صعودك" />
          <p>باقات تناسب كل مسافر. اختر الأنسب لك واحجز مباشرة عبر واتساب خلال دقائق.</p>
        </div>
        <div className="etx-pass-grid" {...tilt}>
          {packages.map((p, index) => {
            const featured = index === featuredIndex;
            const cls = packages.length === 1 ? 'BUSINESS' : classes[index] || 'ECONOMY+';
            return (
              <Reveal key={p.id} as="article" className={`etx-pass${featured ? ' featured' : ''}`} delay={index * 140}>
                {featured && <span className="etx-pass-ribbon">★ الأكثر طلباً</span>}
                <div className="etx-pass-main">
                  <div className="etx-pass-top">
                    <span className="etx-pass-airline">
                      <WingsMark id={`etx-wing-pass-${p.id}`} /> سهل السفر
                    </span>
                    <span className="etx-pass-class">{cls}</span>
                  </div>
                  <h3>{p.name}</h3>
                  {p.subtitle && <p className="etx-pass-desc">{p.subtitle}</p>}
                  <div className="etx-pass-route">
                    <div>
                      <b>RUH</b>
                      <small>الرياض</small>
                    </div>
                    <div className="etx-pass-line">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d={PLANE_PATH} />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <b>ANY</b>
                      <small>وجهتك</small>
                    </div>
                  </div>
                  <ul className="etx-pass-features">
                    <li>{CHECK}<span>طيران وإقامة وتنقلات مرتبة لك</span></li>
                    <li>{CHECK}<span>برنامج يومي يناسب وقتك</span></li>
                    <li>{CHECK}<span>دعم على واتساب طوال الرحلة</span></li>
                  </ul>
                  <div className="etx-pass-meta">
                    <div><small>الحجز</small><b>واتساب</b></div>
                    <div><small>البوابة</small><b>{gates[index] || 'A1'}</b></div>
                    <div><small>المقعد</small><b>{seats[index] || '1A'}</b></div>
                  </div>
                </div>
                <div className="etx-pass-tear" aria-hidden="true" />
                <div className="etx-pass-stub">
                  <div className="etx-pass-price">
                    <div>
                      <small>السعر</small>
                      <b className="etx-pass-ask">حسب الموعد</b>
                    </div>
                    <div className="etx-barcode" aria-hidden="true" />
                  </div>
                  <div className="etx-pass-actions">
                    <a
                      className={`etx-btn ${featured ? 'etx-btn-primary' : 'etx-btn-dark'}`}
                      href={whatsappLink(whatsapp, [p.name, p.url])}
                      target="_blank"
                      rel="noopener"
                    >
                      <i className="sicon-whatsapp" aria-hidden="true" /> احجز عبر واتساب
                    </a>
                    <a className="etx-btn etx-btn-outline etx-icon-only" href={p.url} aria-label={`تفاصيل ${p.name}`}>
                      <i className="sicon-arrow-left" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <p className="etx-pkg-note">تتغير الأسعار حسب الموعد والموسم، لذلك نحددها معك عند الحجز عبر واتساب.</p>
      </div>
    </section>
  );
}

/** 3D tilt for boarding passes under a mouse pointer. */
function useTilt() {
  const enabled =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !prefersReducedMotion();
  if (!enabled) return {};
  const reset = (card: HTMLElement) => {
    card.classList.remove('tilting');
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  };
  return {
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>('.etx-pass');
      event.currentTarget.querySelectorAll<HTMLElement>('.etx-pass.tilting').forEach((other) => other !== card && reset(other));
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.classList.add('tilting');
      card.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
    },
    onPointerLeave: (event: ReactPointerEvent<HTMLDivElement>) =>
      event.currentTarget.querySelectorAll<HTMLElement>('.etx-pass.tilting').forEach(reset),
  };
}

/* ---------- Journey: the plane draws its path while scrolling ---------- */
const JOURNEY_PATH =
  'M1000 120 C 930 120 900 40 820 50 S 700 170 620 150 S 480 40 400 60 S 260 180 180 140 S 60 90 0 100';
const STEPS = [
  { icon: 'sicon-location', title: 'اختر وجهتك', text: 'تصفح الوجهات أو أخبرنا بما تحب، ونقترح عليك الأنسب.' },
  { icon: 'sicon-calendar', title: 'نصمم برنامجك', text: 'برنامج يومي مرتب حسب ميزانيتك ووقتك واهتماماتك.' },
  { icon: 'sicon-whatsapp', title: 'نتفق عبر واتساب', text: 'نؤكد معك التفاصيل والسعر، ثم يصلك رابط دفع آمن في رسالة نصية.' },
  { icon: 'sicon-airplane', title: 'انطلق مطمئناً', text: 'فريقنا معك على واتساب من الإقلاع حتى العودة.' },
];

function Journey() {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const [marks, setMarks] = useState<{ x: number; y: number; fraction: number }[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const line = lineRef.current;
    const svg = svgRef.current;
    const plane = planeRef.current;
    if (!line || !svg || !plane) return;
    const length = line.getTotalLength();
    line.style.strokeDasharray = `${length}`;
    const samples = Array.from({ length: 400 }, (_, i) => {
      const at = (i / 399) * length;
      return { at, point: line.getPointAtLength(at) };
    });
    // RTL: the first step is on the right.
    setMarks(
      STEPS.map((_, index) => {
        const targetX = 1000 - (index + 0.5) * (1000 / STEPS.length);
        const best = samples.reduce((a, b) => (Math.abs(b.point.x - targetX) < Math.abs(a.point.x - targetX) ? b : a));
        return { x: best.point.x, y: best.point.y, fraction: best.at / length };
      })
    );
    const calm = prefersReducedMotion();
    let target = 0;
    let current = -1;
    let animating = false;
    let frame = 0;
    const render = () => {
      if (current < 0) current = target;
      current += (target - current) * (calm ? 1 : 0.08);
      if (Math.abs(target - current) < 0.0005) {
        current = target;
        animating = false;
      }
      const at = length * current;
      const point = line.getPointAtLength(at);
      const ahead = line.getPointAtLength(Math.min(at + 1, length));
      const behind = line.getPointAtLength(Math.max(at - 1, 0));
      const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      line.style.strokeDashoffset = `${length - at}`;
      plane.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle + 90})`);
      setProgress(current);
      if (animating) frame = requestAnimationFrame(render);
    };
    const measure = () => {
      const rect = svg.getBoundingClientRect();
      const viewport = window.innerHeight;
      target = Math.min(1, Math.max(0, (viewport * 0.85 - rect.top) / (viewport * 0.6)));
      if (!animating) {
        animating = true;
        frame = requestAnimationFrame(render);
      }
    };
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const on = (i: number) => marks[i] !== undefined && progress >= marks[i].fraction - 0.02;

  return (
    <section className="etx-section etx-journey" id="etxJourney">
      <div className="etx-container">
        <div className="etx-section-head center on-dark">
          <span className="etx-kicker">كيف نعمل</span>
          <SplitHeading text="من الفكرة إلى" accent="الإقلاع" />
          <p>أربع خطوات بسيطة، وأنت مرتاح في كل واحدة منها.</p>
        </div>
        <svg ref={svgRef} className="etx-journey-svg" viewBox="0 0 1000 200" aria-hidden="true">
          <defs>
            <linearGradient id="journeyGrad" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0" stopColor="#F7B267" />
              <stop offset="1" stopColor="#F39237" />
            </linearGradient>
          </defs>
          <path className="etx-journey-base" d={JOURNEY_PATH} />
          <path ref={lineRef} className="etx-journey-line" d={JOURNEY_PATH} />
          <g>
            {marks.map((m, i) => (
              <circle key={i} cx={m.x} cy={m.y} r={9} className={`etx-journey-mark${on(i) ? ' on' : ''}`} />
            ))}
          </g>
          <g ref={planeRef}>
            <g transform="translate(-18 -18) scale(1.5)">
              <path fill="#fff" d={PLANE_PATH} />
            </g>
          </g>
        </svg>
        <ol className="etx-journey-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`etx-journey-step${on(i) ? ' on' : ''}`}>
              <span className="etx-ico">
                <i className={s.icon} aria-hidden="true" />
              </span>
              <span className="etx-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Departure board: the merchant's own numbers from theme settings ---------- */
function Flaps({ text, run, offset }: { text: string; run: boolean; offset: number }) {
  const [chars, setChars] = useState(() => [...text].map((c) => (/\d/.test(c) ? '0' : c)));
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!run) return;
    const finals = [...text];
    const calm = prefersReducedMotion();
    const timers = finals.map((final, index) => {
      if (!/\d/.test(final)) return 0;
      let rounds = calm ? 0 : 8 + (offset + index) * 2;
      return window.setInterval(() => {
        setChars((prev) => {
          const next = prev.slice();
          next[index] = rounds <= 0 ? final : String(Math.floor(Math.random() * 10));
          return next;
        });
        setTick((t) => t + 1);
        if (rounds-- <= 0) window.clearInterval(timers[index]);
      }, 70);
    });
    return () => timers.forEach((t) => t && window.clearInterval(t));
  }, [run, text, offset]);
  return (
    <div className="etx-board-digits" data-tick={tick}>
      {chars.map((c, i) => (
        <span key={i} className="etx-flap">
          {c}
        </span>
      ))}
    </div>
  );
}

function Board({ stats }: { stats: { value: string; label: string }[] }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const [clock, setClock] = useState('');
  useEffect(() => {
    const update = () =>
      setClock(
        new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }) + ' RUH'
      );
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);
  let offset = 0;
  return (
    <section className="etx-section">
      <div className="etx-container etx-board-wrap">
        <Reveal className="etx-section-head">
          <span className="etx-kicker">لوحة المغادرة</span>
          <h2>
            أرقام <em className="etx-grad-text">تتحدث عنا</em>
          </h2>
          <p>كل رقم هنا وراءه مسافر عاد بذكريات جميلة. هدفنا أن تكون أنت القادم.</p>
        </Reveal>
        <div ref={ref} className={`etx-board${inView ? ' is-in' : ''}`} data-reveal="left">
          <div className="etx-board-top">
            <span>المغادرون · DEPARTURES</span>
            <span className="etx-clock">{clock}</span>
          </div>
          {stats.map((s) => {
            const o = offset;
            offset += s.value.length;
            return (
              <div key={s.label} className="etx-board-row">
                <span className="etx-board-label">{s.label}</span>
                <Flaps text={s.value} run={inView} offset={o} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials: the store's real reviews as postcards; hidden while there are none ---------- */
type Review = {
  id?: number | string;
  content?: string;
  stars?: number;
  rating?: number;
  name?: string;
  customer?: { name?: string };
  product?: { name?: string; image?: { url?: string } };
};

function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [flying, setFlying] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      (window.salla as unknown as { api?: { component?: { getReviews?: (q: object) => Promise<{ data?: Review[] }> } } })
        ?.api?.component?.getReviews?.({ source: 'all', source_value: [], limit: 8 })
        ?.then((res) => {
          if (cancelled) return;
          const list = (res?.data ?? []).filter((r) => r.content);
          setReviews(list);
          setOrder(list.map((_, i) => i));
        })
        .catch(() => undefined);
    const salla = window.salla as unknown as { onReady?: () => Promise<unknown> } | undefined;
    if (salla?.onReady) salla.onReady().then(load);
    return () => {
      cancelled = true;
    };
  }, []);

  const next = () => {
    if (flying || order.length < 2) return;
    setFlying(true);
    window.setTimeout(() => {
      setOrder((o) => [...o.slice(1), o[0]]);
      setFlying(false);
    }, 650);
    setRound((r) => r + 1);
  };

  useEffect(() => {
    if (order.length < 2 || prefersReducedMotion()) return;
    const timer = window.setTimeout(next, 5500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, order.length]);

  if (!reviews.length) return null;
  return (
    <section className="etx-section etx-testi">
      <div className="etx-container etx-testi-grid">
        <div>
          <div className="etx-section-head" style={{ marginBottom: 0 }}>
            <span className="etx-kicker">بطاقات من مسافرينا</span>
            <SplitHeading text="قصص كُتبت" accent="من الطريق" />
            <p>أجمل ما نتلقاه بعد كل رحلة: بطاقة شكر من مسافر عاد سعيداً.</p>
          </div>
          <div className="etx-testi-controls">
            <button className="etx-btn etx-btn-dark etx-btn-sm" type="button" onClick={next}>
              البطاقة التالية <i className="sicon-arrow-left" aria-hidden="true" />
            </button>
            <div className="etx-testi-progress" aria-hidden="true">
              <i key={round} className="run" />
            </div>
          </div>
        </div>
        <Reveal variant="left" className="etx-postcards">
          {order.map((index, position) => {
            const review = reviews[index];
            const name = review.customer?.name || review.name || 'مسافر';
            const rating = Math.max(1, Math.min(5, Math.round(Number(review.stars || review.rating || 5))));
            const image = review.product?.image?.url;
            return (
              <article
                key={review.id ?? index}
                className={`etx-postcard${position === 0 && flying ? ' fly' : ''}`}
                onClick={next}
              >
                <div>
                  <div className="etx-stars-rate" aria-label={`${rating} نجوم`}>
                    {'★'.repeat(rating)}
                    {'☆'.repeat(5 - rating)}
                  </div>
                  <blockquote>{review.content}</blockquote>
                  <div className="etx-who">
                    <span className="etx-initial">{name.charAt(0)}</span>
                    <div>
                      <b>{name}</b>
                      <small>{review.product?.name || 'سهل السفر'}</small>
                    </div>
                  </div>
                </div>
                <div className="etx-postcard-side" aria-hidden="true">
                  <div className="etx-stamp">{image && <img src={image} alt="" />}</div>
                  <div className="etx-postmark">
                    سهل السفر
                    <br />✈
                  </div>
                  <div className="etx-postcard-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Mosaic: trip photos ---------- */
function Mosaic({ items }: { items: Product[] }) {
  if (items.length < 3) return null;
  return (
    <section className="etx-section">
      <div className="etx-container">
        <div className="etx-section-head center">
          <span className="etx-kicker">إلهام لرحلتك</span>
          <SplitHeading text="العالم" accent="بعدسة المسافر" />
        </div>
        <Stagger className="etx-mosaic">
          {items.map((p) => (
            <figure key={p.id}>
              <a href={p.url}>
                <img src={imageOf(p)} alt={p.name} loading="lazy" />
              </a>
              <figcaption>{placeOf(p.name)}</figcaption>
            </figure>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------- Final booking box ---------- */
function Cta({ whatsapp }: { whatsapp: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const box = boxRef.current;
      const img = imgRef.current;
      if (!box || !img) return;
      const rect = box.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewport) return;
      const offset = (rect.top + rect.height / 2 - viewport / 2) * 0.12;
      img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <section className="etx-section" id="travel-contact" style={{ paddingTop: 0 }}>
      <div className="etx-container" ref={boxRef}>
        <Reveal variant="zoom" className="etx-cta">
          <img ref={imgRef} className="etx-cta-bg" src={ctaSkyUrl} alt="" loading="lazy" />
          <svg className="etx-cta-plane" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={PLANE_PATH} />
          </svg>
          <span className="etx-kicker">جاهز للإقلاع؟</span>
          <h2>
            رحلتك القادمة <span className="etx-script">على بُعد رسالة</span>
          </h2>
          <p>أخبرنا إلى أين تحلم أن تذهب، ونرتب لك كل التفاصيل.</p>
          <a className="etx-btn etx-btn-wa etx-btn-lg" href={whatsappLink(whatsapp)} target="_blank" rel="noopener">
            <i className="sicon-whatsapp" aria-hidden="true" /> ابدأ المحادثة الآن
          </a>
        </Reveal>
      </div>
    </section>
  );
}
