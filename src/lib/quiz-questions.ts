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
  optional?: boolean;
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
    id: "foggyHours",
    type: "single",
    step: "energy",
    title: "Сколько времени за последнюю неделю вам было трудно ясно мыслить или сконцентрироваться?",
    options: [
      { value: "<1h", label: "Меньше часа" },
      { value: "1-3h", label: "1–3 часа" },
      { value: "3-7h", label: "3–7 часов" },
      { value: "7-14h", label: "7–14 часов" },
      { value: "14-20h", label: "14–20 часов" },
      { value: "20-40h", label: "20–40 часов" },
      { value: "40+h", label: "Больше 40 часов" },
    ],
  },
  {
    id: "conditions",
    type: "multi",
    step: "energy",
    title: "Есть ли у вас хронические заболевания или диагнозы?",
    hint: "Важно, чтобы мы не дали совет, который вам противопоказан",
    options: [
      { value: "none", label: "Нет" },
      { value: "hypertension", label: "Гипертония / сердечно-сосудистые заболевания" },
      { value: "atherosclerosis", label: "Атеросклероз" },
      { value: "diabetes2", label: "Диабет II типа" },
      { value: "autoimmune", label: "Аутоиммунные заболевания" },
      { value: "thyroid", label: "Заболевания щитовидной железы" },
      { value: "kidney", label: "Почечная недостаточность" },
      { value: "allergy", label: "Аллергия" },
      { value: "cancer", label: "Онкологические заболевания" },
      { value: "bpd", label: "Пограничные расстройства личности" },
      { value: "other", label: "Другое" },
      { value: "prefer_not_to_say", label: "Предпочитаю не указывать" },
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
      { value: "01-02", label: "01:00–02:00" },
      { value: "02-03", label: "02:00–03:00" },
      { value: "03-04", label: "03:00–04:00" },
      { value: "04-05", label: "04:00–05:00" },
      { value: "after05", label: "После 05:00" },
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
      { value: "9-10", label: "09:00–10:00" },
      { value: "10-11", label: "10:00–11:00" },
      { value: "11-12", label: "11:00–12:00" },
      { value: "12-13", label: "12:00–13:00" },
      { value: "13-14", label: "13:00–14:00" },
      { value: "after14", label: "После 14:00" },
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
    title: "Сколько дней в неделю вы двигаетесь активно не менее 1 часа?",
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
  {
    id: "functionalActivities",
    type: "multi",
    step: "movement",
    title: "Какие активности вы можете выполнять без выраженного дискомфорта?",
    hint: "Одышка, сильная усталость — признак дискомфорта. Отметьте все, что подходит",
    options: [
      { value: "short_walk", label: "Ходьба на короткие расстояния (10–15 минут)" },
      { value: "stairs", label: "Подъём по лестнице или в гору" },
      { value: "short_run", label: "Бег на короткую дистанцию" },
      { value: "light_chores", label: "Лёгкая работа по дому" },
      { value: "moderate_chores", label: "Умеренная работа по дому" },
      { value: "heavy_chores", label: "Тяжёлая работа по дому" },
      { value: "moderate_sport", label: "Умеренная физическая активность (танцы, гольф)" },
      { value: "intense_sport", label: "Интенсивные виды спорта (плавание, футбол)" },
    ],
  },
  {
    id: "breathRecovery",
    type: "single",
    step: "movement",
    title: "Как быстро вы восстанавливаете дыхание после подъёма по лестнице или быстрой ходьбы 10 минут?",
    options: [
      { value: "<1min", label: "Меньше минуты" },
      { value: "1-2min", label: "1–2 минуты" },
      { value: "3-5min", label: "3–5 минут" },
      { value: "5min+_avoid", label: "Более 5 минут / стараюсь избегать такой нагрузки" },
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
      { value: "2-3wk", label: "2–3 раза в неделю" },
      { value: "4-6wk", label: "4–6 раз в неделю" },
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
  {
    id: "exerciseType",
    type: "single",
    step: "habits",
    title: "Какой тип нагрузки у вас преобладает?",
    options: [
      { value: "strength", label: "Силовые тренировки (зал, TRX, кроссфит)" },
      { value: "cardio", label: "Кардио (бег, велосипед, плавание)" },
      { value: "yoga_flex", label: "Йога / растяжка / пилатес" },
      { value: "mixed", label: "Смешанный тип" },
      { value: "walking", label: "Ходьба / лёгкая активность" },
      { value: "none", label: "Практически не занимаюсь" },
    ],
  },
  {
    id: "barrier",
    type: "single",
    step: "habits",
    title: "Что сейчас мешает вам больше всего начать заботиться о себе регулярно?",
    hint: "Longy подстроит план под ваш барьер",
    options: [
      { value: "time", label: "Не хватает времени" },
      { value: "energy", label: "Не хватает энергии" },
      { value: "conflicting_advice", label: "Слишком много противоречивых советов" },
      { value: "motivation", label: "Быстро теряю мотивацию" },
      { value: "dont_know_start", label: "Не понимаю, с чего начать" },
    ],
  },

  // БЛОК 7. ДАННЫЕ ДЛЯ ПЕРСОНАЛИЗАЦИИ
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
    id: "waistCm",
    type: "number",
    step: "personalization",
    title: "Окружность талии",
    hint: "На уровне пупка, на выдохе. Можно пропустить, если не знаете",
    placeholder: "82",
    min: 40,
    max: 200,
    suffix: "см",
    optional: true,
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

  // БЛОК 8. КОНТАКТ
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
    hint: "Пришлём PDF-отчёт и доступ к приложению Longy",
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
