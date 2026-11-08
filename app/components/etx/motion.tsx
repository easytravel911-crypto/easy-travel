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
    const covered = () =>
      document.documentElement.classList.contains('is-loading') ||
      document.documentElement.classList.contains('is-intro');
    if (!covered()) start();
    else {
      const wait = () => {
        if (covered()) return;
        document.removeEventListener('preloader:done', wait);
        document.removeEventListener('intro:done', wait);
        start();
      };
      document.addEventListener('preloader:done', wait);
      document.addEventListener('intro:done', wait);
    }
    return () => observer?.disconnect();
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
  const words = (value: string) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => (
        <span className="etx-w" key={`${word}-${index}`}>
          <span style={{ ['--i' as string]: index++ }}>{word}</span>{' '}
        </span>
      ));
  return createElement(
    as,
    { ref, id, 'data-split': '', className: `${className ?? ''}${inView ? ' is-in' : ''}`.trim() },
    <>
      {words(text)}
      {accent && <em>{words(accent)}</em>}
    </>
  );
}
