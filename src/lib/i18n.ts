export type Lang = "ru" | "en";

export const LANG: Lang = "ru";

type Dict = {
  header: {
    title: string;
  };
  footer: {
    site: string;
    email: string;
    notClinical: string;
    privacy: string;
    terms: string;
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
      email: "info@longy.ai",
      notClinical: "Not a clinical diagnosis",
      privacy: "Конфиденциальность",
      terms: "Условия",
    },
    hero: {
      reportTitle: "Ваш персональный отчёт",
      profilePrefix: "Профиль: ",
      notClinical: "Не является клиническим диагнозом",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      emptyName: "—",
    },
    cover: {
      ordinal: "Обложка",
      chip: "Потеря здоровых лет",
      chipOptimize: "Сильная база",
      headlineLine1: "Ваш организм",
      headlineAccent: "стареет",
      headlineLine2: " не так, как",
      headlineLine3: "календарь",
      headlineOptimizeLine1: "Ваш образ жизни",
      headlineOptimizeAccent: "защищает",
      headlineOptimizeLine2: " вас от старения",
      methodology:
        "Методология: Li et al., J Intern Med 2024 · 5 доменов · 21 параметр + хронические заболевания",
      longyScore: "Longy Health Score *",
      outOf100: "/ 100",
      mainDriver: "Главный драйвер",
      strongestSupport: "Ваша сильнейшая опора",
      mainDriverEmpty: "—",
      yearsOfLife: (years) => `≈${years} лет здоровой жизни`,
      topPercent: (n) => `Вы в верхней ${n}% среди ровесников по Longy Health Score`,
      percentileChip: "Ранг по Longy Health Score",
    },
    final: {
      ctaLabel: "Что дальше",
      ctaLabelOptimize: "Как сохранить и продвинуть",
      ctaTitle: "Получить глубокий аудит в приложении",
      ctaTitleOptimize: "Сохранить результат и дойти до top-1%",
    },
    common: {
      dash: "—",
    },
  },
  en: {
    header: {
      title: "Health Audit",
    },
    footer: {
      site: "longy.ai",
      email: "info@longy.ai",
      notClinical: "Not a clinical diagnosis",
      privacy: "Privacy",
      terms: "Terms",
    },
    hero: {
      reportTitle: "Your Personal Report",
      profilePrefix: "Profile: ",
      notClinical: "Not a clinical diagnosis",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      emptyName: "—",
    },
    cover: {
      ordinal: "Cover",
      chip: "Healthy years lost",
      chipOptimize: "Strong foundation",
      headlineLine1: "Your body",
      headlineAccent: "ages",
      headlineLine2: " differently from",
      headlineLine3: "the calendar",
      headlineOptimizeLine1: "Your lifestyle",
      headlineOptimizeAccent: "protects",
      headlineOptimizeLine2: " you from aging",
      methodology:
        "Method: Li et al., J Intern Med 2024 · 5 domains · 21 parameters + chronic conditions",
      longyScore: "Longy Health Score *",
      outOf100: "/ 100",
      mainDriver: "Main driver",
      strongestSupport: "Your strongest pillar",
      mainDriverEmpty: "—",
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
      dash: "—",
    },
  },
};

export const T: Dict = DICT[LANG];

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function formatAge(age: number): string {
  if (LANG === "ru") {
    return `${age} ${pluralRu(age, "год", "года", "лет")}`;
  }
  return age === 1 ? `${age} year` : `${age} years`;
}

export function formatReportDate(date: Date = new Date()): string {
  return LANG === "ru"
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
