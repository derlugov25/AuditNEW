"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QUESTIONS, Question } from "@/lib/quiz-questions";
import { Answers, INITIAL_ANSWERS, STEPS } from "@/lib/types";

const STORAGE_KEY = "longy_audit_answers_v2";

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers({ ...INITIAL_ANSWERS, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {}
  }, [answers, hydrated]);

  const q = QUESTIONS[index];
  const totalQ = QUESTIONS.length;
  const currentStep = STEPS.find((s) => s.key === q.step)!;
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep.key);

  const canAdvance = useMemo(() => isFilled(q, answers), [q, answers]);

  const onNext = () => {
    if (!canAdvance) return;
    if (index === totalQ - 1) {
      router.push("/result");
      return;
    }
    setIndex((i) => Math.min(totalQ - 1, i + 1));
  };
  const onBack = () => setIndex((i) => Math.max(0, i - 1));

  const setField = (value: unknown) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const toggleMulti = (value: string) => {
    setAnswers((prev) => {
      const curr = (prev[q.id] as string[]) ?? [];
      const has = curr.includes(value);
      const next = has ? curr.filter((v) => v !== value) : [...curr, value];
      return { ...prev, [q.id]: next };
    });
  };

  return (
    <main className="relative min-h-screen vignette">
      <div className="grain absolute inset-0 pointer-events-none" />

      <header className="relative z-10 px-6 md:px-12 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent-primary/20 grid place-items-center">
              <div className="h-3 w-3 rounded-full bg-accent-primary" />
            </div>
            <span className="display text-xl">Longy</span>
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm text-white/60">
            <span className="mono">
              {String(index + 1).padStart(2, "0")} / {String(totalQ).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-8 gap-1.5 max-w-3xl">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className="progress-dot"
              data-active={i === stepIndex}
              data-done={i < stepIndex}
            />
          ))}
        </div>

        <div className="mt-6 flex items-baseline justify-between max-w-3xl">
          <div>
            <div className="mono text-xs text-accent-primary/80">
              {currentStep.ordinal} · {currentStep.title}
            </div>
            <p className="text-white/50 mt-1 text-sm">{currentStep.subtitle}</p>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-6 md:px-12 pb-24 max-w-3xl">
        <h2 className="display text-3xl md:text-5xl leading-[1.05] tracking-[-0.02em]">
          {q.title}
        </h2>
        {q.hint ? (
          <p className="mt-4 text-white/50 italic">{q.hint}</p>
        ) : null}

        <div className="mt-10 space-y-3">
          {q.type === "single" &&
            q.options.map((opt) => {
              const selected = (answers[q.id] as string) === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className="option"
                  data-selected={selected}
                  onClick={() => setField(opt.value)}
                >
                  <span className="text-base md:text-lg text-white/90 leading-snug">
                    {opt.label}
                  </span>
                  <span className="option-dot" />
                </button>
              );
            })}

          {q.type === "multi" &&
            q.options.map((opt) => {
              const curr = (answers[q.id] as string[]) ?? [];
              const selected = curr.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className="option"
                  data-selected={selected}
                  onClick={() => toggleMulti(opt.value)}
                >
                  <span className="text-base md:text-lg text-white/90 leading-snug">
                    {opt.label}
                  </span>
                  <span
                    className={`option-dot ${selected ? "" : "rounded-md"}`}
                    style={{ borderRadius: selected ? 6 : 6 }}
                  />
                </button>
              );
            })}

          {q.type === "number" && (
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={q.min}
                max={q.max}
                value={
                  typeof answers[q.id] === "number" ? (answers[q.id] as number) : ""
                }
                onChange={(e) => {
                  const isOptional = "optional" in q && q.optional;
                  const v = e.target.value === "" ? (isOptional ? null : "") : Number(e.target.value);
                  setField(v);
                }}
                placeholder={q.placeholder}
                className="field-input pr-20"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 mono">
                {q.suffix}
              </span>
            </div>
          )}

          {(q.type === "text" || q.type === "email") && (
            <input
              type={q.type === "email" ? "email" : "text"}
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => setField(e.target.value)}
              placeholder={q.placeholder}
              className="field-input"
            />
          )}
        </div>

        <div className="mt-12 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={index === 0}
            className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Назад
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!canAdvance}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {index === totalQ - 1 ? "Получить отчёт" : "Далее"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
}

function isFilled(q: Question, a: Answers): boolean {
  const v = a[q.id];
  if (q.type === "single") return typeof v === "string" && v.length > 0;
  if (q.type === "multi") return Array.isArray(v) && v.length > 0;
  if (q.type === "number") {
    if ("optional" in q && q.optional) return true;
    return typeof v === "number" && v >= q.min && v <= q.max;
  }
  if (q.type === "text") return typeof v === "string" && v.trim().length >= 2;
  if (q.type === "email")
    return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  return false;
}
