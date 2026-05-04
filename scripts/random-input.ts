#!/usr/bin/env tsx
/**
 * Перезаписывает input.txt случайным валидным профилем (lang: ru, лейблы из quiz-questions).
 * Ответы без «1. 2.» — по одной строке на вопрос, порядок как в QUESTIONS.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { readInputFile } from "@/lib/input-parser";
import { QUESTIONS } from "@/lib/quiz-questions";

const INPUT_PATH = path.resolve(process.cwd(), "input.txt");

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function intIn(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST = ["Иван", "Мария", "Алексей", "Елена", "Дмитрий", "Ольга", "Сергей", "Анна", "Павел", "Наталья"];
const LAST = ["Иванов", "Петрова", "Смирнов", "Козлова", "Новиков", "Морозова", "Волков", "Соколова", "Фёдоров", "Лебедева"];

function translitForEmail(name: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? (/[a-z0-9]/.test(ch) ? ch : ""))
    .join("")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function randomEmail(displayName: string): string {
  const base = translitForEmail(displayName) || "user";
  return `${base}.${intIn(10, 99)}@example.com`;
}

/** splitMultiTokens режет по любой `,` — лейблы с запятой внутри (Q11) в input.txt недопустимы. */

function joinMultiLabels(labels: string[]): string {
  return labels.join(", ");
}

function lineForQuestion(
  _index1: number,
  q: (typeof QUESTIONS)[number],
  ctx: { displayName: string },
): string {
  if (q.type === "single") {
    return pick(q.options).label;
  }
  if (q.type === "multi") {
    if (q.id === "conditions") {
      if (Math.random() < 0.42) return "Нет";
      const opts = q.options.filter((o) => o.value !== "none");
      const k = intIn(1, Math.min(3, opts.length));
      return joinMultiLabels(
        shuffle(opts)
          .slice(0, k)
          .map((o) => o.label),
      );
    }
    if (q.id === "functionalActivities") {
      const pool = q.options.filter((o) => !o.label.includes(","));
      const k = intIn(1, Math.min(4, pool.length));
      return joinMultiLabels(
        shuffle(pool)
          .slice(0, k)
          .map((o) => o.label),
      );
    }
    if (q.id === "trackers") {
      if (Math.random() < 0.38) return "Не пользуюсь";
      const opts = q.options.filter((o) => o.value !== "none");
      const k = intIn(1, Math.min(3, opts.length));
      return joinMultiLabels(
        shuffle(opts)
          .slice(0, k)
          .map((o) => o.label),
      );
    }
    return pick(q.options).label;
  }
  if (q.type === "number") {
    if (q.id === "age") return String(intIn(q.min, q.max));
    if (q.id === "heightCm") return String(intIn(q.min, q.max));
    if (q.id === "weightKg") return String(intIn(q.min, q.max));
    if (q.id === "waistCm") {
      return Math.random() < 0.32 ? "skip" : String(intIn(q.min, q.max));
    }
    return String(intIn(q.min, q.max));
  }
  if (q.type === "text") {
    if (q.id === "name") {
      ctx.displayName = `${pick(FIRST)} ${pick(LAST)}`;
      return ctx.displayName;
    }
    return "skip";
  }
  if (q.type === "email") {
    return randomEmail(ctx.displayName);
  }
  return "skip";
}

function main() {
  const ctx = { displayName: "Иван Иванов" };
  const body = QUESTIONS.map((q, i) => lineForQuestion(i + 1, q, ctx));
  const text = ["lang: ru", "", ...body, ""].join("\n");
  writeFileSync(INPUT_PATH, text, "utf8");

  const { errors, warnings } = readInputFile(INPUT_PATH);
  for (const w of warnings) console.warn(`⚠ ${w}`);
  if (errors.length) {
    console.error("✗ Парсер отклонил сгенерированный input.txt:");
    for (const e of errors) console.error(`  · ${e.message}`);
    process.exit(1);
  }
  console.log(`✓ Записано: ${INPUT_PATH}`);
}

main();
