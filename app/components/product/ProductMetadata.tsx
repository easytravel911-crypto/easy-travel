import { useEffect, useRef } from 'react';
import { SallaMetadata } from '@salla.sa/twilight-components-react/metadata';

interface ProductMetadataProps {
  /** Extra classes on the wrapper (used for the responsive show/hide). */
  className?: string;
}

/**
 * `<SallaMetadata>` (product specs) rendered as collapsible accordion groups.
 *
 * The web component emits static `.s-metadata-box` blocks — this wires
 * click-to-toggle on their `.s-metadata-box-header`s and opens the first group
 * once it appears. A MutationObserver handles the async spec fetch; the click
 * handler is delegated so it survives re-renders.
 *
 * Rendered under the gallery slider on `md`+ ({@link ProductGallery}) and at the
 * end of the description on mobile ({@link ProductDetails}); the `className`
 * carries the `hidden md:block` / `md:hidden` toggle.
 *
 * The headers are plain `<div>`s, so each one gets `role="button"`,
 * `tabindex="0"` and `aria-expanded`, and Enter / Space toggle it, so keyboard
 * and screen-reader users can open every group. `aria-expanded` is the only
 * open/closed state: `04-components/metadata.scss` styles the groups from it.
 * The boxes come from `<salla-metadata>`, not React, so no React state or ref
 * reaches them; the attribute keeps the state in one place, with no class changes.
 */
export function ProductMetadata({ className }: ProductMetadataProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const isOpen = (header: Element) => header.getAttribute('aria-expanded') === 'true';

    // Runs on every change under the root: the specs arrive after an async fetch,
    // and the component can re-render its boxes (new headers, without attributes).
    let opened = false;
    const setUp = () => {
      root.querySelectorAll('.s-metadata-box-header').forEach((header) => {
        if (header.hasAttribute('aria-expanded')) return;
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', String(!opened));
        opened = true;
      });
    };

    const observer = new MutationObserver(setUp);
    observer.observe(root, { childList: true, subtree: true });
    setUp();

    const headerOf = (event: Event) => {
      const header = (event.target as HTMLElement).closest('.s-metadata-box-header');
      return header && root.contains(header) ? header : null;
    };
    const toggle = (header: Element) =>
      header.setAttribute('aria-expanded', String(!isOpen(header)));

    const onClick = (event: MouseEvent) => {
      const header = headerOf(event);
      if (header) toggle(header);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const header = headerOf(event);
      if (!header) return;
      // Space would otherwise scroll the page.
      event.preventDefault();
      toggle(header);
    };
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);

    return () => {
      observer.disconnect();
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={`product-metadata${className ? ` ${className}` : ''}`}>
      <SallaMetadata />
    </div>
  );
}
