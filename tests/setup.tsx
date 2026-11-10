import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Node 25+ ships its own `localStorage` global, which hides jsdom's and has no
// methods unless Node runs with `--localstorage-file`. Put an in-memory Storage
// back so tests behave the same on Node 24 (`.nvmrc`) and newer.
for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (typeof globalThis[name]?.clear === 'function') continue;
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(String(key)) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(String(key)),
    setItem: (key, value) => void data.set(String(key), String(value)),
  };
  Object.defineProperty(globalThis, name, { configurable: true, value: storage });
  if (typeof window !== 'undefined' && window !== globalThis) {
    Object.defineProperty(window, name, { configurable: true, value: storage });
  }
}

// jsdom doesn't implement matchMedia. Default to "matches" so components that
// gate mobile-only behavior behind a media query (e.g. MobileBottomBar's DOM
// observers) behave as they would on a small screen, matching what the
// existing tests for those components already assume.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

vi.mock('@salla.sa/twilight-components-react/slider', () => ({
  SallaSlider: ({
    type,
    id,
    centered,
    autoPlay,
    autoplay,
    showControls,
    controlsOuter,
    slidesPerView,
    sliderConfig,
    className,
    children,
    ...props
  }: Record<string, unknown>) => {
    const hasAutoplay = autoplay || autoPlay;
    const attrs: Record<string, string> = {};
    if (type) attrs.type = String(type);
    if (id) attrs.id = String(id);
    if (centered) attrs.centered = 'true';
    if (hasAutoplay) attrs['auto-play'] = 'true';
    if (showControls !== undefined) attrs['show-controls'] = String(showControls);
    if (controlsOuter) attrs['controls-outer'] = 'true';
    if (slidesPerView) attrs['slides-per-view'] = String(slidesPerView);
    if (sliderConfig) attrs['slider-config'] = JSON.stringify(sliderConfig);
    if (className) attrs.class = String(className);
    return React.createElement('salla-slider', { ...attrs, ...props }, children);
  },
}));

vi.mock('@salla.sa/twilight-components-react/rating-stars', () => ({
  SallaRatingStars: ({ value, size, reviews, withLabel, ...props }: Record<string, unknown>) => {
    const attrs: Record<string, string> = {};
    if (value !== undefined) attrs.value = String(value);
    if (size) attrs.size = String(size);
    if (reviews !== undefined) attrs.reviews = String(reviews);
    if (withLabel) attrs['with-label'] = 'true';
    return React.createElement('salla-rating-stars', { ...attrs, ...props });
  },
}));

vi.mock('@salla.sa/twilight-components-react', () => ({
  SallaProductsSlider: ({
    loader,
    children,
    blockTitle,
    sliderProps,
    displayAllUrl,
  }: Record<string, unknown>) => {
    const [items, setItems] = React.useState<unknown[]>([]);
    React.useEffect(() => {
      (loader as () => Promise<{ items: unknown[] }>)().then((result) => {
        setItems(result.items);
      });
    }, [loader]);
    return (
      <div
        data-testid="salla-products-slider"
        data-block-title={blockTitle ?? ''}
        data-slider-id={(sliderProps as Record<string, unknown>)?.id ?? ''}
        data-display-all-url={displayAllUrl ?? ''}
      >
        {items.map((item, index) =>
          (children as (item: unknown, index: number) => React.ReactNode)(item, index)
        )}
      </div>
    );
  },
}));
