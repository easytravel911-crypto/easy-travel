import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { readAgencySettings, whatsappLink } from '../../lib/easyTravel';

/**
 * Trip page booking box: prices are agreed per date and season, so instead of
 * add-to-cart the visitor books over WhatsApp with a message that already holds
 * the trip name and link. The agency then sends a Salla payment link by SMS.
 */
export function EtxBooking({ product }: { product: Pick<Product, 'name' | 'url'> }) {
  const { theme } = useTwilight();
  const agency = readAgencySettings(theme?.settings);
  const pageUrl = product.url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <div className="et-booking etx-booking">
      <p className="et-booking__note">
        تختلف الأسعار حسب الموعد والموسم. احجز عبر واتساب ونرسل لك التفاصيل والسعر ورابط دفع آمن من سلة.
      </p>
      <a
        className="et-whatsapp-button etx-btn etx-btn-wa etx-btn-lg"
        href={whatsappLink(agency.whatsapp, [product.name, pageUrl])}
        target="_blank"
        rel="noopener"
        data-testid="easy-travel-booking"
      >
        <i className="sicon-whatsapp" aria-hidden="true" /> احجز عبر واتساب
      </a>
    </div>
  );
}
