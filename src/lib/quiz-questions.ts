import { Answers, StepKey } from "./types";

export type OptionValue = string;

export interface ChoiceQuestion {
  id: keyof Answers;
  type: "single";
  step: StepKey;
  title: string;
  hint?: string;
  options: Array<{ value: OptionValue; label: string }>;
}

export interface MultiQuestion {
  id: keyof Answers;
  type: "multi";
  step: StepKey;
  title: string;
  hint?: string;
  options: Array<{ value: OptionValue; label: string }>;
}

export interface NumericQuestion {
  id: keyof Answers;
  type: "number";
  step: StepKey;
  title: string;
  hint?: string;
  placeholder: string;
  min: number;
  max: number;
  suffix: string;
}

export interface TextQuestion {
  id: keyof Answers;
  type: "text" | "email";
  step: StepKey;
  title: string;
  hint?: string;
  placeholder: string;
}

export type Question = ChoiceQuestion | MultiQuestion | NumericQuestion | TextQuestion;

export const QUESTIONS: Question[] = [
  // БЛОК 1. ЦЕЛЬ
  {
    id: "goal",
    type: "single",
    step: "goal",
    title: "Ваша главная цель прямо сейчас",
    hint: "Longy подстроит акцент рекомендаций под выбранную цель",
    options: [
      { value: "weight_loss", label: "Снижение веса" },
      { value: "muscle_gain", label: "Набор мышечной массы" },
      { value: "energy", label: "Повышение энергии" },
      { value: "nutrition", label: "Наладить питание" },
      { value: "endurance", label: "Повышение выносливости" },
      { value: "sleep", label: "Улучшение качества сна" },
      { value: "biological_age", label: "Снижение биологического возраста" },
    ],
  },

  // БЛОК 2. САМОЧУВСТВИЕ И ЭНЕРГИЯ
  {
    id: "energyPattern",
    type: "single",
    step: "energy",
    title: "Оцените уровень вашей энергии в течение дня",
    options: [
      { value: "stable_high", label: "На высоком уровне и стабильно весь день" },
      { value: "drop_after_lunch", label: "В основном ок, после обеда заметно падает" },
      { value: "unstable", label: "Нестабильно — в разные дни по-разному" },
      { value: "mostly_low", label: "Большую часть дня на низком уровне" },
    ],
  },
  {
    id: "foggyDays",
    type: "single",
    step: "energy",
    title:
      "Сколько дней за последнюю неделю вам было сложно ясно мыслить или сконцентрироваться?",
    options: [
      { value: "0", label: "0 дней" },
      { value: "1-2", label: "1–2 дня" },
      { value: "3-4", label: "3–4 дня" },
      { value: "5-7", label: "5–7 дней" },
    ],
  },
  {
    id: "overwhelmed",
    type: "single",
    step: "energy",
    title:
      "Сколько раз за последний месяц вы чувствовали, что трудностей так много, что вы не справляетесь?",
    hint: "Энергия, фокус и стресс тесно связаны",
    options: [
      { value: "0-2", label: "0–2 раза за месяц" },
      { value: "3-4", label: "3–4 раза за месяц" },
      { value: "5-10", label: "5–10 раз за месяц" },
      { value: "10+", label: "Более 10 раз за месяц" },
    ],
  },

  // БЛОК 3. СОН
  {
    id: "bedtime",
    type: "single",
    step: "sleep",
    title: "Во сколько вы обычно ложитесь спать?",
    options: [
      { value: "before22", label: "До 22:00" },
      { value: "22-23", label: "22:00–23:00" },
      { value: "23-00", label: "23:00–00:00" },
      { value: "00-01", label: "00:00–01:00" },
      { value: "after01", label: "После 01:00" },
    ],
  },
  {
    id: "wakeTime",
    type: "single",
    step: "sleep",
    title: "Во сколько вы обычно просыпаетесь?",
    options: [
      { value: "before6", label: "До 06:00" },
      { value: "6-7", label: "06:00–07:00" },
      { value: "7-8", label: "07:00–08:00" },
      { value: "8-9", label: "08:00–09:00" },
      { value: "after9", label: "После 09:00" },
    ],
  },
  {
    id: "sleepProblems",
    type: "single",
    step: "sleep",
    title: "Как часто за последний месяц у вас были проблемы со сном?",
    hint: "Не могли уснуть 30+ минут, просыпались ночью",
    options: [
      { value: "never", label: "Ни разу" },
      { value: "1-3", label: "1–3 ночи за месяц" },
      { value: "4-8", label: "4–8 ночей (1–2 раза в неделю)" },
      { value: "9+", label: "9+ ночей (3+ раза в неделю)" },
    ],
  },
  {
    id: "daytimeSleepiness",
    type: "single",
    step: "sleep",
    title: "Как часто за последний месяц вам хотелось заснуть днём?",
    hint: "За рулём, после еды, на встречах",
    options: [
      { value: "never", label: "Ни разу" },
      { value: "1-3", label: "1–3 раза за месяц" },
      { value: "4-8", label: "4–8 раз (1–2 раза в неделю)" },
      { value: "9+", label: "9+ раз (3+ раза в неделю)" },
    ],
  },

  // БЛОК 4. ДВИЖЕНИЕ
  {
    id: "activeDays",
    type: "single",
    step: "movement",
    title: "Сколько дней в неделю вы двигаетесь активно не менее 30 минут?",
    hint: "Зал, ходьба, йога, бег, плавание — всё считается",
    options: [
      { value: "0", label: "0 дней" },
      { value: "1-2", label: "1–2 дня" },
      { value: "3-4", label: "3–4 дня" },
      { value: "5-7", label: "5–7 дней" },
    ],
  },
  {
    id: "sittingHours",
    type: "single",
    step: "movement",
    title: "Сколько часов в день вы проводите сидя?",
    hint: "Работа + транспорт + досуг",
    options: [
      { value: "<4", label: "Менее 4 часов" },
      { value: "4-6", label: "4–6 часов" },
      { value: "6-8", label: "6–8 часов" },
      { value: "8+", label: "Более 8 часов" },
    ],
  },

  // БЛОК 5. ПИТАНИЕ
  {
    id: "processedFood",
    type: "single",
    step: "nutrition",
    title: "Как часто вы едите обработанные продукты?",
    hint: "Фастфуд, снеки, сладкое, газировка",
    options: [
      { value: "almost_never", label: "Практически никогда" },
      { value: "1-4mo", label: "1–4 раза в месяц" },
      { value: "3-6wk", label: "3–6 раз в неделю" },
      { value: "daily", label: "Ежедневно" },
    ],
  },
  {
    id: "veggiesFruits",
    type: "single",
    step: "nutrition",
    title: "Как часто вы едите свежие овощи и фрукты?",
    options: [
      { value: "3plus_daily", label: "3+ порции каждый день" },
      { value: "1-2_daily", label: "1–2 порции в день" },
      { value: "3-6_week", label: "Несколько раз в неделю" },
      { value: "<3_week", label: "Реже 3 раз в неделю" },
    ],
  },
  {
    id: "water",
    type: "single",
    step: "nutrition",
    title: "Сколько воды вы выпиваете в день?",
    options: [
      { value: "2plus_l", label: "Более 2 литров" },
      { value: "1.5-2l", label: "1.5–2 литра" },
      { value: "1-1.5l", label: "1–1.5 литра" },
      { value: "<1l", label: "Менее 1 литра" },
    ],
  },

  // БЛОК 6. ПРИВЫЧКИ
  {
    id: "alcohol",
    type: "single",
    step: "habits",
    title: "Вы употребляете алкоголь?",
    options: [
      { value: "never", label: "Нет, совсем" },
      { value: "rare", label: "Редко (1–5 раз в год)" },
      { value: "1-2wk", label: "1–2 раза в неделю" },
      { value: "3-4wk", label: "3–4 раза в неделю" },
      { value: "daily", label: "Ежедневно" },
    ],
  },
  {
    id: "nicotine",
    type: "single",
    step: "habits",
    title: "Вы курите или употребляете никотин?",
    hint: "Сигареты, вейп, снюс",
    options: [
      { value: "never", label: "Нет" },
      { value: "quit_1yr_plus", label: "Бросил(а) более года назад" },
      { value: "quit_under_1yr", label: "Бросил(а) менее года назад" },
      { value: "sometimes", label: "Да, иногда (менее 5 раз в неделю)" },
      { value: "regular", label: "Да, регулярно (5+ раз в неделю)" },
    ],
  },

  // БЛОК 7. СОЦИАЛЬНОЕ И ОПОРА
  {
    id: "socialConnections",
    type: "single",
    step: "social",
    title: "Как часто вы общаетесь с людьми, которым доверяете?",
    hint: "Социальные связи влияют на здоровье и устойчивость к стрессу сильнее, чем принято думать",
    options: [
      { value: "almost_daily", label: "Почти каждый день" },
      { value: "few_per_week", label: "Несколько раз в неделю" },
      { value: "few_per_month", label: "Несколько раз в месяц" },
      { value: "rarely", label: "Редко или почти никогда" },
    ],
  },

  // БЛОК 8. ДАННЫЕ ДЛЯ ПЕРСОНАЛИЗАЦИИ
  {
    id: "gender",
    type: "single",
    step: "personalization",
    title: "Ваш пол",
    options: [
      { value: "male", label: "Мужской" },
      { value: "female", label: "Женский" },
    ],
  },
  {
    id: "age",
    type: "number",
    step: "personalization",
    title: "Ваш возраст",
    placeholder: "35",
    min: 14,
    max: 100,
    suffix: "лет",
  },
  {
    id: "heightCm",
    type: "number",
    step: "personalization",
    title: "Ваш рост",
    placeholder: "175",
    min: 120,
    max: 230,
    suffix: "см",
  },
  {
    id: "weightKg",
    type: "number",
    step: "personalization",
    title: "Ваш вес",
    placeholder: "72",
    min: 30,
    max: 250,
    suffix: "кг",
  },
  {
    id: "trackers",
    type: "multi",
    step: "personalization",
    title: "Какими трекерами или устройствами вы пользуетесь?",
    hint: "Можно выбрать несколько — Longy сможет интерпретировать данные точнее",
    options: [
      { value: "whoop", label: "Whoop" },
      { value: "oura", label: "Oura Ring" },
      { value: "apple_watch", label: "Apple Watch" },
      { value: "garmin", label: "Garmin" },
      { value: "smart_scales", label: "Смарт-весы" },
      { value: "smart_mattress", label: "Смарт-матрас" },
      { value: "other", label: "Другое" },
      { value: "none", label: "Не пользуюсь" },
    ],
  },

  // БЛОК 9. КОНТАКТ
  {
    id: "name",
    type: "text",
    step: "contact",
    title: "Как вас зовут?",
    hint: "Имя и фамилия — укажем в персональном отчёте",
    placeholder: "Иван Иванов",
  },
  {
    id: "email",
    type: "email",
    step: "contact",
    title: "Ваш email",
    hint: "Пришлём PDF-отчёт и доступ к waitlist Longy",
    placeholder: "you@example.com",
  },
  {
    id: "telegram",
    type: "text",
    step: "contact",
    title: "Ваш Telegram",
    hint: "Пришлём уведомление, когда Longy станет доступен",
    placeholder: "@username",
  },
];
