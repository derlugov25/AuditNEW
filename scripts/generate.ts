#!/usr/bin/env tsx
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { readInputFile } from "@/lib/input-parser";
import { calculateScore } from "@/lib/scoring";
import { buildAccelerators, buildProtectors } from "@/lib/insights";
import Report from "@/components/pdf/Report";

const INPUT_PATH = path.resolve(process.cwd(), "input.txt");
const OUTPUT_DIR = path.resolve(process.cwd(), "output");

function main() {
  if (!existsSync(INPUT_PATH)) {
    console.error(`✗ Файл input.txt не найден по пути: ${INPUT_PATH}`);
    process.exit(1);
  }

  const { answers, errors, warnings } = readInputFile(INPUT_PATH);

  if (warnings.length) {
    for (const w of warnings) console.warn(`⚠ ${w}`);
  }

  if (errors.length) {
    console.error("\n✗ Ошибки в input.txt — PDF не сгенерирован:");
    for (const e of errors) {
      const prefix = e.question ? `Q${e.question}` : `строка ${e.line}`;
      console.error(`  · ${prefix}: ${e.message}`);
    }
    process.exit(1);
  }

  const score = calculateScore(answers);
  const accelerators = buildAccelerators(answers, score);
  const protectors = buildProtectors(score);

  console.log("\n─── Результат скоринга ─────────────────────────────");
  console.log(
    `  Longy Score:         ${score.longyScore} / 100  (${score.longyScoreBand})`,
  );
  console.log(
    `  Потеря здоровых лет: ≈${score.yearsLifeLostTotal.toFixed(1)} лет (модель; velocity ${score.agingVelocityPct > 0 ? "+" : ""}${score.agingVelocityPct}%)`,
  );
  console.log(
    `  Индекс массы тела:   ${score.bmi ?? "—"} (${score.bmiCategory})`,
  );
  if (score.goalDomainScore) {
    console.log(
      `  Домен цели:          ${score.goalDomainScore.label} — ${score.goalDomainScore.score0to100}/100`,
    );
  }
  {
    const gap = Math.max(0, score.healthspanMax - score.healthspanYears);
    console.log(
      `  Healthspan gap:      −${gap.toFixed(1)} лет на столе  (реализовано +${score.healthspanYears.toFixed(1)} / +${score.healthspanMax})`,
    );
  }
  console.log("  Топ ускорителей:");
  for (const acc of accelerators) {
    console.log(
      `    · ${score.domains[acc.key].label}  —  ≈${score.domains[acc.key].yearsLifeLost.toFixed(1)} лет`,
    );
  }
  const p = score.projection;
  if (p.deltaScore > 0) {
    console.log(
      `  Проекция (8 нед.):   Longy Score ${p.longyScoreNow} → ${p.longyScoreTarget} (+${p.deltaScore}),  годы ≈${p.yearsLifeLostNow.toFixed(1)} → ≈${p.yearsLifeLostTarget.toFixed(1)}`,
    );
  }
  console.log("────────────────────────────────────────────────────\n");

  const element = React.createElement(Report, {
    answers,
    score,
    accelerators,
    protectors,
  }) as unknown as Parameters<typeof renderToBuffer>[0];

  renderToBuffer(element)
    .then((buffer) => {
      if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
      const stamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 16);
      const base = (answers.name ?? "report").toString().trim() || "report";
      const asciiName = base.replace(/[^A-Za-z0-9_-]+/g, "_");
      const fullName =
        asciiName === "_" || !asciiName
          ? `Longy-audit_${stamp}.pdf`
          : `Longy-audit_${asciiName}_${stamp}.pdf`;
      const filePath = path.join(OUTPUT_DIR, fullName);
      writeFileSync(filePath, buffer);
      const latest = path.join(OUTPUT_DIR, "latest.pdf");
      writeFileSync(latest, buffer);
      console.log(`✓ PDF сохранён:  ${path.relative(process.cwd(), filePath)}`);
      console.log(`✓ Копия:         ${path.relative(process.cwd(), latest)}`);
    })
    .catch((err) => {
      console.error("✗ Ошибка при генерации PDF:", err);
      process.exit(1);
    });
}

main();
