import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import themeTranslations from 'virtual:twilight/theme-translations';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useUser } from '@salla.sa/twilight-theme-engine/hooks/useUser';
import { EtxHeader } from '../etx/EtxHeader';
import { EtxFooter } from '../etx/EtxFooter';
import { fillComponentTranslations, type ComponentLang } from '../../lib/componentTranslations';

/**
 * Theme layout — passed to `<TwilightProvider layout={ThemeLayout}>` in
 * `app/routes/__root.tsx`: the Easy Travel header and footer around every page,
 * plus the same global modals (offer / login / scopes) as the engine's `MasterLayout`.
 */
const SallaLoginModal = lazy(() =>
  import('@salla.sa/twilight-components-react/login-modal').then((m) => ({
    default: m.SallaLoginModal,
  }))
);
const SallaScopes = lazy(() =>
  import('@salla.sa/twilight-components-react/scopes').then((m) => ({
    default: m.SallaScopes,
  }))
);
const SallaOfferModal = lazy(() =>
  import('@salla.sa/twilight-components-react/offer-modal').then((m) => ({
    default: m.SallaOfferModal,
  }))
);
const SallaLocalizationModal = lazy(() =>
  import('@salla.sa/twilight-components-react/localization-modal').then((m) => ({
    default: m.SallaLocalizationModal,
  }))
);

export interface ThemeLayoutProps {
  children: ReactNode;
}

const IMG_RATIOS = ['auto', 'square', 'landscape', 'portrait'] as const;
type ImgRatio = (typeof IMG_RATIOS)[number];

/**
 * Read the `product_card_img_ratio` dropdown setting (string, or `[{value}]`).
 * No value means `auto`, the old Twig card, so a store moving over keeps its look.
 */
function productImageRatio(raw: unknown): ImgRatio {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const value =
    typeof first === 'string' ? first : (first as { value?: string } | undefined)?.value;
  return (IMG_RATIOS as readonly string[]).includes(value ?? '') ? (value as ImgRatio) : 'auto';
}

/** Whether the merchant's `squar_photo_bg_image_size` dropdown asks for cover. */
function squarePhotosCover(raw: unknown): boolean {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const value =
    typeof first === 'string' ? first : (first as { value?: string } | undefined)?.value;
  return value === 'cover';
}

/**
 * The engine's shared modals ThemeLayout mounts globally, each gated on
 * whether the store actually needs it: the offer modal always, the
 * language / currency switcher only when the store has more than one of
 * either, the login modal only for a guest, scopes only when the store has
 * one. Split out from {@link ThemeLayout} itself so that component stays
 * about the page structure (header, footer, bottom bar, sheets) rather than
 * also carrying every modal's own gating condition.
 */
function GlobalModals() {
  const { store, currency } = useTwilight();
  const { locale } = useTranslation();
  const { isLoggedIn } = useUser();
  const showLocalization =
    !!store?.settings?.is_multilingual || !!store?.settings?.currencies_enabled;

  return (
    <>
      <Suspense>
        <SallaOfferModal />
      </Suspense>

      {/* Language / currency switcher — the header nav's sticky footer buttons
          dispatch `localization::open`; mount the modal here since our Header
          replaces the engine one that normally hosts it. */}
      {showLocalization && (
        <Suspense>
          <SallaLocalizationModal
            language={locale}
            currency={currency?.code || 'SAR'}
            suppressHydrationWarning
          />
        </Suspense>
      )}

      {!isLoggedIn && (
        <Suspense>
          <SallaLoginModal
            isEmailAllowed={store?.settings?.auth?.email_allowed}
            isMobileAllowed={store?.settings?.auth?.mobile_allowed}
            suppressHydrationWarning
          />
        </Suspense>
      )}

      {store?.scope && (
        <Suspense>
          <SallaScopes
            selection={store?.scope?.display_as === 'popup' ? 'mandatory' : 'optional'}
            suppressHydrationWarning
          />
        </Suspense>
      )}
    </>
  );
}

export function ThemeLayout({ children }: ThemeLayoutProps) {
  const { theme } = useTwilight();

  // Fill the web components' strings the store's pack lacks from the theme's
  // locale files, each time a pack loads (`subscribe` also runs at once when one already has).
  useEffect(() => {
    const lang = window.salla?.lang as
      | (ComponentLang & { subscribe?: (fn: () => void) => () => void })
      | undefined;
    if (typeof lang?.subscribe !== 'function' || typeof lang.add !== 'function') return;
    return lang.subscribe(() => fillComponentTranslations(lang, themeTranslations));
  }, []);

  const imgRatio = productImageRatio(theme?.settings?.product_card_img_ratio);
  const squarePhotos = squarePhotosCover(theme?.settings?.squar_photo_bg_image_size)
    ? ' square-photos--cover'
    : '';

  // Easy Travel: one header (with its full-screen menu for every screen size) and
  // one footer replace Raed's header, mobile bottom bar and account sheets.
  return (
    <>
      <div
        className={`app-inner theme-easy-travel flex flex-col min-h-full product-card-img--${imgRatio}${squarePhotos}`}
        suppressHydrationWarning
      >
        <EtxHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <EtxFooter />
      </div>

      <GlobalModals />
    </>
  );
}
