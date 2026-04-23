import { Answers } from "./types";

export type DomainKey = "stress" | "sleep" | "movement" | "nutrition" | "habits";

export interface DomainScore {
  key: DomainKey;
  label: string;
  score0to100: number;
  velocityContribution: number;
  yearsLifeLost: number;
  weight: number;
  verdict: "strong" | "ok" | "risk" | "critical";
  isGoalFocus?: boolean;
}

export interface WaterfallItem {
  key: string;
  label: string;
  delta: number;
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
  waistCategory: "normal" | "elevated" | "high" | "unknown";
  domains: Record<DomainKey, DomainScore>;
  rankedAccelerators: DomainScore[];
  protectors: DomainScore[];
  topThree: DomainScore[];
  goalDomain: DomainKey | null;
  goalDomainScore: DomainScore | null;
  healthspanYears: number;
  healthspanMax: number;
  yearsLifeLostTotal: number;
  velocityWaterfall: WaterfallItem[];
  projection: Projection;
}

// Li et al., J Intern Med 2024 — 5 доменов (social удалён), сумма 12 лет сохранена
const HEALTHSPAN_MAX_YEARS: Record<DomainKey, number> = {
  habits: 3.5,
  sleep: 3.0,
  movement: 2.5,
  nutrition: 1.5,
  stress: 1.5,
};
export const HEALTHSPAN_TOTAL_YEARS = 12;

const LIFE_YEARS_AT_MAX_VELOCITY = 12;
const VELOCITY_CAP_FOR_YEARS = 40;

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
  value && value in map ? map[value as T] : fallback;

// ──────────────────────────────────────────────────────────────
// ДОМЕНЫ
// ──────────────────────────────────────────────────────────────

const stressDomain = (a: Answers): DomainScore => {
  const energy = pick(a.energyPattern, {
    stable_high: 0,
    drop_after_lunch: 4,
    unstable: 14,
    mostly_low: 26,
  } as const);
  const foggy = pick(a.foggyHours, {
    "<1h": 0,
    "1-3h": 3,
    "3-7h": 10,
    "7-14h": 18,
    "14-20h": 26,
    "20-40h": 32,
    "40+h": 38,
  } as const);

  const raw = energy * 0.5 + foggy * 0.5;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "stress",
    label: "Ментальная устойчивость и фокус",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.15,
    verdict: verdictFor(score),
  };
};

export const BEDTIME_HOUR: Record<string, number> = {
  before22: 21.5,
  "22-23": 22.5,
  "23-00": 23.5,
  "00-01": 24.5,
  "01-02": 25.5,
  "02-03": 26.5,
  "03-04": 27.5,
  "04-05": 28.5,
  after05: 29.5,
};

export const WAKE_HOUR: Record<string, number> = {
  before6: 5.5,
  "6-7": 6.5,
  "7-8": 7.5,
  "8-9": 8.5,
  "9-10": 9.5,
  "10-11": 10.5,
  "11-12": 11.5,
  "12-13": 12.5,
  "13-14": 13.5,
  after14: 14.5,
};

export const computeSleepHours = (a: Answers): number | null => {
  const bed = BEDTIME_HOUR[a.bedtime];
  const wakeRaw = WAKE_HOUR[a.wakeTime];
  if (bed === undefined || wakeRaw === undefined) return null;
  const wake = wakeRaw + 24;
  return Math.max(0, Math.round((wake - bed) * 10) / 10);
};

const durationPenalty = (hours: number): number => {
  if (hours >= 7 && hours <= 9) return 0;
  if (hours >= 6.5 && hours < 7) return 3;
  if (hours >= 6 && hours < 6.5) return 10;
  if (hours >= 5 && hours < 6) return 22;
  if (hours < 5) return 36;
  if (hours > 9 && hours <= 10) return 4;
  return 14;
};

const circadianPenalty = (bedtime: Answers["bedtime"]): number =>
  pick(bedtime, {
    before22: 0,
    "22-23": 0,
    "23-00": 2,
    "00-01": 10,
    "01-02": 18,
    "02-03": 26,
    "03-04": 32,
    "04-05": 36,
    after05: 40,
  } as const);

const sleepDomain = (a: Answers): DomainScore => {
  const hours = computeSleepHours(a);
  const duration = hours === null ? 20 : durationPenalty(hours);
  const probs = pick(a.sleepProblems, {
    never: 0,
    "1-3": 5,
    "4-8": 18,
    "9+": 30,
  } as const);
  const daytime = pick(a.daytimeSleepiness, {
    never: 0,
    "1-3": 4,
    "4-8": 16,
    "9+": 26,
  } as const);
  const circadian = circadianPenalty(a.bedtime);

  const raw = duration * 0.35 + circadian * 0.25 + probs * 0.25 + daytime * 0.15;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "sleep",
    label: "Качество сна и режим",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.22,
    verdict: verdictFor(score),
  };
};

const movementDomain = (a: Answers): DomainScore => {
  const days = pick(a.activeDays, {
    "0": 32,
    "1-2": 16,
    "3-4": 4,
    "5-7": 0,
  } as const);
  const sit = pick(a.sittingHours, {
    "<4": 0,
    "4-6": 4,
    "6-8": 14,
    "8+": 26,
  } as const);

  const functionalCount = a.functionalActivities.length;
  const functional =
    functionalCount >= 6
      ? 0
      : functionalCount >= 4
        ? 6
        : functionalCount >= 2
          ? 16
          : functionalCount >= 1
            ? 26
            : 32;

  const breath = pick(a.breathRecovery, {
    "<1min": 0,
    "1-2min": 4,
    "3-5min": 18,
    "5min+_avoid": 32,
  } as const);

  const raw = days * 0.4 + sit * 0.25 + functional * 0.2 + breath * 0.15;
  const score = Math.max(0, 100 - raw * 2);
  return {
    key: "movement",
    label: "Движение и функциональная форма",
    score0to100: Math.round(score),
    velocityContribution: 0,
    yearsLifeLost: 0,
    weight: 0.2,
    verdict: verdictFor(score),
  };
};

const nutritionDomain = (a: Answers): DomainScore => {
  const processed = pick(a.processedFood, {
    almost_never: 0,
    "1-4mo": 3,
    "2-3wk": 14,
    "4-6wk": 24,
    daily: 34,
  } as const);
  const veg = pick(a.veggiesFruits, {
    "3plus_daily": 0,
    "1-2_daily": 4,
    "3-6_week": 18,
    "<3_week": 30,
  } as const);
  const water = pick(a.water, {
    "2plus_l": 0,
    "1.5-2l": 0,
    "1-1.5l": 10,
    "<1l": 22,
  } as const);
  const raw = processed * 0.5 + veg * 0.3 + water * 0.2;
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

const habitsDomain = (a: Answers): DomainScore => {
  const alc = pick(a.alcohol, {
    never: 0,
    rare: 0,
    "1-2wk": 10,
    "3-4wk": 22,
    daily: 36,
  } as const);
  const nic = pick(a.nicotine, {
    never: 0,
    quit_1yr_plus: 0,
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
    return {
      bmi: null as number | null,
      category: "unknown" as const,
      waistCategory: "unknown" as const,
      velocityMod: 0,
      bmiMod: 0,
      waistMod: 0,
    };
  }
  const bmi = w / Math.pow(h / 100, 2);
  let category: "underweight" | "normal" | "overweight" | "obese" = "normal";
  let bmiMod = 0;
  if (bmi < 18.5) { category = "underweight"; bmiMod = 2; }
  else if (bmi < 25) { category = "normal"; bmiMod = -2; }
  else if (bmi < 30) { category = "overweight"; bmiMod = 3; }
  else { category = "obese"; bmiMod = 8; }

  if (a.activeDays === "5-7" && bmiMod > 0) bmiMod = Math.max(0, bmiMod - 2);

  let waistMod = 0;
  let waistCategory: "normal" | "elevated" | "high" | "unknown" = "unknown";
  const waist = a.waistCm;
  if (waist !== null && waist !== undefined && waist > 0 && a.gender) {
    const thresholds = a.gender === "male"
      ? { low: 94, high: 102 }
      : { low: 80, high: 88 };
    if (waist >= thresholds.high) { waistMod = 7; waistCategory = "high"; }
    else if (waist >= thresholds.low) { waistMod = 3; waistCategory = "elevated"; }
    else { waistCategory = "normal"; }
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    waistCategory,
    velocityMod: bmiMod + waistMod,
    bmiMod,
    waistMod,
  };
};

export function calculateScore(a: Answers): ScoreResult {
  const stress = stressDomain(a);
  const sleep = sleepDomain(a);
  const movement = movementDomain(a);
  const nutrition = nutritionDomain(a);
  const habits = habitsDomain(a);

  const maxContribMap: Record<DomainKey, number> = {
    habits: 22,
    sleep: 18,
    movement: 16,
    stress: 13,
    nutrition: 13,
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
  };

  const bmi = bmiAnalysis(a);
  const lifestyleVelocity = Object.values(domains).reduce(
    (s, d) => s + d.velocityContribution,
    0,
  );
  const agingVelocityPct = Math.max(-5, Math.min(40, lifestyleVelocity + bmi.velocityMod));

  type WfBaseRow = { key: DomainKey | "bmi"; label: string; delta: number };
  const wfBase: WfBaseRow[] = [
    ...Object.values(domains)
      .map((d) => ({ key: d.key, label: d.label, delta: d.velocityContribution }))
      .sort((x, y) => y.delta - x.delta),
  ];
  if (bmi.velocityMod > 0) {
    const bmiDelta = Math.round(bmi.velocityMod * 10) / 10;
    const insertIdx = wfBase.findIndex((item) => item.delta < bmiDelta);
    const bmiRow: WfBaseRow = { key: "bmi", label: "Индекс массы тела / талия", delta: bmiDelta };
    if (insertIdx === -1) wfBase.push(bmiRow);
    else wfBase.splice(insertIdx, 0, bmiRow);
  }

  // Вариант A: «годы здоровой жизни» — одна модель на всех экранах.
  // Сколько вы сейчас реализуете из потенциала Li et al. (12 лет).
  const healthspanYearsRaw = Object.values(domains).reduce(
    (sum, d) => sum + (d.score0to100 / 100) * HEALTHSPAN_MAX_YEARS[d.key],
    0,
  );
  // Итоговая потеря для шапки/вердикта = то же число, что и gap в HealthspanStrip.
  const yearsLifeLostTotalRounded =
    Math.round(Math.max(0, HEALTHSPAN_TOTAL_YEARS - healthspanYearsRaw) * 10) / 10;
  const rawWfSum = wfBase.reduce((s, w) => s + w.delta, 0);

  let velocityWaterfall: WaterfallItem[] = wfBase.map((w) => ({
    key: w.key,
    label: w.label,
    delta: w.delta,
    yearsLost: 0,
  }));

  if (rawWfSum > 0 && yearsLifeLostTotalRounded > 0) {
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
  };

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
  const nonStrongAccelerators = rankedAccelerators.filter((d) => d.verdict !== "strong");
  const topThree = (nonStrongAccelerators.length > 0 ? nonStrongAccelerators : rankedAccelerators).slice(0, 3);

  const longyScore = Math.max(1, Math.min(100, Math.round(100 - agingVelocityPct * 2)));

  void chronoAgeFor(a);

  const healthspanYears = Math.round(healthspanYearsRaw * 10) / 10;

  const TARGET_SCORE = 75;
  const projectionTargets = topThree.filter((d) => d.score0to100 < TARGET_SCORE);
  let velocitySaved = 0;
  projectionTargets.forEach((d) => {
    const newContrib = (1 - TARGET_SCORE / 100) * maxContribMap[d.key];
    velocitySaved += Math.max(0, d.velocityContribution - newContrib);
  });
  const velocityTarget = Math.max(-5, Math.min(40, agingVelocityPct - velocitySaved));
  const longyScoreTarget = Math.max(1, Math.min(100, Math.round(100 - velocityTarget * 2)));
  // yearsLifeLostTarget считаем той же healthspan-моделью: подтягиваем
  // targets-домены до TARGET_SCORE и пересобираем сумму.
  const targetKeys = new Set(projectionTargets.map((d) => d.key));
  const healthspanYearsTargetRaw = allDomains.reduce((sum, d) => {
    const effectiveScore = targetKeys.has(d.key)
      ? Math.max(d.score0to100, TARGET_SCORE)
      : d.score0to100;
    return sum + (effectiveScore / 100) * HEALTHSPAN_MAX_YEARS[d.key];
  }, 0);
  const yearsLifeLostTarget = Math.max(
    0,
    Math.round((HEALTHSPAN_TOTAL_YEARS - healthspanYearsTargetRaw) * 10) / 10,
  );
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
    waistCategory: bmi.waistCategory,
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
