import { Answers } from "./types";

export type DomainKey = "stress" | "sleep" | "movement" | "nutrition" | "habits" | "social";

export interface DomainScore {
  key: DomainKey;
  label: string;
  score0to100: number;
  velocityContribution: number;
  /** Доля «потерянных лет» по модели отчёта, лет (сумма по доменам ≈ yearsLifeLostTotal). */
  yearsLifeLost: number;
  weight: number;
  verdict: "strong" | "ok" | "risk" | "critical";
  isGoalFocus?: boolean;
}

export interface WaterfallItem {
  key: string;
  label: string;
  /** Вклад в служебную «скорость старения», % к шкале −5…+40 (внутренний расчёт). */
  delta: number;
  /** Оценка потери здоровых лет жизни по этому рычагу, лет (показ пользователю). */
  yearsLost: number;
}

export interface Projection {
  longyScoreNow: number;
  longyScoreTarget: number;
  velocityNow: number;
  velocityTarget: number;
  yearsLifeLostNow: number;
  yearsLifeLostTarget: number;
  targets: DomainScore[];
  deltaScore: number;
  deltaVelocity: number;
}

export interface ScoreResult {
  agingVelocityPct: number;
  longyScore: number;
  longyScoreBand: "excellent" | "good" | "attention" | "risk" | "critical";
  bmi: number | null;
  bmiCategory: "underweight" | "normal" | "overweight" | "obese" | "unknown";
  domains: Record<DomainKey, DomainScore>;
  rankedAccelerators: DomainScore[];
  protectors: DomainScore[];
  topThree: DomainScore[];
  goalDomain: DomainKey | null;
  goalDomainScore: DomainScore | null;
  healthspanYears: number;
  healthspanMax: number;
  /** Оценка потери здоровых лет из-за образа жизни (модель: до ~12 лет при +40% к шкале). */
  yearsLifeLostTotal: number;
  velocityWaterfall: WaterfallItem[];
  projection: Projection;
}

// Li et al., J Intern Med 2024: следование 8 низкорисковым факторам образа жизни
// даёт ~12 дополнительных лет жизни без хронических заболеваний.
// Наши 6 доменов сгруппированы иначе, но сохраняют пропорцию влияния.
const HEALTHSPAN_MAX_YEARS: Record<DomainKey, number> = {
  habits: 3.0,
  sleep: 2.5,
  movement: 2.0,
  nutrition: 1.5,
  stress: 1.5,
  social: 1.5,
};
export const HEALTHSPAN_TOTAL_YEARS = 12;

/** Ориентир Li et al.: при «максимальной» нагрузке по шкале отчёта (+40%) — до ~12 лет здоровой жизни в формулировках. */
const LIFE_YEARS_AT_MAX_VELOCITY = 12;
const VELOCITY_CAP_FOR_YEARS = 40;

/** Сводит служебную скорость старения (%) в оценку потери здоровых лет для тезиса отчёта. */
export function lifeYearsLostFromVelocity(agingVelocityPct: number): number {
  const v = Math.max(0, agingVelocityPct);
  return Math.round((v / VELOCITY_CAP_FOR_YEARS) * LIFE_YEARS_AT_MAX_VELOCITY * 10) / 10;
}

const longyBandFor = (score: number): ScoreResult["longyScoreBand"] => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "attention";
  if (score >= 40) return "risk";
  return "critical";
};

// Привязка главной цели пользователя к приоритетному домену.
// Используется для подсветки в вердикте и бонусного веса в ранжировании.
const GOAL_TO_DOMAIN: Record<Answers["goal"], DomainKey | null> = {
  weight_loss: "nutrition",
  muscle_gain: "movement",
  energy: "sleep",
  nutrition: "nutrition",
  endurance: "movement",
  sleep: "sleep",
  biological_age: "habits",
  "": null,
};

const chronoAgeFor = (a: Answers): number => {
  const v = typeof a.age === "number" ? a.age : Number(a.age);
  if (Number.isFinite(v) && v >= 14 && v <= 110) return v;
  return 35;
};

const pick = <T extends string>(value: string, map: Record<T, number>, fallback = 0): number =>
  (value && value in map ? map[value as T] : fallback);

// ──────────────────────────────────────────────────────────────
// ШКАЛЫ ШТРАФОВ
// Принцип: нормальное по ВОЗ/AASM поведение = 0 штрафа.
// Штрафы начинаются там, где есть реальная доказательная база риска.
// ──────────────────────────────────────────────────────────────

const stressDomain = (a: Answers): DomainScore => {
  const energy = pick(a.energyPattern, {
    stable_high: 0,
    drop_after_lunch: 6, // нормальный постпрандиальный спад
    unstable: 16,
    mostly_low: 28,
  } as const);
  const foggy = pick(a.foggyDays, {
    "0": 0,
    "1-2": 4, // в пределах нормы
    "3-4": 16,
    "5-7": 28,
  } as const);
  const over = pick(a.overwhelmed, {
    "0-2": 0,
    "3-4": 6, // жизнь бывает сложной
    "5-10": 20,
    "10+": 32,
  } as const);

  const raw = energy * 0.3 + foggy * 0.35 + over * 0.35;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "stress",
    label: "Стресс и ментальная устойчивость",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.15,
    verdict: verdictFor(score),
  };
};

const BEDTIME_HOUR: Record<string, number> = {
  before22: 21.5,
  "22-23": 22.5,
  "23-00": 23.5,
  "00-01": 24.5,
  after01: 25.5,
};

const WAKE_HOUR: Record<string, number> = {
  before6: 5.5,
  "6-7": 6.5,
  "7-8": 7.5,
  "8-9": 8.5,
  after9: 9.5,
};

export const computeSleepHours = (a: Answers): number | null => {
  const bed = BEDTIME_HOUR[a.bedtime];
  const wakeRaw = WAKE_HOUR[a.wakeTime];
  if (bed === undefined || wakeRaw === undefined) return null;
  const wake = wakeRaw + 24;
  return Math.max(0, Math.round((wake - bed) * 10) / 10);
};

// 7-9 ч — оптимум AASM. Штрафы растут нелинейно только на серьёзных отклонениях.
const durationPenalty = (hours: number): number => {
  if (hours >= 7 && hours <= 9) return 0;
  if (hours >= 6.5 && hours < 7) return 3; // lower bound нормы, не критично
  if (hours >= 6 && hours < 6.5) return 10;
  if (hours >= 5 && hours < 6) return 22;
  if (hours < 5) return 36;
  if (hours > 9 && hours <= 10) return 4;
  return 14; // >10 ч стабильно
};

const circadianPenalty = (bedtime: Answers["bedtime"]): number =>
  pick(bedtime, {
    before22: 0,
    "22-23": 0,
    "23-00": 2,
    "00-01": 8,
    after01: 14,
  } as const);

const sleepDomain = (a: Answers): DomainScore => {
  const hours = computeSleepHours(a);
  const duration = hours === null ? 20 : durationPenalty(hours);
  const probs = pick(a.sleepProblems, {
    never: 0,
    "1-3": 6, // случайное — норма
    "4-8": 20,
    "9+": 32,
  } as const);
  const daytime = pick(a.daytimeSleepiness, {
    never: 0,
    "1-3": 5,
    "4-8": 18,
    "9+": 28,
  } as const);
  const circadianRaw = circadianPenalty(a.bedtime);
  const durationOk = hours !== null && hours >= 7 && hours <= 9;
  // Позднее засыпание (00:00+) имеет самостоятельный метаболический эффект (social jetlag)
  // даже при нормальной длительности — применяем 40% штрафа.
  const circadian = durationOk ? circadianRaw * 0.4 : circadianRaw;

  const raw = duration * 0.45 + probs * 0.3 + daytime * 0.2 + circadian * 0.05;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "sleep",
    label: "Качество сна",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.2,
    verdict: verdictFor(score),
  };
};

const movementDomain = (a: Answers): DomainScore => {
  // ВОЗ: 150+ мин умеренной активности = 3-4 дня по 30-40 мин. Это норма, не риск.
  const days = pick(a.activeDays, {
    "0": 30,
    "1-2": 14,
    "3-4": 2, // ВОЗ-норма
    "5-7": 0,
  } as const);
  const sit = pick(a.sittingHours, {
    "<4": 0,
    "4-6": 4, // среднестатистический офис, не критично
    "6-8": 14,
    "8+": 26,
  } as const);
  const raw = days * 0.6 + sit * 0.4;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "movement",
    label: "Движение и активность",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.18,
    verdict: verdictFor(score),
  };
};

const nutritionDomain = (a: Answers): DomainScore => {
  const processed = pick(a.processedFood, {
    almost_never: 0,
    "1-4mo": 3, // редкие исключения — не проблема
    "3-6wk": 18,
    daily: 32,
  } as const);
  const veg = pick(a.veggiesFruits, {
    "3plus_daily": 0,
    "1-2_daily": 4, // ниже идеала, но приемлемо
    "3-6_week": 18,
    "<3_week": 30,
  } as const);
  const water = pick(a.water, {
    "2plus_l": 0,
    "1.5-2l": 0, // научная норма
    "1-1.5l": 10,
    "<1l": 22,
  } as const);
  const raw = processed * 0.45 + veg * 0.35 + water * 0.2;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "nutrition",
    label: "Питание и гидратация",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.15,
    verdict: verdictFor(score),
  };
};

const socialDomain = (a: Answers): DomainScore => {
  const raw = pick(a.socialConnections, {
    almost_daily: 0,
    few_per_week: 3, // здоровый паттерн
    few_per_month: 18,
    rarely: 30,
  } as const);
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "social",
    label: "Социальные связи",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.1,
    verdict: verdictFor(score),
  };
};

const habitsDomain = (a: Answers): DomainScore => {
  const alc = pick(a.alcohol, {
    never: 0,
    rare: 0, // 1-5 раз в год ≈ не пьёт
    "1-2wk": 10,
    "3-4wk": 22,
    daily: 36,
  } as const);
  const nic = pick(a.nicotine, {
    never: 0,
    quit_1yr_plus: 0, // вернулся к базовой линии
    quit_under_1yr: 8,
    sometimes: 22,
    regular: 38,
  } as const);
  const raw = alc * 0.4 + nic * 0.6;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "habits",
    label: "Алкоголь и никотин",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.22,
    verdict: verdictFor(score),
  };
};

function verdictFor(score: number): DomainScore["verdict"] {
  if (score >= 80) return "strong";
  if (score >= 60) return "ok";
  if (score >= 35) return "risk";
  return "critical";
}

const bmiAnalysis = (a: Answers) => {
  const h = typeof a.heightCm === "number" ? a.heightCm : 0;
  const w = typeof a.weightKg === "number" ? a.weightKg : 0;
  if (h < 100 || w < 30) {
    return { bmi: null as number | null, category: "unknown" as const, velocityMod: 0 };
  }
  const bmi = w / Math.pow(h / 100, 2);
  let category: "underweight" | "normal" | "overweight" | "obese" = "normal";
  let mod = 0;
  if (bmi < 18.5) {
    category = "underweight";
    mod = 2;
  } else if (bmi < 25) {
    category = "normal";
    mod = -2;
  } else if (bmi < 30) {
    category = "overweight";
    mod = 3;
  } else {
    category = "obese";
    mod = 8;
  }
  // BMI у физически активных людей завышает — скидываем часть штрафа,
  // если активность 5-7 дней в неделю.
  if (a.activeDays === "5-7" && mod > 0) {
    mod = Math.max(0, mod - 2);
  }
  return { bmi: Math.round(bmi * 10) / 10, category, velocityMod: mod };
};

export function calculateScore(a: Answers): ScoreResult {
  const stress = stressDomain(a);
  const sleep = sleepDomain(a);
  const movement = movementDomain(a);
  const nutrition = nutritionDomain(a);
  const habits = habitsDomain(a);
  const social = socialDomain(a);

  const maxContribMap: Record<DomainKey, number> = {
    stress: 12,
    sleep: 16,
    movement: 14,
    nutrition: 12,
    habits: 20,
    social: 8,
  };

  const applyContrib = (d: DomainScore): DomainScore => {
    const deficit = (100 - d.score0to100) / 100;
    const contrib = Math.round(deficit * maxContribMap[d.key] * 10) / 10;
    return { ...d, velocityContribution: contrib };
  };

  const goalDomain: DomainKey | null = GOAL_TO_DOMAIN[a.goal] ?? null;

  const markGoal = (d: DomainScore): DomainScore =>
    goalDomain && d.key === goalDomain ? { ...d, isGoalFocus: true } : d;

  const domains: Record<DomainKey, DomainScore> = {
    stress: markGoal(applyContrib(stress)),
    sleep: markGoal(applyContrib(sleep)),
    movement: markGoal(applyContrib(movement)),
    nutrition: markGoal(applyContrib(nutrition)),
    habits: markGoal(applyContrib(habits)),
    social: markGoal(applyContrib(social)),
  };

  const bmi = bmiAnalysis(a);
  const lifestyleVelocity = Object.values(domains).reduce(
    (s, d) => s + d.velocityContribution,
    0,
  );
  const agingVelocityPct = Math.max(-5, Math.min(40, lifestyleVelocity + bmi.velocityMod));

  // ── Waterfall (доли в «годах жизни» распределяем пропорционально вкладу delta) ──
  type WfBaseRow = { key: DomainKey | "bmi"; label: string; delta: number };
  const wfBase: WfBaseRow[] = [
    ...Object.values(domains)
      .map((d) => ({ key: d.key, label: d.label, delta: d.velocityContribution }))
      .sort((x, y) => y.delta - x.delta),
  ];
  // BMI включаем в waterfall только если он является акселератором (mod > 0).
  // Нормальный BMI (mod < 0) уже снижает итоговую скорость, но отдельной строкой в
  // "потерянных годах" не отображаем — это запутывает (отрицательные yearsLost).
  if (bmi.velocityMod > 0) {
    const bmiDelta = Math.round(bmi.velocityMod * 10) / 10;
    const insertIdx = wfBase.findIndex((item) => item.delta < bmiDelta);
    const bmiRow: WfBaseRow = { key: "bmi", label: "Индекс массы тела", delta: bmiDelta };
    if (insertIdx === -1) wfBase.push(bmiRow);
    else wfBase.splice(insertIdx, 0, bmiRow);
  }

  const yearsLifeLostTotalRounded = lifeYearsLostFromVelocity(agingVelocityPct);
  const rawWfSum = wfBase.reduce((s, w) => s + w.delta, 0);

  let velocityWaterfall: WaterfallItem[] = wfBase.map((w) => ({
    key: w.key,
    label: w.label,
    delta: w.delta,
    yearsLost: 0,
  }));

  if (rawWfSum > 0 && yearsLifeLostTotalRounded > 0) {
    // Метод наибольших остатков: floor + добавляем по 0.1 элементам с наибольшим остатком.
    const STEP = 0.1;
    const totalUnits = Math.round(yearsLifeLostTotalRounded / STEP);
    const rawValues = wfBase.map((w) => (w.delta / rawWfSum) * yearsLifeLostTotalRounded);
    const floors = rawValues.map((v) => Math.floor(Math.round(v / STEP)) * STEP);
    const remainders = rawValues.map((v, i) => v - floors[i]);
    const allocated = floors.reduce((s, f) => s + Math.round(f / STEP), 0);
    const toDistribute = totalUnits - allocated;
    const order = remainders
      .map((r, i) => ({ i, r }))
      .sort((a, b) => b.r - a.r)
      .map((x) => x.i);
    const extra = new Set(order.slice(0, Math.max(0, toDistribute)));
    velocityWaterfall = wfBase.map((w, i) => ({
      key: w.key,
      label: w.label,
      delta: w.delta,
      yearsLost: Math.round((floors[i] + (extra.has(i) ? STEP : 0)) * 10) / 10,
    }));
  }

  const enrichYears = (d: DomainScore): DomainScore => ({
    ...d,
    yearsLifeLost: velocityWaterfall.find((w) => w.key === d.key)?.yearsLost ?? 0,
  });
  const domainsOut: Record<DomainKey, DomainScore> = {
    stress: enrichYears(domains.stress),
    sleep: enrichYears(domains.sleep),
    movement: enrichYears(domains.movement),
    nutrition: enrichYears(domains.nutrition),
    habits: enrichYears(domains.habits),
    social: enrichYears(domains.social),
  };

  // Ранжируем по вкладу, но ломаем ничью в пользу домена цели:
  const allDomains = Object.values(domainsOut);
  const rankedAccelerators = [...allDomains].sort((x, y) => {
    const diff = y.velocityContribution - x.velocityContribution;
    if (Math.abs(diff) < 0.5) {
      if (x.isGoalFocus && !y.isGoalFocus) return -1;
      if (y.isGoalFocus && !x.isGoalFocus) return 1;
    }
    return diff;
  });
  const protectors = allDomains.filter((d) => d.score0to100 >= 75);
  // Исключаем домены с вердиктом "strong" из топ-3 проблем, если есть более слабые.
  // Если всё сильное — берём топ-3 как есть (хоть что-то показать).
  const nonStrongAccelerators = rankedAccelerators.filter((d) => d.verdict !== "strong");
  const topThree = (nonStrongAccelerators.length > 0 ? nonStrongAccelerators : rankedAccelerators).slice(0, 3);

  const longyScore = Math.max(
    1,
    Math.min(100, Math.round(100 - agingVelocityPct * 2)),
  );

  void chronoAgeFor(a);

  const healthspanYears =
    Math.round(
      allDomains.reduce(
        (sum, d) => sum + (d.score0to100 / 100) * HEALTHSPAN_MAX_YEARS[d.key],
        0,
      ) * 10,
    ) / 10;

  const TARGET_SCORE = 75;
  const projectionTargets = topThree.filter((d) => d.score0to100 < TARGET_SCORE);
  let velocitySaved = 0;
  projectionTargets.forEach((d) => {
    const newContrib = (1 - TARGET_SCORE / 100) * maxContribMap[d.key];
    velocitySaved += Math.max(0, d.velocityContribution - newContrib);
  });
  const velocityTarget = Math.max(-5, Math.min(40, agingVelocityPct - velocitySaved));
  const longyScoreTarget = Math.max(
    1,
    Math.min(100, Math.round(100 - velocityTarget * 2)),
  );
  const yearsLifeLostTarget = lifeYearsLostFromVelocity(velocityTarget);
  const projection: Projection = {
    longyScoreNow: longyScore,
    longyScoreTarget,
    velocityNow: Math.round(agingVelocityPct * 10) / 10,
    velocityTarget: Math.round(velocityTarget * 10) / 10,
    yearsLifeLostNow: Math.round(yearsLifeLostTotalRounded * 10) / 10,
    yearsLifeLostTarget: Math.round(yearsLifeLostTarget * 10) / 10,
    targets: projectionTargets,
    deltaScore: longyScoreTarget - longyScore,
    deltaVelocity: Math.round((agingVelocityPct - velocityTarget) * 10) / 10,
  };

  return {
    agingVelocityPct: Math.round(agingVelocityPct * 10) / 10,
    longyScore,
    longyScoreBand: longyBandFor(longyScore),
    bmi: bmi.bmi,
    bmiCategory: bmi.category,
    domains: domainsOut,
    rankedAccelerators,
    protectors,
    topThree,
    goalDomain,
    goalDomainScore: goalDomain ? domainsOut[goalDomain] : null,
    healthspanYears,
    healthspanMax: HEALTHSPAN_TOTAL_YEARS,
    yearsLifeLostTotal: Math.round(yearsLifeLostTotalRounded * 10) / 10,
    velocityWaterfall,
    projection,
  };
}
