"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Answers, INITIAL_ANSWERS } from "@/lib/types";
import { calculateScore } from "@/lib/scoring";
import {
  buildAccelerators,
  buildProtectors,
  getLongyFeatures,
  LongyFeature,
  acceleratorColor,
  goalLabel,
  longyScoreLabel,
  goalDomainHeadline,
  coverSubtitle,
  coverCTA,
  lifeYearsHeadline,
  lifeYearsModelNote,
} from "@/lib/insights";
import { Speedometer } from "@/components/Speedometer";
import { RadarChart } from "@/components/RadarChart";
import { healthyYearsUnitRu, tr, getLang, pluralEn } from "@/lib/i18n";

const STORAGE_KEY = "longy_audit_answers_v2";

export default function ResultPage() {
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers({ ...INITIAL_ANSWERS, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  const result = useMemo(() => {
    if (!answers) return null;
    const score = calculateScore(answers);
    const accelerators = buildAccelerators(answers, score);
    const protectors = buildProtectors(score);
    return { score, accelerators, protectors };
  }, [answers]);

  if (!hydrated) return null;

  if (!answers || !answers.goal || !answers.age) {
    return (
      <main className="min-h-screen vignette grid place-items-center px-6">
        <div className="card p-10 max-w-lg text-center">
          <h1 className="display text-3xl">{tr("Нужно пройти опрос", "Take the quiz first")}</h1>
          <p className="mt-3 text-white/60">
            {tr(
              "Мы не нашли сохранённых ответов. Пройдите опрос, чтобы получить персональный аудит.",
              "We didn't find any saved answers. Take the quiz to get your personal audit.",
            )}
          </p>
          <Link href="/quiz" className="btn-primary mt-6">
            {tr("Начать", "Start")}
          </Link>
        </div>
      </main>
    );
  }

  if (!result) return null;
  const { score, accelerators, protectors } = result;
  const velocity = score.agingVelocityPct;
  const isAccelerated = velocity > 0;

  const onDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Longy-audit-${(answers.name ?? "report").trim() || "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(tr(
        "Не удалось сформировать PDF. Попробуйте ещё раз.",
        "Failed to generate the PDF. Please try again.",
      ));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="relative min-h-screen vignette">
      <div className="grain absolute inset-0 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-8 pb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-accent-primary/20 grid place-items-center">
            <div className="h-3 w-3 rounded-full bg-accent-primary" />
          </div>
          <span className="display text-xl">Longy</span>
        </Link>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="btn-primary disabled:opacity-60"
        >
          {downloading
            ? tr("Готовим PDF…", "Preparing PDF…")
            : tr("Скачать PDF-отчёт", "Download PDF report")}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <section className="relative z-10 px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="flex flex-col gap-3">
          <span className="chip">
            {tr("Ваш персональный аудит", "Your personal audit")} ·{" "}
            {new Date().toLocaleDateString(getLang() === "en" ? "en-US" : "ru-RU")}
          </span>
          <h1 className="max-w-5xl">
            {answers.name ? (
              <span className="display text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em]">
                {answers.name},{" "}
              </span>
            ) : null}
            <span className="block text-4xl md:text-6xl font-bold text-white font-sans tracking-normal leading-snug whitespace-pre-line mt-1">
              {lifeYearsHeadline(score, answers)}
            </span>
          </h1>
          <p className="text-white/45 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            {lifeYearsModelNote(score)}
          </p>
          <p className="text-white/70 text-lg md:text-xl mt-3 max-w-2xl leading-relaxed">
            {coverSubtitle(score)}
          </p>
          <p className="text-white/35 text-xs mt-1 tracking-wide">
            {tr(
              "Методология: Li et al., J Intern Med 2024 · 5 доменов · 21 параметр + хронические заболевания",
              "Methodology: Li et al., J Intern Med 2024 · 5 domains · 21 parameters + chronic conditions",
            )}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-8 md:col-span-2 flex flex-col md:flex-row items-center gap-8">
            <Speedometer velocityPct={velocity} size={260} />
            <div className="flex-1">
              <div className="mono text-xs text-white/50">LONGY HEALTH SCORE</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="display text-6xl md:text-7xl">{score.longyScore}</div>
                <div className="text-white/40 text-xl">/ 100</div>
              </div>
              <p className="mt-4 text-white/70 leading-relaxed">
                {longyScoreLabel(score.longyScoreBand).label}.{" "}
                {tr(
                  "Ниже — три главных фактора и что с ними делать.",
                  "Below — three main factors and what to do about them.",
                )}
              </p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mono text-xs text-white/50">
              {score.isGainBranch
                ? tr("ГЛАВНАЯ ТОЧКА РОСТА", "MAIN GROWTH AREA")
                : tr("ГЛАВНЫЙ ДРАЙВЕР", "MAIN DRIVER")}
            </div>
            <div className="display text-2xl mt-3 leading-tight">
              {score.topThree[0]?.label ?? "-"}
            </div>
            <div className={`mt-2 mono text-sm ${score.isGainBranch ? "text-accent-primary" : "text-accent-warm"}`}>
              {score.isGainBranch
                ? (() => {
                    const y =
                      score.gainPotentialWaterfall.find((w) => w.key === score.topThree[0]?.key)?.yearsLost ?? 0;
                    return getLang() === "en"
                      ? `+${y.toFixed(1)} ${pluralEn(Math.round(y), "year", "years")} potential`
                      : `+${y.toFixed(1)} ${healthyYearsUnitRu(y)} потенциал`;
                  })()
                : (() => {
                    const y = score.topThree[0]?.yearsLifeLost ?? 0;
                    return getLang() === "en"
                      ? `minus ~${y.toFixed(1)} ${pluralEn(Math.round(y), "year", "years")} of healthy life`
                      : `минус ~${y.toFixed(1)} ${healthyYearsUnitRu(y)} здоровой жизни`;
                  })()}
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="mono text-xs text-white/50">
                {tr("ИНДЕКС МАССЫ ТЕЛА", "BODY MASS INDEX")}
              </div>
              <div className="display text-3xl mt-1">{score.bmi ?? "-"}</div>
              <div className="text-white/50 text-sm mt-1">{bmiLabel(score.bmiCategory)}</div>
            </div>
          </div>
        </div>

        {(() => {
          const g = goalDomainHeadline(
            answers.goal,
            score.goalDomain,
            score.goalDomainScore?.score0to100 ?? null,
          );
          if (!g || !score.goalDomainScore) return null;
          const isStrength = g.mode === "strength";
          const toneText = isStrength ? "text-accent-primary" : "text-accent-warm";
          const toneBorder = isStrength
            ? "border-accent-primary/30"
            : "border-accent-warm/30";
          const toneBg = isStrength ? "bg-accent-primary/5" : "bg-accent-warm/5";
          return (
            <div
              className={`mt-8 rounded-2xl border ${toneBorder} ${toneBg} p-6 md:p-7`}
            >
              <div className={`mono text-xs ${toneText}`}>{g.label.toUpperCase()}</div>
              <div className="flex items-baseline gap-3 mt-2">
                <h3 className="display text-2xl md:text-3xl leading-tight">
                  {score.goalDomainScore.label}
                </h3>
                <span className={`mono text-sm ${toneText}`}>
                  {score.goalDomainScore.score0to100}/100
                </span>
              </div>
              <p className="mt-3 text-white/70 text-sm md:text-base leading-relaxed max-w-3xl">
                {g.reason}
              </p>
            </div>
          );
        })()}

        <div className="mt-14">
          {(() => {
            const isOptimizing = score.longyScoreBand === "excellent" || score.longyScoreBand === "good";
            return (
              <>
                <div className="mono text-xs text-accent-primary/80">
                  {isOptimizing
                    ? tr("ГДЕ МОЖНО ДОЖАТЬ", "WHERE YOU CAN PUSH")
                    : tr("ТОП-3 ГЛАВНЫХ ФАКТОРА", "TOP-3 MAIN FACTORS")}
                </div>
                <h2 className="display text-3xl md:text-4xl mt-2">
                  {isOptimizing
                    ? tr("Где есть потенциал для роста", "Where there's room to grow")
                    : tr(
                        "Что отнимает у вас годы здоровой жизни",
                        "What's costing you years of healthy life",
                      )}
                </h2>
              </>
            );
          })()}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const isOptimizing = score.longyScoreBand === "excellent" || score.longyScoreBand === "good";
              return accelerators.length === 0 ? (
              <div className="card p-8 md:col-span-3">
                <p className="text-white/70">
                  {tr(
                    "Ни один из факторов не превышает порога риска - отличная отправная точка.",
                    "None of the factors exceed the risk threshold — an excellent starting point.",
                  )}
                </p>
              </div>
            ) : (
              accelerators.map((acc, idx) => (
                <div key={acc.key} className="card p-7 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div
                      className="h-10 w-10 rounded-full grid place-items-center"
                      style={{ backgroundColor: `${acceleratorColor(score.domains[acc.key].velocityContribution)}22` }}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: acceleratorColor(
                            score.domains[acc.key].velocityContribution,
                          ),
                        }}
                      />
                    </div>
                    <span className="mono text-xs text-white/50">#{idx + 1}</span>
                  </div>
                  <div className="mt-5 mono text-xs text-white/50">
                    {score.domains[acc.key].label.toUpperCase()}
                  </div>
                  <h3 className="display text-2xl mt-2 leading-[1.1]">{acc.headline}</h3>
                  <div className={`mt-3 mono text-sm ${isOptimizing ? "text-accent-primary" : "text-accent-warm"}`}>{acc.yearsLostEstimate}</div>
                  <p className="mt-4 text-white/65 text-sm leading-relaxed">{acc.detail}</p>
                  <div className="mt-5 rounded-2xl border border-accent-primary/25 bg-accent-primary/5 p-4">
                    <div className="mono text-xs text-accent-primary">{tr("ЧТО ДЕЛАТЬ", "WHAT TO DO")}</div>
                    <p className="text-white/85 text-sm mt-1 leading-relaxed">{acc.action}</p>
                  </div>
                  <p className="mt-4 text-white/35 text-xs italic">{acc.evidence}</p>
                </div>
              ))
            );
            })()}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-8">
            <div className="mono text-xs text-white/50">{tr("5 ДОМЕНОВ", "5 DOMAINS")}</div>
            <h3 className="display text-2xl mt-2">
              {tr("Карта вашего состояния", "Your state map")}
            </h3>
            <div className="mt-4 grid place-items-center">
              <RadarChart domains={Object.values(score.domains)} size={320} />
            </div>
          </div>

          <div className="card p-8">
            <div className="mono text-xs text-white/50">
              {tr("ЧТО ВАС ЗАЩИЩАЕТ", "WHAT PROTECTS YOU")}
            </div>
            <h3 className="display text-2xl mt-2">
              {tr("Ваши сильные стороны", "Your strengths")}
            </h3>
            {protectors.length === 0 ? (
              <p className="mt-4 text-white/60 leading-relaxed">
                {tr(
                  "Сейчас нет доменов с уверенно защитным уровнем. Это не приговор - это просто стартовая точка. Через 8 недель работы с Longy картина меняется у 86% пользователей.",
                  "No domains are currently at a clearly protective level. That's not a verdict — just a starting point. After 8 weeks with Longy, 86% of users see this picture change.",
                )}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {protectors.map((p) => (
                  <div key={p.key} className="rounded-2xl border border-white/10 p-5">
                    <h4 className="display text-lg">{p.headline}</h4>
                    <p className="text-white/60 text-sm mt-2 leading-relaxed">{p.detail}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mono text-xs text-white/50">{tr("ВАША ЦЕЛЬ", "YOUR GOAL")}</div>
              <div className="mt-1 text-white/85">{goalLabel(answers.goal)}</div>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="mono text-xs text-accent-primary/80">
            {tr("КАК LONGY БЕРЁТ ЭТО НА СЕБЯ", "HOW LONGY HANDLES THIS FOR YOU")}
          </div>
          <h2 className="display text-3xl md:text-4xl mt-2">
            {tr("Три вещи, которых нет больше нигде", "Three things you won't find anywhere else")}
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {getLongyFeatures().map((f: LongyFeature, i: number) => (
              <div key={f.title} className="card p-7 flex flex-col">
                <div className="mono text-xs text-white/50">0{i + 1}</div>
                <h3 className="display text-2xl mt-4">{f.title}</h3>
                <p className="text-accent-primary text-sm mt-2">{f.tagline}</p>
                <p className="text-white/65 mt-4 text-sm leading-relaxed">{f.description}</p>
                <div className="mt-auto pt-5">
                  <p className="text-white/45 text-xs italic leading-relaxed">{f.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 card p-10 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="display text-2xl md:text-3xl">
                {tr("Скачайте полный аудит в PDF", "Download the full audit as PDF")}
              </h3>
              <p className="text-white/60 mt-2 max-w-xl">
                {tr(
                  "Персональный отчёт на 12 страниц: обложка, вердикт, цель, топ-3 фактора, разбор по доменам, лайфхаки, сильные стороны, описание Longy и методология.",
                  "Personal 12-page report: cover, verdict, goal, top-3 factors, per-domain breakdown, lifehacks, strengths, Longy overview, and methodology.",
                )}
              </p>
            </div>
            <button onClick={onDownload} disabled={downloading} className="btn-primary disabled:opacity-60">
              {downloading
                ? tr("Готовим PDF…", "Preparing PDF…")
                : tr("Скачать PDF", "Download PDF")}
            </button>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="display text-2xl md:text-3xl">
                {tr("Получить глубокий аудит в приложении", "Get the deep audit in the app")}
              </h3>
              <p className="text-white/60 mt-2 max-w-xl">{coverCTA(score, answers)}</p>
            </div>
            <a
              href="https://longy.health/app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              {tr("Скачать приложение", "Download app")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function bmiLabel(c: string): string {
  switch (c) {
    case "underweight":
      return tr("Ниже нормы", "Below normal");
    case "normal":
      return tr("В норме", "Normal");
    case "overweight":
      return tr("Избыточный", "Overweight");
    case "obese":
      return tr("Ожирение", "Obesity");
    default:
      return "-";
  }
}
