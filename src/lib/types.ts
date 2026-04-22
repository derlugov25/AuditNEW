export type QuizAnswer = string | number;

export interface Answers {
  gender: "male" | "female" | "";
  age: number | "";
  heightCm: number | "";
  weightKg: number | "";

  energyPattern: "" | "stable_high" | "drop_after_lunch" | "unstable" | "mostly_low";
  foggyDays: "" | "0" | "1-2" | "3-4" | "5-7";
  overwhelmed: "" | "0-2" | "3-4" | "5-10" | "10+";

  bedtime: "" | "before22" | "22-23" | "23-00" | "00-01" | "after01";
  wakeTime: "" | "before6" | "6-7" | "7-8" | "8-9" | "after9";
  sleepProblems: "" | "never" | "1-3" | "4-8" | "9+";
  daytimeSleepiness: "" | "never" | "1-3" | "4-8" | "9+";

  activeDays: "" | "0" | "1-2" | "3-4" | "5-7";
  sittingHours: "" | "<4" | "4-6" | "6-8" | "8+";

  processedFood: "" | "almost_never" | "1-4mo" | "3-6wk" | "daily";
  veggiesFruits: "" | "3plus_daily" | "1-2_daily" | "3-6_week" | "<3_week";
  water: "" | "2plus_l" | "1.5-2l" | "1-1.5l" | "<1l";

  alcohol: "" | "never" | "rare" | "1-2wk" | "3-4wk" | "daily";
  nicotine: "" | "never" | "quit_1yr_plus" | "quit_under_1yr" | "sometimes" | "regular";

  socialConnections: "" | "almost_daily" | "few_per_week" | "few_per_month" | "rarely";

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
  energyPattern: "",
  foggyDays: "",
  overwhelmed: "",
  bedtime: "",
  wakeTime: "",
  sleepProblems: "",
  daytimeSleepiness: "",
  activeDays: "",
  sittingHours: "",
  processedFood: "",
  veggiesFruits: "",
  water: "",
  alcohol: "",
  nicotine: "",
  socialConnections: "",
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
  | "social"
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
    subtitle: "Алкоголь и никотин — самые изученные ускорители старения",
    ordinal: "06",
  },
  {
    key: "social",
    title: "Социальное и опора",
    subtitle: "Связи влияют на здоровье сильнее, чем принято думать",
    ordinal: "07",
  },
  {
    key: "personalization",
    title: "Данные для персонализации",
    subtitle: "Нужны для точного расчёта биологического возраста",
    ordinal: "08",
  },
  {
    key: "contact",
    title: "Куда отправить отчёт",
    subtitle: "Подготовим персональный PDF и пришлём на почту",
    ordinal: "09",
  },
];
