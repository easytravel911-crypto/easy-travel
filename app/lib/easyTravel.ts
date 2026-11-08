/**
 * Easy Travel agency details and WhatsApp booking links.
 *
 * Every value comes from the theme settings (`twilight.json`, group «بيانات الوكالة»)
 * with the agency's own details as the fallback, so a store that never saved the
 * settings still shows the right contacts.
 */
export interface AgencySettings {
  whatsapp: string;
  phone: string;
  email: string;
  cr: string;
  twitter: string;
  tiktok: string;
  instagram: string;
  heroVideoUrl: string;
  useStoreLogo: boolean;
  packagesKeyword: string;
  stats: { value: string; label: string }[];
}

// Accepts the engine's ThemeSettings (an interface without an index signature) or any plain object.
type Settings = object | undefined | null;

const text = (settings: Settings, id: string, fallback: string): string => {
  const value = (settings as Record<string, unknown> | null | undefined)?.[id];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};

export function readAgencySettings(settings: Settings): AgencySettings {
  const stats: AgencySettings['stats'] = [];
  for (let i = 1; i <= 4; i++) {
    const value = text(settings, `et_stat${i}_value`, '');
    const label = text(settings, `et_stat${i}_label`, '');
    if (value && label) stats.push({ value, label });
  }
  return {
    whatsapp: text(settings, 'et_whatsapp', '966509890653').replace(/\D/g, ''),
    phone: text(settings, 'et_phone', '0509890653'),
    email: text(settings, 'et_email', 'Easytravel.911@gmail.com'),
    cr: text(settings, 'et_cr', '7055183482'),
    twitter: text(settings, 'et_twitter', 'Easy_traveel'),
    tiktok: text(settings, 'et_tiktok', 'Easy_traveel'),
    instagram: text(settings, 'et_instagram', 'Easy.traveel'),
    heroVideoUrl: text(settings, 'et_hero_video_url', ''),
    useStoreLogo: (settings as Record<string, unknown> | null | undefined)?.et_use_store_logo === true,
    packagesKeyword: text(settings, 'et_packages_keyword', 'باقة'),
    stats,
  };
}

export const BOOKING_GREETING = 'السلام عليكم، أرغب بالحجز:';

/** A wa.me link with a ready message: greeting, then the trip name and link when given. */
export function whatsappLink(number: string, lines: (string | undefined | null)[] = []): string {
  const message = [BOOKING_GREETING, ...lines.filter(Boolean)].join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** A wa.me link with a free-form message (planner form, general questions). */
export function whatsappMessage(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** First word of a trip name, used for short labels (marquee, stamps, captions). */
export const placeOf = (name: string): string => String(name || '').trim().split(/\s+/)[0] || '';
