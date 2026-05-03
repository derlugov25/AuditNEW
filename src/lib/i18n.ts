export type Lang = "ru" | "en";

// Текущий язык отчёта. Меняется через setLang() - например, по директиве `lang: en` в input.txt.
let _CURRENT_LANG: Lang = "ru";

export function setLang(lang: Lang): void {
  _CURRENT_LANG = lang;
}

export function getLang(): Lang {
  return _CURRENT_LANG;
}

// Сохраняем для обратной совместимости. ВНИМАНИЕ: это снимок на момент импорта.
// Используйте getLang() для актуального значения.
export const LANG: Lang = "ru";

type Dict = {
  header: {
    title: string;
  };
  footer: {
    site: string;
    siteHref: string;
    email: string;
    notClinical: string;
    privacy: string;
    privacyHref: string;
    terms: string;
    termsHref: string;
  };
  hero: {
    reportTitle: string;
    profilePrefix: string;
    notClinical: string;
    privacyPolicy: string;
    termsOfService: string;
    emptyName: string;
  };
  cover: {
    ordinal: string;
    chip: string;
    chipOptimize: string;
    headlineLine1: string;
    headlineAccent: string;
    headlineLine2: string;
    headlineLine3: string;
    headlineOptimizeLine1: string;
    headlineOptimizeAccent: string;
    headlineOptimizeLine2: string;
    methodology: string;
    longyScore: string;
    outOf100: string;
    mainDriver: string;
    strongestSupport: string;
    mainDriverEmpty: string;
    yearsOfLife: (years: string) => string;
    topPercent: (n: number) => string;
    percentileChip: string;
  };
  final: {
    ctaLabel: string;
    ctaLabelOptimize: string;
    ctaTitle: string;
    ctaTitleOptimize: string;
  };
  common: {
    dash: string;
  };
};

const DICT: Record<Lang, Dict> = {
  ru: {
    header: {
      title: "Health Audit",
    },
    footer: {
      site: "longy.ai",
      siteHref: "https://longy.ai/ru",
      email: "info@longy.ai",
      notClinical: "Не является клиническим диагнозом",
      privacy: "Конфиденциальность",
      privacyHref: "https://longy.ai/ru/privacy-policy",
      terms: "Условия",
      termsHref: "https://longy.ai/ru/terms-of-service",
    },
    hero: {
      reportTitle: "Ваш персональный отчёт",
      profilePrefix: "Профиль: ",
      notClinical: "Не является клиническим диагнозом",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      emptyName: "-",
    },
    cover: {
      ordinal: "Обложка",
      chip: "Потеря здоровых лет",
      chipOptimize: "Сильная база",
      headlineLine1: "Ваш организм",
      headlineAccent: "стареет",
      headlineLine2: " быстрее, чем идут часы",
      headlineLine3: "",
      headlineOptimizeLine1: "Ваш образ жизни",
      headlineOptimizeAccent: "защищает",
      headlineOptimizeLine2: " вас от старения",
      methodology:
        "Методология: Li et al., J Intern Med 2024 · 5 доменов · 21 параметр + хронические заболевания",
      longyScore: "Longy Health Score *",
      outOf100: "/ 100",
      mainDriver: "Главный драйвер",
      strongestSupport: "Ваша сильнейшая опора",
      mainDriverEmpty: "-",
      yearsOfLife: (years) => `≈${years} лет здоровой жизни`,
      topPercent: (n) => `Вы в верхней ${n}% среди ровесников по Longy Health Score`,
      percentileChip: "Ранг по Longy Health Score",
    },
    final: {
      ctaLabel: "Что дальше",
      ctaLabelOptimize: "Как сохранить и улучшить",
      ctaTitle: "Получить глубокий аудит в приложении",
      ctaTitleOptimize: "Сохранить результат и дойти до top-1%",
    },
    common: {
      dash: "-",
    },
  },
  en: {
    header: {
      title: "Health Audit",
    },
    footer: {
      site: "longy.ai",
      siteHref: "https://longy.ai/",
      email: "info@longy.ai",
      notClinical: "Not a clinical diagnosis",
      privacy: "Privacy",
      privacyHref: "https://longy.ai/privacy-policy",
      terms: "Terms",
      termsHref: "https://longy.ai/terms-of-service",
    },
    hero: {
      reportTitle: "Your Personal Report",
      profilePrefix: "Profile: ",
      notClinical: "Not a clinical diagnosis",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      emptyName: "-",
    },
    cover: {
      ordinal: "Cover",
      chip: "Healthy years lost",
      chipOptimize: "Strong foundation",
      headlineLine1: "Your body",
      headlineAccent: "ages",
      headlineLine2: " faster than the clock",
      headlineLine3: "",
      headlineOptimizeLine1: "Your lifestyle",
      headlineOptimizeAccent: "protects",
      headlineOptimizeLine2: " you from aging",
      methodology:
        "Method: Li et al., J Intern Med 2024 · 5 domains · 21 parameters + chronic conditions",
      longyScore: "Longy Health Score *",
      outOf100: "/ 100",
      mainDriver: "Main driver",
      strongestSupport: "Your strongest pillar",
      mainDriverEmpty: "-",
      yearsOfLife: (years) => `≈${years} years of healthy life`,
      topPercent: (n) => `You are in the top ${n}% among peers by Longy Health Score`,
      percentileChip: "Your rank vs peers",
    },
    final: {
      ctaLabel: "What's next",
      ctaLabelOptimize: "How to keep and level up",
      ctaTitle: "Get a deep audit in the app",
      ctaTitleOptimize: "Preserve your result and reach top-1%",
    },
    common: {
      dash: "-",
    },
  },
};

// Динамический прокси на словарь текущего языка.
// `T.cover.headlineLine1` всегда возвращает значение из DICT[currentLang].
export const T: Dict = new Proxy({} as Dict, {
  get(_target, prop: string) {
    return (DICT[_CURRENT_LANG] as unknown as Record<string, unknown>)[prop];
  },
}) as Dict;

// Простой инлайн-переводчик: tr("Текст", "Text") вернёт нужный вариант для текущего языка.
export function tr(ru: string, en: string): string {
  return _CURRENT_LANG === "en" ? en : ru;
}

// Множественное число для английского (1 unit / N units).
export function pluralEn(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

// Универсальный плюрал: для RU использует mod-правила, для EN - one/many.
export function plural(
  n: number,
  ru: { one: string; few: string; many: string },
  en: { one: string; many: string },
): string {
  if (_CURRENT_LANG === "en") return pluralEn(n, en.one, en.many);
  return pluralRu(n, ru.one, ru.few, ru.many);
}

// Стандартное «X лет» / «X years».
export function formatYears(n: number): string {
  const rounded = Number.isInteger(n) ? n : Number(n.toFixed(1));
  if (_CURRENT_LANG === "en") return `${rounded} ${pluralEn(rounded, "year", "years")}`;
  return `${rounded} ${pluralRu(Math.round(rounded), "год", "года", "лет")}`;
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function formatAge(age: number): string {
  if (_CURRENT_LANG === "ru") {
    return `${age} ${pluralRu(age, "год", "года", "лет")}`;
  }
  return age === 1 ? `${age} year` : `${age} years`;
}

export function formatReportDate(date: Date = new Date()): string {
  return _CURRENT_LANG === "ru"
    ? date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}
