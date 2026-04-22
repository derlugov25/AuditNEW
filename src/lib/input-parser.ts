import { readFileSync } from "node:fs";
import { Answers, INITIAL_ANSWERS } from "@/lib/types";

type OptionMap = Record<number, string>;

// Нумерация соответствует внешнему опроснику Longy (Q1..Q23)
const MAPS: Record<number, OptionMap | "age" | "height_weight" | "trackers" | "text"> = {
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
  2: {
    1: "stable_high",
    2: "drop_after_lunch",
    3: "unstable",
    4: "mostly_low",
  },
  // Q3. Дни тумана / сложной концентрации
  3: { 1: "0", 2: "1-2", 3: "3-4", 4: "5-7" },
  // Q4. Overwhelmed
  4: { 1: "0-2", 2: "3-4", 3: "5-10", 4: "10+" },
  // Q5. Во сколько ложитесь
  5: { 1: "before22", 2: "22-23", 3: "23-00", 4: "00-01", 5: "after01" },
  // Q6. Во сколько просыпаетесь
  6: { 1: "before6", 2: "6-7", 3: "7-8", 4: "8-9", 5: "after9" },
  // Q7. Проблемы со сном
  7: { 1: "never", 2: "1-3", 3: "4-8", 4: "9+" },
  // Q8. Дневная сонливость
  8: { 1: "never", 2: "1-3", 3: "4-8", 4: "9+" },
  // Q9. Дни активности
  9: { 1: "0", 2: "1-2", 3: "3-4", 4: "5-7" },
  // Q10. Часы сидения
  10: { 1: "<4", 2: "4-6", 3: "6-8", 4: "8+" },
  // Q11. Обработанные продукты
  11: { 1: "almost_never", 2: "1-4mo", 3: "3-6wk", 4: "daily" },
  // Q12. Овощи и фрукты
  12: { 1: "3plus_daily", 2: "1-2_daily", 3: "3-6_week", 4: "<3_week" },
  // Q13. Вода
  13: { 1: "2plus_l", 2: "1.5-2l", 3: "1-1.5l", 4: "<1l" },
  // Q14. Алкоголь
  14: { 1: "never", 2: "rare", 3: "1-2wk", 4: "3-4wk", 5: "daily" },
  // Q15. Никотин
  15: {
    1: "never",
    2: "quit_1yr_plus",
    3: "quit_under_1yr",
    4: "sometimes",
    5: "regular",
  },
  // Q16. Социальные связи
  16: {
    1: "almost_daily",
    2: "few_per_week",
    3: "few_per_month",
    4: "rarely",
  },
  // Q17. Пол
  17: { 1: "male", 2: "female" },
  // Q18. Возраст (число)
  18: "age",
  // Q19. Рост / вес
  19: "height_weight",
  // Q20. Трекеры (multi)
  20: "trackers",
  // Q21-23. Текстовые поля: имя, email, telegram
  21: "text",
  22: "text",
  23: "text",
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

const KEY_FOR_Q: Record<number, keyof Answers | null> = {
  1: "goal",
  2: "energyPattern",
  3: "foggyDays",
  4: "overwhelmed",
  5: "bedtime",
  6: "wakeTime",
  7: "sleepProblems",
  8: "daytimeSleepiness",
  9: "activeDays",
  10: "sittingHours",
  11: "processedFood",
  12: "veggiesFruits",
  13: "water",
  14: "alcohol",
  15: "nicotine",
  16: "socialConnections",
  17: "gender",
  18: "age",
  19: null, // height_weight → heightCm + weightKg
  20: "trackers",
  21: "name",
  22: "email",
  23: "telegram",
};

// Минимальный обязательный набор вопросов для валидного аудита.
// Q21 (имя) и Q23 (telegram) — не обязательные: их можно не заполнять.
const REQUIRED_QUESTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
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

    // Поддерживаем также префиксы Name:/Email:/Telegram: для контактов
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

    const mapOrMode = MAPS[qNum];

    if (mapOrMode === "age") {
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

    if (mapOrMode === "height_weight") {
      const m = rest.match(/(\d{2,3})\s*[/,xх]\s*(\d{2,3})/);
      if (!m) {
        errors.push({
          line: i + 1,
          question: qNum,
          message: `Q${qNum} ожидает "рост / вес" — например: 180 / 85. Получено: "${rest}"`,
        });
        continue;
      }
      answers.heightCm = Number(m[1]);
      answers.weightKg = Number(m[2]);
      continue;
    }

    if (mapOrMode === "trackers") {
      if (/^(нет|none|0|—)$/i.test(rest)) {
        answers.trackers = ["none"];
        continue;
      }
      const nums = rest
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
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

    if (mapOrMode === "text") {
      const key = KEY_FOR_Q[qNum];
      if (!key) continue;
      (answers as unknown as Record<string, unknown>)[key] = rest;
      continue;
    }

    const optionMap = mapOrMode as OptionMap;
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

  // Email можно указать как через строку "Email:", так и через "22. ...".
  // Требуем, чтобы он был заполнен хоть как-то.
  if (!answers.email) {
    errors.push({ line: 0, message: `Не указан email (Q22 или строка "Email: ...")` });
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
