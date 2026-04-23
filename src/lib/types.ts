export type QuizAnswer = string | number;

export type ConditionKey =
  | "none"
  | "hypertension"
  | "atherosclerosis"
  | "diabetes2"
  | "autoimmune"
  | "thyroid"
  | "kidney"
  | "allergy"
  | "cancer"
  | "bpd"
  | "other"
  | "prefer_not_to_say";

export type FunctionalActivity =
  | "short_walk"
  | "stairs"
  | "short_run"
  | "light_chores"
  | "moderate_chores"
  | "heavy_chores"
  | "moderate_sport"
  | "intense_sport";

export interface Answers {
  gender: "male" | "female" | "";
  age: number | "";
  heightCm: number | "";
  weightKg: number | "";
  waistCm: number | null;

  energyPattern: "" | "stable_high" | "drop_after_lunch" | "unstable" | "mostly_low";
  foggyHours: "" | "<1h" | "1-3h" | "3-7h" | "7-14h" | "14-20h" | "20-40h" | "40+h";
  conditions: ConditionKey[];

  bedtime:
    | ""
    | "before22"
    | "22-23"
    | "23-00"
    | "00-01"
    | "01-02"
    | "02-03"
    | "03-04"
    | "04-05"
    | "after05";
  wakeTime:
    | ""
    | "before6"
    | "6-7"
    | "7-8"
    | "8-9"
    | "9-10"
    | "10-11"
    | "11-12"
    | "12-13"
    | "13-14"
    | "after14";
  sleepProblems: "" | "never" | "1-3" | "4-8" | "9+";
  daytimeSleepiness: "" | "never" | "1-3" | "4-8" | "9+";

  activeDays: "" | "0" | "1-2" | "3-4" | "5-7";
  sittingHours: "" | "<4" | "4-6" | "6-8" | "8+";
  functionalActivities: FunctionalActivity[];
  breathRecovery: "" | "<1min" | "1-2min" | "3-5min" | "5min+_avoid";

  processedFood: "" | "almost_never" | "1-4mo" | "2-3wk" | "4-6wk" | "daily";
  veggiesFruits: "" | "3plus_daily" | "1-2_daily" | "3-6_week" | "<3_week";
  water: "" | "2plus_l" | "1.5-2l" | "1-1.5l" | "<1l";

  alcohol: "" | "never" | "rare" | "1-2wk" | "3-4wk" | "daily";
  nicotine: "" | "never" | "quit_1yr_plus" | "quit_under_1yr" | "sometimes" | "regular";
  exerciseType: "" | "strength" | "cardio" | "yoga_flex" | "mixed" | "walking" | "none";
  barrier: "" | "time" | "energy" | "conflicting_advice" | "motivation" | "dont_know_start";

  goal:
    | ""
    | "weight_loss"
    | "muscle_gain"
    | "energy"
    | "nutrition"
    | "endurance"
    | "sleep"
    | "biological_age";
  trackers: string[];

  name?: string;
  email?: string;
  telegram?: string;
}

export const INITIAL_ANSWERS: Answers = {
  gender: "",
  age: "",
  heightCm: "",
  weightKg: "",
  waistCm: null,
  energyPattern: "",
  foggyHours: "",
  conditions: [],
  bedtime: "",
  wakeTime: "",
  sleepProblems: "",
  daytimeSleepiness: "",
  activeDays: "",
  sittingHours: "",
  functionalActivities: [],
  breathRecovery: "",
  processedFood: "",
  veggiesFruits: "",
  water: "",
  alcohol: "",
  nicotine: "",
  exerciseType: "",
  barrier: "",
  goal: "",
  trackers: [],
};

export type StepKey =
  | "goal"
  | "energy"
  | "sleep"
  | "movement"
  | "nutrition"
  | "habits"
  | "personalization"
  | "contact";

export interface StepDef {
  key: StepKey;
  title: string;
  subtitle: string;
  ordinal: string;
}

export const STEPS: StepDef[] = [
  {
    key: "goal",
    title: "Ваша цель",
    subtitle: "Чем точнее цель, тем точнее рекомендации Longy",
    ordinal: "01",
  },
  {
    key: "energy",
    title: "Самочувствие и энергия",
    subtitle: "Как вы проживаете обычный день",
    ordinal: "02",
  },
  {
    key: "sleep",
    title: "Сон",
    subtitle: "Один из пяти ключевых факторов долголетия",
    ordinal: "03",
  },
  {
    key: "movement",
    title: "Движение",
    subtitle: "Даже короткая ежедневная активность заметно влияет на здоровье",
    ordinal: "04",
  },
  {
    key: "nutrition",
    title: "Питание",
    subtitle: "Энергия, восстановление и темп старения",
    ordinal: "05",
  },
  {
    key: "habits",
    title: "Привычки",
    subtitle: "Алкоголь, никотин и тип нагрузок",
    ordinal: "06",
  },
  {
    key: "personalization",
    title: "Данные для персонализации",
    subtitle: "Нужны для точного расчёта биологического возраста",
    ordinal: "07",
  },
  {
    key: "contact",
    title: "Куда отправить отчёт",
    subtitle: "Подготовим персональный PDF и пришлём на почту",
    ordinal: "08",
  },
];
