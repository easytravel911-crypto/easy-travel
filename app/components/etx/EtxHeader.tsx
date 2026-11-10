import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { SallaUserMenu } from '@salla.sa/twilight-components-react/user-menu';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { useDocumentClass } from '@salla.sa/twilight-theme-engine/hooks/useDocumentClass';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { menu } from '@salla.sa/twilight-theme-engine/api/menu';
import type { MenuItem } from '@salla.sa/twilight-theme-engine/types';
import { readAgencySettings, whatsappLink } from '../../lib/easyTravel';
import logoUrl from '../../assets/logo.png?url';

const openSearch = () => window.salla?.event?.dispatch('search::open');

/**
 * Easy Travel header: a frosted bar that hides while scrolling down and returns on
 * scroll up, plus a full-screen navy menu (every screen size) filled from the store's
 * header menu in the Salla dashboard. Styling: `04-components/easy-travel.scss`.
 */
export function EtxHeader() {
  const { store, theme } = useTwilight();
  const { t } = useTranslation();
  const agency = readAgencySettings(theme?.settings);
  const logo = agency.useStoreLogo && store?.logo ? store.logo : logoUrl;
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [space, setSpace] = useState<number | undefined>(undefined);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close the menu on any navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Scroll behaviour: frosted bar after 40px, hide on the way down past 500px.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y > 500 && y > last + 4) setHidden(true);
      if (y < last - 4 || y <= 500) setHidden(false);
      last = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The spacer follows the real header height so breadcrumbs never sit under the fixed bar.
  // Measured only while the bar is not in its compact (scrolled) state.
  const scrolledRef = useRef(scrolled);
  scrolledRef.current = scrolled;
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const fit = () => {
      if (!scrolledRef.current) setSpace(el.offsetHeight);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // While the menu is open: `etx-menu-open` on <body> drives the menu styles and
  // `etx-menu-lock` on <html> locks page scroll. The engine adds and removes both.
  useDocumentClass({
    body: { class: menuOpen ? 'etx-menu-open' : undefined },
    html: { class: menuOpen ? 'etx-menu-lock' : undefined },
  });

  // While the menu is open: stop smooth scrolling and close on Escape.
  useEffect(() => {
    const lenis = (window as unknown as { etxLenis?: { stop(): void; start(): void } }).etxLenis;
    if (menuOpen) lenis?.stop();
    else lenis?.start();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const menuLabel = t('blocks.header.main_menu', 'القائمة');

  return (
    <>
      <header
        ref={headerRef}
        data-testid="store-header"
        className={`store-header etx-header${scrolled ? ' is-scrolled' : ''}${hidden && !menuOpen ? ' is-hidden' : ''}`}
      >
        <HookSlot name="header:start" />
        <div className="etx-container etx-header-inner">
          <div className="etx-header-start">
            <button
              type="button"
              className="etx-icon-btn etx-menu-toggle"
              aria-label={menuLabel}
              aria-expanded={menuOpen}
              aria-controls="etxMenu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
            <Link to="/" className="etx-brand" aria-label={store?.name}>
              <img src={logo} alt={store?.name || 'سهل السفر'} width={404} height={450} fetchPriority="high" />
            </Link>
          </div>

          <EtxInlineNav label={menuLabel} />

          <div className="etx-header-actions">
            <button
              type="button"
              className="etx-icon-btn"
              aria-label={t('common.elements.search', 'بحث')}
              onClick={openSearch}
            >
              <i className="sicon-search" aria-hidden="true" />
            </button>
            <SallaUserMenu avatarOnly showHeader relativeDropdown className="header-action" />
            <a
              className="etx-btn etx-btn-primary etx-btn-sm etx-header-cta"
              href={whatsappLink(agency.whatsapp)}
              target="_blank"
              rel="noopener"
            >
              احجز رحلتك
            </a>
          </div>
        </div>
        <HookSlot name="header:end" />
      </header>
      <div className="etx-header-space" aria-hidden="true" style={space ? { height: space } : undefined} />
      <EtxMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

/** Desktop: the store's top-level header menu links inline; sub-menus live in the full-screen menu. */
function EtxInlineNav({ label }: { label: string }) {
  const { data: items = [] } = useQuery(menu.queries.header());
  const links = (items as MenuItem[]).filter((item) => item?.title && item?.url).slice(0, 6);
  return (
    <nav className="etx-nav" aria-label={label}>
      {links.map((item) => (
        <a key={item.id} href={item.url}>
          {item.title}
        </a>
      ))}
    </nav>
  );
}

/** Full-screen navy menu: the store's header menu, account, and a WhatsApp box. */
function EtxMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTwilight();
  const { t } = useTranslation();
  const agency = readAgencySettings(theme?.settings);
  const { data: items = [] } = useQuery(menu.queries.header());
  const visible = (items as MenuItem[]).filter((item) => item?.title && item?.url);
  let index = 1;

  const openAccount = () => {
    onClose();
    const salla = window.salla;
    if (salla?.config?.isGuest?.()) salla.event?.dispatch('login::open');
    else window.location.assign((salla?.url as { get?: (path: string) => string } | undefined)?.get?.('customer/profile') || '/');
  };

  return (
    <nav
      className="etx-mobile-nav"
      id="etxMenu"
      aria-label={t('blocks.header.main_menu', 'القائمة')}
      aria-hidden={!open}
      data-lenis-prevent=""
    >
      <div className="etx-menu-grid">
        <div className="etx-menu-links">
          <span className="etx-menu-kicker">القائمة</span>
          <ul className="etx-menu-list">
            <li style={{ ['--i' as string]: 0 }}>
              <Link to="/" onClick={onClose}>
                <span className="etx-mn-ico"><i className="sicon-home" aria-hidden="true" /></span>
                الرئيسية
              </Link>
            </li>
            {visible.map((item) => {
              const i = index++;
              const children = (item.children ?? []).filter((child) => child?.title && child?.url);
              if (!children.length) {
                return (
                  <li key={item.id} style={{ ['--i' as string]: i }}>
                    <a href={item.url} onClick={onClose}>
                      <span className="etx-mn-ico"><i className="sicon-airplane" aria-hidden="true" /></span>
                      {item.title}
                    </a>
                  </li>
                );
              }
              return (
                <li key={item.id} style={{ ['--i' as string]: i }}>
                  <details className="etx-mn-group">
                    <summary>
                      <span className="etx-mn-ico"><i className="sicon-airplane" aria-hidden="true" /></span>
                      {item.title}
                      <i className="sicon-keyboard_arrow_down etx-mn-caret" aria-hidden="true" />
                    </summary>
                    <ul>
                      <li><a href={item.url} onClick={onClose}>{t('blocks.home.display_all', 'عرض الكل')}</a></li>
                      {children.map((child) => (
                        <li key={child.id}><a href={child.url} onClick={onClose}>{child.title}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
          <div className="etx-menu-account" style={{ ['--i' as string]: index }}>
            <button type="button" className="etx-menu-account-btn" onClick={openAccount}>
              <span className="etx-mn-ico"><i className="sicon-user" aria-hidden="true" /></span>
              حسابي
            </button>
          </div>
        </div>
        <aside className="etx-menu-aside">
          <span className="etx-menu-script">العالم أقرب إليك</span>
          <p>أخبرنا إلى أين تحلم أن تذهب، ونرتب لك كل التفاصيل.</p>
          <a className="etx-btn etx-btn-wa etx-btn-lg" href={whatsappLink(agency.whatsapp)} target="_blank" rel="noopener">
            <i className="sicon-whatsapp" aria-hidden="true" /> احجز عبر واتساب
          </a>
          <a className="etx-menu-phone" href={`tel:${agency.phone}`}>
            <i className="sicon-phone" aria-hidden="true" />
            <span dir="ltr">{agency.phone}</span>
          </a>
        </aside>
      </div>
    </nav>
  );
}
