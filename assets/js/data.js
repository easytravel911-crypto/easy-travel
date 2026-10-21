/* =========================================================
   سهل السفر — البيانات المشتركة
   كل المحتوى هنا تجريبي ويُستبدل لاحقاً بمنتجات سلة الحقيقية.
   ========================================================= */
(function () {
  'use strict';

  const WHATSAPP_NUMBER = '966508695674';
  const unsplash = (id, width = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=72`;

  const IMG = {
    wing: '1436491865332-7a61a109cc05',
    boatLake: '1476514525535-07fb3b4ae5f1',
    planning: '1488646953014-85cb44e25828',
    aboveClouds: '1500835556837-99ac94a94552',
    mountainLake: '1501785888041-af3ef285b470',
    paris: '1502602898657-3e91760cbb34',
    backpacker: '1503220317375-aaad61436b1b',
    beach: '1507525428034-b723cf961d3e',
    dubai: '1512453979798-5ea266f8880c',
    maldives: '1514282401047-d79a71a590e8',
    istanbul: '1524231757912-21f4fe3a7200',
    alley: '1527631746610-bca00a040d60',
    switzerland: '1530122037265-a5f1f91d3b99',
    cappadociaPhotographer: '1530789253388-582c481c54b0',
    bali: '1537996194471-e657df975ab4',
    resortPool: '1540541338287-41700207dee6',
    georgia: '1565008576549-57569a49371d',
    lodgePool: '1566073771259-6a8506099945',
    kualaLumpur: '1596422846543-75c6fc197f07',
    cappadocia: '1641128324972-af3212f0f6bd',
  };

  /* ---------- Icons (inline SVG) ---------- */
  const stroke = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const ICONS = {
    plane: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
    check: stroke('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    x: stroke('<path d="M18 6 6 18M6 6l12 12"/>'),
    plus: stroke('<path d="M12 5v14M5 12h14"/>'),
    cart: stroke('<path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
    cartAdd: stroke('<path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M12 11v5M9.5 13.5h5"/>'),
    user: stroke('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    home: stroke('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
    heart: stroke('<path d="M12 20s-7-4.4-9.2-8.6A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5.4C19 15.6 12 20 12 20z"/>'),
    clock: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    pin: stroke('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    calendar: stroke('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    users: stroke('<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3"/>'),
    arrowLeft: stroke('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    arrowRight: stroke('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    shield: stroke('<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
    compass: stroke('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
    map: stroke('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
    suitcase: stroke('<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'),
    headset: stroke('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/><path d="M20 19a3 3 0 0 1-3 3h-3"/>'),
    sparkle: stroke('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
    hotel: stroke('<path d="M3 21V7l9-4 9 4v14"/><path d="M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01M8 13h.01M16 13h.01"/>'),
    ticket: stroke('<path d="M3 8a2 2 0 0 0 0 4v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M14 4v16" stroke-dasharray="2 3"/>'),
    logout: stroke('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>'),
    phone: stroke('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
    lock: stroke('<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
    refund: stroke('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'),
    trash: stroke('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    search: stroke('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    sun: stroke('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>'),
  };

  const wingsMark = (id, extraClass = '') => `
    <svg class="mark ${extraClass}" viewBox="0 0 80 56" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style="stop-color:var(--wing-a)"/><stop offset="1" stop-color="#F39237"/>
      </linearGradient></defs>
      <g fill="none" stroke="url(#${id})" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M38 44C24 40 10 26 8 4c10 12 20 18 30 22"/>
        <path d="M36 35c-10-3-18-10-21-20"/>
        <path d="M42 44c14-4 28-18 30-40-10 12-20 18-30 22"/>
        <path d="M44 35c10-3 18-10 21-20"/>
        <path d="M27 51c6-6 20-6 26 0"/>
      </g>
    </svg>`;

  /* ---------- Products (packages + trips) ---------- */
  const commonIncludes = ['تذاكر الطيران ذهاباً وعودة', 'الإقامة في الفنادق المذكورة مع الإفطار', 'الاستقبال والتوديع من المطار', 'التنقلات حسب البرنامج'];
  const commonExcludes = ['رسوم التأشيرة إن وُجدت', 'الوجبات غير المذكورة في البرنامج', 'المصاريف الشخصية'];

  const PRODUCTS = [
    {
      id: 'launch', type: 'package', cats: ['packages'], name: 'باقة الانطلاقة', code: 'ECONOMY+', route: 'الرياض ← وجهتك', to: 'ANY',
      days: 5, price: 2990, badge: 'مناسبة للبداية', img: IMG.beach, gallery: [IMG.beach, IMG.istanbul, IMG.georgia, IMG.mountainLake],
      summary: 'خيار عملي لرحلة قصيرة، فيها كل الأساسيات ورتّبناها لك.',
      features: ['تذاكر طيران ذهاب وعودة', 'فندق 4 نجوم مع الإفطار', 'استقبال وتوديع من المطار', 'جولة سياحية يومية', 'شريحة اتصال وإنترنت'],
      includes: [...commonIncludes, 'شريحة اتصال وإنترنت'], excludes: [...commonExcludes, 'التأمين الصحي للسفر'],
      itinerary: [
        ['الوصول والاستقبال', 'نستقبلك في المطار وننقلك إلى الفندق، ويبقى المساء لك.'],
        ['جولة المدينة', 'جولة على أبرز معالم المدينة مع وقت حر للتسوق.'],
        ['يوم الطبيعة', 'رحلة يوم كامل إلى أجمل المناطق الطبيعية القريبة.'],
        ['يوم حر', 'يوم مفتوح، ونقترح عليك أنشطة تناسب ذوقك.'],
        ['العودة', 'تسليم الغرفة والتوصيل إلى المطار.'],
      ],
    },
    {
      id: 'explore', type: 'package', cats: ['packages'], name: 'باقة الاستكشاف', code: 'BUSINESS', route: 'الرياض ← وجهتك', to: 'ANY',
      days: 7, price: 5490, badge: 'الأكثر طلباً', featured: true, img: IMG.cappadociaPhotographer, gallery: [IMG.cappadociaPhotographer, IMG.cappadocia, IMG.switzerland, IMG.boatLake],
      summary: 'رحلة متكاملة مع مرشد عربي وتجارب مختارة، لمن يريد أن يعيش المكان فعلاً.',
      features: ['كل مزايا باقة الانطلاقة', 'فندق 5 نجوم بموقع مميز', 'مرشد سياحي يتحدث العربية', 'تأمين سفر شامل', '3 تجارب مميزة مختارة', 'سيارة خاصة للتنقلات'],
      includes: [...commonIncludes, 'مرشد سياحي عربي', 'تأمين سفر شامل', 'سيارة خاصة', '3 تجارب مميزة'], excludes: commonExcludes,
      itinerary: [
        ['الوصول بأسلوب مريح', 'استقبال خاص وسيارة خاصة إلى فندقك.'],
        ['قلب المدينة', 'جولة مع مرشد عربي في المعالم التاريخية والأسواق القديمة.'],
        ['التجربة الأولى', 'تجربة مختارة حسب الوجهة، مثل منطاد أو قارب أو قطار جبلي.'],
        ['الطبيعة', 'يوم كامل في الطبيعة مع غداء في مطعم محلي.'],
        ['التجربة الثانية والثالثة', 'تجربتان مميزتان ننسقهما حسب اهتمامك.'],
        ['يوم حر', 'وقت للتسوق أو للراحة.'],
        ['العودة', 'التوصيل إلى المطار.'],
      ],
    },
    {
      id: 'elite', type: 'package', cats: ['packages', 'honeymoon'], name: 'باقة النخبة', code: 'FIRST CLASS', route: 'الرياض ← وجهتك', to: 'VIP',
      days: 10, price: 9990, badge: 'فاخرة', img: IMG.resortPool, gallery: [IMG.resortPool, IMG.maldives, IMG.lodgePool, IMG.bali],
      summary: 'رحلة فاخرة بتفاصيل خاصة، مع مدير رحلة يتابعك من لحظة الحجز إلى العودة.',
      features: ['طيران على درجة الأعمال', 'منتجعات وفلل فاخرة', 'سائق ومرشد خاص طوال الرحلة', 'تجارب حصرية مختارة', 'مدير رحلة متاح 24/7'],
      includes: ['طيران على درجة الأعمال', 'إقامة في منتجعات وفلل فاخرة', 'سائق ومرشد خاص', 'تجارب حصرية', 'مدير رحلة متاح 24/7', 'تأمين سفر شامل'], excludes: ['رسوم التأشيرة إن وُجدت', 'المصاريف الشخصية'],
      itinerary: [
        ['استقبال VIP', 'خدمة استقبال خاصة في المطار، ثم الانتقال إلى المنتجع.'],
        ['الاسترخاء', 'يوم في المنتجع مع جلسة سبا.'],
        ['تجارب حصرية', 'عدة أيام من التجارب الخاصة التي نصممها لك.'],
        ['عشاء مميز', 'عشاء خاص في موقع مختار.'],
        ['العودة', 'توديع خاص وخدمة سريعة في المطار.'],
      ],
    },
    {
      id: 'istanbul', type: 'trip', cats: ['cities', 'nature'], name: 'إسطنبول وكبادوكيا', country: 'تركيا', route: 'الرياض ← إسطنبول', to: 'IST',
      days: 6, price: 4290, oldPrice: 4790, badge: 'عرض', img: IMG.istanbul, gallery: [IMG.istanbul, IMG.cappadocia, IMG.cappadociaPhotographer, IMG.alley],
      summary: 'إسطنبول بتاريخها وأسواقها، ثم منظر المناطيد فوق كبادوكيا عند الفجر.',
      includes: [...commonIncludes, 'رحلة داخلية إلى كبادوكيا'], excludes: [...commonExcludes, 'رحلة المنطاد (اختيارية)'],
      itinerary: [
        ['الوصول إلى إسطنبول', 'الاستقبال ثم الانتقال إلى الفندق.'],
        ['إسطنبول القديمة', 'السلطان أحمد وآيا صوفيا والبازار الكبير.'],
        ['البوسفور', 'رحلة بحرية في البوسفور، ثم وقت حر في تقسيم.'],
        ['كبادوكيا', 'طيران داخلي إلى كبادوكيا وجولة في الوديان.'],
        ['شروق المناطيد', 'مشاهدة المناطيد عند الشروق، ثم العودة إلى إسطنبول.'],
        ['العودة', 'التوصيل إلى المطار.'],
      ],
    },
    {
      id: 'maldives', type: 'trip', cats: ['honeymoon', 'nature'], name: 'المالديف لشهر العسل', country: 'المالديف', route: 'الرياض ← ماليه', to: 'MLE',
      days: 5, price: 7490, badge: 'شهر العسل', img: IMG.maldives, gallery: [IMG.maldives, IMG.resortPool, IMG.lodgePool, IMG.beach],
      summary: 'فيلا فوق الماء، وغروب لا يُنسى، وعشاء على الشاطئ.',
      includes: [...commonIncludes, 'انتقال بالقارب السريع', 'عشاء رومانسي على الشاطئ'], excludes: commonExcludes,
      itinerary: [
        ['الوصول إلى الجنة', 'الانتقال بالقارب السريع إلى المنتجع.'],
        ['يوم الشعاب', 'غطس سطحي بين الشعاب المرجانية.'],
        ['جزيرة خاصة', 'نزهة إلى جزيرة رملية مع غداء.'],
        ['الغروب', 'رحلة غروب بالقارب، ثم عشاء على الشاطئ.'],
        ['العودة', 'التوديع والانتقال إلى المطار.'],
      ],
    },
    {
      id: 'switzerland', type: 'trip', cats: ['nature'], name: 'سويسرا الساحرة', country: 'سويسرا', route: 'الرياض ← زيورخ', to: 'ZRH',
      days: 7, price: 8290, img: IMG.switzerland, gallery: [IMG.switzerland, IMG.boatLake, IMG.mountainLake, IMG.backpacker],
      summary: 'جبال الألب، وبحيرات بلون الفيروز، وقطارات بانورامية بين القرى.',
      includes: [...commonIncludes, 'تذاكر القطار البانورامي'], excludes: commonExcludes,
      itinerary: [
        ['زيورخ', 'الوصول وجولة خفيفة في المدينة القديمة.'],
        ['لوسيرن', 'البحيرة وجسر الكنيسة، ثم قمة جبلية.'],
        ['إنترلاكن', 'الطريق إلى قلب الألب، ثم البحيرتان.'],
        ['لاوتربرونن', 'وادي الشلالات والقرى الخضراء.'],
        ['القطار البانورامي', 'رحلة قطار بين القمم.'],
        ['جنيف', 'البحيرة والنافورة الشهيرة.'],
        ['العودة', 'التوصيل إلى المطار.'],
      ],
    },
    {
      id: 'paris', type: 'trip', cats: ['cities', 'honeymoon'], name: 'باريس مدينة الأضواء', country: 'فرنسا', route: 'الرياض ← باريس', to: 'CDG',
      days: 5, price: 5990, img: IMG.paris, gallery: [IMG.paris, IMG.alley, IMG.wing, IMG.aboveClouds],
      summary: 'برج إيفل، والشانزليزيه، ونزهة نهرية في السين.',
      includes: [...commonIncludes, 'رحلة نهرية في السين'], excludes: commonExcludes,
      itinerary: [
        ['الوصول', 'الاستقبال ثم الانتقال إلى الفندق.'],
        ['المعالم', 'برج إيفل وقوس النصر والشانزليزيه.'],
        ['الفن', 'متحف اللوفر، ثم نزهة في حي مونمارتر.'],
        ['السين', 'رحلة نهرية مسائية.'],
        ['العودة', 'التوصيل إلى المطار.'],
      ],
    },
    {
      id: 'bali', type: 'trip', cats: ['nature', 'honeymoon'], name: 'بالي جزيرة الآلهة', country: 'إندونيسيا', route: 'الرياض ← دينباسار', to: 'DPS',
      days: 7, price: 5290, img: IMG.bali, gallery: [IMG.bali, IMG.beach, IMG.lodgePool, IMG.resortPool],
      summary: 'معابد على الماء، ومدرجات أرز، وشواطئ بغروب استثنائي.',
      includes: [...commonIncludes, 'جولة أوبود ومدرجات الأرز'], excludes: commonExcludes,
      itinerary: [
        ['الوصول', 'الاستقبال ثم الفيلا.'],
        ['أوبود', 'الغابات ومدرجات الأرز.'],
        ['المعابد', 'معبد أولون دانو على البحيرة.'],
        ['الشواطئ', 'يوم بحري مع غروب أولواتو.'],
        ['الجزر', 'رحلة إلى نوسا بينيدا.'],
        ['يوم حر', 'سبا واسترخاء.'],
        ['العودة', 'التوصيل إلى المطار.'],
      ],
    },
    {
      id: 'georgia', type: 'trip', cats: ['nature', 'cities'], name: 'جورجيا الخضراء', country: 'جورجيا', route: 'الرياض ← تبليسي', to: 'TBS',
      days: 5, price: 3490, badge: 'سعر مميز', img: IMG.georgia, gallery: [IMG.georgia, IMG.mountainLake, IMG.backpacker, IMG.boatLake],
      summary: 'تبليسي العتيقة، وجبال كازبيجي، وطقس منعش.',
      includes: commonIncludes, excludes: commonExcludes,
      itinerary: [
        ['تبليسي', 'الوصول وجولة مسائية في المدينة القديمة.'],
        ['كازبيجي', 'الطريق العسكري والجبال الخضراء.'],
        ['متسخيتا', 'المدينة التاريخية والأنهار.'],
        ['يوم حر', 'تسوق أو ركوب التلفريك.'],
        ['العودة', 'التوصيل إلى المطار.'],
      ],
    },
    {
      id: 'malaysia', type: 'trip', cats: ['cities', 'nature'], name: 'ماليزيا الاستوائية', country: 'ماليزيا', route: 'الرياض ← كوالالمبور', to: 'KUL',
      days: 6, price: 3990, img: IMG.kualaLumpur, gallery: [IMG.kualaLumpur, IMG.beach, IMG.bali, IMG.lodgePool],
      summary: 'أبراج بتروناس، ومرتفعات جنتنج، وجزيرة لنكاوي.',
      includes: [...commonIncludes, 'رحلة داخلية إلى لنكاوي'], excludes: commonExcludes,
      itinerary: [
        ['كوالالمبور', 'الوصول وزيارة أبراج بتروناس.'],
        ['جنتنج', 'المرتفعات والتلفريك.'],
        ['لنكاوي', 'طيران داخلي إلى الجزيرة.'],
        ['جولة الجزر', 'جولة بحرية بين الجزر.'],
        ['يوم حر', 'شاطئ واسترخاء.'],
        ['العودة', 'التوصيل إلى المطار.'],
      ],
    },
  ];

  const CATEGORIES = [
    { id: 'all', name: 'الكل' },
    { id: 'packages', name: 'الباقات' },
    { id: 'honeymoon', name: 'شهر العسل' },
    { id: 'nature', name: 'طبيعة' },
    { id: 'cities', name: 'مدن' },
  ];

  const TESTIMONIALS = [
    { text: 'رتبوا لنا كل التفاصيل في تركيا، من الاستقبال إلى رحلة المنطاد. ما احتجنا نفكر بأي شيء.', name: 'أبو فيصل', trip: 'إسطنبول وكبادوكيا', img: IMG.cappadocia, place: 'كبادوكيا' },
    { text: 'شهر عسل في المالديف كان حلمنا، وتحقق بتنظيم مرتب جداً. ردودهم على الواتساب كانت سريعة طوال الرحلة.', name: 'سارة ومحمد', trip: 'المالديف لشهر العسل', img: IMG.maldives, place: 'المالديف' },
    { text: 'أول مرة نسافر بالعائلة إلى سويسرا. البرنامج كان مريحاً ومناسباً للأطفال، والفنادق ممتازة.', name: 'عائلة القحطاني', trip: 'سويسرا الساحرة', img: IMG.switzerland, place: 'سويسرا' },
    { text: 'باقة الاستكشاف تستحق كل ريال. المرشد العربي فرق معنا كثيراً.', name: 'نورة', trip: 'باقة الاستكشاف', img: IMG.bali, place: 'بالي' },
  ];

  /* ---------- Safe storage ---------- */
  const memory = {};
  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        return key in memory ? memory[key] : fallback;
      }
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* private mode */ }
    },
  };

  const formatMoney = (value) => `${Math.round(value).toLocaleString('en-US')} <span>ر.س</span>`;
  const formatMoneyText = (value) => `${Math.round(value).toLocaleString('en-US')} ر.س`;
  const whatsappLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const findProduct = (id) => PRODUCTS.find((product) => product.id === id);

  window.EasyTravel = {
    WHATSAPP_NUMBER, IMG, ICONS, PRODUCTS, CATEGORIES, TESTIMONIALS,
    unsplash, wingsMark, storage, formatMoney, formatMoneyText, whatsappLink, findProduct,
  };
})();
