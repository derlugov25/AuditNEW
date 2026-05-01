import { readFileSync } from "node:fs";
import { Answers, INITIAL_ANSWERS } from "@/lib/types";
import { QUESTIONS } from "@/lib/quiz-questions";
import type { Lang } from "@/lib/i18n";

type OptionMap = Record<number, string>;

type QMode =
  | OptionMap
  | "age"
  | "height"
  | "weight"
  | "waist"
  | "trackers"
  | "conditions"
  | "functional"
  | "text";

// Нумерация совпадает с порядком вопросов в src/lib/quiz-questions.ts (Q1..Q28).
const MAPS: Record<number, QMode> = {
  // Q1. Главная цель
  1: {
    1: "weight_loss",
    2: "muscle_gain",
    3: "energy",
    4: "nutrition",
    5: "endurance",
    6: "sleep",
    7: "biological_age",
  },
  // Q2. Уровень энергии
  2: { 1: "stable_high", 2: "drop_after_lunch", 3: "unstable", 4: "mostly_low" },
  // Q3. Часы тумана за неделю
  3: {
    1: "<1h",
    2: "1-3h",
    3: "3-7h",
    4: "7-14h",
    5: "14-20h",
    6: "20-40h",
    7: "40+h",
  },
  // Q4. Хронические заболевания (multi)
  4: "conditions",
  // Q5. Время отбоя
  5: {
    1: "before22",
    2: "22-23",
    3: "23-00",
    4: "00-01",
    5: "01-02",
    6: "02-03",
    7: "03-04",
    8: "04-05",
    9: "after05",
  },
  // Q6. Время подъёма
  6: {
    1: "before6",
    2: "6-7",
    3: "7-8",
    4: "8-9",
    5: "9-10",
    6: "10-11",
    7: "11-12",
    8: "12-13",
    9: "13-14",
    10: "after14",
  },
  // Q7. Проблемы со сном
  7: { 1: "never", 2: "1-3", 3: "4-8", 4: "9+" },
  // Q8. Дневная сонливость
  8: { 1: "never", 2: "1-3", 3: "4-8", 4: "9+" },
  // Q9. Активные дни (1+ час)
  9: { 1: "0", 2: "1-2", 3: "3-4", 4: "5-7" },
  // Q10. Часы сидения
  10: { 1: "<4", 2: "4-6", 3: "6-8", 4: "8+" },
  // Q11. Функциональная активность (multi, DASI-style)
  11: "functional",
  // Q12. Восстановление дыхания
  12: { 1: "<1min", 2: "1-2min", 3: "3-5min", 4: "5min+_avoid" },
  // Q13. Обработанные продукты (5 градаций)
  13: { 1: "almost_never", 2: "1-4mo", 3: "2-3wk", 4: "4-6wk", 5: "daily" },
  // Q14. Овощи и фрукты
  14: { 1: "3plus_daily", 2: "1-2_daily", 3: "3-6_week", 4: "<3_week" },
  // Q15. Вода
  15: { 1: "2plus_l", 2: "1.5-2l", 3: "1-1.5l", 4: "<1l" },
  // Q16. Алкоголь
  16: { 1: "never", 2: "rare", 3: "1-2wk", 4: "3-4wk", 5: "daily" },
  // Q17. Никотин
  17: {
    1: "never",
    2: "quit_1yr_plus",
    3: "quit_under_1yr",
    4: "sometimes",
    5: "regular",
  },
  // Q18. Тип нагрузки
  18: {
    1: "strength",
    2: "cardio",
    3: "yoga_flex",
    4: "mixed",
    5: "walking",
    6: "none",
  },
  // Q19. Барьер
  19: {
    1: "time",
    2: "energy",
    3: "conflicting_advice",
    4: "motivation",
    5: "dont_know_start",
  },
  // Q20. Пол
  20: { 1: "male", 2: "female" },
  // Q21. Возраст
  21: "age",
  // Q22. Рост
  22: "height",
  // Q23. Вес
  23: "weight",
  // Q24. Окружность талии (опционально, "skip"/"-" допустимо)
  24: "waist",
  // Q25. Трекеры (multi)
  25: "trackers",
  // Q26-28. Контакт
  26: "text",
  27: "text",
  28: "text",
};

const TRACKERS: Record<number, string> = {
  1: "whoop",
  2: "oura",
  3: "apple_watch",
  4: "garmin",
  5: "smart_scales",
  6: "smart_mattress",
  7: "other",
  8: "none",
};

const CONDITIONS: Record<number, string> = {
  1: "none",
  2: "hypertension",
  3: "atherosclerosis",
  4: "diabetes2",
  5: "autoimmune",
  6: "thyroid",
  7: "kidney",
  8: "allergy",
  9: "cancer",
  10: "bpd",
  11: "other",
  12: "prefer_not_to_say",
};

const FUNCTIONAL: Record<number, string> = {
  1: "short_walk",
  2: "stairs",
  3: "short_run",
  4: "light_chores",
  5: "moderate_chores",
  6: "heavy_chores",
  7: "moderate_sport",
  8: "intense_sport",
};

const KEY_FOR_Q: Record<number, keyof Answers | null> = {
  1: "goal",
  2: "energyPattern",
  3: "foggyHours",
  4: "conditions",
  5: "bedtime",
  6: "wakeTime",
  7: "sleepProblems",
  8: "daytimeSleepiness",
  9: "activeDays",
  10: "sittingHours",
  11: "functionalActivities",
  12: "breathRecovery",
  13: "processedFood",
  14: "veggiesFruits",
  15: "water",
  16: "alcohol",
  17: "nicotine",
  18: "exerciseType",
  19: "barrier",
  20: "gender",
  21: "age",
  22: "heightCm",
  23: "weightKg",
  24: "waistCm",
  25: "trackers",
  26: "name",
  27: "email",
  28: "telegram",
};

// ──────────────────────────────────────────────────────────────────────
// TEXT-BASED ANSWERS
// Поддержка человеко-читаемых ответов в input.txt:
//   1. Повышение энергии
//   3. 1-3 ч
// Сначала пытаемся распарсить как число варианта, потом как текст-метку.
// ──────────────────────────────────────────────────────────────────────

// Unicode-aware замена «целого слова» (поскольку \b не работает с кириллицей).
const wordBoundary = (units: string[]): RegExp =>
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${units.join("|")})(?![\\p{L}\\p{N}])`, "gu");

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/['’`]/g, "")
    // RU-единицы
    .replace(wordBoundary(["часов", "часа", "час"]), "ч")
    .replace(wordBoundary(["минут", "минуты", "минуту", "минута"]), "мин")
    .replace(wordBoundary(["литров", "литра", "литр"]), "л")
    .replace(wordBoundary(["дней", "дня", "день"]), "д")
    .replace(wordBoundary(["ночей", "ночи", "ночь"]), "")
    .replace(wordBoundary(["раза", "разы", "раз"]), "")
    .replace(wordBoundary(["неделю", "неделе", "неделя", "нед"]), "")
    .replace(wordBoundary(["месяц", "месяца", "месяцев", "мес"]), "")
    .replace(wordBoundary(["год", "года", "лет"]), "")
    .replace(wordBoundary(["менее", "меньше"]), "<")
    .replace(wordBoundary(["более", "больше"]), ">")
    .replace(wordBoundary(["в", "за"]), "")
    // EN units / qualifiers
    .replace(wordBoundary(["hours", "hour", "hrs", "hr", "h"]), "ч")
    .replace(wordBoundary(["minutes", "minute", "mins", "min", "m"]), "мин")
    .replace(wordBoundary(["liters", "liter", "litres", "litre", "l"]), "л")
    .replace(wordBoundary(["days", "day"]), "д")
    .replace(wordBoundary(["nights", "night"]), "")
    .replace(wordBoundary(["times", "time"]), "")
    .replace(wordBoundary(["per", "a"]), "")
    .replace(wordBoundary(["week", "weekly", "wk"]), "")
    .replace(wordBoundary(["month", "monthly", "mo"]), "")
    .replace(wordBoundary(["year", "years", "yr", "yrs"]), "")
    .replace(wordBoundary(["servings", "serving"]), "")
    .replace(wordBoundary(["less than", "fewer than", "under"]), "<")
    .replace(wordBoundary(["more than", "over", "above"]), ">")
    .replace(/\bam\b|\bpm\b/g, "")
    .replace(/[--\-:,;().\/+"“”«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(?<![\d])0+(\d)/g, "$1")
    .replace(/(\d)\s+00(?![\d])/g, "$1")
    .replace(/<\s+/g, "<")
    .replace(/>\s+/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const MANUAL_ALIASES: Partial<Record<number, Record<string, string[]>>> = {
  // Q2 - короткие формы из input.txt отличаются от полных лейблов в QUESTIONS
  2: {
    stable_high: ["стабильно высокий весь день"],
    drop_after_lunch: ["в основном ок, после обеда падает"],
    unstable: ["нестабильно"],
    mostly_low: ["большую часть дня низкий"],
  },
  // Q3 hours
  3: {
    "<1h": ["<1 ч", "меньше 1 часа", "до 1 ч"],
    "1-3h": ["1-3 ч", "1-3 ч"],
    "3-7h": ["3-7 ч", "3-7 ч"],
    "7-14h": ["7-14 ч", "7-14 ч"],
    "14-20h": ["14-20 ч", "14-20 ч"],
    "20-40h": ["20-40 ч", "20-40 ч"],
    "40+h": ["40+ ч", "более 40 ч"],
  },
  // Q5 / Q6 times - пользователь может писать без минут
  5: {
    before22: ["до 22"],
    after05: ["после 05", "после 5"],
  },
  6: {
    before6: ["до 6", "до 06"],
    after14: ["после 14"],
  },
  // Q9 days
  9: {
    "0": ["0", "0 дней"],
    "1-2": ["1-2", "1-2"],
    "3-4": ["3-4", "3-4"],
    "5-7": ["5-7", "5-7"],
  },
  // Q10 sitting hours
  10: {
    "<4": ["<4 ч", "<4"],
    "4-6": ["4-6 ч", "4-6 ч"],
    "6-8": ["6-8 ч", "6-8 ч"],
    "8+": ["8+ ч", ">8 ч"],
  },
  // Q12 minutes
  12: {
    "<1min": ["<1 мин"],
    "1-2min": ["1-2 мин", "1-2 мин"],
    "3-5min": ["3-5 мин", "3-5 мин"],
    "5min+_avoid": [">5 мин / избегаю", ">5 мин", "избегаю", "более 5 мин избегаю"],
  },
  // Q15 water
  15: {
    "2plus_l": [">2 л", "2+ л", "более 2 л"],
    "1.5-2l": ["1.5-2 л", "1.5-2 л"],
    "1-1.5l": ["1-1.5 л", "1-1.5 л"],
    "<1l": ["<1 л", "менее 1 л"],
  },
  // Q16 alcohol
  16: {
    rare: ["редко"],
    "1-2wk": ["1-2 раза/нед", "1-2 раза в неделю"],
    "3-4wk": ["3-4 раза/нед", "3-4 раза в неделю"],
  },
  // Q17 nicotine
  17: {
    sometimes: ["иногда"],
    regular: ["регулярно"],
  },
  // Q18 exercise
  18: {
    strength: ["силовые"],
    cardio: ["кардио"],
    yoga_flex: ["йога/растяжка", "йога", "растяжка"],
    mixed: ["смешанный"],
    walking: ["ходьба"],
    none: ["не занимаюсь"],
  },
  // Q4 conditions short forms
  4: {
    none: ["нет"],
    hypertension: ["гипертония / ссз", "гипертония", "ссз"],
    diabetes2: ["диабет 2 типа", "диабет ii типа", "диабет 2"],
    thyroid: ["щитовидка", "щитовидная железа"],
    kidney: ["почечная недостаточность"],
    autoimmune: ["аутоиммунные"],
    cancer: ["онкология"],
    bpd: ["пограничные расстройства личности"],
    prefer_not_to_say: ["предпочитаю не указывать"],
  },
  // Q25 trackers short
  25: {
    oura: ["oura"],
    smart_scales: ["смарт-весы", "смарт весы"],
    smart_mattress: ["смарт-матрас", "смарт матрас"],
    none: ["не пользуюсь"],
  },
};

// ──────────────────────────────────────────────────────────────────────
// EN ALIASES - поддержка английских ответов в input.txt.
// ──────────────────────────────────────────────────────────────────────
const EN_ALIASES: Partial<Record<number, Record<string, string[]>>> = {
  1: {
    weight_loss: ["weight loss", "lose weight"],
    muscle_gain: ["building muscle mass", "build muscle", "muscle gain", "gain muscle"],
    energy: ["boosting energy", "boost energy", "energy boost", "more energy"],
    nutrition: ["improving nutrition", "improve nutrition", "better nutrition"],
    endurance: ["increasing endurance", "improve endurance", "better endurance"],
    sleep: ["better sleep quality", "better sleep", "improve sleep"],
    biological_age: ["reducing biological age", "lower biological age", "biological age"],
  },
  2: {
    stable_high: ["high and stable all day", "stable high", "high all day"],
    drop_after_lunch: [
      "mostly fine noticeable drop after lunch",
      "drop after lunch",
      "energy drops after lunch",
    ],
    unstable: ["unstable varies day to day", "unstable", "varies day to day"],
    mostly_low: ["low most of the day", "mostly low", "low energy"],
  },
  3: {
    "<1h": ["less than an hour", "less than 1 hour", "<1 h", "<1h"],
    "1-3h": ["1 3 hours", "1-3 hours", "1-3 h"],
    "3-7h": ["3 7 hours", "3-7 hours"],
    "7-14h": ["7 14 hours", "7-14 hours"],
    "14-20h": ["14 20 hours", "14-20 hours"],
    "20-40h": ["20 40 hours", "20-40 hours"],
    "40+h": ["more than 40 hours", "40+ hours", "over 40 hours"],
  },
  4: {
    none: ["none", "no"],
    hypertension: [
      "hypertension cardiovascular disease",
      "hypertension",
      "cardiovascular disease",
      "cardiovascular",
      "high blood pressure",
    ],
    atherosclerosis: ["atherosclerosis"],
    diabetes2: ["type 2 diabetes", "diabetes type 2", "diabetes 2", "t2d"],
    autoimmune: ["autoimmune diseases", "autoimmune"],
    thyroid: ["thyroid disorders", "thyroid"],
    kidney: ["kidney failure", "kidney"],
    allergy: ["allergies", "allergy"],
    cancer: ["cancer"],
    bpd: ["borderline personality disorder", "bpd"],
    other: ["other"],
    prefer_not_to_say: ["prefer not to say"],
  },
  5: {
    before22: ["before 10 pm", "before 10:00 pm"],
    "22-23": ["10:00 11:00 pm", "10 11 pm", "10pm 11pm"],
    "23-00": ["11:00 pm 12:00 am", "11 pm 12 am", "11pm 12am"],
    "00-01": ["12:00 1:00 am", "12 1 am", "12am 1am"],
    "01-02": ["1:00 2:00 am", "1 2 am"],
    "02-03": ["2:00 3:00 am", "2 3 am"],
    "03-04": ["3:00 4:00 am", "3 4 am"],
    "04-05": ["4:00 5:00 am", "4 5 am"],
    after05: ["after 5 am", "after 5:00 am"],
  },
  6: {
    before6: ["before 6 am", "before 6:00 am"],
    "6-7": ["6:00 7:00 am", "6 7 am"],
    "7-8": ["7:00 8:00 am", "7 8 am"],
    "8-9": ["8:00 9:00 am", "8 9 am"],
    "9-10": ["9:00 10:00 am", "9 10 am"],
    "10-11": ["10:00 11:00 am", "10 11 am"],
    "11-12": ["11:00 am 12:00 pm", "11 am 12 pm"],
    "12-13": ["12:00 1:00 pm", "12 1 pm"],
    "13-14": ["1:00 2:00 pm", "1 2 pm"],
    after14: ["after 2 pm", "after 2:00 pm"],
  },
  7: {
    never: ["never"],
    "1-3": ["1 3 nights per month", "1-3 nights", "1-3 nights per month"],
    "4-8": ["4 8 nights per month", "4-8 nights"],
    "9+": ["9 nights per month", "9+ nights"],
  },
  8: {
    never: ["never"],
    "1-3": ["1 3 times per month", "1-3 times"],
    "4-8": ["4 8 times per month", "4-8 times"],
    "9+": ["9 times per month", "9+ times"],
  },
  9: {
    "0": ["0 days", "zero", "none"],
    "1-2": ["1 2 days", "1-2 days"],
    "3-4": ["3 4 days", "3-4 days"],
    "5-7": ["5 7 days", "5-7 days"],
  },
  10: {
    "<4": ["less than 4 hours", "<4 hours", "<4h"],
    "4-6": ["4 6 hours", "4-6 hours"],
    "6-8": ["6 8 hours", "6-8 hours"],
    "8+": ["more than 8 hours", "8+ hours", ">8 hours"],
  },
  11: {
    short_walk: ["short walks", "short walk", "10 15 minutes", "10-15 minutes"],
    stairs: ["climbing stairs", "stairs", "climbing stairs or hills", "stairs or hills"],
    short_run: ["short distance running", "short run", "short distance run"],
    light_chores: ["light housework", "light chores"],
    moderate_chores: ["moderate housework", "moderate chores"],
    heavy_chores: ["heavy housework", "heavy chores"],
    moderate_sport: [
      "moderate physical activity",
      "moderate sport",
      "dancing golf doubles tennis",
    ],
    intense_sport: ["intense sports", "intense sport", "swimming soccer basketball"],
  },
  12: {
    "<1min": ["less than a minute", "<1 minute", "<1 min"],
    "1-2min": ["1 2 minutes", "1-2 minutes", "1-2 min"],
    "3-5min": ["3 5 minutes", "3-5 minutes"],
    "5min+_avoid": [
      "more than 5 minutes",
      ">5 minutes",
      "i try to avoid such exertion",
      "more than 5 minutes i try to avoid such exertion",
      "avoid",
    ],
  },
  13: {
    almost_never: ["almost never"],
    "1-4mo": ["1 4 times per month", "1-4 times per month"],
    "2-3wk": ["2 3 times per week", "2-3 times per week"],
    "4-6wk": ["4 6 times per week", "4-6 times per week"],
    daily: ["daily", "every day"],
  },
  14: {
    "3plus_daily": ["3 servings every day", "3+ servings every day", "3+ daily"],
    "1-2_daily": ["1 2 servings per day", "1-2 servings per day", "1-2 daily"],
    "3-6_week": ["several times per week", "several times a week"],
    "<3_week": ["less than 3 times per week", "<3 times per week"],
  },
  15: {
    "2plus_l": ["more than 2 liters", "2+ liters", ">2 l"],
    "1.5-2l": ["1.5 2 liters", "1.5-2 liters"],
    "1-1.5l": ["1 1.5 liters", "1-1.5 liters"],
    "<1l": ["less than 1 liter", "<1 liter", "<1 l"],
  },
  16: {
    never: ["no not at all", "no", "not at all"],
    rare: ["rarely", "rarely 1 5 times per year", "rarely 1-5 times per year"],
    "1-2wk": ["1 2 times per week", "1-2 times per week"],
    "3-4wk": ["3 4 times per week", "3-4 times per week"],
    daily: ["daily", "every day"],
  },
  17: {
    never: ["no", "never"],
    quit_1yr_plus: ["quit more than a year ago", "quit over a year ago"],
    quit_under_1yr: ["quit less than a year ago", "quit under a year ago"],
    sometimes: [
      "yes occasionally",
      "occasionally",
      "yes occasionally less than 5 times per week",
    ],
    regular: ["yes regularly", "regularly", "yes regularly 5 times per week"],
  },
  18: {
    strength: ["strength training", "strength", "gym trx crossfit"],
    cardio: ["cardio", "running cycling swimming elliptical"],
    yoga_flex: ["yoga stretching pilates", "yoga", "stretching", "pilates"],
    mixed: ["mixed"],
    walking: ["walking light activity", "walking", "light activity"],
    none: ["i hardly exercise", "hardly exercise", "no exercise", "none"],
  },
  19: {
    time: ["not enough time", "no time"],
    energy: ["not enough energy", "no energy"],
    conflicting_advice: ["too much conflicting advice", "conflicting advice"],
    motivation: ["i lose motivation quickly", "lose motivation", "low motivation"],
    dont_know_start: [
      "i dont know where to start",
      "dont know where to start",
      "where to start",
    ],
  },
  20: {
    male: ["male", "man", "m"],
    female: ["female", "woman", "f"],
  },
  25: {
    whoop: ["whoop"],
    oura: ["oura ring", "oura"],
    apple_watch: ["apple watch"],
    garmin: ["garmin"],
    smart_scales: ["smart scales", "smart scale"],
    smart_mattress: ["smart mattress"],
    other: ["other"],
    none: ["none", "no devices", "i dont use any"],
  },
};

// Слияние RU + EN алиасов в общий MANUAL_ALIASES.
for (const [qNumStr, aliases] of Object.entries(EN_ALIASES)) {
  const qNum = Number(qNumStr);
  const existing = MANUAL_ALIASES[qNum] ?? {};
  const merged: Record<string, string[]> = { ...existing };
  for (const [val, list] of Object.entries(aliases ?? {})) {
    merged[val] = [...(merged[val] ?? []), ...list];
  }
  MANUAL_ALIASES[qNum] = merged;
}

type OptItem = { value: string; label: string };

function optionsForQuestion(qNum: number): OptItem[] | null {
  const key = KEY_FOR_Q[qNum];
  if (!key) return null;
  const q = QUESTIONS.find((qq) => qq.id === key);
  if (!q || (q.type !== "single" && q.type !== "multi")) return null;
  return q.options;
}

function buildAliasIndex(qNum: number): Map<string, string> {
  const out = new Map<string, string>();
  const opts = optionsForQuestion(qNum);
  if (opts) {
    for (const o of opts) {
      out.set(normalize(o.value), o.value);
      out.set(normalize(o.label), o.value);
    }
  }
  const m = MANUAL_ALIASES[qNum];
  if (m) {
    for (const [val, aliases] of Object.entries(m)) {
      for (const a of aliases) out.set(normalize(a), val);
    }
  }
  return out;
}

const ALIAS_CACHE = new Map<number, Map<string, string>>();
function aliasIndex(qNum: number): Map<string, string> {
  let cached = ALIAS_CACHE.get(qNum);
  if (!cached) {
    cached = buildAliasIndex(qNum);
    ALIAS_CACHE.set(qNum, cached);
  }
  return cached;
}

function resolveByText(qNum: number, raw: string): string | null {
  const idx = aliasIndex(qNum);
  return idx.get(normalize(raw)) ?? null;
}

function splitMultiTokens(rest: string): string[] {
  const out: string[] = [];
  let buf = "";
  let depth = 0;
  for (const ch of rest) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === "," || ch === ";")) {
      const t = buf.trim();
      if (t) out.push(t);
      buf = "";
      continue;
    }
    buf += ch;
  }
  const last = buf.trim();
  if (last) out.push(last);
  return out;
}

// Минимальный обязательный набор. Q24 (талия), Q26 (имя), Q28 (telegram) - необязательные.
const REQUIRED_QUESTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25,
];

export interface ParseError {
  line: number;
  question?: number;
  message: string;
}

export interface ParseResult {
  answers: Answers;
  errors: ParseError[];
  warnings: string[];
  lang: Lang;
}

const SKIP_RE = /^(skip|пропуск|-|-|нет|0|none)$/i;

const parseMultiNums = (rest: string): number[] =>
  rest
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));

export function parseInput(raw: string): ParseResult {
  const answers: Answers = { ...INITIAL_ANSWERS };
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  const seen = new Set<number>();
  let lang: Lang = "ru";
  let langExplicit = false;
  let enHits = 0;
  let ruHits = 0;

  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = stripInlineComment(rawLine).trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;

    // Явная директива языка: `lang: en` / `lang: ru` / `language: en`
    const langMatch = line.match(/^(?:lang|language)\s*:\s*(en|ru|english|russian)$/i);
    if (langMatch) {
      const v = langMatch[1].toLowerCase();
      lang = v === "en" || v === "english" ? "en" : "ru";
      langExplicit = true;
      continue;
    }

    const metaMatch = line.match(/^(name|email|telegram)\s*:\s*(.+)$/i);
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase();
      const value = metaMatch[2].trim();
      if (key === "name") answers.name = value;
      if (key === "email") answers.email = value;
      if (key === "telegram") answers.telegram = value;
      continue;
    }

    const qMatch = line.match(/^(\d{1,2})\s*[.)]\s*(.+)$/);
    if (!qMatch) {
      warnings.push(`Строка ${i + 1} проигнорирована: "${line}"`);
      continue;
    }
    const qNum = Number(qMatch[1]);
    const rest = qMatch[2].trim();

    // Авто-детект языка по содержимому ответов: сравниваем количество кириллицы и латиницы.
    enHits += (rest.match(/[A-Za-z]/g) ?? []).length;
    ruHits += (rest.match(/[А-Яа-яЁё]/g) ?? []).length;

    if (!(qNum in MAPS)) {
      errors.push({ line: i + 1, message: `Неизвестный вопрос Q${qNum}` });
      continue;
    }
    if (seen.has(qNum)) {
      warnings.push(`Q${qNum} встречается повторно в строке ${i + 1} - перезаписываю`);
    }
    seen.add(qNum);

    const mode = MAPS[qNum];

    if (mode === "age") {
      const ageNum = Number(rest.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(ageNum) || ageNum < 14 || ageNum > 100) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} ожидает возраст числом (14-100). Получено: "${rest}"`,
        });
        continue;
      }
      answers.age = Math.round(ageNum);
      continue;
    }

    if (mode === "height") {
      const n = Number(rest.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(n) || n < 120 || n > 230) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} ожидает рост в см (120-230). Получено: "${rest}"`,
        });
        continue;
      }
      answers.heightCm = Math.round(n);
      continue;
    }

    if (mode === "weight") {
      const n = Number(rest.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(n) || n < 30 || n > 250) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} ожидает вес в кг (30-250). Получено: "${rest}"`,
        });
        continue;
      }
      answers.weightKg = Math.round(n);
      continue;
    }

    if (mode === "waist") {
      if (SKIP_RE.test(rest)) {
        answers.waistCm = null;
        continue;
      }
      const n = Number(rest.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(n) || n < 40 || n > 200) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} ожидает окружность талии в см (40-200) или "skip". Получено: "${rest}"`,
        });
        continue;
      }
      answers.waistCm = Math.round(n);
      continue;
    }

    if (mode === "trackers") {
      if (SKIP_RE.test(rest)) {
        answers.trackers = ["none"];
        continue;
      }
      const tokens = splitMultiTokens(rest);
      const resolved: string[] = [];
      const invalid: string[] = [];
      for (const tok of tokens) {
        const asNum = Number(tok);
        if (Number.isFinite(asNum) && asNum in TRACKERS) {
          resolved.push(TRACKERS[asNum]);
          continue;
        }
        const v = resolveByText(qNum, tok);
        if (v) resolved.push(v);
        else invalid.push(tok);
      }
      if (invalid.length) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} содержит неизвестные варианты: ${invalid.join(", ")}. Допустимо 1-8 или название трекера.`,
        });
        continue;
      }
      answers.trackers = resolved;
      continue;
    }

    if (mode === "conditions") {
      if (SKIP_RE.test(rest)) {
        answers.conditions = ["none"];
        continue;
      }
      const tokens = splitMultiTokens(rest);
      const resolved: string[] = [];
      const invalid: string[] = [];
      for (const tok of tokens) {
        const asNum = Number(tok);
        if (Number.isFinite(asNum) && asNum in CONDITIONS) {
          resolved.push(CONDITIONS[asNum]);
          continue;
        }
        const v = resolveByText(qNum, tok);
        if (v) resolved.push(v);
        else invalid.push(tok);
      }
      if (invalid.length) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} содержит неизвестные варианты: ${invalid.join(", ")}. Допустимо 1-12 или название диагноза.`,
        });
        continue;
      }
      answers.conditions = resolved as Answers["conditions"];
      continue;
    }

    if (mode === "functional") {
      if (SKIP_RE.test(rest)) {
        answers.functionalActivities = [];
        continue;
      }
      const tokens = splitMultiTokens(rest);
      const resolved: string[] = [];
      const invalid: string[] = [];
      for (const tok of tokens) {
        const asNum = Number(tok);
        if (Number.isFinite(asNum) && asNum in FUNCTIONAL) {
          resolved.push(FUNCTIONAL[asNum]);
          continue;
        }
        const v = resolveByText(qNum, tok);
        if (v) resolved.push(v);
        else invalid.push(tok);
      }
      if (invalid.length) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} содержит неизвестные варианты: ${invalid.join(", ")}. Допустимо 1-8 или название активности.`,
        });
        continue;
      }
      answers.functionalActivities = resolved as Answers["functionalActivities"];
      continue;
    }

    if (mode === "text") {
      const key = KEY_FOR_Q[qNum];
      if (!key) continue;
      (answers as unknown as Record<string, unknown>)[key] = rest;
      continue;
    }

    const optionMap = mode as OptionMap;
    const asNum = Number(rest);
    let resolvedValue: string | null = null;
    if (Number.isFinite(asNum) && asNum in optionMap) {
      resolvedValue = optionMap[asNum];
    } else {
      resolvedValue = resolveByText(qNum, rest);
    }
    if (!resolvedValue) {
      errors.push({
        line: i + 1,
        question: qNum,
        message: `Q${qNum} ожидает номер варианта (${Object.keys(optionMap).join("/")}) или текст ответа. Получено: "${rest}"`,
      });
      continue;
    }
    const key = KEY_FOR_Q[qNum];
    if (!key) continue;
    (answers as unknown as Record<string, unknown>)[key] = resolvedValue;
  }

  for (const q of REQUIRED_QUESTIONS) {
    if (!seen.has(q)) {
      errors.push({ line: 0, question: q, message: `Отсутствует ответ на Q${q}` });
    }
  }

  if (!answers.email) {
    errors.push({ line: 0, message: `Не указан email (Q27 или строка "Email: ...")` });
  }

  if (!langExplicit) {
    // Авто-детект: если латинских букв ощутимо больше кириллических - считаем, что язык English.
    if (enHits > ruHits * 1.5 && enHits > 5) lang = "en";
    else lang = "ru";
  }

  return { answers, errors, warnings, lang };
}

function stripInlineComment(line: string): string {
  let inHash = false;
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "#") {
      inHash = true;
      break;
    }
    out += ch;
  }
  return inHash ? out : line;
}

export function readInputFile(path: string): ParseResult {
  const text = readFileSync(path, "utf8");
  return parseInput(text);
}
