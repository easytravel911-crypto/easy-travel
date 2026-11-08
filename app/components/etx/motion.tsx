import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type ReactElement,
  type ReactNode,
} from 'react';

/**
 * Whether the home preloader or intro is covering the page. Kept here rather than
 * in <html> classes because the engine rewrites the root element's classes.
 */
export const opening = { loading: false, intro: false };
export const isCovered = (): boolean => opening.loading || opening.intro;

/** Locks page scrolling while the opening covers it (inline style: the engine owns the classes). */
export function syncOpeningLock() {
  if (typeof document === 'undefined') return;
  document.documentElement.style.overflow = isCovered() ? 'hidden' : '';
}

/** True when the visitor asked the system for less motion. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Becomes true once the element scrolls into view (and stays true). Waits for the
 * home preloader and intro to finish first, so nothing animates behind them.
 */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    let observer: IntersectionObserver | null = null;
    const start = () => {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setInView(true);
            observer?.disconnect();
          }
        },
        { threshold, rootMargin: '0px 0px -40px 0px' }
      );
      observer.observe(el);
    };
    let waiting = false;
    const wait = () => {
      if (isCovered()) return;
      waiting = false;
      document.removeEventListener('preloader:done', wait);
      document.removeEventListener('intro:done', wait);
      start();
    };
    if (!isCovered()) start();
    else {
      waiting = true;
      document.addEventListener('preloader:done', wait);
      document.addEventListener('intro:done', wait);
    }
    return () => {
      observer?.disconnect();
      if (waiting) {
        document.removeEventListener('preloader:done', wait);
        document.removeEventListener('intro:done', wait);
      }
    };
  }, [inView, threshold]);
  return [ref, inView] as const;
}

type RevealProps = {
  as?: keyof JSX.IntrinsicElements;
  variant?: 'up' | 'left' | 'right' | 'zoom';
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
};

/** Fades and slides its content in when it scrolls into view. */
export function Reveal({ as = 'div', variant = 'up', delay = 0, className = '', style, children, id }: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  return createElement(
    as,
    {
      ref,
      id,
      'data-reveal': variant === 'up' ? '' : variant,
      className: `${className}${inView ? ' is-in' : ''}`.trim(),
      style: { ...style, ['--d' as string]: delay },
    },
    children
  );
}

/** Children appear one after another when the group scrolls into view. */
export function Stagger({ className = '', children }: { className?: string; children?: ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-stagger="" className={`${className}${inView ? ' is-in' : ''}`.trim()}>
      {Children.map(children, (child, i) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ style?: CSSProperties }>, {
              style: { ...((child.props as { style?: CSSProperties }).style ?? {}), ['--i' as string]: i },
            })
          : child
      )}
    </div>
  );
}

/**
 * A heading whose words rise in one after another. Arabic letters stay joined
 * because each whole word is one span. `accent` words get the warm gradient.
 */
export function SplitHeading({
  as = 'h2',
  text,
  accent,
  className,
  id,
}: {
  as?: 'h1' | 'h2' | 'h3';
  text: string;
  accent?: string;
  className?: string;
  id?: string;
}) {
  const [ref, inView] = useInView<HTMLHeadingElement>();
  let index = 0;
  // The space sits between the word masks (not inside them), so it is never clipped away.
  const words = (value: string) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((word, i) => [
        i > 0 ? ' ' : null,
        <span className="etx-w" key={`${word}-${index}`}>
          <span style={{ ['--i' as string]: index++ }}>{word}</span>
        </span>,
      ]);
  return createElement(
    as,
    { ref, id, 'data-split': '', className: `${className ?? ''}${inView ? ' is-in' : ''}`.trim() },
    <>
      {words(text)}
      {accent && ' '}
      {accent && <em>{words(accent)}</em>}
    </>
  );
}
