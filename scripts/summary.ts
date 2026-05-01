#!/usr/bin/env tsx
/**
 * Краткий текстовый вывод по текущему input.txt (без PDF).
 * Использует те же скоринг и формулировки, что и отчёт.
 */
import path from "node:path";

import { readInputFile } from "@/lib/input-parser";
import { calculateScore } from "@/lib/scoring";
import { setLang } from "@/lib/i18n";
import {
  buildAccelerators,
  goalLabel,
  terminalSummaryLifestyleOneLiner,
} from "@/lib/insights";

const INPUT_PATH = path.resolve(process.cwd(), "input.txt");

function main() {
  const { answers, errors, warnings, lang } = readInputFile(INPUT_PATH);
  setLang(lang);

  if (warnings.length) for (const w of warnings) console.warn(`⚠ ${w}`);

  if (errors.length) {
    console.error("✗ Ошибки в input.txt:");
    for (const e of errors) console.error(`  · ${e.message}`);
    process.exit(1);
  }

  const score = calculateScore(answers);
  const goalName = goalLabel(answers.goal);

  const driversTitle =
    lang === "en" ? "Your three main personal drivers:" : "Три ваших главных личных драйвера:";
  const drivers = buildAccelerators(answers, score)
    .slice(0, 3)
    .map((a) => a.headline);

  const closing =
    lang === "en"
      ? `Longy collects your data, builds a personal model of your body, and turns the path to your goal «${goalName}» into simple daily steps. From day one - a concrete action plan and visible changes.`
      : `Longy собирает ваши данные, строит персональную модель организма и превращает путь к вашей цели «${goalName}» в простые ежедневные шаги. Уже с первого дня - конкретный план действий и заметные изменения.`;

  console.log("");
  console.log(`Longy Health Score: ${score.longyScore} / 100`);
  console.log(terminalSummaryLifestyleOneLiner(score));
  console.log("");
  console.log(driversTitle);
  for (const line of drivers) console.log(`- ${line}`);
  console.log("");
  console.log(closing);
  console.log("");
}

main();
