import { readFileSync } from "node:fs";
import { Answers, INITIAL_ANSWERS } from "@/lib/types";

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

// Минимальный обязательный набор. Q24 (талия), Q26 (имя), Q28 (telegram) — необязательные.
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
}

const SKIP_RE = /^(skip|пропуск|—|-|нет|0|none)$/i;

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

  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = stripInlineComment(rawLine).trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;

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

    if (!(qNum in MAPS)) {
      errors.push({ line: i + 1, message: `Неизвестный вопрос Q${qNum}` });
      continue;
    }
    if (seen.has(qNum)) {
      warnings.push(`Q${qNum} встречается повторно в строке ${i + 1} — перезаписываю`);
    }
    seen.add(qNum);

    const mode = MAPS[qNum];

    if (mode === "age") {
      const ageNum = Number(rest.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(ageNum) || ageNum < 14 || ageNum > 100) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} ожидает возраст числом (14–100). Получено: "${rest}"`,
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
          message: `Q${qNum} ожидает рост в см (120–230). Получено: "${rest}"`,
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
          message: `Q${qNum} ожидает вес в кг (30–250). Получено: "${rest}"`,
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
          message: `Q${qNum} ожидает окружность талии в см (40–200) или "skip". Получено: "${rest}"`,
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
      const nums = parseMultiNums(rest);
      const invalid = nums.filter((n) => !(n in TRACKERS));
      if (invalid.length) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} содержит неизвестные варианты: ${invalid.join(", ")}. Допустимо 1–8.`,
        });
        continue;
      }
      answers.trackers = nums.map((n) => TRACKERS[n]);
      continue;
    }

    if (mode === "conditions") {
      if (SKIP_RE.test(rest)) {
        answers.conditions = ["none"];
        continue;
      }
      const nums = parseMultiNums(rest);
      const invalid = nums.filter((n) => !(n in CONDITIONS));
      if (invalid.length) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} содержит неизвестные варианты: ${invalid.join(", ")}. Допустимо 1–12.`,
        });
        continue;
      }
      answers.conditions = nums.map((n) => CONDITIONS[n]) as Answers["conditions"];
      continue;
    }

    if (mode === "functional") {
      if (SKIP_RE.test(rest)) {
        answers.functionalActivities = [];
        continue;
      }
      const nums = parseMultiNums(rest);
      const invalid = nums.filter((n) => !(n in FUNCTIONAL));
      if (invalid.length) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} содержит неизвестные варианты: ${invalid.join(", ")}. Допустимо 1–8.`,
        });
        continue;
      }
      answers.functionalActivities = nums.map(
        (n) => FUNCTIONAL[n],
      ) as Answers["functionalActivities"];
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
    if (!Number.isFinite(asNum) || !(asNum in optionMap)) {
      errors.push({
        line: i + 1,
        question: qNum,
        message: `Q${qNum} ожидает номер варианта из ${Object.keys(optionMap).join("/")}, получено: "${rest}"`,
      });
      continue;
    }
    const key = KEY_FOR_Q[qNum];
    if (!key) continue;
    (answers as unknown as Record<string, unknown>)[key] = optionMap[asNum];
  }

  for (const q of REQUIRED_QUESTIONS) {
    if (!seen.has(q)) {
      errors.push({ line: 0, question: q, message: `Отсутствует ответ на Q${q}` });
    }
  }

  if (!answers.email) {
    errors.push({ line: 0, message: `Не указан email (Q27 или строка "Email: ...")` });
  }

  return { answers, errors, warnings };
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
