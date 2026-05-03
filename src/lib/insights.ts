import { DomainKey, DomainScore, ScoreResult, computeSleepHours } from "./scoring";
import { Answers, ConditionKey } from "./types";
import { getLang, pluralEn, pluralRu, tr } from "./i18n";

export interface AcceleratorInsight {
  key: DomainKey;
  headline: string;
  detail: string;
  yearsLostEstimate: string;
  action: string;
  evidence: string;
}

export interface ProtectorInsight {
  key: DomainKey;
  headline: string;
  detail: string;
}

// ──────────────────────────────────────────────────────────────
// REPORT TONE - central narrative switcher
// ──────────────────────────────────────────────────────────────

export type ReportTone = "optimize" | "fix" | "recover";

/**
 * Derive one narrative tone from score. Used once per render to pick
 * headlines, CTAs, card titles, chart modes.
 *   optimize - сильная база, задача удержать + точечно дожать (excellent/good с малыми потерями)
 *   fix      - есть ощутимые точки роста, но без катастрофы (attention, или good/excellent с потерями)
 *   recover  - образ жизни заметно ускоряет старение (risk/critical)
 */
export function reportTone(score: ScoreResult): ReportTone {
  // Тон строго по longyScore - совпадает с isGainBranch (≥90 → optimize)
  // и нижней границей risk/critical (<50 → recover).
  if (score.longyScore < 50) return "recover";
  if (score.longyScore >= 90) return "optimize";
  return "fix";
}

/**
 * Нормативная оценка перцентили по Longy Health Score. Построена на грубом
 * предположении о распределении score в популяции (μ=60, σ=15, clamped).
 * Возвращает 1..99 - «вы в топ-N%». Достаточно для качественной фразы
 * «в верхней X%»; не претендует на точный эпидемиологический расчёт.
 */
export function longyScorePercentileTop(score: number): number {
  const mu = 60;
  const sigma = 15;
  const z = (score - mu) / sigma;
  // Abramowitz-Stegun CDF approximation.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp((-z * z) / 2);
  const cdf =
    z >= 0
      ? 1 -
        d *
          (0.319381530 * t -
            0.356563782 * t * t +
            1.781477937 * t * t * t -
            1.821255978 * Math.pow(t, 4) +
            1.330274429 * Math.pow(t, 5))
      : d *
        (0.319381530 * t -
          0.356563782 * t * t +
          1.781477937 * t * t * t -
          1.821255978 * Math.pow(t, 4) +
          1.330274429 * Math.pow(t, 5));
  const topPct = Math.round((1 - cdf) * 100);
  return Math.max(1, Math.min(99, topPct));
}

export function strongestDomain(score: ScoreResult): DomainScore {
  return Object.values(score.domains).reduce((best, d) =>
    d.score0to100 > best.score0to100 ? d : best,
  );
}

// ──────────────────────────────────────────────────────────────
// УСЛОВИЯ И GUARDRAILS
// ──────────────────────────────────────────────────────────────

export type AdviceCategory =
  | "caffeine"
  | "hiit"
  | "strength"
  | "fasting"
  | "high_protein"
  | "supplements"
  | "cold_exposure"
  | "general";

type BarrierKey = NonNullable<Answers["barrier"]> | "";

const CONDITION_BLOCKS: Record<ConditionKey, AdviceCategory[]> = {
  hypertension: ["caffeine", "hiit", "cold_exposure"],
  atherosclerosis: ["caffeine", "hiit", "fasting"],
  diabetes2: ["fasting"],
  autoimmune: ["fasting", "cold_exposure"],
  thyroid: ["supplements"],
  kidney: ["high_protein", "supplements"],
  cancer: ["fasting", "supplements", "cold_exposure"],
  bpd: [],
  allergy: [],
  other: [],
  none: [],
  prefer_not_to_say: [],
};

const CONDITION_REFRAMES: Record<ConditionKey, Partial<Record<AdviceCategory, string>>> = {
  hypertension: {
    caffeine: "Кофе - максимум 1 чашка до 12:00, следите за давлением после",
    hiit: "Интенсивное кардио - только после консультации с кардиологом",
    cold_exposure: "Контрастный душ и криотерапия - обсудите с кардиологом",
  },
  atherosclerosis: {
    caffeine: "Кофе ограничьте до 1 чашки в день, следите за АД",
    hiit: "Высокоинтенсивные нагрузки - только под медицинским контролем",
    fasting: "Интервальное голодание - обязательно согласуйте с врачом",
  },
  diabetes2: {
    fasting: "Длительное голодание при диабете - только под наблюдением врача",
  },
  autoimmune: {
    fasting: "Длительное голодание при аутоиммунных состояниях - проконсультируйтесь с врачом",
    cold_exposure: "Экстремальные температурные воздействия - обсудите со специалистом",
  },
  thyroid: {
    supplements: "БАДы с йодом и селеном - только после анализов, не наугад",
  },
  kidney: {
    high_protein: "Норму белка обсудите с нефрологом - стандартные 1.6 г/кг вам могут не подойти",
    supplements: "Большинство БАДов нагружают почки - обсудите с нефрологом",
  },
  cancer: {
    fasting: "Любые ограничения питания согласовывайте с онкологом",
    supplements: "Все БАДы - только с согласования онколога",
    cold_exposure: "Экстремальные практики - согласуйте с лечащим врачом",
  },
  bpd: {},
  allergy: {},
  other: {},
  none: {},
  prefer_not_to_say: {},
};

const CONDITION_REFRAMES_EN: Record<ConditionKey, Partial<Record<AdviceCategory, string>>> = {
  hypertension: {
    caffeine: "Coffee - max 1 cup before noon, track your blood pressure afterwards",
    hiit: "Intense cardio - only after consulting your cardiologist",
    cold_exposure: "Contrast showers and cryotherapy - discuss with your cardiologist",
  },
  atherosclerosis: {
    caffeine: "Limit coffee to 1 cup a day, monitor your blood pressure",
    hiit: "High-intensity loads - only under medical supervision",
    fasting: "Intermittent fasting - mandatory to clear with your doctor",
  },
  diabetes2: {
    fasting: "Long fasts with diabetes - only under medical supervision",
  },
  autoimmune: {
    fasting: "Long fasts with autoimmune conditions - check with your doctor",
    cold_exposure: "Extreme temperature exposure - discuss with a specialist",
  },
  thyroid: {
    supplements: "Iodine and selenium supplements - only after labs, not blindly",
  },
  kidney: {
    high_protein: "Discuss your protein target with a nephrologist - the standard 1.6 g/kg may not fit you",
    supplements: "Most supplements load the kidneys - discuss with a nephrologist",
  },
  cancer: {
    fasting: "Any dietary restrictions - clear with your oncologist",
    supplements: "All supplements - only with oncologist approval",
    cold_exposure: "Extreme practices - clear with your treating physician",
  },
  bpd: {},
  allergy: {},
  other: {},
  none: {},
  prefer_not_to_say: {},
};

interface Snippet {
  match: (a: Answers) => boolean;
  headline: string;
  detail: string;
  actionByBarrier: Record<string, string>;
  category: AdviceCategory;
}

function applyGuardrails(snippet: Snippet, conditions: ConditionKey[], barrier: BarrierKey): {
  headline: string;
  detail: string;
  action: string;
} {
  const isEn = getLang() === "en";
  const reframeMap = isEn ? CONDITION_REFRAMES_EN : CONDITION_REFRAMES;
  const blocks = new Set(conditions.flatMap((c) => CONDITION_BLOCKS[c] ?? []));
  const reframes = conditions.flatMap((c) =>
    Object.entries(reframeMap[c] ?? {}),
  );

  let action =
    snippet.actionByBarrier[barrier] ??
    snippet.actionByBarrier["dont_know_start"] ??
    Object.values(snippet.actionByBarrier)[0] ??
    "";

  if (blocks.has(snippet.category)) {
    const reframe = reframes.find(([cat]) => cat === snippet.category);
    if (isEn) {
      action = reframe
        ? `⚠ Given your diagnosis: ${reframe[1]}`
        : "⚠ Given your diagnosis: this advice should be cleared with your doctor. In Longy we substitute an alternative tailored to your condition.";
    } else {
      action = reframe
        ? `⚠ С учётом вашего диагноза: ${reframe[1]}`
        : "⚠ С учётом вашего диагноза: этот совет нужно согласовать с вашим врачом. В Longy подбираем альтернативу под ваш диагноз.";
    }
  }

  return { headline: snippet.headline, detail: snippet.detail, action };
}

// ──────────────────────────────────────────────────────────────
// SNIPPET LIBRARIES BY DOMAIN
// ──────────────────────────────────────────────────────────────

const SLEEP_SNIPPETS: Snippet[] = [
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h < 5; },
    headline: "Критический недосып - меньше 5 часов",
    detail: "Меньше 5 часов сна - это не «немного устал». Падает гормон роста, мозг хуже очищается от продуктов своей же работы, организм хуже обращается с сахаром в крови. И «отоспаться в выходные» не компенсирует - недосып копится.",
    actionByBarrier: {
      time: "Сегодня - на 30 минут раньше в кровать. Только это.",
      energy: "Недосып сам тянет вашу энергию. Один шаг: убрать телефон за час до сна.",
      conflicting_advice: "Prather et al., Sleep 2015: при сне <6 ч риск простуды в 4 раза выше. Цель - 7+ ч.",
      motivation: "Первая победа - 14 ночей подряд по 6.5+ ч. Отмечайте каждую.",
      dont_know_start: "Сегодня вечером ложитесь в 23:00 - и так 7 дней подряд. Через неделю сдвиньте на 22:30. Этого пока достаточно.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 7 && h <= 9 && (a.bedtime === "after05" || a.bedtime === "04-05" || a.bedtime === "03-04"); },
    headline: "Сон сдвинут в день - сбит режим",
    detail: "Даже если спите 8 часов, но ложитесь после 3 ночи - внутренние часы постоянно сбиты. Это как жить с лёгким перелётом каждый день: страдают обмен веществ, иммунитет, мышление.",
    actionByBarrier: {
      time: "Сдвиг на 15 мин раньше каждые 3 дня - этого достаточно.",
      energy: "Яркий свет сразу после подъёма ускоряет перестройку ритма.",
      conflicting_advice: "Гормон сна (мелатонин) сильнее всего вырабатывается в темноте примерно до 2 ночи.",
      motivation: "Каждая ночь в «до 01:00» - маленькая победа над jetlag.",
      dont_know_start: "Первую неделю - ложитесь не позже 3 ночи. Вторую - не позже 2. Третью - не позже 1.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 5 && h < 6; },
    headline: "Сон 5-6 ч - хронический дефицит восстановления",
    detail: "При 5-6 часах сокращается глубокий сон - именно в нём тело восстанавливается, а иммунитет работает в полную силу. К нехватке привыкаешь субъективно - но память и обмен веществ страдают по-настоящему.",
    actionByBarrier: {
      time: "Добавьте 30 мин: ложитесь на полчаса раньше 14 ночей подряд.",
      energy: "Сон - главный генератор энергии. Инвестиция в 30 мин даёт возврат весь следующий день.",
      conflicting_advice: "AASM, ВОЗ, NIH единогласны: минимум 7 часов для взрослых.",
      motivation: "Отслеживайте HRV утром - за 2 недели увидите разницу.",
      dont_know_start: "Сегодня - оставьте телефон вне спальни за час до сна. Через 7 дней увидите разницу, дальше шагнём дальше.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 6 && h < 7; },
    headline: "Сон чуть ниже восстановительного порога",
    detail: "7-9 часов - окно, в которое помещаются все нужные стадии сна. При 6-7 часах глубокая стадия не успевает развернуться - тело недовосстанавливается.",
    actionByBarrier: {
      time: "30 мин раньше в кровать - и 30 мин прироста сна без усилий.",
      energy: "30 минут дополнительного сна = 20% больше энергии в первой половине дня.",
      conflicting_advice: "7 часов - минимальный консенсус всех медицинских организаций.",
      motivation: "14 ночей стабильного режима - и биомаркеры сна видимо улучшатся.",
      dont_know_start: "Один шаг: отбой на 30 мин раньше, не меняя больше ничего.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h > 10; },
    headline: "Сон 10+ ч - сигнал нарушения качества",
    detail: "Сон больше 10 часов у взрослого - обычно признак, что ночью сон рваный, и тело пытается «добрать» количеством. Это ассоциировано с повышенным риском проблем с сердцем.",
    actionByBarrier: {
      time: "Трекер сна (даже телефон) покажет структуру за 2 недели.",
      energy: "Причина усталости, скорее всего, в качестве сна, а не его длине.",
      conflicting_advice: "Длина сна 10+ ч - не признак здоровья, а сигнал к обследованию.",
      motivation: "Проверка ферритина и витамина D часто меняет картину кардинально.",
      dont_know_start: "Следующие 2 недели записывайте данные по сну в приложение и затем отмечайте, как чувствуете себя днём.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 7 && (a.daytimeSleepiness === "9+" || a.daytimeSleepiness === "4-8"); },
    headline: "Достаточно сплю, но днём клонит - скрытая проблема",
    detail: "Часов сна вроде хватает, но днём клонит - это сигнал, что ночью сон не такой, как кажется: возможно, вы много раз просыпаетесь, не помня этого, или есть нарушение дыхания во сне (апноэ).",
    actionByBarrier: {
      time: "Следующие 2 недели отслеживайте сон с помощью трекера и чек-инов в приложении и фиксируйте, как чувствуете себя днём.",
      energy: "Дневной кофеин маскирует, но не решает. Нужна причина - не симптом.",
      conflicting_advice: "Дневная сонливость при, казалось бы, нормальном сне - это медицинский вопрос, а не вопрос привычек. Сюда стоит подключить врача.",
      motivation: "Знать причину - уже половина решения. Запись сна на 14 ночей.",
      dont_know_start: "На 14 ночей включите запись сна (Apple Watch, Whoop, Oura или просто приложение на телефоне). Если в данных видны частые пробуждения или апноэ - идите к сомнологу. Не отмахивайтесь.",
    },
    category: "general",
  },
  {
    match: (a) => a.sleepProblems === "9+" || a.sleepProblems === "4-8",
    headline: "Прерывистый сон - часы есть, восстановления нет",
    detail: "Трудно заснуть или пробуждения ночью - значит, организм не доходит до глубоких стадий сна. А именно в этих стадиях мозг очищается от «отходов» дневной работы, закрепляется память и вырабатывается гормон роста.",
    actionByBarrier: {
      time: "Ритуал 10 мин: выключить экраны, короткое дыхание 4-7-8, темнота.",
      energy: "Прерывистый сон = постоянная усталость. Ритуал перед сном - первый шаг.",
      conflicting_advice: "Один доказанный шаг: темнота и тишина в спальне. Начните отсюда.",
      motivation: "14 ночей ритуала подряд - мозг «выучивает» новый паттерн.",
      dont_know_start: "Шаг 1 - убрать телефон из спальни на 7 дней.",
    },
    category: "general",
  },
  {
    match: (a) => a.bedtime === "01-02" || a.bedtime === "02-03",
    headline: "Позднее засыпание - сдвинутый циркадный ритм",
    detail: "Спите достаточно, но окно сна смещено в ночь. Внутренние часы сбиты - это даёт лёгкий, но постоянный фоновый стресс для гормонов и иммунитета.",
    actionByBarrier: {
      time: "Сдвиг на 15 мин раньше каждые 3 дня - без резкого дискомфорта.",
      energy: "Яркий свет сразу после подъёма - главный якорь циркадного ритма.",
      conflicting_advice: "Один факт: циркадный сдвиг = повышенный риск метаболических нарушений.",
      motivation: "Каждая неделя сдвига ритма - измеримый прирост HRV.",
      dont_know_start: "Неделя 1 - отбой на 30 мин раньше. Повторять до нормы.",
    },
    category: "general",
  },
];

const STRESS_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.foggyHours === "40+h" || a.foggyHours === "20-40h",
    headline: "Ментальный туман большую часть недели",
    detail: "Постоянно высокий кортизол (главный гормон стресса) запускает в организме фоновое воспаление и ускоряет клеточное старение. 20+ часов «тумана в голове» в неделю - серьёзный сигнал, что нервная система выгорает.",
    actionByBarrier: {
      time: "10 мин дыхания 4-7-8 утром. Одно действие, измеримый эффект за 2 недели.",
      energy: "Начните с одной точки: 10 мин тишины после обеда без телефона.",
      conflicting_advice: "Один проверенный приём: спокойное дыхание снижает кортизол за 4 минуты.",
      motivation: "Ведите дневник туманности по шкале 1-10. Через 2 недели увидите тренд.",
      dont_know_start: "Каждый вечер 5 минут пишите от руки или в заметках всё, что крутится в голове. Без отбора. Цель - выгрузить мысли из головы на бумагу.",
    },
    category: "general",
  },
  {
    match: (a) => a.foggyHours === "14-20h" || a.foggyHours === "7-14h",
    headline: "Хронический перегруз истощает нервную систему",
    detail: "Постоянно высокий кортизол ускоряет старение клеток. Внутреннее воспаление быстрее изнашивает сосуды и нервные клетки.",
    actionByBarrier: {
      time: "10 мин дыхания + вечернюю выгрузку мыслей на бумагу на бумаге. Минимум инвестиций.",
      energy: "Одна точка восстановления в день - 15 мин без задач и экранов.",
      conflicting_advice: "Один приём: дыхание 4-4-8 (вдох на 4 счёта, задержка на 4, выдох на 8). Это включает «успокаивающую» часть нервной системы - наука про это есть.",
      motivation: "Контроль стресса - это навык. Первые 14 дней самые важные.",
      dont_know_start: "Шаг 1 - 5 мин медитации на выдохе перед сном.",
    },
    category: "general",
  },
  {
    match: (a) => a.energyPattern === "mostly_low",
    headline: "Стабильно низкая энергия - это не норма",
    detail: "Постоянно низкая энергия - сигнал одной из трёх проблем: хронический стресс, недосып или сбои в обмене веществ. Часто работают все три сразу.",
    actionByBarrier: {
      time: "20 мин яркого света утром перестраивают кортизольную кривую за 5 дней.",
      energy: "Одна точка восстановления: короткий сон 20 мин после обеда - не слабость, метод.",
      conflicting_advice: "Дефицит витамина D и железа - частые находки при хронической усталости (Roy et al. 2014, EJCM 2025). Это первый и самый дешёвый шаг диагностики.",
      motivation: "Ведите шкалу 1-10 каждое утро. Тренд виден через неделю.",
      dont_know_start: "Шаг 1 - анализы: ферритин, витамин D, ТТГ. Без догадок.",
    },
    category: "general",
  },
  {
    match: (a) => a.foggyHours === "3-7h",
    headline: "Туман в голове 3-7 часов в неделю",
    detail: "Стресс пока умеренный - нервная система справляется, но с потерями: меньше ясности в голове, медленнее реакции. Хорошая точка, чтобы не доводить до выгорания.",
    actionByBarrier: {
      time: "Две 5-минутные паузы в день - выйти на улицу, без телефона.",
      energy: "Снизьте стимуляторы (кофе, новости) в первой половине дня.",
      conflicting_advice: "Тишина - самый недооценённый когнитивный инструмент.",
      motivation: "Начните с одного «тихого часа» в неделю. Расширяйте.",
      dont_know_start: "Шаг 1 - прогулка 15 мин без наушников и телефона.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Стресс тянет ресурс сильнее, чем кажется",
    detail: "Даже умеренный стресс запускает фоновое воспаление и уменьшает вариабельность сердечного ритма (HRV) - а это один из самых ранних сигналов, что нервная система перегружена.",
    actionByBarrier: {
      time: "5 мин дыхательной практики перед сном.",
      energy: "Отдых - это не бездействие, это активное восстановление.",
      conflicting_advice: "Один простой факт: глубокое дыхание включает «успокаивающую» часть нервной системы за 60 секунд.",
      motivation: "Отслеживайте HRV - прогресс виден через 2 недели.",
      dont_know_start: "Шаг 1 - 5 мин медитации утром, 7 дней подряд.",
    },
    category: "general",
  },
];

const MOVEMENT_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.activeDays === "0",
    headline: "Отсутствие движения - один из самых сильных факторов риска",
    detail: "Мышцы - один из главных регуляторов сахара в крови. После 30 лет при низкой физической активности человек теряет в среднем 3-5% мышечной массы за каждые 10 лет, а вместе с этим ухудшаются обмен веществ и работа иммунной системы.",
    actionByBarrier: {
      time: "Правило 22: 22 мин ходьбы в день - нейтрализует риски 10 ч сидения.",
      energy: "Начните с 10 мин прогулки. Движение генерирует энергию, а не тратит её.",
      conflicting_advice: "Один факт: 22 минуты быстрой ходьбы в день нейтрализуют вред долгого сидения (Sagelv et al., BJSM 2023).",
      motivation: "Первые 7 дней по 10 мин. Потом тело само попросит больше.",
      dont_know_start: "Сегодня - 10 минут быстрой ходьбы. Завтра - 12. Через 2 недели - те самые 22 минуты в день. Никаких залов, ничего покупать.",
    },
    category: "general",
  },
  {
    match: (a) => a.sittingHours === "8+" && a.activeDays !== "5-7",
    headline: "8+ часов сидения - важно вставать и двигаться",
    detail: "Долгое сидение само по себе повышает риск ранней смерти - даже если у вас нормальный вес. Хорошая новость: это исправляется без смены работы.",
    actionByBarrier: {
      time: "Вставать каждые 45 мин на 5 мин. Таймер - и больше ничего.",
      energy: "Микродвижение каждый час не истощает, а восполняет энергию.",
      conflicting_advice: "Sagelv et al., BJSM 2023 (мета-анализ 4 когорт, n=11985): 22+ мин MVPA в день нейтрализуют избыточный риск смертности от длительного сидения.",
      motivation: "Отметьте каждый «вставальный» промежуток - за неделю привычка.",
      dont_know_start: "Прямо сейчас поставьте таймер на телефоне на 45 минут. Когда зазвенит - встаньте, пройдитесь по квартире, сделайте 10 приседаний. Дальше повторяйте каждый рабочий час.",
    },
    category: "general",
  },
  {
    match: (a) => a.breathRecovery === "5min+_avoid" || a.breathRecovery === "3-5min",
    headline: "Сниженная кардио-форма - самостоятельный фактор риска",
    detail: "VO₂max (мера того, как хорошо организм использует кислород) - один из самых сильных предикторов долголетия. Если после нагрузки дыхание восстанавливается дольше 3 минут - у сердца и лёгких сейчас низкий запас прочности.",
    actionByBarrier: {
      time: "10 мин ходьбы в лёгком темпе ежедневно - уже запускает адаптацию.",
      energy: "Начните с медленной ходьбы. Тело само ускорится через 2-3 недели.",
      conflicting_advice: "VO2max улучшается даже от умеренных прогулок - это не миф.",
      motivation: "Замеряйте пульс после лестницы раз в неделю - динамика мотивирует.",
      dont_know_start: "Шаг 1 - 10 мин ходьбы на умеренном темпе каждый день.",
    },
    category: "general",
  },
  {
    match: (a) => a.functionalActivities.length <= 2,
    headline: "Ограниченная функциональная форма требует внимания",
    detail: "Если простые повседневные действия - подняться по лестнице, нести сумки, присесть - даются с дискомфортом, физическая форма уже не в порядке. И ослабевает она незаметно.",
    actionByBarrier: {
      time: "5 мин лёгкой растяжки утром и 10 мин ходьбы - точка входа.",
      energy: "Функциональная форма строится маленькими шагами, не объёмом.",
      conflicting_advice: "Один принцип: постепенная прогрессия нагрузки без боли.",
      motivation: "Отмечайте каждую новую активность, которая стала комфортнее.",
      dont_know_start: "Шаг 1 - лестница вместо лифта 5 дней подряд.",
    },
    category: "general",
  },
  {
    match: (a) => a.activeDays === "1-2",
    headline: "Недостаток движения накапливает дефицит здоровья",
    detail: "1-2 активных дня в неделю - это ниже минимума, который рекомендует ВОЗ (150 минут умеренного движения). Запас прочности организма уменьшается незаметно.",
    actionByBarrier: {
      time: "Добавьте один 20-минутный блок ходьбы - в рабочее время или обеденный перерыв.",
      energy: "Третий активный день в неделю даёт непропорциональный прирост энергии.",
      conflicting_advice: "ВОЗ: 150 мин в неделю = снижение риска смертности на 30%.",
      motivation: "От 2 до 3 дней - самый быстрый прирост субъективного самочувствия.",
      dont_know_start: "Шаг 1 - запланировать третью прогулку в календаре прямо сейчас.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Движение работает против вас прямо сейчас",
    detail: "Нехватка движения копится тихо. Каждый малоподвижный день - это минус к запасу прочности организма.",
    actionByBarrier: {
      time: "22 мин ходьбы в день - минимально эффективная доза.",
      energy: "Начните с 10 мин - тело само запросит больше через неделю.",
      conflicting_advice: "Sagelv et al., BJSM 2023 (мета-анализ 4 когорт, n=11985): 22+ мин MVPA в день нейтрализуют избыточный риск смертности от длительного сидения.",
      motivation: "Поставьте цель на 7 дней, не на месяц.",
      dont_know_start: "Шаг 1 - 10 мин прогулки сегодня после ужина.",
    },
    category: "general",
  },
];

const NUTRITION_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.processedFood === "daily",
    headline: "Ежедневная ультра-обработанная еда запускает воспалительный каскад",
    detail: "Ультра-обработанная еда (готовые блюда, колбасы, сладкие батончики, газировка) ломает работу кишечной микрофлоры, а она напрямую отвечает за иммунитет и воспаление в организме. Большое потребление повышает риск диабета на 40%, болезней сердца на 29%, ранней смерти на 21% (Lane et al., BMJ 2024).",
    actionByBarrier: {
      time: "Правило трети тарелки: треть - овощи, треть - белок, треть - злаки. Без счёта калорий.",
      energy: "Одна замена в день: обработанный перекус → орехи или фрукт.",
      conflicting_advice: "Один принцип: меньше ингредиентов в составе = лучше для микробиома.",
      motivation: "Замените один ежедневный продукт на цельный. Неделю подряд.",
      dont_know_start: "Шаг 1 - убрать один ультра-обработанный продукт из ежедневного меню.",
    },
    category: "general",
  },
  {
    match: (a) => a.veggiesFruits === "<3_week",
    headline: "Дефицит овощей истощает микробиом и митохондрии",
    detail: "В овощах - клетчатка и природные защитные вещества. Без них клетки хуже производят энергию и хуже выводят «отходы», и старение ускоряется.",
    actionByBarrier: {
      time: "Горсть листьев + помидор к любому приёму пищи - 30 секунд.",
      energy: "Овощи = питание для митохондрий. Дефицит = меньше энергии на клеточном уровне.",
      conflicting_advice: "3 порции овощей/фруктов в день - рекомендация всех диетологических организаций.",
      motivation: "Один новый овощ в рацион в неделю. Без давления.",
      dont_know_start: "Шаг 1 - добавить одну порцию овощей к обеду ежедневно.",
    },
    category: "general",
  },
  {
    match: (a) => a.water === "<1l",
    headline: "Хроническая дегидратация замедляет метаболизм и мышление",
    detail: "Даже лёгкое обезвоживание (потеря около 2% массы тела) заметно ухудшает внимание, концентрацию и реакцию (Wittbrodt & Millard-Stafford, 2018). Постоянная нехватка воды замедляет работу почек и выведение продуктов обмена.",
    actionByBarrier: {
      time: "Стакан воды утром и перед каждым приёмом пищи - без усилий.",
      energy: "Вода - дешевле и быстрее любого энергетика.",
      conflicting_advice: "1.5 л в день - научный минимум для взрослых при умеренной активности.",
      motivation: "Трекер воды в телефоне + напоминание раз в 2 часа.",
      dont_know_start: "Шаг 1 - поставить бутылку воды на стол прямо сейчас.",
    },
    category: "general",
  },
  {
    match: (a) => a.processedFood === "4-6wk",
    headline: "Частая обработанная еда нарушает метаболизм",
    detail: "Если ультра-обработанная еда (колбасы, готовые соусы, сладкое, газировка) - 4-6 раз в неделю, это уже устойчиво ломает кишечную микрофлору и держит организм в фоновом воспалении.",
    actionByBarrier: {
      time: "Заменить один из 4-6 случаев на что-то цельное - конкретный план на неделю.",
      energy: "Меньше обработанной еды = стабильнее энергия без провалов.",
      conflicting_advice: "Снизить с 5 до 2 раз в неделю - измеримая цель.",
      motivation: "Каждая замена - +1 к счёту здорового питания на неделе.",
      dont_know_start: "Начните с одного простого шага: выберите 1 день в неделю без ультраобработанной еды. В этот день откажитесь от колбас, сладостей газировки, готовых соусов и снеков.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Рацион работает против восстановления",
    detail: "Нехватка нужных веществ копится незаметно - ограничивает восстановление, иммунитет и ясность мышления.",
    actionByBarrier: {
      time: "Замените один перекус в день: вместо печенья или чипсов - горсть орехов или фрукт.",
      energy: "Питание - топливо. Качество топлива = качество энергии.",
      conflicting_advice: "Три принципа: цельные продукты, разнообразие, достаточно воды.",
      motivation: "Один новый здоровый выбор в день - 30 дней = новая база.",
      dont_know_start: "Шаг 1 - заменить один перекус на орехи или фрукт.",
    },
    category: "general",
  },
];

const HABITS_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.nicotine === "regular",
    headline: "Никотин ускоряет старение быстрее любого другого фактора - и это доказано сотнями исследований.",
    detail: "Никотин повреждает внутренние стенки сосудов и ускоряет накопление налёта в них. По данным GBD Tobacco 2021, курение в среднем сокращает здоровую жизнь на 10 лет.",
    actionByBarrier: {
      time: "Не «бросить» сразу, а заменить одну конкретную ситуацию-курильщик. Две недели - одна ситуация.",
      energy: "Никотин имитирует бодрость, но снижает HRV и качество сна.",
      conflicting_advice: "Doll et al. BMJ 2004: отказ до 35 лет возвращает ожидаемую продолжительность жизни к уровню некурящих.",
      motivation: "Замена ситуации на 5-минутное действие. Одна новая привычка-якорь.",
      dont_know_start: "Шаг 1: понаблюдайте за собой 3 дня - в каких ситуациях вы тянетесь к сигарете чаще всего (после еды? на нервах? в компании?). Шаг 2: на самую частую - придумайте, чем заменить (жвачка, прогулка вокруг офиса, минута дыхания). Шаг 3: пробуйте замену 7 дней.",
    },
    category: "general",
  },
  {
    match: (a) => a.alcohol === "daily" || a.alcohol === "3-4wk",
    headline: "Частый алкоголь нарушает сон, гормоны и клеточное восстановление",
    detail: "Алкоголь ломает структуру сна (особенно стадии, в которых мозг разгружается), повышает гормон стресса и понемногу повреждает нервные клетки. Чем чаще - тем сильнее эффект, и не пропорционально, а быстрее.",
    actionByBarrier: {
      time: "Один бокал вечером → стакан воды с лимоном. Один конкретный ритуал.",
      energy: "Алкоголь гасит REM-сон - отсюда утренняя вялость.",
      conflicting_advice: "ВОЗ 2023: нет безопасного уровня алкоголя для здоровья.",
      motivation: "Каждый день без алкоголя - лучший HRV следующим утром.",
      dont_know_start: "Шаг 1: сегодня - будний день без алкоголя. Шаг 2: через неделю - добавьте ещё один. Цель к 4-й неделе - 0 будней с алкоголем.",
    },
    category: "general",
  },
  {
    match: (a) => a.nicotine === "sometimes",
    headline: "Нет безопасного порога: никотин повреждает сосуды даже эпизодически",
    detail: "Даже редкий никотин - это каждый раз удар по стенкам сосудов и шаг к накоплению налёта в них. Безопасной дозы нет.",
    actionByBarrier: {
      time: "Замените один эпизодический ритуал на 5-минутную прогулку.",
      energy: "Никотин снижает HRV - главный маркер стрессоустойчивости.",
      conflicting_advice: "Безопасного «немного» не бывает: сосуды реагируют на каждую дозу.",
      motivation: "Каждая пропущенная сигарета - конкретный вклад в здоровье сосудов.",
      dont_know_start: "Шаг 1: выберите одну ситуацию, в которой вы курите чаще всего раз в неделю (пятничная встреча? после большого ужина?). Просто пропустите её на этой неделе.",
    },
    category: "general",
  },
  {
    match: (a) => a.alcohol === "1-2wk",
    headline: "Алкоголь 1-2 раза в неделю нарушает качество сна",
    detail: "Даже 1-2 бокала в неделю в ночь после ломают глубокий сон - поэтому на следующий день хуже восстановление и медленнее мышление.",
    actionByBarrier: {
      time: "Попробуйте один алкогольный вечер заменить безалкогольным напитком - 2 недели.",
      energy: "Ночь без алкоголя = лучший HRV с утра.",
      conflicting_advice: "Gardiner et al., Sleep Med Rev 2025: при 2+ дозах REM значимо нарушается; при 1 бокале сильнее всего страдает вторая половина ночи.",
      motivation: "Отследите HRV утром после «алкогольной» и «чистой» ночи - разница очевидна.",
      dont_know_start: "Шаг 1 - не пить 7 дней подряд и замерить разницу самочувствия.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Токсичные привычки ускоряют клеточное старение",
    detail: "Никотин и алкоголь - самые изученные ускорители старения на клеточном уровне. Эффекты накапливаются нелинейно.",
    actionByBarrier: {
      time: "Работайте с одной ситуацией две недели.",
      energy: "Один токсичный ритуал тянет больше ресурса, чем кажется.",
      conflicting_advice: "Отказ от никотина и алкоголя - то немногое в долголетии, по чему согласны абсолютно все исследования.",
      motivation: "Маленькая победа каждый день: не вчера, а сегодня.",
      dont_know_start: "Шаг 1: всю эту неделю отмечайте - после каждого случая курения или алкоголя записывайте на 1-2 слова, что было до. К концу недели увидите свои самые частые поводы.",
    },
    category: "general",
  },
];

const SLEEP_SNIPPETS_EN: Snippet[] = [
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h < 5; },
    headline: "Critical sleep debt - under 5 hours",
    detail: "Less than 5 hours of sleep is not «a bit tired». Growth hormone drops, the brain clears its own metabolic waste worse, the body handles blood sugar worse. And «catching up on weekends» does not compensate — sleep debt accumulates.",
    actionByBarrier: {
      time: "Tonight - to bed 30 minutes earlier. That is all.",
      energy: "Sleep loss drains your energy. One step: phone out of the room an hour before bed.",
      conflicting_advice: "Prather et al., Sleep 2015: at <6 h of sleep, cold risk is 4× higher. Target — 7+ h.",
      motivation: "First win - 14 nights in a row at 6.5+ h. Mark every one.",
      dont_know_start: "Tonight, in bed by 11 PM - and the same for 7 days in a row. After a week shift to 10:30 PM. That is enough for now.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 7 && h <= 9 && (a.bedtime === "after05" || a.bedtime === "04-05" || a.bedtime === "03-04"); },
    headline: "Sleep shifted into the day - disrupted rhythm",
    detail: "Even if you sleep 8 hours but go to bed after 3 AM — your internal clock is constantly off. It's like living with mild jetlag every day: metabolism, immunity and thinking all suffer.",
    actionByBarrier: {
      time: "Shift bedtime 15 min earlier every 3 days - that is enough.",
      energy: "Bright light right after waking up speeds up the rhythm reset.",
      conflicting_advice: "The sleep hormone (melatonin) is most strongly produced in darkness up to roughly 2 AM.",
      motivation: "Every night with bedtime «before 1 AM» is a small win over jetlag.",
      dont_know_start: "Week 1 - in bed no later than 3 AM. Week 2 - no later than 2. Week 3 - no later than 1.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 5 && h < 6; },
    headline: "5-6 hours of sleep - chronic recovery deficit",
    detail: "At 5-6 hours, deep sleep gets cut short — that is exactly when the body recovers and the immune system runs at full capacity. You get used to the shortage subjectively — but memory and metabolism really do suffer.",
    actionByBarrier: {
      time: "Add 30 min: go to bed half an hour earlier for 14 nights in a row.",
      energy: "Sleep is the main generator of energy. 30 min invested pays back across the whole next day.",
      conflicting_advice: "AASM, WHO, NIH all agree: 7 hours minimum for adults.",
      motivation: "Track HRV in the morning - in 2 weeks you'll see the difference.",
      dont_know_start: "Tonight - leave the phone outside the bedroom an hour before sleep. In 7 days you'll see the difference, then the next step.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 6 && h < 7; },
    headline: "Sleep slightly below the recovery threshold",
    detail: "7-9 hours is the window that fits all the needed sleep stages. At 6-7 hours the deep stage doesn't fully unfold - the body under-recovers.",
    actionByBarrier: {
      time: "30 min earlier in bed - and 30 min more sleep with no effort.",
      energy: "30 minutes more sleep = 20% more energy in the first half of the day.",
      conflicting_advice: "7 hours is the minimum consensus across all medical organizations.",
      motivation: "14 nights of a stable schedule - and your sleep biomarkers will visibly improve.",
      dont_know_start: "One step: bedtime 30 min earlier, change nothing else.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h > 10; },
    headline: "10+ hours of sleep - a signal of quality issues",
    detail: "Sleep over 10 hours in an adult is usually a sign that the night is fragmented and the body tries to «catch up» with quantity. It's associated with elevated risk of heart problems.",
    actionByBarrier: {
      time: "A sleep tracker (even a phone) will show the structure in 2 weeks.",
      energy: "The cause of fatigue is most likely in sleep quality, not duration.",
      conflicting_advice: "Sleep length of 10+ h is not a sign of health, it's a signal to investigate.",
      motivation: "Checking ferritin and vitamin D often changes the picture dramatically.",
      dont_know_start: "For the next 2 weeks log your sleep in the app and note how you feel during the day.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 7 && (a.daytimeSleepiness === "9+" || a.daytimeSleepiness === "4-8"); },
    headline: "You sleep enough but feel drowsy in the day - a hidden issue",
    detail: "Hours of sleep look fine, but you're drowsy in the day - a signal that the night is not what it seems: maybe you wake up many times without remembering it, or there's a breathing disorder during sleep (apnea).",
    actionByBarrier: {
      time: "For the next 2 weeks track sleep with a wearable or app check-ins and note how you feel during the day.",
      energy: "Daytime caffeine masks but doesn't solve. You need the cause - not the symptom.",
      conflicting_advice: "Daytime sleepiness despite seemingly normal sleep is a medical question, not a habits one. A doctor should be involved.",
      motivation: "Knowing the cause is half the solution. 14 nights of recording.",
      dont_know_start: "For 14 nights turn on sleep recording (Apple Watch, Whoop, Oura, or just a phone app). If frequent awakenings or apnea show up - go to a sleep specialist. Don't brush it off.",
    },
    category: "general",
  },
  {
    match: (a) => a.sleepProblems === "9+" || a.sleepProblems === "4-8",
    headline: "Fragmented sleep - hours in bed, little recovery",
    detail: "Trouble falling asleep or waking up at night means your body doesn't reach the deep stages. And it's exactly in those stages that the brain clears the «waste» of daily work, memory consolidates, and growth hormone is produced.",
    actionByBarrier: {
      time: "10-min ritual: screens off, brief 4-7-8 breathing, darkness.",
      energy: "Fragmented sleep = constant fatigue. A bedtime ritual is the first step.",
      conflicting_advice: "One proven step: darkness and quiet in the bedroom. Start there.",
      motivation: "14 nights of the ritual in a row - the brain «learns» the new pattern.",
      dont_know_start: "Step 1 - phone out of the bedroom for 7 days.",
    },
    category: "general",
  },
  {
    match: (a) => a.bedtime === "01-02" || a.bedtime === "02-03",
    headline: "Late bedtime - shifted circadian rhythm",
    detail: "You sleep enough, but the sleep window is pushed into the night. Your internal clock is off — that creates a mild but constant background stress for hormones and the immune system.",
    actionByBarrier: {
      time: "Shift 15 min earlier every 3 days - no sharp discomfort.",
      energy: "Bright light right after waking is the main anchor of the circadian rhythm.",
      conflicting_advice: "One fact: a circadian shift = elevated risk of metabolic disorders.",
      motivation: "Every week of shifting is a measurable HRV gain.",
      dont_know_start: "Week 1 - bedtime 30 min earlier. Repeat until normalized.",
    },
    category: "general",
  },
];

const STRESS_SNIPPETS_EN: Snippet[] = [
  {
    match: (a) => a.foggyHours === "40+h" || a.foggyHours === "20-40h",
    headline: "Brain fog most of the week",
    detail: "Constantly elevated cortisol (the main stress hormone) drives background inflammation in the body and accelerates cellular aging. 20+ hours of «brain fog» per week is a serious signal that the nervous system is burning out.",
    actionByBarrier: {
      time: "10 min of 4-7-8 breathing in the morning. One action, measurable effect in 2 weeks.",
      energy: "Start from one anchor: 10 min of silence after lunch without your phone.",
      conflicting_advice: "One proven technique: calm breathing lowers cortisol within 4 minutes.",
      motivation: "Track fog on a 1-10 scale daily. In 2 weeks you'll see the trend.",
      dont_know_start: "Every evening, 5 minutes — write down by hand or in notes everything spinning in your head. Don't filter. The goal is to unload thoughts onto paper.",
    },
    category: "general",
  },
  {
    match: (a) => a.foggyHours === "14-20h" || a.foggyHours === "7-14h",
    headline: "Chronic overload drains the nervous system",
    detail: "Constantly high cortisol accelerates cellular aging. Internal inflammation wears out vessels and nerve cells faster.",
    actionByBarrier: {
      time: "10 min of breathing + an evening thought-dump on paper. Minimal investment.",
      energy: "One recovery anchor a day - 15 min without tasks or screens.",
      conflicting_advice: "One technique: 4-4-8 breathing (inhale 4 counts, hold 4, exhale 8). It engages the «calming» part of the nervous system - there's good science on this.",
      motivation: "Stress control is a skill. The first 14 days are the most important.",
      dont_know_start: "Step 1 - 5 min of exhale-focused meditation before bed.",
    },
    category: "general",
  },
  {
    match: (a) => a.energyPattern === "mostly_low",
    headline: "Consistently low energy is not normal",
    detail: "Consistently low energy is a signal of one of three issues: chronic stress, sleep loss, or metabolic disturbances. Often all three at once.",
    actionByBarrier: {
      time: "20 min of bright morning light rebuilds the cortisol curve in 5 days.",
      energy: "One recovery anchor: a short 20-min nap after lunch - not weakness, a method.",
      conflicting_advice: "Vitamin D and iron deficiency are common findings in chronic fatigue (Roy et al. 2014, EJCM 2025). It's the first and cheapest diagnostic step.",
      motivation: "Rate yourself 1-10 every morning. Trend visible in a week.",
      dont_know_start: "Step 1 - labs: ferritin, vitamin D, TSH. No guessing.",
    },
    category: "general",
  },
  {
    match: (a) => a.foggyHours === "3-7h",
    headline: "Brain fog 3-7 hours per week",
    detail: "Stress is still moderate - the nervous system copes, but with losses: less mental clarity, slower reactions. A good point to step in before burnout.",
    actionByBarrier: {
      time: "Two 5-minute pauses per day - step outside, no phone.",
      energy: "Cut stimulants (coffee, news) in the first half of the day.",
      conflicting_advice: "Silence is the most underrated cognitive tool.",
      motivation: "Start with one «quiet hour» per week. Expand from there.",
      dont_know_start: "Step 1 - a 15-min walk without headphones or phone.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Stress pulls more from you than it feels like",
    detail: "Even moderate stress triggers background inflammation and lowers heart rate variability (HRV) - one of the earliest signals that the nervous system is overloaded.",
    actionByBarrier: {
      time: "5 min of breathing practice before bed.",
      energy: "Rest is not inactivity, it's active recovery.",
      conflicting_advice: "One simple fact: deep breathing engages the «calming» part of the nervous system in 60 seconds.",
      motivation: "Track HRV - progress visible in 2 weeks.",
      dont_know_start: "Step 1 - 5 min of meditation in the morning, 7 days in a row.",
    },
    category: "general",
  },
];

const MOVEMENT_SNIPPETS_EN: Snippet[] = [
  {
    match: (a) => a.activeDays === "0",
    headline: "No movement - one of the strongest risk factors",
    detail: "Muscles are one of the main regulators of blood sugar. After 30, with low physical activity, a person loses on average 3-5% of muscle mass per decade — and along with it, metabolism and immune function decline.",
    actionByBarrier: {
      time: "Rule of 22: 22 min of walking a day - neutralizes the risks of 10 h of sitting.",
      energy: "Start with a 10-min walk. Movement generates energy, it doesn't spend it.",
      conflicting_advice: "One fact: 22 minutes of brisk walking a day neutralizes the harm of long sitting (Sagelv et al., BJSM 2023).",
      motivation: "First 7 days at 10 min. Then the body itself will ask for more.",
      dont_know_start: "Today - 10 minutes of brisk walking. Tomorrow - 12. In 2 weeks - that 22 minutes a day. No gyms, nothing to buy.",
    },
    category: "general",
  },
  {
    match: (a) => a.sittingHours === "8+" && a.activeDays !== "5-7",
    headline: "8+ hours sitting - important to stand up and move",
    detail: "Long sitting on its own raises the risk of early death — even if your weight is normal. The good news: it's fixable without changing your job.",
    actionByBarrier: {
      time: "Stand up every 45 min for 5 min. A timer - and nothing else.",
      energy: "Micro-movement every hour doesn't drain you, it restores energy.",
      conflicting_advice: "Sagelv et al., BJSM 2023 (meta-analysis of 4 cohorts, n=11,985): 22+ min of MVPA per day neutralizes the excess mortality risk of prolonged sitting.",
      motivation: "Mark every «stand-up» break - in a week it's a habit.",
      dont_know_start: "Right now set a phone timer for 45 minutes. When it rings - stand up, walk around, do 10 squats. Then repeat every working hour.",
    },
    category: "general",
  },
  {
    match: (a) => a.breathRecovery === "5min+_avoid" || a.breathRecovery === "3-5min",
    headline: "Reduced cardio fitness - a risk factor on its own",
    detail: "VO₂max (a measure of how well the body uses oxygen) is one of the strongest predictors of longevity. If your breathing takes more than 3 minutes to recover after effort - your heart and lungs are at low reserve right now.",
    actionByBarrier: {
      time: "10 min of light-pace walking daily already kicks off adaptation.",
      energy: "Start with slow walking. The body itself will speed up in 2-3 weeks.",
      conflicting_advice: "VO2max improves even from moderate walking - it's not a myth.",
      motivation: "Measure your pulse after stairs once a week - the progression is motivating.",
      dont_know_start: "Step 1 - 10 min of moderate-pace walking every day.",
    },
    category: "general",
  },
  {
    match: (a) => a.functionalActivities.length <= 2,
    headline: "Limited functional fitness needs attention",
    detail: "If simple everyday actions - climbing stairs, carrying bags, squatting - feel uncomfortable, your physical form is already not in order. And it weakens unnoticed.",
    actionByBarrier: {
      time: "5 min of light stretching in the morning and 10 min of walking - the entry point.",
      energy: "Functional fitness is built in small steps, not by volume.",
      conflicting_advice: "One principle: gradual load progression without pain.",
      motivation: "Mark every new activity that feels more comfortable.",
      dont_know_start: "Step 1 - stairs instead of the elevator for 5 days in a row.",
    },
    category: "general",
  },
  {
    match: (a) => a.activeDays === "1-2",
    headline: "Too little movement builds a health deficit",
    detail: "1-2 active days a week is below the WHO minimum (150 min of moderate movement). The body's reserve shrinks unnoticed.",
    actionByBarrier: {
      time: "Add one 20-minute walking block - in work hours or on lunch break.",
      energy: "A third active day per week gives a disproportionate energy lift.",
      conflicting_advice: "WHO: 150 min per week = 30% lower mortality risk.",
      motivation: "From 2 to 3 days - the fastest gain in subjective wellbeing.",
      dont_know_start: "Step 1 - schedule the third walk on your calendar right now.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Movement is working against you right now",
    detail: "Lack of movement piles up quietly. Every sedentary day is a hit to the body's reserve.",
    actionByBarrier: {
      time: "22 min of walking a day - the minimum effective dose.",
      energy: "Start with 10 min - the body will ask for more in a week.",
      conflicting_advice: "Sagelv et al., BJSM 2023 (meta-analysis of 4 cohorts, n=11,985): 22+ min of MVPA per day neutralizes the excess mortality risk of prolonged sitting.",
      motivation: "Set a 7-day goal, not a monthly one.",
      dont_know_start: "Step 1 - 10 min walk today after dinner.",
    },
    category: "general",
  },
];

const NUTRITION_SNIPPETS_EN: Snippet[] = [
  {
    match: (a) => a.processedFood === "daily",
    headline: "Daily ultra-processed food triggers an inflammatory cascade",
    detail: "Ultra-processed food (ready meals, sausages, sweet bars, soda) breaks the gut microbiome, which directly governs immunity and inflammation. High intake raises diabetes risk by 40%, heart disease by 29%, early mortality by 21% (Lane et al., BMJ 2024).",
    actionByBarrier: {
      time: "The third-of-a-plate rule: a third veggies, a third protein, a third grains. No calorie counting.",
      energy: "One swap a day: a processed snack → nuts or fruit.",
      conflicting_advice: "One principle: fewer ingredients on the label = better for the microbiome.",
      motivation: "Replace one daily product with a whole-food one. A week in a row.",
      dont_know_start: "Step 1 - remove one ultra-processed item from your daily menu.",
    },
    category: "general",
  },
  {
    match: (a) => a.veggiesFruits === "<3_week",
    headline: "Low vegetable intake depletes the microbiome and mitochondria",
    detail: "Vegetables provide fiber and natural protective compounds. Without them cells produce energy worse and clear «waste» worse - and aging accelerates.",
    actionByBarrier: {
      time: "A handful of leaves + a tomato with any meal - 30 seconds.",
      energy: "Veggies = food for mitochondria. Deficit = less energy at the cellular level.",
      conflicting_advice: "3 servings of vegetables/fruit per day - the recommendation of every dietetic body.",
      motivation: "One new vegetable in your diet each week. No pressure.",
      dont_know_start: "Step 1 - add one vegetable serving to lunch every day.",
    },
    category: "general",
  },
  {
    match: (a) => a.water === "<1l",
    headline: "Chronic dehydration slows metabolism and thinking",
    detail: "Even mild dehydration (a loss of about 2% of body mass) noticeably worsens attention, focus, and reaction (Wittbrodt & Millard-Stafford, 2018). Constant water shortage slows kidney function and the clearance of metabolic byproducts.",
    actionByBarrier: {
      time: "A glass of water in the morning and before each meal - effortless.",
      energy: "Water - cheaper and faster than any energy drink.",
      conflicting_advice: "1.5 L per day - the scientific minimum for adults at moderate activity.",
      motivation: "Water tracker on your phone + a reminder every 2 hours.",
      dont_know_start: "Step 1 - put a water bottle on your desk right now.",
    },
    category: "general",
  },
  {
    match: (a) => a.processedFood === "4-6wk",
    headline: "Frequent processed food disrupts metabolism",
    detail: "If ultra-processed food (sausages, ready sauces, sweets, soda) is on the menu 4-6 times a week — that's already enough to consistently disrupt the gut microbiome and keep the body in background inflammation.",
    actionByBarrier: {
      time: "Swap one of the 4-6 occasions for something whole-food - a concrete weekly plan.",
      energy: "Less processed food = steadier energy without crashes.",
      conflicting_advice: "Drop from 5 to 2 times a week - a measurable goal.",
      motivation: "Every swap - +1 to the week's healthy-eating tally.",
      dont_know_start: "Start with one simple step: pick 1 day a week with no ultra-processed food. On that day skip sausages, sweets, soda, ready sauces and snacks.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Your diet is working against recovery",
    detail: "A shortage of needed nutrients piles up unnoticed - it limits recovery, immunity, and clarity of thought.",
    actionByBarrier: {
      time: "Swap one snack a day: instead of cookies or chips - a handful of nuts or fruit.",
      energy: "Food is fuel. Quality of fuel = quality of energy.",
      conflicting_advice: "Three principles: whole foods, variety, enough water.",
      motivation: "One new healthy choice per day - 30 days = a new baseline.",
      dont_know_start: "Step 1 - replace one snack with nuts or fruit.",
    },
    category: "general",
  },
];

const HABITS_SNIPPETS_EN: Snippet[] = [
  {
    match: (a) => a.nicotine === "regular",
    headline: "Nicotine accelerates aging faster than almost any other factor - hundreds of studies show this.",
    detail: "Nicotine damages the inner walls of vessels and accelerates plaque buildup. According to GBD Tobacco 2021, smoking shortens healthy life by an average of 10 years.",
    actionByBarrier: {
      time: "Don't «quit» all at once - replace one specific smoking situation. Two weeks - one situation.",
      energy: "Nicotine mimics alertness, but lowers HRV and sleep quality.",
      conflicting_advice: "Doll et al. BMJ 2004: quitting before 35 returns life expectancy to that of non-smokers.",
      motivation: "Replace the situation with a 5-minute action. One new anchor habit.",
      dont_know_start: "Step 1: observe yourself for 3 days - in which situations do you reach for a cigarette most often (after meals? when nervous? in company?). Step 2: for the most frequent one - design a replacement (gum, a walk around the office, a minute of breathing). Step 3: try the swap for 7 days.",
    },
    category: "general",
  },
  {
    match: (a) => a.alcohol === "daily" || a.alcohol === "3-4wk",
    headline: "Frequent alcohol disrupts sleep, hormones, and cellular repair",
    detail: "Alcohol breaks sleep architecture (especially the stages where the brain offloads), raises the stress hormone, and gradually damages nerve cells. The more often - the stronger the effect, and not proportionally — faster.",
    actionByBarrier: {
      time: "One glass in the evening → a glass of water with lemon. One concrete ritual.",
      energy: "Alcohol blocks REM sleep - hence the morning sluggishness.",
      conflicting_advice: "WHO 2023: there is no safe level of alcohol for health.",
      motivation: "Every alcohol-free day = better HRV the next morning.",
      dont_know_start: "Step 1: today - a weekday with no alcohol. Step 2: in a week - add one more. Goal by week 4 - 0 weekdays with alcohol.",
    },
    category: "general",
  },
  {
    match: (a) => a.nicotine === "sometimes",
    headline: "There is no safe threshold: nicotine harms vessels even occasionally",
    detail: "Even rare nicotine is a hit to the vessel walls each time and a step toward plaque buildup. There is no safe dose.",
    actionByBarrier: {
      time: "Replace one occasional ritual with a 5-minute walk.",
      energy: "Nicotine lowers HRV - the main marker of stress resilience.",
      conflicting_advice: "There's no safe «a little»: vessels react to every dose.",
      motivation: "Every cigarette skipped is a concrete contribution to vessel health.",
      dont_know_start: "Step 1: pick one situation in which you smoke most often (a Friday gathering? after a big dinner?). Just skip it this week.",
    },
    category: "general",
  },
  {
    match: (a) => a.alcohol === "1-2wk",
    headline: "Alcohol 1-2 times a week still hurts sleep quality",
    detail: "Even 1-2 drinks a week break deep sleep on the night after - so the next day brings worse recovery and slower thinking.",
    actionByBarrier: {
      time: "Try replacing one alcoholic evening with a non-alcoholic drink - 2 weeks.",
      energy: "A night without alcohol = better HRV in the morning.",
      conflicting_advice: "Gardiner et al., Sleep Med Rev 2025: at 2+ drinks REM is significantly disrupted; at 1 drink the second half of the night suffers most.",
      motivation: "Track HRV the morning after an «alcohol» vs a «clean» night - the difference is obvious.",
      dont_know_start: "Step 1 - go 7 days in a row without drinking and measure the difference in how you feel.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Toxic habits accelerate cellular aging",
    detail: "Nicotine and alcohol are the most studied accelerators of aging at the cellular level. Effects accumulate non-linearly.",
    actionByBarrier: {
      time: "Work with one situation for two weeks.",
      energy: "One toxic ritual pulls more reserve than it seems.",
      conflicting_advice: "Quitting nicotine and alcohol - one of the few things in longevity that essentially every study agrees on.",
      motivation: "A small win every day: not yesterday, but today.",
      dont_know_start: "Step 1: this whole week, after every smoking or drinking event, write down 1-2 words describing what was happening before. By the end of the week you'll see your most frequent triggers.",
    },
    category: "general",
  },
];

const SNIPPETS_BY_DOMAIN: Record<DomainKey, Snippet[]> = {
  sleep: SLEEP_SNIPPETS,
  stress: STRESS_SNIPPETS,
  movement: MOVEMENT_SNIPPETS,
  nutrition: NUTRITION_SNIPPETS,
  habits: HABITS_SNIPPETS,
};

const SNIPPETS_BY_DOMAIN_EN: Record<DomainKey, Snippet[]> = {
  sleep: SLEEP_SNIPPETS_EN,
  stress: STRESS_SNIPPETS_EN,
  movement: MOVEMENT_SNIPPETS_EN,
  nutrition: NUTRITION_SNIPPETS_EN,
  habits: HABITS_SNIPPETS_EN,
};

// Advanced «next-level» tips for users with strong domains (score ≥ 80).
// Не привязаны к конкретным ответам - это general optimization layer.
interface OptimizationVariant {
  title: string;
  body: string;
  action: string;
}

const OPTIMIZATION_BY_DOMAIN: Record<DomainKey, OptimizationVariant[]> = {
  sleep: [
    {
      title: "Перейти от «высыпаюсь» к управляемому восстановлению",
      body: "На вашем уровне субъективные ощущения уже не информативны - нужна объективная динамика. HRV, время засыпания и структура сна меняются раньше, чем вы это почувствуете.",
      action: "2 недели с Oura/Whoop и ежедневной записью HRV. Одна неделя с CGM (датчик глюкозы), чтобы увидеть, как ночной сахар влияет на глубокий сон.",
    },
    {
      title: "Закрепить циркадный коридор",
      body: "Стабильность отбоя ±30 мин важнее общей длительности - она задаёт точность секреции мелатонина и кортизола. На вашем уровне вариативность времени отбоя - основной источник просадок.",
      action: "Зафиксируйте окно отбоя в пределах 30 минут на 6 недель. Замеряйте время засыпания раз в неделю - это самый чувствительный маркер.",
    },
    {
      title: "От длительности к качеству фаз",
      body: "Когда длительность стабильна, следующий шаг - структура: глубокий глубокий сон в первой половине ночи и REM во второй. Тренируется через предсонную температуру и свет.",
      action: "Снизьте температуру в спальне до 18-19 °C, темнота от 22:00. Через 2 недели сравните долю глубокого сна на трекере «до» и «после».",
    },
  ],
  stress: [
    {
      title: "От управления нагрузкой к измерению устойчивости к стрессу",
      body: "Сильная база - не гарантия от хронического стресса при росте ответственности. Нужен индикатор «запаса» до того, как он сломается.",
      action: "Раз в квартал — анализ кортизола утром, плюс измерение обычного уровня HRV раз в 2 недели. Ранний сигнал — падение утреннего HRV ≥15% от обычного уровня 3 дня подряд.",
    },
    {
      title: "Перейти от реактивного восстановления к проактивному",
      body: "На вашем уровне работает уже не «отдохнуть после стресса», а заранее заложенные точки восстановления в день. Это держит «успокаивающую» часть нервной системы в запасе.",
      action: "Зафиксируйте 2 точки в день по 10 мин: дыхание 4-7-8 утром и медленное дыхание перед сном. Через 4 недели сравните вечернюю HRV.",
    },
    {
      title: "Тонкая настройка стимуляторов",
      body: "Кофе, новости и социальные сети - основные незаметные источники стресса у людей с уже стабильной базой. Их вклад виден только в трекере.",
      action: "Кофе только до 12:00, новости - окнами по 15 мин 1-2 раза в день. Замеряйте HRV в 17:00 на 14 днях «до» и «после».",
    },
  ],
  movement: [
    {
      title: "Перейти от общей активности к целевому VO₂max",
      body: "Общие 150 мин в неделю уже есть. Следующая цель - попасть в топ-25% по VO₂max для возраста: один из сильнейших одиночных предикторов смертности (Mandsager et al., JAMA 2018).",
      action: "Замер VO₂max раз в 3 месяца (лаб. или Garmin/Apple Watch). Добавьте 2 интервальные тренировки 4×4 на максимуме в неделю - доказанный протокол прироста VO₂max на 10-15% за 10 недель.",
    },
    {
      title: "Защита мышечной массы как запаса прочности обмена веществ",
      body: "После 35 лет мышечная масса убывает 3-5% за десятилетие при отсутствии силовой нагрузки. Это главный метаболический резерв - без него падает чувствительность к инсулину.",
      action: "Один силовой день в неделю с прогрессией нагрузки. Замер состава тела (DEXA или биоимпеданс в спортзале) раз в 6 мес - отслеживаете «сухую» мышечную массу, а не вес.",
    },
    {
      title: "От объёма к восстановлению - распределение нагрузки по HRV",
      body: "На вашем уровне средняя нагрузка не даёт прироста - нужна периодизация: тяжёлые дни в дни хорошего восстановления, лёгкие - в дни высокой нагрузки. Без данных это выходит наугад.",
      action: "Привяжите нагрузку к восстановлению: HRV ниже личной нормы на 10% - лёгкий день; HRV в зелёной зоне - тяжёлая работа.",
    },
  ],
  nutrition: [
    {
      title: "От «правильно питаюсь» к персональной метаболической карте",
      body: "На общих принципах потолок быстро достигается. Индивидуальная реакция на еду отличается в 3-4 раза между людьми (Zeevi et al., Cell 2015) - обобщённые рекомендации оставляют треть потенциала на столе.",
      action: "Датчик глюкозы (CGM) на 14 дней - получаете личный список продуктов на которые сахар не скачет. Панель раз в 6 мес: hs-CRP, ApoB, HbA1c, ALT, омега-3 индекс.",
    },
    {
      title: "Микронутриентный аудит",
      body: "При хорошем рационе всё ещё бывают незаметные дефициты - ферритин, витамин D, B12, магний. Они не дают симптомов до критики, но ограничивают восстановление и когнитивные функции.",
      action: "Раз в 6 мес - ферритин, 25(OH)D, B12, магний. При сниженном - короткие курсы, не курсами БАДов.",
    },
    {
      title: "Тайминг и состав, а не калории",
      body: "На вашем уровне калорийность обычно в порядке. Следующий шаг - структура приёмов пищи: окно еды, белок утром, клетчатка с каждым приёмом.",
      action: "Окно питания 10-12 часов (например, 9:00-19:00), 25-30 г белка с завтраком, 30+ г клетчатки в день. Замеряйте вечернюю глюкозу через 2 недели.",
    },
  ],
  habits: [
    {
      title: "Зафиксировать защищённый статус",
      body: "Алкоголь и никотин под контролем - вклад, который накапливается годами. Задача - не дать режиму сорваться в трудные периоды.",
      action: "Раз в квартал делайте 30-дневный аудит: алкоголь, никотин, каннабис и снотворные. Любой рост частоты или дозы в 2+ раза от вашей нормы - ранний сигнал.",
    },
    {
      title: "Социальные триггеры - ранний контур защиты",
      body: "Срывы обычно случаются не из-за желания, а из-за обстановки: новые компании, командировки, отпуск. У вас это главный риск.",
      action: "Заранее продумайте 1 привычку-замену для каждой трудной ситуации. Альтернативный напиток на ужине, ритуал прогулки вместо перекура.",
    },
    {
      title: "Переход от «ноль» к восстановлению клеток",
      body: "Ноль никотина и минимум алкоголя - лучшее, что вы могли сделать. Следующий слой - первые сигналы восстановления по анализам (hs-CRP, FEV1, эластичность сосудов).",
      action: "Раз в год - hs-CRP, спирометрия (FEV1) и проба пульса на восстановление. Это даёт объективную картину прогресса восстановления, не только субъективное «лучше дышу».",
    },
  ],
};

const OPTIMIZATION_TITLE_EN: Record<string, string> = {
  "Перейти от «высыпаюсь» к управляемому восстановлению": "From \"I get enough sleep\" to managed recovery",
  "Закрепить циркадный коридор": "Lock in a circadian window",
  "От длительности к качеству фаз": "From duration to sleep-stage quality",
  "От управления нагрузкой к измерению устойчивости к стрессу": "From coping with load to measuring stress resilience",
  "Перейти от реактивного восстановления к проактивному": "From reactive recovery to proactive recovery",
  "Тонкая настройка стимуляторов": "Fine-tuning stimulants (caffeine, news, feeds)",
  "Перейти от общей активности к целевому VO₂max": "From general activity to a VO₂max target",
  "Защита мышечной массы как запаса прочности обмена веществ": "Protecting muscle as metabolic reserve",
  "От объёма к восстановлению - распределение нагрузки по HRV": "From volume to recovery - pacing load with HRV",
  "От «правильно питаюсь» к персональной метаболической карте": "From \"I eat well\" to a personal metabolic map",
  "Микронутриентный аудит": "Micronutrient audit",
  "Тайминг и состав, а не калории": "Timing and composition, not calories",
  "Зафиксировать защищённый статус": "Lock in your protected baseline",
  "Социальные триггеры - ранний контур защиты": "Social triggers - an early guardrail",
  "Переход от «ноль» к восстановлению клеток": "From zero exposure to signs of cellular recovery",
};

const OPTIMIZATION_BY_DOMAIN_EN: Record<DomainKey, OptimizationVariant[]> = {
  sleep: [
    {
      title: "From \"I get enough sleep\" to managed recovery",
      body: "At your level subjective feel is no longer informative — you need objective dynamics. HRV, sleep onset, and sleep architecture shift before you'll feel it.",
      action: "2 weeks with Oura/Whoop and daily HRV logging. One week with a CGM (glucose sensor) to see how nighttime glucose affects deep sleep.",
    },
    {
      title: "Lock in a circadian window",
      body: "Bedtime stability of ±30 min matters more than total duration — it sets the precision of melatonin and cortisol release. At your level, bedtime variability is the main source of dips.",
      action: "Lock your bedtime window to a 30-minute span for 6 weeks. Measure sleep onset weekly — it's the most sensitive marker.",
    },
    {
      title: "From duration to sleep-stage quality",
      body: "Once duration is stable, the next step is structure: deep sleep in the first half of the night and REM in the second. It's trained via pre-sleep temperature and light.",
      action: "Drop bedroom temperature to 18-19 °C, darkness from 10 PM. After 2 weeks compare the deep-sleep share on your tracker «before» vs «after».",
    },
  ],
  stress: [
    {
      title: "From coping with load to measuring stress resilience",
      body: "A strong baseline is no guarantee against chronic stress as responsibility grows. You need an indicator of «reserve» before it breaks.",
      action: "Quarterly — morning cortisol test, plus measuring your usual HRV level every 2 weeks. Early signal — morning HRV ≥15% below your baseline for 3 days in a row.",
    },
    {
      title: "From reactive recovery to proactive recovery",
      body: "At your level «rest after stress» no longer works — pre-built recovery anchors during the day do. They keep the «calming» part of the nervous system in reserve.",
      action: "Lock in 2 daily anchors of 10 min: 4-7-8 breathing in the morning and slow breathing before bed. After 4 weeks compare evening HRV.",
    },
    {
      title: "Fine-tuning stimulants (caffeine, news, feeds)",
      body: "Coffee, news and social media are the main hidden sources of stress for people with an already stable baseline. Their contribution shows only on the tracker.",
      action: "Coffee only before noon, news in 15-min windows 1-2 times a day. Measure HRV at 5 PM for 14 days «before» vs «after».",
    },
  ],
  movement: [
    {
      title: "From general activity to a VO₂max target",
      body: "The general 150 min per week are already there. The next target — make it into the top-25% of VO₂max for your age: one of the strongest single predictors of mortality (Mandsager et al., JAMA 2018).",
      action: "VO₂max measurement every 3 months (lab or Garmin/Apple Watch). Add 2 interval sessions of 4×4 at maximum per week — proven to lift VO₂max by 10-15% in 10 weeks.",
    },
    {
      title: "Protecting muscle as metabolic reserve",
      body: "After 35, muscle mass declines 3-5% per decade without strength work. It's the main metabolic reserve — without it, insulin sensitivity drops.",
      action: "One strength day a week with progressive load. Body-composition measurement (DEXA or gym bioimpedance) every 6 months — track «lean» mass, not weight.",
    },
    {
      title: "From volume to recovery — pacing load with HRV",
      body: "At your level, average load no longer drives gains — you need periodization: hard days on good-recovery days, easy ones on high-load days. Without data this is guesswork.",
      action: "Tie load to recovery: HRV 10% below your personal baseline — easy day; HRV in the green zone — hard work.",
    },
  ],
  nutrition: [
    {
      title: "From \"I eat well\" to a personal metabolic map",
      body: "On general principles you hit a ceiling fast. Individual response to food varies 3-4× between people (Zeevi et al., Cell 2015) — generic advice leaves a third of the potential on the table.",
      action: "CGM (glucose sensor) for 14 days — get a personal list of foods that don't spike your sugar. Panel every 6 months: hs-CRP, ApoB, HbA1c, ALT, omega-3 index.",
    },
    {
      title: "Micronutrient audit",
      body: "Even on a good diet, hidden deficiencies happen — ferritin, vitamin D, B12, magnesium. They give no symptoms until critical, but limit recovery and cognition.",
      action: "Every 6 months — ferritin, 25(OH)D, B12, magnesium. If reduced — short courses, not long supplement runs.",
    },
    {
      title: "Timing and composition, not calories",
      body: "At your level calories are usually fine. The next step is meal structure: feeding window, protein in the morning, fiber with every meal.",
      action: "Feeding window 10-12 hours (e.g. 9:00-19:00), 25-30 g protein with breakfast, 30+ g fiber per day. Measure evening glucose after 2 weeks.",
    },
  ],
  habits: [
    {
      title: "Lock in your protected baseline",
      body: "Alcohol and nicotine under control — a contribution that compounds over years. The task is to keep the regimen from slipping in tough periods.",
      action: "Quarterly do a 30-day audit: alcohol, nicotine, cannabis and sleep aids. Any 2× rise in frequency or dose vs your baseline is an early signal.",
    },
    {
      title: "Social triggers — an early guardrail",
      body: "Relapses usually happen not because of desire, but because of the setting: new groups, business trips, vacations. For you this is the main risk.",
      action: "Pre-build one habit-replacement for each tough situation. An alternative drink at dinner, a walk ritual instead of a smoke break.",
    },
    {
      title: "From zero exposure to signs of cellular recovery",
      body: "Zero nicotine and minimal alcohol — the best you could have done. The next layer is the first signs of recovery in the labs (hs-CRP, FEV1, vascular elasticity).",
      action: "Once a year — hs-CRP, spirometry (FEV1) and a pulse-recovery test. This gives an objective picture of recovery progress, not just a subjective «I breathe easier».",
    },
  ],
};

export function pickOptimizationForDomain(
  domainKey: DomainKey,
  score: ScoreResult,
  answers: Answers,
): OptimizationVariant {
  const seed = variantSeed(score, answers) + "|opt:" + domainKey;
  const map = getLang() === "en" ? OPTIMIZATION_BY_DOMAIN_EN : OPTIMIZATION_BY_DOMAIN;
  return pickVariant(map[domainKey], seed);
}

const OPTIMIZATION_EVIDENCE: Record<DomainKey, string> = {
  sleep: "Walker, Why We Sleep (2017) + Sleep Foundation 2023 meta-analysis: субъективная оценка сна коррелирует с объективной всего на r=0.3.",
  stress: "Task-Force HRV Standard 1996; Thayer & Lane 2009: обычный уровень HRV - наиболее чувствительный non-invasive маркер autonomic balance.",
  movement: "Mandsager et al., JAMA Netw Open 2018 (n=122 000): VO₂max - сильнейший одиночный предиктор all-cause mortality, сильнее курения и диабета.",
  nutrition: "Zeevi et al., Cell 2015; PREDICT study 2020 (n=1100): индивидуальный гликемический отклик на один и тот же продукт варьируется в ≥3× между людьми.",
  habits: "Sinha et al., Biological Psychiatry 2011: стресс-индуцированный возврат к алкоголю фиксируется задолго до осознанного желания - нужны внешние sensors.",
};

const OPTIMIZATION_EVIDENCE_EN: Record<DomainKey, string> = {
  sleep: "Walker, Why We Sleep (2017) + Sleep Foundation 2023 meta-analysis: subjective sleep ratings correlate with objective ones at only r=0.3.",
  stress: "Task-Force HRV Standard 1996; Thayer & Lane 2009: baseline HRV is the most sensitive non-invasive marker of autonomic balance.",
  movement: "Mandsager et al., JAMA Netw Open 2018 (n=122,000): VO₂max is the strongest single predictor of all-cause mortality — stronger than smoking or diabetes.",
  nutrition: "Zeevi et al., Cell 2015; PREDICT study 2020 (n=1,100): individual glycemic response to the same food varies ≥3× between people.",
  habits: "Sinha et al., Biological Psychiatry 2011: stress-induced return to alcohol is detectable long before the conscious urge — external sensors are needed.",
};

const EVIDENCE_BY_DOMAIN: Record<DomainKey, string> = {
  sleep: "Cappuccio et al., Sleep 2010 (метаанализ 16 когорт, 1.4 млн человек): 7-9 ч - зона минимального риска смерти от всех причин; отклонение в любую сторону повышает риск на 12-35%.",
  stress: "Epel et al., PNAS 2004 (совместно с лаб. Elizabeth Blackburn, Нобелевская премия 2009): у людей с высоким хроническим стрессом теломеры соответствовали +9-17 годам дополнительного биологического старения.",
  movement: "Sagelv et al., BJSM 2023 (мета-анализ 4 когорт, n=11985): 22+ мин MVPA в день нейтрализуют избыточный риск смертности от длительного сидения.",
  nutrition: "Lane et al., BMJ 2024 (зонтичный обзор 45 метаанализов): высокое потребление ультра-обработанных продуктов связано с ростом риска диабета 2 типа на 40%, сердечно-сосудистых событий на 29%, ранней смерти от всех причин на 21%.",
  habits: "GBD Tobacco Collaborators, Lancet 2021 (195 стран): курение сокращает ожидаемую продолжительность здоровой жизни в среднем на 10 лет. Doll et al., BMJ 2004: отказ до 35 лет возвращает ожидаемую продолжительность жизни к уровню никогда не куривших.",
};

const EVIDENCE_BY_DOMAIN_EN: Record<DomainKey, string> = {
  sleep: "Cappuccio et al., Sleep 2010 (meta-analysis of 16 cohorts, 1.4M people): 7-9 h is the zone of minimum all-cause mortality risk; deviation in either direction raises risk by 12-35%.",
  stress: "Epel et al., PNAS 2004 (with the lab of Elizabeth Blackburn, Nobel 2009): people with high chronic stress had telomeres equivalent to +9-17 years of additional biological aging.",
  movement: "Sagelv et al., BJSM 2023 (meta-analysis of 4 cohorts, n=11,985): 22+ min of MVPA per day neutralizes the excess mortality risk from prolonged sitting.",
  nutrition: "Lane et al., BMJ 2024 (umbrella review of 45 meta-analyses): high intake of ultra-processed foods is linked to a 40% rise in type 2 diabetes risk, 29% in cardiovascular events, and 21% in all-cause early mortality.",
  habits: "GBD Tobacco Collaborators, Lancet 2021 (195 countries): smoking shortens healthy life expectancy by an average of 10 years. Doll et al., BMJ 2004: quitting before 35 returns life expectancy to the level of never-smokers.",
};

// ──────────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────────

/** Стабильный детерминированный выбор варианта на основе строкового ключа. */
function pickVariant<T>(variants: T[], seedKey: string): T {
  if (variants.length === 0) throw new Error("empty variants");
  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) {
    hash = ((hash << 5) - hash + seedKey.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % variants.length;
  return variants[idx];
}

function variantSeed(score: ScoreResult, answers: Answers): string {
  return [
    answers.name ?? "anon",
    answers.email ?? "",
    Math.round(score.longyScore),
    Math.round(score.yearsLifeLostTotal * 10),
    Math.round(score.agingVelocityPct * 10),
  ].join("|");
}

function plural(n: number, one: string, few: string, many: string): string {
  if (getLang() === "en") return pluralEn(Math.round(n), one, many);
  return pluralRu(Math.round(n), one, few, many);
}

function lifeYearsUnitWord(y: number): string {
  const r = Math.round(y * 10) / 10;
  const whole = Math.round(r);
  if (Math.abs(r - whole) < 0.05) return plural(whole, "год", "года", "лет");
  return "лет";
}

function formatHeadlineYears(y: number): string {
  const r = Math.round(y * 10) / 10;
  if (Math.abs(r - Math.round(r)) < 0.05) return String(Math.round(r));
  return r.toFixed(1);
}

interface HeadlineLines {
  line1: string;
  line2: string;
  line3: string;
}

type HeadlineKey =
  | "gain-excellent" | "gain-good" | "gain-other"
  | "loss-excellent" | "loss-good" | "loss-attention"
  | "loss-risk" | "loss-critical";

const HEADLINE_VARIANTS: Record<HeadlineKey, HeadlineLines[]> = {
  "gain-excellent": [
    { line1: "У вас крепкая база", line2: "Можно добрать ещё +{N} здоровых лет", line3: "через данные с устройств и точные настройки" },
    { line1: "Вы в верхних 10% по образу жизни", line2: "Резерв роста: +{N} здоровых лет", line3: "через данные с устройств и чёткий план" },
    { line1: "База у вас уже работает", line2: "Следующий шаг - +{N} лет", line3: "по методологии Longy" },
  ],
  "gain-good": [
    { line1: "Сильная база с запасом", line2: "Можно добрать +{N} здоровых лет", line3: "через работу с вашими данными" },
    { line1: "Большинство факторов уже на вашей стороне", line2: "Можно добрать +{N} лет здоровой жизни", line3: "если усилить 2-3 ключевые точки" },
    { line1: "Хороший фундамент - есть запас", line2: "+{N} лет здоровья ещё доступны", line3: "через работу с вашими данными в Longy" },
  ],
  "gain-other": [
    { line1: "Базовые факторы в норме", line2: "Можно добрать ещё +{N} лет", line3: "через точечную настройку с Longy" },
    { line1: "Образ жизни не тянет вниз", line2: "Резерв роста: +{N} здоровых лет", line3: "через данные с трекеров и точную настройку" },
    { line1: "Серьёзных факторов риска нет", line2: "+{N} лет - следующая планка", line3: "через тонкую работу с метриками" },
  ],
  "loss-excellent": [
    { line1: "База крепкая, но есть пара слабых мест", line2: "Они «стоят» вам ≈{Y} {YW} здоровой жизни", line3: "- и закрываются за 4-8 недель" },
    { line1: "Большинство факторов на вашей стороне", line2: "≈{Y} {YW} ещё «утекают» через 1-2 точки", line3: "- возвращаются легче, чем кажется" },
    { line1: "Сильная база с одной слабой точкой", line2: "≈{Y} {YW} здоровой жизни ещё можно вернуть", line3: "Разбираем на следующих страницах" },
  ],
  "loss-good": [
    { line1: "Хороший фундамент, есть точечные потери", line2: "≈{Y} {YW} - такова цена образа жизни сейчас", line3: "- это обратимо за 8 недель" },
    { line1: "Образ жизни в основном работает на вас", line2: "Но ≈{Y} {YW} ещё теряется", line3: "Показываем где именно" },
    { line1: "Хорошая база с парой нюансов", line2: "Цена - ≈{Y} {YW} здоровой жизни", line3: "- и они закрываются точечно" },
  ],
  "loss-attention": [
    { line1: "Несколько факторов копят дефицит", line2: "Сейчас это ≈{Y} {YW} здоровой жизни", line3: "- но фундамент пока стабильный, разворот возможен" },
    { line1: "Образ жизни в зоне внимания", line2: "Текущая цена - ≈{Y} {YW}", line3: "- разбираем три главные точки и план на 4 недели" },
    { line1: "Несколько факторов работают против вас", line2: "Вместе - ≈{Y} {YW} здоровой жизни", line3: "Всё начинается с одного изменения" },
  ],
  "loss-risk": [
    { line1: "Ваш образ жизни «стоит» вам", line2: "≈{Y} {YW} здоровой жизни - но это обратимо", line3: "" },
    { line1: "Организм стареет быстрее паспортного возраста", line2: "Текущая цена - ≈{Y} {YW}", line3: "- и она снижается за 8-12 недель работы" },
    { line1: "Сразу несколько факторов риска работают одновременно", line2: "Они отнимают ≈{Y} {YW} здоровой жизни", line3: "Большую часть можно вернуть за 2-3 месяца" },
  ],
  "loss-critical": [
    { line1: "Текущий образ жизни заметно ускоряет старение", line2: "Цена - ≈{Y} {YW} здоровой жизни", line3: "- но ключевые факторы развернутся за 8-16 недель" },
    { line1: "Эти факторы вместе ускоряют ваше старение на ≈{Y} {YW}.", line2: "", line3: "Несколько важных изменений - и движение пойдёт обратно." },
    { line1: "Это крупный, но управляемый разворот", line2: "≈{Y} {YW} - такова цена сейчас", line3: "- Longy ведёт по шагам, простыми задачами и рекомендациями." },
  ],
};

/**
 * Три строки для PDF: в одном Text кириллица + цифры давали «наложение» глифов.
 * LOSS-ветка пишет «теряете X», GAIN-ветка пишет «можете добрать +N».
 */
export function verdictLifeYearsHeadlineLines(
  score: ScoreResult,
  _answers: Answers,
): string[] | null {
  // Две ветки строго по longyScore (через isGainBranch ≥ 90):
  //   gain (90+)  → "У вас крепкая база / Можно добрать ещё +N..."
  //   loss (<90)  → "Ваш образ жизни «стоит» вам / ≈N лет / но это обратимо"
  if (score.isGainBranch) {
    const n = Math.max(4, Math.round(score.gainPotentialYears));
    if (getLang() === "en") {
      return [
        "Your baseline is already strong",
        `You can still gain about +${n} healthy years`,
        "through precision data and fine-tuning",
      ];
    }
    const yw = plural(n, "год", "года", "лет");
    return [
      "У вас крепкая база",
      `Можно добрать ещё +${n} ${yw} здоровой жизни`,
      "через данные с устройств и точные настройки",
    ];
  }

  const y = score.yearsLifeLostTotal;
  if (y < 0.05) return null;
  const yFmt = formatHeadlineYears(y);
  if (getLang() === "en") {
    return [
      "Your lifestyle is costing you",
      `≈${yFmt} ${pluralEn(Math.round(y), "year", "years")} of healthy life`,
      "but it is reversible",
    ];
  }
  const yw = lifeYearsUnitWord(y);
  return [
    "Ваш образ жизни «стоит» вам",
    `≈${yFmt} ${yw} здоровой жизни`,
    "— но это обратимо",
  ];
}

/**
 * Одна строка для CLI summary: «стоит» N лет / ветка gain (модель Li et al.).
 */
export function terminalSummaryLifestyleOneLiner(score: ScoreResult): string {
  if (getLang() === "en") {
    if (score.isGainBranch) {
      const n = Math.max(1, Math.round(score.gainPotentialYears));
      const yw = pluralEn(n, "year", "years");
      return `You have a strong baseline - the model suggests you can still add ≈+${n} ${yw} of healthy life`;
    }
    const y = score.yearsLifeLostTotal;
    if (y < 0.05) return "By the model, almost no healthy-life years are being lost";
    const yStr = formatHeadlineYears(y);
    const fractional = Math.abs(y - Math.round(y)) >= 0.05;
    const yearPhrase = fractional ? `${yStr} years` : `${yStr} ${pluralEn(Math.round(y), "year", "years")}`;
    return `Your lifestyle is "costing" you ≈${yearPhrase} of healthy life - but it is reversible`;
  }
  if (score.isGainBranch) {
    const n = Math.max(1, Math.round(score.gainPotentialYears));
    const yw = plural(n, "год", "года", "лет");
    return `У вас сильная база - по модели можно добрать ещё +${n} ${yw} здоровой жизни.`;
  }
  const y = score.yearsLifeLostTotal;
  if (y < 0.05) return "По модели потерь здоровых лет почти нет.";
  const Y = formatHeadlineYears(y);
  const yw = lifeYearsUnitWord(y);
  return `Ваш образ жизни «стоит» вам ≈${Y} ${yw} здоровой жизни - но это обратимо`;
}

export function yearsLostLineFromDomain(d: DomainScore): string {
  const y = d.yearsLifeLost;
  // Минимальный отображаемый вклад - 0.5 года; ниже считаем малозначимым.
  if (y < 0.5) return tr("Менее 0.5 года - незначительный вклад", "Less than 0.5 year - negligible contribution");
  return tr(
    `Минус ≈${y.toFixed(1)} ${lifeYearsUnitWord(y)} здоровой жизни`,
    `Minus ≈${y.toFixed(1)} ${pluralEn(Math.round(y), "year", "years")} of healthy life`,
  );
}

// ──────────────────────────────────────────────────────────────
// BUILD FUNCTIONS
// ──────────────────────────────────────────────────────────────

export function buildAccelerators(answers: Answers, score: ScoreResult): AcceleratorInsight[] {
  const tone = reportTone(score);
  const isEn = getLang() === "en";

  if (tone === "optimize") {
    // Top-3 strongest domains get optimization-tier content (next-level biomarkers / training).
    const top = [...Object.values(score.domains)]
      .sort((a, b) => b.score0to100 - a.score0to100)
      .slice(0, 3);
    return top.map((d) => {
      // pickOptimizationForDomain уже возвращает EN-версию при getLang === "en"
      const opt = pickOptimizationForDomain(d.key, score, answers);
      return {
        key: d.key,
        headline: opt.title,
        detail: opt.body,
        yearsLostEstimate: tr(
          `${d.score0to100}/100 - выйти на следующий уровень`,
          `${d.score0to100}/100 - move to the next level`,
        ),
        action: opt.action,
        evidence: isEn ? OPTIMIZATION_EVIDENCE_EN[d.key] : OPTIMIZATION_EVIDENCE[d.key],
      };
    });
  }

  return score.topThree.map((d) => {
    // Снипеты подбираем из языкозависимого списка - всё уже на нужном языке.
    const snippets = isEn ? SNIPPETS_BY_DOMAIN_EN[d.key] : SNIPPETS_BY_DOMAIN[d.key];
    const raw = snippets.find((s) => s.match(answers)) ?? snippets[snippets.length - 1];
    const conditions = answers.conditions ?? [];
    const barrier = answers.barrier ?? "";
    const adapted = applyGuardrails(raw, conditions, barrier);

    return {
      key: d.key,
      headline: adapted.headline,
      detail: adapted.detail,
      yearsLostEstimate: yearsLostLineFromDomain(d),
      action: adapted.action,
      evidence: isEn ? EVIDENCE_BY_DOMAIN_EN[d.key] : EVIDENCE_BY_DOMAIN[d.key],
    };
  });
}

export interface MaintenanceTip {
  key: DomainKey;
  label: string;
  tip: string;
}

const MAINTENANCE: Record<DomainKey, MaintenanceTip> = {
  sleep: {
    key: "sleep",
    label: "Качество сна",
    tip: "Постоянное время отбоя ±30 мин важнее длительности. Трекинг HRV выявляет спады качества раньше, чем вы их почувствуете.",
  },
  stress: {
    key: "stress",
    label: "Ментальный ресурс",
    tip: "10-минутные паузы на восстановление в течение дня предотвращают накопление кортизола. Падение HRV 3+ дня подряд - ранний сигнал перегруза.",
  },
  movement: {
    key: "movement",
    label: "Движение",
    tip: "Один силовой день в неделю защищает мышечную массу - главный метаболический резерв после 35. Разнообразие нагрузок важнее объёма.",
  },
  nutrition: {
    key: "nutrition",
    label: "Питание",
    tip: "Раз в полгода - ферритин, витамин D, B12. Дефициты накапливаются незаметно даже при хорошем рационе. Держите структуру тарелки, не считайте калории.",
  },
  habits: {
    key: "habits",
    label: "Привычки",
    tip: "Главное правило: не допускайте нормализации исключений. Случайный никотин или частый алкоголь снижают порог для регулярного - держите строгий ноль.",
  },
};

export function buildMaintenanceTips(score: ScoreResult): MaintenanceTip[] {
  const result: MaintenanceTip[] = score.protectors.map((d) => MAINTENANCE[d.key]);
  const protectorKeys = new Set(score.protectors.map((d) => d.key));
  const firstWeak = score.rankedAccelerators.find((d) => !protectorKeys.has(d.key));
  if (firstWeak) result.push(MAINTENANCE[firstWeak.key]);
  return result.slice(0, 6);
}

export function buildProtectors(score: ScoreResult): ProtectorInsight[] {
  const TEMPLATES: Record<DomainKey, ProtectorInsight> = {
    sleep: {
      key: "sleep",
      headline: "Сон работает на вас",
      detail: "Стабильный режим и достаточная длительность - один из ключевых факторов модели Li et al. 2024. У вас эта основа уже есть.",
    },
    stress: {
      key: "stress",
      headline: "Стресс в управляемом коридоре",
      detail: "Вы держите нагрузку в пределах, не запускающих хроническое воспаление. Это напрямую защищает теломеры (Epel & Blackburn, PNAS 2004).",
    },
    movement: {
      key: "movement",
      headline: "Движение - часть вашей жизни",
      detail: "Регулярная активность ассоциирована с уменьшением риска хронических заболеваний и увеличением здоровых лет жизни (Li et al. 2024).",
    },
    nutrition: {
      key: "nutrition",
      headline: "Рацион на стороне долголетия",
      detail: "Преобладание цельных продуктов, достаточно овощей, минимум ультра-обработанного - снижает риск воспалительных заболеваний (Lane et al. BMJ 2024).",
    },
    habits: {
      key: "habits",
      headline: "Без токсичных якорей",
      detail: "Отсутствие никотина и минимум алкоголя - один из крупнейших вкладов в биологический возраст (GBD Tobacco 2021).",
    },
  };
  const TEMPLATES_EN: Record<DomainKey, ProtectorInsight> = {
    sleep: {
      key: "sleep",
      headline: "Sleep is working for you",
      detail: "A stable schedule and sufficient duration is one of the key factors in the Li et al. 2024 model. You already have that foundation.",
    },
    stress: {
      key: "stress",
      headline: "Stress is in a manageable corridor",
      detail: "You hold the load within limits that don't trigger chronic inflammation. That directly protects telomeres (Epel & Blackburn, PNAS 2004).",
    },
    movement: {
      key: "movement",
      headline: "Movement is part of your life",
      detail: "Regular activity is associated with lower chronic disease risk and more healthy years of life (Li et al. 2024).",
    },
    nutrition: {
      key: "nutrition",
      headline: "Diet on the side of longevity",
      detail: "A whole-food bias, enough vegetables, minimal ultra-processed — reduces the risk of inflammatory disease (Lane et al. BMJ 2024).",
    },
    habits: {
      key: "habits",
      headline: "No toxic anchors",
      detail: "No nicotine and minimal alcohol is one of the largest contributors to biological age (GBD Tobacco 2021).",
    },
  };
  const map = getLang() === "en" ? TEMPLATES_EN : TEMPLATES;
  return score.protectors.map((d) => map[d.key]);
}

// ──────────────────────────────────────────────────────────────
// HEADLINE & CTA FUNCTIONS
// ──────────────────────────────────────────────────────────────

/** Главный тезис страницы вердикта. Две ветки: LOSS (теряете X лет) и GAIN (можно добрать +N). */
export function lifeYearsHeadline(score: ScoreResult, answers: Answers): string {
  const lines = verdictLifeYearsHeadlineLines(score, answers);
  if (!lines) return tr("Потерь здоровых лет по этой модели почти не видно", "Almost no healthy-life loss is visible in this model");
  return lines.join("\n");
}

type CoverCtaTier = "minimal" | "light" | "moderate" | "substantial" | "severe";

const COVER_CTA_VARIANTS: Record<
  CoverCtaTier,
  { withDevices: string; noDevices: string }
> = {
  minimal: {
    withDevices:
      "У вас уже есть трекеры - это сильная стартовая база. Longy объединяет их данные в одну картину, добавляет нутригенетику и маркеры воспаления, и вместе с командой помогает добрать ещё 3-5 лет здоровой жизни.",
    noDevices:
      "Ваша база уже сильная. Чтобы добрать ещё 3-5 здоровых лет, Longy построит план по вашему текущему состоянию и ежедневным отметкам в приложении - а там, где станет видно, что трекер реально полезен, подскажем, какой и зачем.",
  },
  light: {
    withDevices:
      "Точечные узкие места уже видны. Мы найдём, что именно влияет на ваш сон, HRV и энергию, и предложим 2-3 протокола на ближайшие месяцы.",
    noDevices:
      "Точечные узкие места уже видны. Longy ведёт без обязательной покупки гаджетов - начнём с того, что вы можете отметить сами в приложении.",
  },
  moderate: {
    withDevices:
      "Три конкретные точки - на следующих страницах. Longy подключит ваши устройства, ваши анализы и соберёт план для вашей цели. По нашим данным, за этот срок удаётся вернуть 30-50% потерь.",
    noDevices:
      "Три конкретные точки - на следующих страницах. Longy ведёт по простым ежедневным отметкам без гаджетов. Если по ходу окажется, что трекер действительно даст эффект - подскажем какой и зачем.",
  },
  substantial: {
    withDevices:
      "Объём, который вы видите ниже, не закрыть одним «надо лучше следить за собой». Longy собирает данные с ваших устройств в общий протокол, подбирает 10-15 ключевых анализов и ведёт вас по плану с еженедельной корректировкой.",
    noDevices:
      "Объём, который вы видите ниже, требует сопровождения. Мы ведём вас в приложении Longy через ежедневные задачи и план, который корректируется под вашу цель. Через 4 недели подскажем один-два анализа, ещё через 4 - нужен ли вам трекер.",
  },
  severe: {
    withDevices:
      "Это крупный разворот. Хорошая новость - основные факторы обратимы за 8-16 недель. Мы подключим ваши трекеры и будем сопровождать вас ежедневно: задачи на день, план на месяц, корректировка под вашу цель.",
    noDevices:
      "Это крупный разворот. Хорошая новость - основные факторы обратимы. В Longy начнём с самого простого: 3 простых действия на день. Без покупок, без диет, без «надо всё сразу».",
  },
};

const COVER_CTA_VARIANTS_EN: Record<
  CoverCtaTier,
  { withDevices: string; noDevices: string }
> = {
  minimal: {
    withDevices:
      "You already have trackers — a strong starting baseline. Longy unifies their data into one picture, layers in nutrigenetics and inflammation markers, and together with the team helps you add another 3-5 healthy years.",
    noDevices:
      "Your baseline is already strong. To add another 3-5 healthy years, Longy will build a plan from your current state and your daily check-ins in the app — and once it becomes clear that a tracker would actually help, we'll tell you which one and why.",
  },
  light: {
    withDevices:
      "Specific weak spots are already visible. We'll find what exactly is affecting your sleep, HRV and energy, and suggest 2-3 protocols for the coming months.",
    noDevices:
      "Specific weak spots are already visible. Longy runs without forcing gadget purchases — we'll start with what you can log yourself in the app.",
  },
  moderate: {
    withDevices:
      "Three concrete points are on the next pages. Longy will connect your devices and your labs, and assemble a plan for your goal. In our data, 30-50% of the losses are recovered in this timeframe.",
    noDevices:
      "Three concrete points are on the next pages. Longy runs on simple daily check-ins without gadgets. If a tracker does start to make a real difference along the way — we'll tell you which one and why.",
  },
  substantial: {
    withDevices:
      "What you see below cannot be closed by «I should take better care of myself». Longy collects your device data into one protocol, picks 10-15 key labs, and walks you through a plan with weekly adjustments.",
    noDevices:
      "What you see below needs guidance. We work with you in the Longy app through daily tasks and a plan that adjusts to your goal. After 4 weeks we'll suggest one or two labs; after another 4 — whether you actually need a tracker.",
  },
  severe: {
    withDevices:
      "This is a major turnaround. The good news — the core factors are reversible in 8-16 weeks. We'll connect your trackers and walk with you daily: tasks for the day, plan for the month, adjustments toward your goal.",
    noDevices:
      "This is a major turnaround. The good news — the core factors are reversible. In Longy we'll start with the simplest version: 3 simple actions per day. No purchases, no diets, no «everything at once».",
  },
};

function coverCtaTierFor(yearsLifeLost: number): CoverCtaTier {
  if (yearsLifeLost < 0.5) return "minimal";
  if (yearsLifeLost < 2) return "light";
  if (yearsLifeLost < 4) return "moderate";
  if (yearsLifeLost < 7) return "substantial";
  return "severe";
}

export function coverCTA(score: ScoreResult, answers: Answers): string {
  const hasDevices = (answers.trackers ?? []).some(
    (t) => t !== "none" && t !== "other",
  );
  const tier = coverCtaTierFor(score.yearsLifeLostTotal);
  const map = getLang() === "en" ? COVER_CTA_VARIANTS_EN : COVER_CTA_VARIANTS;
  return map[tier][hasDevices ? "withDevices" : "noDevices"];
}

/**
 * Больше не используется в UI - старый текст про служебную шкалу убран.
 * Сигнатура сохранена, чтобы не ломать существующие импорты.
 */
export function lifeYearsModelNote(_score: ScoreResult): string {
  return "";
}

/**
 * Короткий подзаголовок для обложки PDF и шапки веб-отчёта.
 * Две ветки (LOSS / GAIN) и 5 вариантов по band - убраны формулировки
 * «не добираете», «водопад», «служебная шкала».
 */
export function coverSubtitle(score: ScoreResult): string {
  const band = score.longyScoreBand;
  const y = score.yearsLifeLostTotal;

  if (getLang() === "en") {
    // GAIN-ветка - тот же band-split, что и в RU.
    if (score.isGainBranch) {
      const gain = Math.max(1, Math.round(score.gainPotentialYears));
      switch (band) {
        case "excellent":
          return `You are ahead of most people your age. Below — where you can add another ~${gain} healthy years with Longy.`;
        case "good":
          return "You already have a solid baseline across all the key factors. We show where Longy can push results further through precision insights.";
        default:
          return "Core factors are in normal range. Below — a breakdown of where the result can be reinforced.";
      }
    }

    // LOSS-ветка с band-split.
    switch (band) {
      case "excellent":
      case "good":
        return `Strong baseline, but a few specific weak spots — together they "cost" ≈${y.toFixed(1)} ${pluralEn(Math.round(y), "year", "years")}. We break down the three main ones.`;
      case "attention":
        return "Several factors are accumulating a healthy-life gap. We break down the three main ones — and what to do over the next month.";
      case "risk":
        return "Several factors are creating a healthy-life gap. Below — the top-3 main drivers and where to start first.";
      case "critical":
        return "Several factors are creating a healthy-life gap. Below — the top-3 main drivers and where to start first.";
    }
  }

  // GAIN-ветка - переключение по isGainBranch (longyScore≥80, потерь<0.5)
  if (score.isGainBranch) {
    const gain = Math.max(1, Math.round(score.gainPotentialYears));
    switch (band) {
      case "excellent":
        return `Вы идёте лучше большинства людей вашего возраста. Ниже - где можно добрать ещё ~${gain} лет здоровой жизни вместе с Longy.`;
      case "good":
        return "У вас уже есть крепкая база по всем ключевым факторам. Показываем, где Longy может усилить результат за счёт точечных инсайтов.";
      default:
        return "По основным факторам всё в норме. Ниже - разбор, где можно укрепить результат.";
    }
  }

  // LOSS-ветка
  switch (band) {
    case "excellent":
    case "good":
      return `База крепкая, но есть точечные узкие места - вместе они «стоят» ≈${y.toFixed(1)} ${plural(y, "год", "года", "лет")}. Разбираем три главных.`;
    case "attention":
      return "Несколько факторов копят дефицит здоровых лет. Разбираем три главных - и что сделать в ближайший месяц.";
    case "risk":
      return "Несколько факторов создают дефицит здоровья. Ниже - топ-3 главных и с чего начать в первую очередь.";
    case "critical":
      return "Несколько факторов создают дефицит здоровья. Ниже - топ-3 главных и с чего начать в первую очередь.";
  }
}

export function longyScoreLabel(
  band: ScoreResult["longyScoreBand"],
): { label: string; tone: "accent" | "amber" | "warm" | "danger" } {
  switch (band) {
    case "excellent":
      return { label: tr("Отличный образ жизни для долголетия", "Excellent longevity lifestyle"), tone: "accent" };
    case "good":
      return { label: tr("Сильная база, есть точки роста", "Strong baseline, clear growth points"), tone: "accent" };
    case "attention":
      return { label: tr("Образ жизни в зоне внимания", "Lifestyle in the attention zone"), tone: "amber" };
    case "risk":
      return { label: tr("Несколько серьёзных факторов риска", "Several serious risk factors"), tone: "warm" };
    case "critical":
      return { label: tr("Высокий суммарный риск - нужны действия", "High combined risk - action required"), tone: "danger" };
  }
}

export function goalDomainHeadline(
  goal: Answers["goal"],
  domainKey: DomainKey | null,
  domainScore: number | null,
): { label: string; reason: string; mode: "strength" | "blocker" } | null {
  if (!goal || !domainKey) return null;
  const goalText = goalLabel(goal).toLowerCase();
  const mode: "strength" | "blocker" =
    domainScore !== null && domainScore >= 70 ? "strength" : "blocker";

  const STRENGTH: Record<DomainKey, string> = {
    sleep: tr(
      "Сон - ваш главный ресурс под эту цель. Продолжайте защищать режим.",
      "Sleep is your strongest asset for this goal. Protect consistency.",
    ),
    movement: tr(
      "Движение у вас - уже преимущество. Именно на нём держится прогресс к цели.",
      "Movement is already your advantage. It powers your progress.",
    ),
    nutrition: tr(
      "Питание работает на вас. На этом фундаменте остальные изменения дают кратный эффект.",
      "Nutrition works in your favor. It amplifies all other changes.",
    ),
    stress: tr(
      "Ментальная устойчивость - ваша сила. Пока стресс в норме, цель достигается быстрее.",
      "Mental resilience is your lever. Controlled stress means faster progress.",
    ),
    habits: tr(
      "Отсутствие вредных привычек - преимущество, которое точно нужно использовать.",
      "Low-toxin habits are a clear advantage worth leveraging.",
    ),
  };

  const BLOCKER: Record<DomainKey, string> = {
    sleep: tr(
      "Сон задаёт потолок вашей цели: гормоны роста, восстановление, толерантность к нагрузке. Без него другие усилия дают 30-40% от возможного.",
      "Sleep sets the ceiling for this goal: recovery, hormones, and load tolerance. Without it, other efforts deliver only 30-40% of potential.",
    ),
    movement: tr(
      "Уровень физической активности напрямую влияет на устойчивость движения к цели и уровень энергии.",
      "Your physical activity level directly affects how steadily you progress toward the goal and how stable your energy is.",
    ),
    nutrition: tr(
      "Без понятного режима питания остальные усилия дают 20-30% от возможного - это первый шаг.",
      "Without a nutrition baseline, other efforts yield just 20-30% of potential.",
    ),
    stress: tr(
      "Хронический кортизол блокирует жиросжигание, рост мышц и восстановление.",
      "Chronic cortisol blocks fat loss, muscle gain, and recovery.",
    ),
    habits: tr(
      "Никотин и алкоголь напрямую гасят эффект любых тренировок и диет на клеточном уровне.",
      "Nicotine and alcohol blunt the effect of training and nutrition at the cellular level.",
    ),
  };

  const reasons = mode === "strength" ? STRENGTH : BLOCKER;
  const label = mode === "strength"
    ? tr(`Ваш ресурс под цель «${goalText}»`, `Your advantage for goal: "${goalText}"`)
    : tr(`Ключ к цели «${goalText}»`, `Key blocker for goal: "${goalText}"`);

  return { label, reason: reasons[domainKey], mode };
}

export function goalLabel(goal: Answers["goal"]): string {
  switch (goal) {
    case "weight_loss": return tr("Снижение веса", "Weight loss");
    case "muscle_gain": return tr("Набор мышечной массы", "Building muscle mass");
    case "energy": return tr("Повышение энергии", "Boosting energy");
    case "nutrition": return tr("Наладить питание", "Improving nutrition");
    case "endurance": return tr("Повышение выносливости", "Increasing endurance");
    case "sleep": return tr("Улучшение качества сна", "Better sleep quality");
    case "biological_age": return tr("Снижение биологического возраста", "Reducing biological age");
    default: return tr("Общее улучшение самочувствия", "General health improvement");
  }
}

export function acceleratorColor(velocity: number): string {
  if (velocity >= 10) return "#FF4D6D";
  if (velocity >= 5) return "#FF8A5B";
  if (velocity >= 2) return "#F5C542";
  return "#7ED9D1";
}

export interface LongyFeature {
  title: string;
  tagline: string;
  description: string;
  why: string;
}

export function getLongyFeatures(): LongyFeature[] {
  return [
  {
    title: tr("Ваша команда экспертов", "Your expert team"),
    tagline: tr("Четыре специалиста в одном приложении", "Four specialists in one app"),
    description: tr(
      "Сертифицированный менеджер здоровья, AI-нутрициолог, AI-тренер, AI-терапевт работают вместе - видят полную картину и дают согласованные рекомендации. Не нужно собирать советы из разных источников и гадать, что важнее.",
      "AI nutrition coach, AI trainer, AI therapist, and health manager work together as one team, giving coordinated recommendations from a full-picture view.",
    ),
    why: tr("Обычно за это платят 4 специалистам. Здесь - всё в одном месте, каждый день.", "What usually requires four separate specialists is combined here in one daily workflow."),
  },
  {
    title: tr("Ежедневный план", "Daily plan"),
    tagline: tr("План, который переписывается каждое утро", "A plan rewritten every morning"),
    description: tr(
      "AI-тренер смотрит на ваши HRV, сон и стресс за ночь — и обновляет план на день: когда тренироваться, что есть, когда ложиться спать. Никаких жёстких расписаний.",
      "The AI trainer reads your nightly HRV, sleep, and stress signals and rewrites your day plan: training timing, meals, and sleep window, without rigid schedules.",
    ),
    why: tr(
      "Обычные программы дают 20% результата - они не учитывают, что организм отличается каждый день. Dynamic Protocol поднимает отдачу в 3-4 раза.",
      "Static programs ignore day-to-day physiology. Dynamic Protocol increases response by adapting to your real recovery state.",
    ),
  },
  {
    title: tr("Методология Longy", "Longy Methodology"),
    tagline: tr("В основе - исследование учёных из Гарварда о 12+ годах жизни", "Built on Harvard-based longevity evidence (12+ healthy years model)"),
    description: tr(
      "Longy построен на научной базе: методология разработана командой наших экспертов - биологов, реальных тренеров - на основе гарвардского исследования о факторах долголетия.",
      "Longy is science-first: the methodology is built by biologists and experienced coaches around evidence-based longevity factors.",
    ),
    why: tr("Не просто «полезные советы» - а система, которая добавляет годы здоровой жизни.", "Not generic wellness tips - a system designed to add measurable healthy years."),
  },
  ];
}

// ──────────────────────────────────────────────────────────────────────
// VELOCITY ZONE DESCRIPTION - подпись под спидометром
// ──────────────────────────────────────────────────────────────────────

// velocity здесь = потеря здоровых лет (0..12).
export function velocityZoneDescription(velocity: number): string {
  if (velocity < 1) {
    return tr(
      "Ваша стрелка - в ЗЕЛЁНОЙ зоне. Вы стареете медленнее большинства ровесников.",
      "Your needle is in the GREEN zone. You are aging slower than most peers.",
    );
  }
  if (velocity < 3) {
    return tr(
      "Ваша стрелка - в ЗОНЕ НОРМЫ. Вы в середине по возрастной группе - есть куда расти.",
      "Your needle is in the NORMAL zone. You are around the middle of your age group - with room to improve.",
    );
  }
  if (velocity < 6) {
    return tr(
      "Ваша стрелка - в ЗОНЕ ВНИМАНИЯ. Образ жизни начинает ускорять биологическое старение.",
      "Your needle is in the ATTENTION zone. Lifestyle factors are starting to accelerate biological aging.",
    );
  }
  if (velocity < 9) {
    return tr(
      "Ваша стрелка - в ЗОНЕ РИСКА. Хорошая новость - это обратимо, и начать проще, чем кажется.",
      "Your needle is in the RISK zone. Good news: this is reversible, and easier to start than it seems.",
    );
  }
  return tr(
    "Ваша стрелка - в критической зоне. Старт с Longy окупается быстрее всего именно отсюда.",
    "Your needle is in the CRITICAL zone. This is where starting with Longy pays off the fastest.",
  );
}

// ──────────────────────────────────────────────────────────────────────
// LONGY HEALTH SCORE EXPLANATION - текст со звёздочкой под карточкой Longy Health Score
// ──────────────────────────────────────────────────────────────────────

export function longyScoreExplanation(): string {
  return tr(
    "Longy Health Score - оценка вашего образа жизни от 0 до 100. Учитывает 5 факторов, сильнее всего влияющих на скорость старения по исследованию Li et al., 2024 (Harvard Medical School, n > 2 млн). Чем выше - тем медленнее ваш организм изнашивается.",
    "Longy Health Score is your lifestyle score from 0 to 100. It reflects 5 factors most strongly linked to aging pace in Li et al., 2024 (Harvard Medical School, n > 2 million). The higher your score, the slower your body wears out relative to chronological age.",
  );
}

// ──────────────────────────────────────────────────────────────────────
// ПРАВАЯ КАРТОЧКА ОБЛОЖКИ - динамическая метрика
// ──────────────────────────────────────────────────────────────────────

export interface RightCardMetric {
  type: "domain" | "body_composition";
  key: string;
  label: string;
  value: string;
  sublabel: string;
  tone: "default" | "warn" | "danger";
}

function verdictWordFor(score0to100: number): string {
  if (score0to100 >= 85) return tr("Отлично", "Excellent");
  if (score0to100 >= 70) return tr("Хорошо", "Good");
  if (score0to100 >= 55) return tr("Внимание", "Attention");
  if (score0to100 >= 40) return tr("Риск", "Risk");
  return tr("Критично", "Critical");
}

/**
 * Ярлык для карточки состава тела с учётом BMI и опциональной талии.
 * Ловит «жирного дрища» (normal BMI + большая талия) и «мускулистого»
 * (overweight BMI + нормальная талия).
 */
export function bodyCompositionLabel(
  bmi: number | null,
  bmiCategory: ScoreResult["bmiCategory"],
  waistCategory?: "normal" | "elevated" | "high" | "unknown",
): string {
  if (bmi === null) return tr("Данных недостаточно", "Insufficient data");
  const waist = waistCategory ?? "unknown";

  if (bmiCategory === "normal") {
    if (waist === "high") return tr("Скрытое абдоминальное ожирение", "Hidden abdominal obesity");
    if (waist === "elevated") return tr("Норма BMI, но талия выше оптимума", "Normal BMI, but waist is above optimal");
    return tr("В норме", "In range");
  }
  if (bmiCategory === "overweight") {
    if (waist === "high") return tr("Избыточный вес + абдоминальный жир", "Overweight + abdominal fat");
    if (waist === "normal") return tr("Избыточный вес (возможно, мышечный)", "Overweight (possibly muscular)");
    return tr("Избыточный", "Overweight");
  }
  if (bmiCategory === "obese") return tr("Ожирение", "Obesity");
  if (bmiCategory === "underweight") return tr("Ниже нормы", "Underweight");
  return tr("Требуется уточнение", "Needs clarification");
}

/**
 * Выбирает, что показать в третьей карточке обложки.
 * Если любой из 5 доменов ниже 60 - приоритет ему; иначе - состав тела.
 */
export function pickRightCardMetric(score: ScoreResult): RightCardMetric {
  const domains = Object.values(score.domains);
  const worst = domains.reduce((w, d) => (d.score0to100 < w.score0to100 ? d : w));

  if (worst.score0to100 < 60) {
    return {
      type: "domain",
      key: worst.key,
      label: worst.label,
      value: `${worst.score0to100}`,
      sublabel: verdictWordFor(worst.score0to100),
      tone: worst.score0to100 < 40 ? "danger" : "warn",
    };
  }

  const bmi = score.bmi;
  const label = bodyCompositionLabel(bmi, score.bmiCategory, score.waistCategory);
  return {
    type: "body_composition",
    key: "bmi",
    label: tr("Состав тела", "Body composition"),
    value: bmi !== null ? String(bmi) : "-",
    sublabel: label,
    tone:
      score.bmiCategory === "obese"
        ? "danger"
        : score.bmiCategory === "overweight"
          ? "warn"
          : "default",
  };
}

// ──────────────────────────────────────────────────────────────────────
// MAIN DRIVER - 5+ вариантов headline на домен для средней карточки
// ──────────────────────────────────────────────────────────────────────

export interface MainDriver {
  domain: DomainScore;
  headline: string;
  subtext: string;
}

interface MainDriverVariant {
  match: (a: Answers, d: DomainScore) => boolean;
  headline: string;
  subtext: string;
}

const MAIN_DRIVER_VARIANTS: Record<DomainKey, MainDriverVariant[]> = {
  sleep: [
    {
      match: (a) => {
        const h = computeSleepHours(a);
        return h !== null && h < 5;
      },
      headline: "Меньше 5 часов сна - хронический недосып",
      subtext: "Тело не успевает восстанавливаться",
    },
    {
      match: (a) => {
        const h = computeSleepHours(a);
        return (
          h !== null && h >= 7 && h <= 9 &&
          (a.bedtime === "after05" || a.bedtime === "04-05" || a.bedtime === "03-04")
        );
      },
      headline: "Сон сдвинут в день - режим совы",
      subtext: "Даже 8 часов с 4 утра = постоянный jetlag",
    },
    {
      match: (a) => a.sleepProblems === "9+",
      headline: "Прерывистый сон",
      subtext: "Часы есть, восстановления нет",
    },
    {
      match: (a) => a.daytimeSleepiness === "9+",
      headline: "Дневная сонливость",
      subtext: "Скрытый дефицит восстановления",
    },
    {
      match: () => true,
      headline: "Сон ниже оптимума",
      subtext: "Один из сильнейших факторов долголетия",
    },
  ],
  habits: [
    {
      match: (a) => a.nicotine === "regular",
      headline: "Регулярный никотин",
      subtext: "Самый изученный ускоритель старения",
    },
    {
      match: (a) => a.alcohol === "daily",
      headline: "Ежедневный алкоголь",
      subtext: "Бьёт по сну, гормонам и клеткам",
    },
    {
      match: (a) => a.nicotine === "sometimes",
      headline: "Эпизодический никотин",
      subtext: "Безопасного порога не существует",
    },
    {
      match: (a) => a.alcohol === "3-4wk",
      headline: "Частый алкоголь",
      subtext: "Нарушает REM-сон и восстановление",
    },
    {
      match: () => true,
      headline: "Токсичные привычки",
      subtext: "Ускоряют клеточное старение",
    },
  ],
  movement: [
    {
      match: (a) => a.activeDays === "0",
      headline: "Движения почти нет",
      subtext: "Мышцы - главный двигатель метаболизма и долголетия",
    },
    {
      match: (a) => a.sittingHours === "8+" && (a.activeDays === "0" || a.activeDays === "1-2"),
      headline: "Сидячий образ жизни",
      subtext: "8+ часов сидения не компенсируются вечером",
    },
    {
      match: (a) => a.activeDays === "1-2",
      headline: "Движения недостаточно",
      subtext: "ВОЗ-минимум - 3-4 дня в неделю",
    },
    {
      match: (a) => a.sittingHours === "8+",
      headline: "Слишком много сидите",
      subtext: "Нужны короткие активные паузы",
    },
    {
      match: () => true,
      headline: "Недостаток движения",
      subtext: "Копится дефицит здоровья",
    },
  ],
  nutrition: [
    {
      match: (a) => a.processedFood === "daily",
      headline: "Ежедневно ультра-обработанная еда",
      subtext: "Основной драйвер воспаления",
    },
    {
      match: (a) => a.veggiesFruits === "<3_week",
      headline: "Почти нет овощей и клетчатки",
      subtext: "Микробиом остаётся без топлива",
    },
    {
      match: (a) => a.water === "<1l",
      headline: "Хроническая дегидратация",
      subtext: "Замедляет метаболизм и когнитивные функции",
    },
    {
      match: (a) => a.processedFood === "4-6wk" || (a.processedFood as string) === "3-6wk",
      headline: "Обработанная еда несколько раз в неделю",
      subtext: "Воспаление накапливается постепенно",
    },
    {
      match: () => true,
      headline: "Рацион работает против восстановления",
      subtext: "Основа всех других факторов",
    },
  ],
  stress: [
    {
      match: (a) => a.foggyHours === "40+h" || a.foggyHours === "20-40h",
      headline: "Хронический ментальный туман",
      subtext: "Больше 20 часов в неделю - это уже сигнал",
    },
    {
      match: (a) => a.energyPattern === "mostly_low",
      headline: "Стабильно низкая энергия",
      subtext: "Это не норма, даже если кажется фоном",
    },
    {
      match: (a) => a.foggyHours === "14-20h" || a.foggyHours === "7-14h",
      headline: "Фрагментация фокуса",
      subtext: "Кортизол не успевает опускаться",
    },
    {
      match: (a) => a.energyPattern === "unstable",
      headline: "Энергия скачет день ко дню",
      subtext: "Признак разбалансированной нервной системы",
    },
    {
      match: () => true,
      headline: "Стресс тянет ресурс",
      subtext: "Даже умеренный фон ускоряет старение",
    },
  ],
};

const MAIN_DRIVER_VARIANTS_EN: Record<DomainKey, MainDriverVariant[]> = {
  sleep: [
    {
      match: (a) => {
        const h = computeSleepHours(a);
        return h !== null && h < 5;
      },
      headline: "Less than 5 hours of sleep — chronic deprivation",
      subtext: "Your body doesn't get the time to recover",
    },
    {
      match: (a) => {
        const h = computeSleepHours(a);
        return (
          h !== null && h >= 7 && h <= 9 &&
          (a.bedtime === "after05" || a.bedtime === "04-05" || a.bedtime === "03-04")
        );
      },
      headline: "Sleep shifted into the day — owl mode",
      subtext: "Even 8 hours starting at 4 AM = constant jetlag",
    },
    {
      match: (a) => a.sleepProblems === "9+",
      headline: "Fragmented sleep",
      subtext: "Hours in bed, but no recovery",
    },
    {
      match: (a) => a.daytimeSleepiness === "9+",
      headline: "Daytime drowsiness",
      subtext: "A hidden recovery deficit",
    },
    {
      match: () => true,
      headline: "Sleep below optimum",
      subtext: "One of the strongest longevity factors",
    },
  ],
  habits: [
    {
      match: (a) => a.nicotine === "regular",
      headline: "Regular nicotine",
      subtext: "The most studied accelerator of aging",
    },
    {
      match: (a) => a.alcohol === "daily",
      headline: "Daily alcohol",
      subtext: "Hits sleep, hormones, and cells",
    },
    {
      match: (a) => a.nicotine === "sometimes",
      headline: "Episodic nicotine",
      subtext: "There is no safe threshold",
    },
    {
      match: (a) => a.alcohol === "3-4wk",
      headline: "Frequent alcohol",
      subtext: "Disrupts REM sleep and recovery",
    },
    {
      match: () => true,
      headline: "Toxic habits",
      subtext: "Accelerate cellular aging",
    },
  ],
  movement: [
    {
      match: (a) => a.activeDays === "0",
      headline: "Almost no movement",
      subtext: "Muscle is the main engine of metabolism and longevity",
    },
    {
      match: (a) => a.sittingHours === "8+" && (a.activeDays === "0" || a.activeDays === "1-2"),
      headline: "Sedentary lifestyle",
      subtext: "8+ hours of sitting can't be undone in the evening",
    },
    {
      match: (a) => a.activeDays === "1-2",
      headline: "Not enough movement",
      subtext: "WHO minimum is 3-4 days a week",
    },
    {
      match: (a) => a.sittingHours === "8+",
      headline: "Too much sitting",
      subtext: "You need short active breaks",
    },
    {
      match: () => true,
      headline: "Insufficient movement",
      subtext: "A health deficit is building up",
    },
  ],
  nutrition: [
    {
      match: (a) => a.processedFood === "daily",
      headline: "Daily ultra-processed food",
      subtext: "The main driver of inflammation",
    },
    {
      match: (a) => a.veggiesFruits === "<3_week",
      headline: "Almost no vegetables or fiber",
      subtext: "Your microbiome is starved of fuel",
    },
    {
      match: (a) => a.water === "<1l",
      headline: "Chronic dehydration",
      subtext: "Slows metabolism and cognition",
    },
    {
      match: (a) => a.processedFood === "4-6wk" || (a.processedFood as string) === "3-6wk",
      headline: "Processed food several times a week",
      subtext: "Inflammation builds up gradually",
    },
    {
      match: () => true,
      headline: "Diet works against recovery",
      subtext: "The foundation of all other factors",
    },
  ],
  stress: [
    {
      match: (a) => a.foggyHours === "40+h" || a.foggyHours === "20-40h",
      headline: "Chronic mental fog",
      subtext: "More than 20 hours a week is already a signal",
    },
    {
      match: (a) => a.energyPattern === "mostly_low",
      headline: "Consistently low energy",
      subtext: "It's not normal, even if it feels like background",
    },
    {
      match: (a) => a.foggyHours === "14-20h" || a.foggyHours === "7-14h",
      headline: "Fragmented focus",
      subtext: "Cortisol doesn't drop in time",
    },
    {
      match: (a) => a.energyPattern === "unstable",
      headline: "Energy swings day to day",
      subtext: "A sign of an unbalanced nervous system",
    },
    {
      match: () => true,
      headline: "Stress drains your reserve",
      subtext: "Even moderate background accelerates aging",
    },
  ],
};

export function pickMainDriver(answers: Answers, score: ScoreResult): MainDriver | null {
  const top = score.topThree[0];
  if (!top) return null;
  const map = getLang() === "en" ? MAIN_DRIVER_VARIANTS_EN : MAIN_DRIVER_VARIANTS;
  const variants = map[top.key];
  const v = variants.find((x) => x.match(answers, top)) ?? variants[variants.length - 1];
  return { domain: top, headline: v.headline, subtext: v.subtext };
}

// ──────────────────────────────────────────────────────────────────────
// LONGY UNDER GOAL - «как Longy работает на вашу цель» (стр. вердикта)
// ──────────────────────────────────────────────────────────────────────

export interface LongyUnderGoal {
  bullets: [string, string, string];
  cta: string;
}

export const LONGY_UNDER_GOAL: Record<
  Exclude<Answers["goal"], "">,
  LongyUnderGoal
> = {
  weight_loss: {
    bullets: [
      "Подключаем смарт-весы - видите общую динамику, а не утренние скачки",
      "AI-нутрициолог составит план питания на ваших любимых продуктах - никаких диет",
      "Раз в неделю обновляем план: что съесть, как двигаться, сколько спать",
    ],
    cta: "За 8 недель - стабильные минус 4-7 кг и понимание, как их удерживать",
  },
  muscle_gain: {
    bullets: [
      "План тренировок под ваши возможности - без поиска «идеальной программы»",
      "Следим, хватает ли вам белка и восстановления, по данным с часов — без подсчёта граммов в каждом блюде",
      "AI-тренер смотрит на ваше восстановление за ночь и подсказывает: сегодня тяжёлая тренировка, а завтра - лёгкая",
    ],
    cta: "За 8 недель - прирост силы и сухой массы без выгорания",
  },
  energy: {
    bullets: [
      "Видим, в какие часы провалы - часто проблема не во сне, а в другом",
      "Подсказываем, что попробовать прямо сейчас: больше дневного света, поесть по-другому, сделать паузу",
      "Еженедельный отчёт: что дало эффект, что можно убрать",
    ],
    cta: "За 8 недель - стабильная энергия с утра до вечера",
  },
  nutrition: {
    bullets: [
      "Дневник питания по фото - без граммов и подсчётов",
      "AI-нутрициолог объясняет выбор, а не навязывает правила",
      "Трекинг реальных маркеров - клетчатка, белок, ультра-обработанные",
    ],
    cta: "За 8 недель - устойчивые пищевые привычки, а не новая диета",
  },
  endurance: {
    bullets: [
      "План кардио под вашу базовую форму и цель - 10 км, полумарафон или просто больше",
      "Неделя сама адаптируется, если пропустили тренировку",
      "Отслеживание VO2max и порогов через данные с часов",
    ],
    cta: "За 8 недель - устойчивый прирост выносливости без травм",
  },
  sleep: {
    bullets: [
      "Анализ с часов/кольца: глубокий сон, REM, пробуждения, HRV",
      "Ритуал отхода ко сну под ваш график, не «ложитесь в 22:00»",
      "Связь: что из дня влияет на ваш сон сильнее всего",
    ],
    cta: "За 8 недель - стабильные 7-9 часов с хорошим восстановлением",
  },
  biological_age: {
    bullets: [
      "Собирает все ваши устройства в одну картину - без ручного сопоставления",
      "Еженедельно пересчитывает биологический возраст",
      "Подскажем, какие 5-10 анализов сдать - без «прочекай всё, что есть»",
    ],
    cta: "За 8 недель - биовозраст ниже паспортного и дальнейший контроль",
  },
};

export function longyForGoalBlock(goal: Answers["goal"]): LongyUnderGoal | null {
  if (!goal) return null;
  if (getLang() === "en") {
    const map: Record<Exclude<Answers["goal"], "">, LongyUnderGoal> = {
      weight_loss: {
        bullets: [
          "We connect smart scales — you see the overall trend, not morning spikes",
          "The AI nutrition coach builds a meal plan around your favorite foods — no diets",
          "Once a week we update the plan: what to eat, how to move, how much to sleep",
        ],
        cta: "In 8 weeks — stable −4 to −7 kg, and the understanding of how to keep them off",
      },
      muscle_gain: {
        bullets: [
          "Training plan tailored to your level — no chasing the «perfect program»",
          "We track whether you're getting enough protein and recovery from wearable data — no gram counting per meal",
          "The AI coach reads your overnight recovery and tells you: hard session today, easy one tomorrow",
        ],
        cta: "In 8 weeks — strength and lean-mass gains without burnout",
      },
      energy: {
        bullets: [
          "We see exactly which hours dip — often the issue is not sleep, it's something else",
          "We suggest what to try right now: more daylight, eat differently, take a pause",
          "Weekly report: what worked, what to drop",
        ],
        cta: "In 8 weeks — steady energy from morning to evening",
      },
      nutrition: {
        bullets: [
          "Photo-based food diary — no grams, no counting",
          "The AI nutrition coach explains your choice, not enforces rules",
          "Tracking the real markers — fiber, protein, ultra-processed intake",
        ],
        cta: "In 8 weeks — durable eating habits, not another diet",
      },
      endurance: {
        bullets: [
          "Cardio plan tuned to your baseline and target — 10K, half-marathon or simply more",
          "The week auto-adjusts if you skip a workout",
          "VO2max and threshold tracking from wearable data",
        ],
        cta: "In 8 weeks — sustained endurance gains without injuries",
      },
      sleep: {
        bullets: [
          "Wearable / ring analysis: deep sleep, REM, awakenings, HRV",
          "Bedtime ritual tuned to your schedule, not «in bed by 10 PM»",
          "The link: what during the day affects your sleep the most",
        ],
        cta: "In 8 weeks — stable 7-9 hours with strong recovery",
      },
      biological_age: {
        bullets: [
          "Unifies all your devices into one picture — no manual cross-checking",
          "Recalculates biological age weekly",
          "We tell you which 5-10 labs to take — no «order everything available»",
        ],
        cta: "In 8 weeks — biological age below your passport age and a maintenance path",
      },
    };
    return map[goal];
  }
  return LONGY_UNDER_GOAL[goal];
}

// ──────────────────────────────────────────────────────────────────────
// EIGHT WEEK PROMISE - что конкретно Longy делает за 8 недель по доменам
// ──────────────────────────────────────────────────────────────────────

type EightWeekBundle = string[];

export const EIGHT_WEEK_PROMISE: Record<DomainKey, EightWeekBundle[]> = {
  habits: [
    [
      "Находим конкретные триггеры: что запускает желание",
      "AI-тренер в моменте предлагает альтернативу - не «запрет», а замену",
      "Трекинг чистых дней без навязчивости",
    ],
    [
      "Карта трудных ситуаций - социальных, эмоциональных, временных",
      "Под каждую - заготовленная привычка-замена за 5 минут",
      "HRV покажет, как тело отвечает на отказ. Прогресс - в цифрах, а не на ощущениях.",
    ],
    [
      "Постепенное снижение триггера за триггером, без давления и полного отказа",
      "Еженедельный обзор: какие моменты прошли чисто, какие - нет, без оценок",
      "К 8-й неделе - устойчивая новая база и понимание своих слабых точек",
    ],
  ],
  movement: [
    [
      "План активности под ваш график - не «час в зале», а короткие сессии в день",
      "План корректируется по HRV и сну: тяжёлые дни - отдых, сильные - прогресс",
      "22-минутный протокол для сидячей работы (Sagelv et al., BJSM 2023)",
    ],
    [
      "Базовая аэробная работа 3 раза в неделю + 1 силовой день - минимум для долголетия",
      "Замер VO₂max через часы или лестничный тест - динамика видна за 6 недель",
      "AI-тренер следит за прогрессом, чтобы тренироваться ровно столько, сколько нужно",
    ],
    [
      "От «делаю - не делаю» к структурированной неделе с микро-целями",
      "Восстановление - это часть плана, а не реакция на усталость. Отдых тогда, когда он реально нужен организму.",
      "К 8-й неделе вырабатывается привычка.",
    ],
  ],
  sleep: [
    [
      "Анализ данных устройств: где именно страдает сон",
      "Ритуал отхода ко сну под ваш график, а не «ложитесь в 22:00»",
      "Корреляция: что из дня влияет на сон сильнее всего",
    ],
    [
      "Циркадный аудит: окно света утром, отбой и подъём ±30 мин",
      "AI находит «плохие» привычки - кофеин после 14:00, экраны в кровати, поздний ужин",
      "Трекинг SWS и REM показывает реальную структуру сна, не только длительность",
    ],
    [
      "Микро-эксперименты: одна переменная меняется, результат на трекере через 3 ночи",
      "Температура спальни, свет, последний приём пищи — проверяем каждый фактор",
      "К 8-й неделе - стабильные 7-9 ч с заметным приростом восстановления",
    ],
  ],
  nutrition: [
    [
      "Дневник питания по фото - без граммов и подсчётов",
      "AI-нутрициолог объясняет выбор, не навязывает запреты",
      "Отслеживание реальных маркеров - клетчатка, белок, ультра-обработанные",
    ],
    [
      "Аудит первой недели - что фактически попадает в тарелку, без оценок",
      "Замены вместо запретов: один обработанный продукт заменяется на один цельный, неделя за неделей",
      "Окно питания 10-12 ч + 30 г клетчатки в день - две главные опоры",
    ],
    [
      "AI помогает с реальными решениями - что заказать в кафе, что купить в магазине",
      "Раз в 4 недели короткий self-audit: что приживается, что нет",
      "К 8-й неделе - устойчивые пищевые привычки, а не диета на силе воли",
    ],
  ],
  stress: [
    [
      "HRV как ранний маркер перегруза",
      "Короткие практики по 2-5 минут, встроенные в день",
      "Еженедельный отчёт: что разгружает, а что истощает",
    ],
    [
      "Карта дневных пиков стресса по данным с часов - где именно «течёт ресурс»",
      "Под каждый пик - короткий приём 2-5 мин: дыхание, прогулка, или короткая запись мыслей",
      "Через 4 недели - видимый рост вечернего HRV и качества сна",
    ],
    [
      "Аудит стимуляторов: кофе, новости, соцсети, многозадачность",
      "Окна работы и восстановления - не привычка, а структура дня",
      "К 8-й неделе - нервная система в равновесии и предсказуемая энергия",
    ],
  ],
};

const EIGHT_WEEK_PROMISE_EN: Record<DomainKey, EightWeekBundle[]> = {
  habits: [
    [
      "We find the specific triggers — what kicks off the urge",
      "The AI coach offers an alternative in the moment — not «forbidden», but a swap",
      "Tracking clean days, without nagging",
    ],
    [
      "Map of hard situations — social, emotional, time-based",
      "For each one — a pre-built 5-minute habit-replacement",
      "HRV shows how your body responds to abstinence. Progress in numbers, not feelings.",
    ],
    [
      "Gradual reduction trigger by trigger — without pressure or full abstinence",
      "Weekly review: which moments stayed clean, which didn't — without judgement",
      "By week 8 — a stable new baseline and clarity on your weak points",
    ],
  ],
  movement: [
    [
      "Activity plan tuned to your schedule — not «an hour at the gym», but short daily sessions",
      "Plan adapts to HRV and sleep: hard days — rest, strong ones — progress",
      "22-minute protocol for desk work (Sagelv et al., BJSM 2023)",
    ],
    [
      "Baseline aerobic work 3×/week + 1 strength day — the longevity minimum",
      "VO₂max measured via watch or stair test — progress visible in 6 weeks",
      "The AI coach watches your progress so you train exactly as much as needed",
    ],
    [
      "From «do/skip» to a structured week with micro-goals",
      "Recovery is part of the plan, not a reaction to fatigue. Rest when the body actually needs it.",
      "By week 8 — the habit is built.",
    ],
  ],
  sleep: [
    [
      "Wearable data analysis: where exactly your sleep suffers",
      "Bedtime ritual tuned to your schedule, not «in bed by 10 PM»",
      "The link: what during the day affects sleep the most",
    ],
    [
      "Circadian audit: morning light window, bed and wake-up ±30 min",
      "AI surfaces the «bad» habits — caffeine after 2 PM, screens in bed, late dinners",
      "Tracking SWS and REM shows the real sleep architecture, not just duration",
    ],
    [
      "Micro-experiments: change one variable, see the result on the tracker in 3 nights",
      "Bedroom temperature, light, last meal — we test every factor",
      "By week 8 — stable 7-9 h with a noticeable recovery boost",
    ],
  ],
  nutrition: [
    [
      "Photo-based food diary — no grams, no counting",
      "The AI nutrition coach explains your choice, not enforces bans",
      "Tracking the real markers — fiber, protein, ultra-processed",
    ],
    [
      "First-week audit — what actually lands on the plate, without judgement",
      "Swaps instead of bans: one processed item replaced by one whole-food, week by week",
      "Feeding window 10-12 h + 30 g fiber per day — the two main anchors",
    ],
    [
      "AI helps with real decisions — what to order at a café, what to buy at the store",
      "Every 4 weeks a short self-audit: what sticks, what doesn't",
      "By week 8 — durable eating habits, not a willpower diet",
    ],
  ],
  stress: [
    [
      "HRV as an early overload marker",
      "Short 2-5 minute practices embedded into the day",
      "Weekly report: what unloads vs what depletes",
    ],
    [
      "Map of daytime stress peaks from watch data — where exactly the «resource leaks»",
      "For each peak — a short 2-5 min technique: breath, walk, or a brief thought-dump",
      "After 4 weeks — visible rise in evening HRV and sleep quality",
    ],
    [
      "Stimulant audit: coffee, news, social media, multitasking",
      "Work and recovery windows — not a habit, a structure of the day",
      "By week 8 — nervous system in balance and predictable energy",
    ],
  ],
};

export function pickEightWeekPromise(
  domainKey: DomainKey,
  score: ScoreResult,
  answers: Answers,
): EightWeekBundle {
  const seed = variantSeed(score, answers) + "|8w:" + domainKey;
  const map = getLang() === "en" ? EIGHT_WEEK_PROMISE_EN : EIGHT_WEEK_PROMISE;
  return pickVariant(map[domainKey], seed);
}

/**
 * Переводит «лет потерь» в «биологический возраст -N лет / M мес»
 * для человекопонятной подачи прогресса.
 */
export function formatBioAgeDelta(deltaYears: number): string {
  if (deltaYears < 0.1) return tr("Первые видимые изменения биовозраста", "First visible biological age improvements");
  const totalMonths = Math.round(deltaYears * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return tr(
    `−${months} мес. биологического возраста`,
    `−${months} months of biological age`,
  );
  const yw = years === 1 ? "год" : years < 5 ? "года" : "лет";
  if (months === 0) {
    return tr(
      `−${years} ${yw} биологического возраста`,
      `−${years} ${pluralEn(years, "year", "years")} of biological age`,
    );
  }
  return tr(
    `−${years} ${yw} ${months} мес. биологического возраста`,
    `−${years} ${pluralEn(years, "year", "years")} ${months} months of biological age`,
  );
}

// ──────────────────────────────────────────────────────────────────────
// LIFE HACKS - короткие конкретные приёмы, которые легко встроить в день.
// Раздаются всем пользователям, по одному на домен; выбор по variantSeed.
// ──────────────────────────────────────────────────────────────────────

export interface LifeHack {
  title: string;
  hack: string;
  why: string;
}

const LIFE_HACKS: Record<DomainKey, LifeHack[]> = {
  sleep: [
    {
      title: "10 минут на солнце сразу после пробуждения",
      hack: "Утренний свет в первый час после сна синхронизирует внутренние часы лучше любой будильниковой системы. Прозрачные шторы открыли - и пока кофе варится, постойте у окна.",
      why: "Утренний свет (особенно прямой солнечный) останавливает выработку мелатонина и запускает дневной режим. Вечером уснёте быстрее на 15-30 минут (Wams et al., Sleep 2017).",
    },
    {
      title: "Носки на ночь - банально, но работает",
      hack: "Тёплые ноги расширяют сосуды конечностей, и тепло уходит из ядра тела. А падение температуры ядра на 0.5°C - главный сигнал для засыпания.",
      why: "В исследовании Швейцарской высшей технической школы (Krauchi, Nature 1999) согревание ног сокращало время засыпания на 7-15 минут - это сильнее, чем у большинства снотворных.",
    },
    {
      title: "Не включайте свет ночью в туалете",
      hack: "Если встали в туалет - оставьте телефон в спальне и не зажигайте яркий свет. Достаточно ночника или света из коридора. Иначе организм решит, что наступило утро.",
      why: "Даже короткая вспышка яркого света ночью гасит мелатонин на 50-80% и сдвигает циркадные часы (Zeitzer, J Physiol 2000).",
    },
    {
      title: "Прохладная спальня важнее тёплого одеяла",
      hack: "Идеальная температура для сна - 18-19°C. Если в спальне теплее - глубокая фаза сна сокращается, даже если вы не просыпаетесь.",
      why: "Температура тела должна снижаться, чтобы уснуть и оставаться в глубоком сне. Тёплая комната мешает этому процессу (Okamoto-Mizuno, JPA 2012).",
    },
    {
      title: "За 1 час до сна - никаких острых эмоций",
      hack: "Ссоры, остросюжетные сериалы, важные разговоры - всё это вкидывает кортизол. И даже если потом легли в кровать, организм ещё 30-60 минут «остывает».",
      why: "Пик кортизола после стрессового события держится 60-90 минут. В это время глубокий сон в первой трети ночи срывается (Hirotsu, Sleep Sci 2015).",
    },
  ],
  stress: [
    {
      title: "Дыхание 4-7-8: успокаивает за 60 секунд",
      hack: "Вдох носом на 4 счёта → задержка на 7 → выдох ртом на 8. Повторите 4 раза. Эффект почувствуете на втором-третьем цикле.",
      why: "Длинный выдох активирует «успокаивающую» часть нервной системы (блуждающий нерв). Это самый быстрый способ снизить пульс и кортизол (Zaccaro, Front Hum Neurosci 2018).",
    },
    {
      title: "Если разозлились - выпейте холодной воды",
      hack: "Воздействие холодной жидкости на язык активирует тот же нерв, что и медленное дыхание. Через 30 секунд пульс начнёт снижаться, через 2 минуты — почувствуете, что эмоции отпускают.",
      why: "«Diving reflex»: контакт с холодом замедляет сердце и снижает симпатический тонус - приём из доказательной DBT-терапии.",
    },
    {
      title: "Прогулка 20 минут = таблетка от тревоги",
      hack: "Лёгкая прогулка с естественным светом снимает тревогу так же сильно, как и популярные успокоительные. Особенно если ходить там, где есть деревья и трава.",
      why: "Мета-анализ 116 исследований (Schuch, Psychiatry Res 2018): эффект от ходьбы при тревожных расстройствах сопоставим с легкими антидепрессантами.",
    },
    {
      title: "Запишите тревоги - и оставьте на бумаге",
      hack: "Каждый вечер 5 минут записывайте всё, что беспокоит. Без оценки, без планов, просто список. Мозг перестаёт «прокручивать» эти мысли ночью.",
      why: "Когнитивная разгрузка работает по принципу «выгрузить из оперативной памяти». Доказано в исследованиях по бессоннице (Harvey, J Sleep Res 2002).",
    },
    {
      title: "Кофе - только до 12:00",
      hack: "Кофеин держится в крови 6-8 часов. Чашка в 16:00 - это всё ещё активный кофеин в полночь. Поэтому утренняя норма ок, дневная - крадёт ваш сон.",
      why: "Период полувыведения кофеина - 5 часов. Даже когда «не чувствуете», уровень в крови остаётся достаточным, чтобы блокировать аденозиновые рецепторы (Drake, JCSM 2013).",
    },
  ],
  movement: [
    {
      title: "10 минут прогулки после еды",
      hack: "Сразу после приёма пищи 10 минут пешком в любом темпе. Сахар в крови поднимется намного меньше, чем если бы вы сидели или лежали.",
      why: "Мышцы во время ходьбы поглощают глюкозу из крови без инсулина. После еды это снижает пик сахара на 30-40% (Buffey et al., Sports Med 2022).",
    },
    {
      title: "Лестница вместо лифта - это уже тренировка",
      hack: "Подняться на 5 этажей пешком = около 1 минуты MVPA-активности. Если делать так 3 раза в день - за неделю набирается рекомендация ВОЗ.",
      why: "В исследовании Allison et al. (Atherosclerosis 2017) короткие вспышки нагрузки по 1-2 минуты дают 70% эффекта длительных тренировок на VO₂max.",
    },
    {
      title: "Стойте 2 минуты каждый час",
      hack: "Поставьте таймер. Каждый час - встать, налить воды, постоять, посмотреть в окно. Не нужно ходить или приседать. Просто стоять.",
      why: "Длительное сидение снижает активность липопротеинлипазы (фермента, отвечающего за обработку жиров) на 90%. Любое прерывание восстанавливает её (Hamilton, Diabetes 2007).",
    },
    {
      title: "5 приседаний перед каждым приёмом еды",
      hack: "Незаметная привычка с большим эффектом. Перед едой - 5 приседаний. Сахар после еды поднимается мягче.",
      why: "Любая нагрузка на крупные мышцы за 15 минут до еды улучшает чувствительность к инсулину на ближайшие 2 часа (Heden, Med Sci Sports Exerc 2014).",
    },
    {
      title: "Висы на турнике 30 секунд в день",
      hack: "Простой вис на перекладине (или на двери, на горизонтальной балке) по 30 секунд раз в день. Не нужен зал, не нужны программы. Хват и мышцы спины делаются параллельно с зарядкой телефона.",
      why: "Каждые 5 кг хвата = −16% риска смертности (Leong, Lancet 2015). Висы — самый быстрый способ её прокачать.",
    },
  ],
  nutrition: [
    {
      title: "Овощи - первыми в тарелке",
      hack: "Если на столе несколько блюд - сначала ешьте овощи и белок, потом углеводы. Тот же объём еды, тот же состав - но сахар поднимется в 2 раза мягче.",
      why: "Порядок «volume → fiber → protein → carbs» замедляет всасывание глюкозы на 30-50% (Shukla, Diabetes Care 2015).",
    },
    {
      title: "Стакан воды - за 15 минут до еды",
      hack: "Не во время и не после. Именно за 10-15 минут до приёма пищи. Это снижает аппетит на следующие 30-60 минут - съедите естественно меньше.",
      why: "В RCT с пожилыми (Davy et al., Obesity 2008) этот приём приводил к -2 кг за 12 недель без других изменений в питании.",
    },
    {
      title: "Завтрак с белком закрывает дневной голод",
      hack: "Если на завтрак минимум 25 г белка (3 яйца, или творог, или курица), вечером есть будете заметно меньше - без силы воли.",
      why: "Белок утром стабилизирует уровень грелина (гормона голода) на весь день и снижает тягу к сладкому к вечеру (Leidy, Am J Clin Nutr 2013).",
    },
    {
      title: "Замените одну из ваших любимых сладостей на тёмный шоколад",
      hack: "70%+ какао - это не сладкое в обычном смысле. Один-два кубика после еды закрывают тягу к десерту, при этом дают флавоноиды и магний.",
      why: "В исследовании Engler (J Am Coll Nutr 2004) ежедневный тёмный шоколад в малых дозах улучшал функцию сосудов через 2 недели.",
    },
    {
      title: "Готовьте порцию на двое суток",
      hack: "Когда варите - варите вдвое больше. Половину едите сегодня, половину завтра. Это убирает «надо что-то срочно поесть» - главный повод для ультра-обработанной еды.",
      why: "Подготовка еды (meal prep) - самый сильный поведенческий фактор для здорового питания на длинной дистанции (Ducrot, Int J Behav Nutr Phys Act 2017).",
    },
  ],
  habits: [
    {
      title: "Бокал воды между бокалами вина",
      hack: "Если пьёте - между каждым алкогольным напитком пейте стакан простой воды. Это уменьшает общую дозу алкоголя за вечер примерно на треть и почти полностью убирает похмелье.",
      why: "Алкоголь - мочегонное; обезвоживание усиливает все его негативные эффекты. Параллельная гидратация - самая простая защита (Verster, Curr Drug Abuse Rev 2010).",
    },
    {
      title: "После 21:00 - никакого алкоголя",
      hack: "Если вы просто перестанете пить во второй половине вечера, сон будет глубже на 20-30%. Тот же объём, но раньше - меньше вреда.",
      why: "Алкоголь в крови во время сна блокирует REM-стадию. Если он успевает выйти к моменту засыпания - блок снимается (Pietilä, JMIR Ment Health 2018).",
    },
    {
      title: "Курят с друзьями? Уйдите на 5 минут",
      hack: "Если все вокруг курят - отойдите. Откажитесь от компании, не от человека. Через 5 минут ситуация изменится, а вы остались чистым.",
      why: "Социальный никотин - сильнейший фактор возобновления курения. Физическое отдаление снижает желание на 60% за 5 минут (Shiffman, Addict Behav 2002).",
    },
    {
      title: "Считайте дни, а не сигареты",
      hack: "Не «сколько сегодня выкурил», а «сколько дней не курил». Мозг устроен так, что наращивание счётчика мотивирует сильнее, чем подсчёт неудач.",
      why: "Прирост vs убыль - фундаментальный принцип когнитивно-поведенческой терапии (Gainsford, Addict Behav 2018).",
    },
    {
      title: "«Не отказываюсь, а откладываю»",
      hack: "Когда тянет к сигарете или бокалу - не говорите себе «нет». Скажите «через 15 минут». В 70% случаев через 15 минут уже не хочется.",
      why: "Технику называют «urge surfing» - желание идёт волной и спадает. Если переждать пик - оно проходит само (Bowen, Addict Behav 2007).",
    },
  ],
};

const LIFE_HACKS_EN: Record<DomainKey, LifeHack[]> = {
  sleep: [
    {
      title: "10 minutes of sunlight right after waking up",
      hack: "Morning light in the first hour after waking syncs your internal clock better than any alarm system. Open the curtains and stand by the window while your coffee brews.",
      why: "Morning light (especially direct sunlight) stops melatonin production and switches you into day mode. You'll fall asleep 15-30 minutes faster in the evening (Wams et al., Sleep 2017).",
    },
    {
      title: "Socks at night - boring but it works",
      hack: "Warm feet dilate peripheral vessels, and heat leaves your body's core. A 0.5°C drop in core temperature is the main signal to fall asleep.",
      why: "In a study from ETH Zurich (Krauchi, Nature 1999), warming the feet shortened sleep onset by 7-15 minutes - more than most sleeping pills.",
    },
    {
      title: "Don't turn on bright lights when you go to the bathroom at night",
      hack: "If you get up at night, leave your phone in the bedroom and don't switch on bright lights. A nightlight or hallway light is enough. Otherwise your body decides morning has arrived.",
      why: "Even a brief flash of bright light at night suppresses melatonin by 50-80% and shifts circadian timing (Zeitzer, J Physiol 2000).",
    },
    {
      title: "A cool bedroom matters more than a warm blanket",
      hack: "Ideal sleep temperature is 18-19°C. If your bedroom is warmer, deep sleep is shortened even if you don't notice waking up.",
      why: "Body temperature has to drop to fall asleep and stay in deep sleep. A warm room interferes with this process (Okamoto-Mizuno, JPA 2012).",
    },
    {
      title: "No intense emotions in the hour before bed",
      hack: "Arguments, gripping shows, important conversations - all of them spike cortisol. Even if you go to bed right after, your body needs another 30-60 minutes to cool down.",
      why: "Cortisol stays elevated for 60-90 minutes after a stressful event. During this window, deep sleep in the first third of the night is disrupted (Hirotsu, Sleep Sci 2015).",
    },
  ],
  stress: [
    {
      title: "4-7-8 breathing: calms you in 60 seconds",
      hack: "Inhale through your nose for 4 counts → hold for 7 → exhale through your mouth for 8. Repeat 4 times. You'll feel the effect by the second or third cycle.",
      why: "A long exhale activates the calming part of the nervous system (the vagus nerve). It's the fastest way to lower heart rate and cortisol (Zaccaro, Front Hum Neurosci 2018).",
    },
    {
      title: "If you get angry - drink cold water",
      hack: "Cold liquid on your tongue activates the same nerve as slow breathing. In 30 seconds your pulse starts to drop; in 2 minutes you feel the emotion easing.",
      why: "Diving reflex: cold contact slows the heart and reduces sympathetic tone - a technique drawn from evidence-based DBT therapy.",
    },
    {
      title: "A 20-minute walk = an anti-anxiety pill",
      hack: "A light walk in natural light eases anxiety about as strongly as common over-the-counter calmers - especially if you walk where there are trees and grass.",
      why: "Meta-analysis of 116 studies (Schuch, Psychiatry Res 2018): the effect of walking on anxiety disorders is comparable to mild antidepressants.",
    },
    {
      title: "Write your worries down - and leave them on paper",
      hack: "Every evening, spend 5 minutes writing whatever's bothering you. No judgement, no plans, just a list. Your brain stops looping through these thoughts at night.",
      why: "Cognitive offload works on the principle of \"clearing working memory.\" Confirmed in insomnia research (Harvey, J Sleep Res 2002).",
    },
    {
      title: "Coffee only before noon",
      hack: "Caffeine stays in your bloodstream for 6-8 hours. A cup at 4 PM is still active caffeine at midnight. Morning coffee is fine; afternoon coffee steals your sleep.",
      why: "Caffeine's half-life is about 5 hours. Even when you don't \"feel\" it, blood levels stay high enough to block adenosine receptors (Drake, JCSM 2013).",
    },
  ],
  movement: [
    {
      title: "A 10-minute walk after meals",
      hack: "Right after eating, walk for 10 minutes at any pace. Blood sugar rises far less than if you sat or lay down.",
      why: "Walking muscles take up glucose from the blood without insulin. After meals this cuts the sugar peak by 30-40% (Buffey et al., Sports Med 2022).",
    },
    {
      title: "Stairs instead of the elevator - that's already a workout",
      hack: "Climbing 5 flights ≈ 1 minute of MVPA. Three times a day, and over a week you cover the WHO recommendation.",
      why: "In Allison et al. (Atherosclerosis 2017), short bursts of 1-2 minutes deliver about 70% of the VO₂max benefit of longer training.",
    },
    {
      title: "Stand for 2 minutes every hour",
      hack: "Set a timer. Every hour - stand up, get water, stand by the window. No need to walk or do squats. Just standing.",
      why: "Prolonged sitting drops lipoprotein lipase activity (the enzyme that processes fats) by 90%. Any interruption restores it (Hamilton, Diabetes 2007).",
    },
    {
      title: "5 squats before each meal",
      hack: "An invisible habit with a big payoff. Before eating - 5 squats. Post-meal sugar rises more gently.",
      why: "Any large-muscle activity 15 minutes before a meal improves insulin sensitivity for the next 2 hours (Heden, Med Sci Sports Exerc 2014).",
    },
    {
      title: "30 seconds of dead hangs a day",
      hack: "Just hang from a pull-up bar (or a doorway, a horizontal beam) for 30 seconds once a day. No gym, no programs. You can train grip and back muscles while your phone charges.",
      why: "Every 5 kg of grip strength = -16% mortality risk (Leong, Lancet 2015). Hangs are the fastest way to build it.",
    },
  ],
  nutrition: [
    {
      title: "Vegetables first on your plate",
      hack: "If several dishes are on the table - eat vegetables and protein first, carbs last. Same volume, same composition, but blood sugar rises twice as gently.",
      why: "The order \"volume → fiber → protein → carbs\" slows glucose absorption by 30-50% (Shukla, Diabetes Care 2015).",
    },
    {
      title: "A glass of water 15 minutes before eating",
      hack: "Not during, not after. Specifically 10-15 minutes before the meal. It reduces appetite for the next 30-60 minutes - you'll naturally eat less.",
      why: "In an RCT with older adults (Davy et al., Obesity 2008), this practice led to -2 kg over 12 weeks with no other dietary changes.",
    },
    {
      title: "A protein breakfast closes the day's hunger",
      hack: "If you have at least 25 g of protein at breakfast (3 eggs, cottage cheese, chicken), you'll eat noticeably less in the evening - without willpower.",
      why: "Morning protein stabilizes ghrelin (the hunger hormone) for the whole day and reduces sweet cravings by evening (Leidy, Am J Clin Nutr 2013).",
    },
    {
      title: "Swap one of your favorite sweets for dark chocolate",
      hack: "70%+ cocoa isn't \"sweet\" in the usual sense. One or two squares after a meal kill the dessert craving and provide flavonoids and magnesium.",
      why: "In Engler (J Am Coll Nutr 2004), daily small amounts of dark chocolate improved vascular function within 2 weeks.",
    },
    {
      title: "Cook a double portion - enough for two days",
      hack: "When you cook, cook twice as much. Half today, half tomorrow. This kills the \"need to eat right now\" feeling - the main reason ultra-processed food sneaks in.",
      why: "Meal prep is the strongest behavioral factor for healthy eating over the long run (Ducrot, Int J Behav Nutr Phys Act 2017).",
    },
  ],
  habits: [
    {
      title: "A glass of water between glasses of wine",
      hack: "If you drink, have a glass of plain water between each alcoholic drink. It cuts your total alcohol dose for the evening by about a third and almost fully removes the hangover.",
      why: "Alcohol is a diuretic; dehydration amplifies all its negative effects. Parallel hydration is the simplest defense (Verster, Curr Drug Abuse Rev 2010).",
    },
    {
      title: "No alcohol after 9 PM",
      hack: "If you simply stop drinking in the second half of the evening, your sleep gets 20-30% deeper. Same amount of alcohol, but earlier - much less harm.",
      why: "Alcohol in your bloodstream during sleep blocks REM. If it's metabolized before you fall asleep, the block lifts (Pietilä, JMIR Ment Health 2018).",
    },
    {
      title: "Friends smoking? Step away for 5 minutes",
      hack: "If everyone around you is smoking, move away. Decline the company, not the person. In 5 minutes the situation changes - and you stayed clean.",
      why: "Social nicotine is the strongest factor in relapse. Physical distance cuts the urge by 60% in 5 minutes (Shiffman, Addict Behav 2002).",
    },
    {
      title: "Count days, not cigarettes",
      hack: "Not \"how many I smoked today,\" but \"how many days I haven't smoked.\" The brain is wired so that a growing counter motivates more strongly than counting failures.",
      why: "Gain framing vs loss framing - a core principle of cognitive-behavioral therapy (Gainsford, Addict Behav 2018).",
    },
    {
      title: "\"I'm not refusing, I'm postponing\"",
      hack: "When you crave a cigarette or a drink, don't say \"no.\" Say \"in 15 minutes.\" 70% of the time you no longer want it after the 15 minutes pass.",
      why: "The technique is called \"urge surfing\": the urge comes as a wave and falls. If you ride out the peak, it passes by itself (Bowen, Addict Behav 2007).",
    },
  ],
};

export function pickLifeHack(
  domain: DomainKey,
  score: ScoreResult,
  answers: Answers,
): LifeHack {
  const seed = variantSeed(score, answers) + "|hack:" + domain;
  const arr = getLang() === "en" ? LIFE_HACKS_EN[domain] : LIFE_HACKS[domain];
  return pickVariant(arr, seed);
}

export type LifeHacksFour = Pick<Record<DomainKey, LifeHack>, "sleep" | "stress" | "movement" | "nutrition">;

/** Четыре лайфхака для PDF: сон, стресс, движение, питание (без блока «привычки»). */
export function pickFourLifeHacks(score: ScoreResult, answers: Answers): LifeHacksFour {
  return {
    sleep: pickLifeHack("sleep", score, answers),
    stress: pickLifeHack("stress", score, answers),
    movement: pickLifeHack("movement", score, answers),
    nutrition: pickLifeHack("nutrition", score, answers),
  };
}
