import { useEffect, useRef, useState } from 'react';
import { SallaAppsIcons } from '@salla.sa/twilight-components-react/apps-icons';
import { SallaMenu } from '@salla.sa/twilight-components-react/menu';
import { SallaTrustBadges } from '@salla.sa/twilight-components-react/trust-badges';
import { SallaPayments } from '@salla.sa/twilight-components-react/payments';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { MadeWithSalla } from '@salla.sa/twilight-theme-engine/layout';
import { readAgencySettings, whatsappLink } from '../../lib/easyTravel';
import logoUrl from '../../assets/logo.png?url';

const RING_LENGTH = 2 * Math.PI * 26;

/**
 * Easy Travel footer: navy band with «رحلة بلا عناء» in large script, the logo,
 * the store's footer menu, the agency contacts and commercial registration.
 * Also renders the floating WhatsApp and back-to-top buttons.
 */
export function EtxFooter() {
  const { store, theme } = useTwilight();
  const { t } = useTranslation();
  const agency = readAgencySettings(theme?.settings);
  const logo = agency.useStoreLogo && store?.logo ? store.logo : logoUrl;
  const year = new Date().getFullYear();

  return (
    <>
      <footer data-testid="store-footer" className="store-footer etx-site-footer">
        <HookSlot name="footer:start" />
        <div className="etx-footer-big" aria-hidden="true">رحلة بلا عناء</div>
        <div className="etx-container">
          <div className="etx-footer-grid">
            <div className="etx-footer-about">
              <Link to="/" className="et-footer-logo etx-footer-logo">
                <img loading="lazy" src={logo} alt={store?.name || 'سهل السفر'} width={539} height={600} />
              </Link>
              {store?.description ? (
                <div className="etx-footer-desc" dangerouslySetInnerHTML={{ __html: store.description }} />
              ) : (
                <p className="etx-footer-desc">
                  نصمم رحلتك من البداية إلى النهاية: الطيران والفنادق والجولات والدعم طوال الطريق. أنت تستمتع، ونحن نهتم بالتفاصيل.
                </p>
              )}
              <div data-testid="store-footer-social" className="et-social etx-social">
                {agency.twitter && (
                  <a href={`https://x.com/${agency.twitter}`} target="_blank" rel="noopener" aria-label="X">
                    <i className="sicon-twitter" aria-hidden="true" />
                  </a>
                )}
                {agency.tiktok && (
                  <a href={`https://www.tiktok.com/@${agency.tiktok}`} target="_blank" rel="noopener" aria-label="TikTok">
                    <i className="sicon-tiktok" aria-hidden="true" />
                  </a>
                )}
                {agency.instagram && (
                  <a href={`https://www.instagram.com/${agency.instagram}`} target="_blank" rel="noopener" aria-label="Instagram">
                    <i className="sicon-instagram" aria-hidden="true" />
                  </a>
                )}
              </div>
              <div className="etx-footer-badges">
                <SallaTrustBadges dark />
              </div>
            </div>

            <div className="etx-footer-links">
              <h4>{t('blocks.footer.pages_links', 'روابط مهمة')}</h4>
              <SallaMenu source="footer" suppressHydrationWarning />
            </div>

            <div data-testid="store-footer-contacts" className="et-footer-contacts etx-footer-contacts">
              <h4>{t('blocks.footer.contact_us', 'تواصل معنا')}</h4>
              <ul>
                <li>
                  <a href={whatsappLink(agency.whatsapp)} target="_blank" rel="noopener">
                    <i className="sicon-whatsapp" aria-hidden="true" />
                    <span dir="ltr">{agency.phone}</span>
                  </a>
                </li>
                <li>
                  <a href={`tel:${agency.phone}`}>
                    <i className="sicon-phone" aria-hidden="true" />
                    <span dir="ltr">{agency.phone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${agency.email}`}>
                    <i className="sicon-mail" aria-hidden="true" />
                    <span dir="ltr">{agency.email}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="etx-footer-apps">
              <SallaAppsIcons />
            </div>
          </div>

          <div className="etx-footer-bottom">
            <span className="copyright-text">
              <HookSlot
                name="copyright"
                context={{ storeName: store?.name }}
                fallback={
                  <>
                    {t('blocks.footer.copyright', 'جميع الحقوق محفوظة')}{' '}
                    <Link to="/">{store?.name}</Link> © {year}
                    <MadeWithSalla className="ms-2" />
                  </>
                }
              />
            </span>
            {agency.cr && (
              <span data-testid="store-footer-cr" className="et-footer-cr">
                {t('blocks.footer.commercial_registration', 'رقم السجل التجاري')}: <b dir="ltr">{agency.cr}</b>
              </span>
            )}
            <span className="etx-footer-tagline">العالم أقرب إليك ✈</span>
            <SallaPayments />
          </div>
        </div>
        <HookSlot name="footer:end" />
      </footer>
      <EtxFloating whatsapp={agency.whatsapp} />
    </>
  );
}

/** WhatsApp on one side, a plane back-to-top button with scroll progress on the other. */
function EtxFloating({ whatsapp }: { whatsapp: string }) {
  const [show, setShow] = useState(false);
  const [launch, setLaunch] = useState(0);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(y > 500);
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(RING_LENGTH * (1 - (max > 0 ? y / max : 0)));
      }
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

  const toTop = () => {
    setLaunch((n) => n + 1);
    const lenis = (window as unknown as { etxLenis?: { scrollTo(t: number, o?: object): void } }).etxLenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <a className="etx-fab-wa" href={whatsappLink(whatsapp)} target="_blank" rel="noopener" aria-label="تواصل عبر واتساب">
        <i className="sicon-whatsapp" aria-hidden="true" />
      </a>
      <button
        key={launch}
        className={`etx-to-top${show ? ' show' : ''}${launch ? ' launch' : ''}`}
        type="button"
        aria-label="العودة إلى الأعلى"
        onClick={toTop}
      >
        <svg className="etx-ring" viewBox="0 0 58 58" aria-hidden="true">
          <circle className="etx-bg" cx="29" cy="29" r="26" />
          <circle ref={ringRef} className="etx-fg" cx="29" cy="29" r="26" />
        </svg>
        <svg className="etx-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
      </button>
    </>
  );
}
