"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Answers, INITIAL_ANSWERS } from "@/lib/types";
import { calculateScore } from "@/lib/scoring";
import {
  buildAccelerators,
  buildProtectors,
  LONGY_FEATURES,
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
          <h1 className="display text-3xl">Нужно пройти опрос</h1>
          <p className="mt-3 text-white/60">
            Мы не нашли сохранённых ответов. Пройдите опрос, чтобы получить персональный
            аудит.
          </p>
          <Link href="/quiz" className="btn-primary mt-6">
            Начать
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
      alert("Не удалось сформировать PDF. Попробуйте ещё раз.");
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
          {downloading ? "Готовим PDF…" : "Скачать PDF-отчёт"}
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
          <span className="chip">Ваш персональный аудит · {new Date().toLocaleDateString("ru-RU")}</span>
          <h1 className="max-w-5xl">
            {answers.name ? (
              <span className="display text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em]">
                {answers.name},{" "}
              </span>
            ) : null}
            <span className="block text-4xl md:text-6xl font-bold text-white font-sans tracking-normal leading-snug whitespace-pre-line mt-1">
              {lifeYearsHeadline(score)}
            </span>
          </h1>
          <p className="text-white/45 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            {lifeYearsModelNote(score)}
          </p>
          <p className="text-white/70 text-lg md:text-xl mt-3 max-w-2xl leading-relaxed">
            {coverSubtitle(score)}
          </p>
          <p className="text-white/35 text-xs mt-1 tracking-wide">
            Методология: Li et al., J Intern Med 2024 · 5 доменов · 21 параметр + хронические заболевания
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-8 md:col-span-2 flex flex-col md:flex-row items-center gap-8">
            <Speedometer velocityPct={velocity} size={260} />
            <div className="flex-1">
              <div className="mono text-xs text-white/50">LONGY SCORE</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="display text-6xl md:text-7xl">{score.longyScore}</div>
                <div className="text-white/40 text-xl">/ 100</div>
              </div>
              <p className="mt-4 text-white/70 leading-relaxed">
                {longyScoreLabel(score.longyScoreBand).label}. Ниже — три личных драйвера и
                что с ними делать.
              </p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mono text-xs text-white/50">ГЛАВНЫЙ ДРАЙВЕР</div>
            <div className="display text-2xl mt-3 leading-tight">
              {score.topThree[0]?.label ?? "—"}
            </div>
            <div className="mt-2 mono text-sm text-accent-warm">
              минус ~{(score.topThree[0]?.yearsLifeLost ?? 0).toFixed(1)} лет здоровой жизни
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="mono text-xs text-white/50">ИНДЕКС МАССЫ ТЕЛА</div>
              <div className="display text-3xl mt-1">{score.bmi ?? "—"}</div>
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
          <div className="mono text-xs text-accent-primary/80">ТОП-3 УСКОРИТЕЛЯ У ВАС</div>
          <h2 className="display text-3xl md:text-4xl mt-2">
            Что именно «стоит» в годах здоровой жизни
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {accelerators.length === 0 ? (
              <div className="card p-8 md:col-span-3">
                <p className="text-white/70">
                  Ни один из факторов не превышает порога риска — отличная отправная точка.
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
                  <div className="mt-3 mono text-sm text-accent-warm">{acc.yearsLostEstimate}</div>
                  <p className="mt-4 text-white/65 text-sm leading-relaxed">{acc.detail}</p>
                  <div className="mt-5 rounded-2xl border border-accent-primary/25 bg-accent-primary/5 p-4">
                    <div className="mono text-xs text-accent-primary">ЧТО ДЕЛАТЬ</div>
                    <p className="text-white/85 text-sm mt-1 leading-relaxed">{acc.action}</p>
                  </div>
                  <p className="mt-4 text-white/35 text-xs italic">{acc.evidence}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-8">
            <div className="mono text-xs text-white/50">5 ДОМЕНОВ</div>
            <h3 className="display text-2xl mt-2">Карта вашего состояния</h3>
            <div className="mt-4 grid place-items-center">
              <RadarChart domains={Object.values(score.domains)} size={320} />
            </div>
          </div>

          <div className="card p-8">
            <div className="mono text-xs text-white/50">ЧТО ВАС ЗАЩИЩАЕТ</div>
            <h3 className="display text-2xl mt-2">Ваши сильные стороны</h3>
            {protectors.length === 0 ? (
              <p className="mt-4 text-white/60 leading-relaxed">
                Сейчас нет доменов с уверенно защитным уровнем. Это не приговор — это просто
                стартовая точка. Через 8 недель работы с Longy картина меняется у 86% пользователей.
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
              <div className="mono text-xs text-white/50">ВАША ЦЕЛЬ</div>
              <div className="mt-1 text-white/85">{goalLabel(answers.goal)}</div>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="mono text-xs text-accent-primary/80">КАК LONGY БЕРЁТ ЭТО НА СЕБЯ</div>
          <h2 className="display text-3xl md:text-4xl mt-2">Три вещи, которых нет больше нигде</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {LONGY_FEATURES.map((f, i) => (
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
                Скачайте полный аудит в PDF
              </h3>
              <p className="text-white/60 mt-2 max-w-xl">
                Персональный отчёт на 7 страниц: обложка, вердикт, топ-3 ускорителя, радар
                доменов, сильные стороны и разбор, как Longy возьмёт ведение на себя.
              </p>
            </div>
            <button onClick={onDownload} disabled={downloading} className="btn-primary disabled:opacity-60">
              {downloading ? "Готовим PDF…" : "Скачать PDF"}
            </button>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="display text-2xl md:text-3xl">
                Получить глубокий аудит в приложении
              </h3>
              <p className="text-white/60 mt-2 max-w-xl">{coverCTA(score)}</p>
            </div>
            <a
              href="https://longy.health/app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Открыть приложение Longy
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
      return "Ниже нормы";
    case "normal":
      return "В норме";
    case "overweight":
      return "Избыточный";
    case "obese":
      return "Ожирение";
    default:
      return "—";
  }
}
