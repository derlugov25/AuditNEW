import { DomainKey, DomainScore, ScoreResult, computeSleepHours } from "./scoring";
import { Answers, ConditionKey } from "./types";

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
    caffeine: "Кофе — максимум 1 чашка до 12:00, следите за давлением после",
    hiit: "Интенсивное кардио — только после консультации с кардиологом",
    cold_exposure: "Контрастный душ и криотерапия — обсудите с кардиологом",
  },
  atherosclerosis: {
    caffeine: "Кофе ограничьте до 1 чашки в день, следите за АД",
    hiit: "Высокоинтенсивные нагрузки — только под медицинским контролем",
    fasting: "Интервальное голодание — обязательно согласуйте с врачом",
  },
  diabetes2: {
    fasting: "Длительное голодание при диабете — только под наблюдением врача",
  },
  autoimmune: {
    fasting: "Длительное голодание при аутоиммунных состояниях — проконсультируйтесь с врачом",
    cold_exposure: "Экстремальные температурные воздействия — обсудите со специалистом",
  },
  thyroid: {
    supplements: "БАДы с йодом и селеном — только после анализов, не наугад",
  },
  kidney: {
    high_protein: "Норму белка обсудите с нефрологом — стандартные 1.6 г/кг вам могут не подойти",
    supplements: "Большинство БАДов нагружают почки — обсудите с нефрологом",
  },
  cancer: {
    fasting: "Любые ограничения питания согласовывайте с онкологом",
    supplements: "Все БАДы — только с согласования онколога",
    cold_exposure: "Экстремальные практики — согласуйте с лечащим врачом",
  },
  bpd: {},
  allergy: {},
  other: {},
  none: {},
  prefer_not_to_say: {},
};

const BARRIER_TONE: Record<string, string> = {
  time: "микрошаги 2–5 минут, встраиваются в день",
  energy: "начинаем с одной точки восстановления, остальное подтягивается",
  conflicting_advice: "один эволюционно-устойчивый приём, без 50 правил",
  motivation: "маленькие ежедневные wins, видимый прогресс",
  dont_know_start: "последовательность 1→2→3, каждый шаг на неделю",
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
  const blocks = new Set(conditions.flatMap((c) => CONDITION_BLOCKS[c] ?? []));
  const reframes = conditions.flatMap((c) =>
    Object.entries(CONDITION_REFRAMES[c] ?? {}),
  );

  let action =
    snippet.actionByBarrier[barrier] ??
    snippet.actionByBarrier["dont_know_start"] ??
    Object.values(snippet.actionByBarrier)[0] ??
    "";

  if (blocks.has(snippet.category)) {
    const reframe = reframes.find(([cat]) => cat === snippet.category);
    action = reframe
      ? `⚠ С учётом вашего диагноза: ${reframe[1]}`
      : "⚠ С учётом вашего диагноза: этот совет нужно согласовать с вашим врачом. В Longy подбираем альтернативу под ваш диагноз.";
  }

  const barrierNote = barrier && BARRIER_TONE[barrier] ? ` (${BARRIER_TONE[barrier]})` : "";
  return { headline: snippet.headline, detail: snippet.detail, action: action + barrierNote };
}

// ──────────────────────────────────────────────────────────────
// SNIPPET LIBRARIES BY DOMAIN
// ──────────────────────────────────────────────────────────────

const SLEEP_SNIPPETS: Snippet[] = [
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h < 5; },
    headline: "Критический недосып — меньше 5 часов",
    detail: "Менее 5 часов регулярно — это не просто усталость: падает выработка гормона роста, нарушается клиренс бета-амилоида из мозга, растёт инсулинорезистентность и системное воспаление. Накопленный «сонный долг» не компенсируется долгим сном в выходные.",
    actionByBarrier: {
      time: "Сегодня — на 30 минут раньше в кровать. Только это.",
      energy: "Недосып сам тянет вашу энергию. Один шаг: убрать телефон за час до сна.",
      conflicting_advice: "Один проверенный факт: <6 ч сна = снижение иммунитета вдвое. Цель — 7 ч.",
      motivation: "Первая победа — 14 ночей подряд по 6.5+ ч. Отмечайте каждую.",
      dont_know_start: "Шаг 1 — отбой в 23:00 на 7 дней. Шаг 2 — сдвигаем на 22:30.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 7 && h <= 9 && (a.bedtime === "after05" || a.bedtime === "04-05" || a.bedtime === "03-04"); },
    headline: "Сон сдвинут в день — циркадный jetlag",
    detail: "Даже при 8 часах сна отбой после 3:00 = постоянный циркадный jetlag. Пики мелатонина, кортизола и температуры тела рассинхронизированы с солнечным циклом — страдает метаболизм, иммунитет и когнитивные функции.",
    actionByBarrier: {
      time: "Сдвиг на 15 мин раньше каждые 3 дня — этого достаточно.",
      energy: "Яркий свет сразу после подъёма ускоряет перестройку ритма.",
      conflicting_advice: "Один факт: мелатонин вырабатывается в темноте до 2:00 по биочасам.",
      motivation: "Каждая ночь в «до 01:00» — маленькая победа над jetlag.",
      dont_know_start: "Неделя 1 — отбой до 03:00. Неделя 2 — до 02:00. Неделя 3 — до 01:00.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 5 && h < 6; },
    headline: "Сон 5–6 ч — хронический дефицит восстановления",
    detail: "При 5–6 часах сна сокращается глубокий SWS-сон — фаза физического восстановления и иммунного контроля. Дефицит накапливается незаметно: субъективно «привыкаешь», объективно страдают память и метаболизм.",
    actionByBarrier: {
      time: "Добавьте 30 мин: ложитесь на полчаса раньше 14 ночей подряд.",
      energy: "Сон — главный генератор энергии. Инвестиция в 30 мин даёт возврат весь следующий день.",
      conflicting_advice: "AASM, ВОЗ, NIH единогласны: минимум 7 часов для взрослых.",
      motivation: "Отслеживайте HRV утром — за 2 недели увидите разницу.",
      dont_know_start: "Шаг 1 — телефон за дверь за час до сна. Потом двигаемся дальше.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 6 && h < 7; },
    headline: "Сон чуть ниже восстановительного порога",
    detail: "7–9 часов — окно всех циклов глубокого и REM-сна. При 6–7 часах сокращается SWS — фаза восстановления и иммунного контроля.",
    actionByBarrier: {
      time: "30 мин раньше в кровать — и 30 мин прироста сна без усилий.",
      energy: "30 минут дополнительного сна = 20% больше энергии в первой половине дня.",
      conflicting_advice: "7 часов — минимальный консенсус всех медицинских организаций.",
      motivation: "14 ночей стабильного режима — и биомаркеры сна видимо улучшатся.",
      dont_know_start: "Один шаг: отбой на 30 мин раньше, не меняя больше ничего.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h > 10; },
    headline: "Сон 10+ ч — сигнал нарушения качества",
    detail: "Регулярный сон более 10 часов у взрослых — маркер фрагментации: тело добирает качество количеством. Ассоциирован с повышенным риском сердечно-сосудистых событий.",
    actionByBarrier: {
      time: "Трекер сна (даже телефон) покажет структуру за 2 недели.",
      energy: "Причина усталости, скорее всего, в качестве сна, а не его длине.",
      conflicting_advice: "Длина сна 10+ ч — не признак здоровья, а сигнал к обследованию.",
      motivation: "Проверка ферритина и витамина D часто меняет картину кардинально.",
      dont_know_start: "Шаг 1 — запись к сомнологу или трекинг 14 дней.",
    },
    category: "general",
  },
  {
    match: (a) => { const h = computeSleepHours(a); return h !== null && h >= 7 && (a.daytimeSleepiness === "9+" || a.daytimeSleepiness === "4-8"); },
    headline: "Достаточно сплю, но днём клонит — скрытая проблема",
    detail: "Сон по часам норме, но дневная сонливость — признак нарушения структуры сна: микропробуждения, апноэ или дефицит SWS.",
    actionByBarrier: {
      time: "2 недели трекинга — минимум данных для понимания проблемы.",
      energy: "Дневной кофеин маскирует, но не решает. Нужна причина — не симптом.",
      conflicting_advice: "Дневная сонливость при нормальном сне — медицинский симптом, не вопрос режима.",
      motivation: "Знать причину — уже половина решения. Трекер за 2 недели.",
      dont_know_start: "Шаг 1 — включить запись сна на телефоне или часах на 14 ночей.",
    },
    category: "general",
  },
  {
    match: (a) => a.sleepProblems === "9+" || a.sleepProblems === "4-8",
    headline: "Прерывистый сон — часы есть, восстановления нет",
    detail: "Трудности с засыпанием и ночные пробуждения означают, что организм не доходит до глубоких фаз SWS и REM — очистка мозга от токсичных белков, консолидация памяти и гормон роста синтезируются именно там.",
    actionByBarrier: {
      time: "Ритуал 10 мин: выключить экраны, короткое дыхание 4-7-8, темнота.",
      energy: "Прерывистый сон = постоянная усталость. Ритуал перед сном — первый рычаг.",
      conflicting_advice: "Один доказанный шаг: темнота и тишина в спальне. Начните отсюда.",
      motivation: "14 ночей ритуала подряд — мозг «выучивает» новый паттерн.",
      dont_know_start: "Шаг 1 — убрать телефон из спальни на 7 дней.",
    },
    category: "general",
  },
  {
    match: (a) => a.bedtime === "01-02" || a.bedtime === "02-03",
    headline: "Позднее засыпание — сдвинутый циркадный ритм",
    detail: "Длительность сна в норме, но окно смещено в ночь. Рассинхронизация циркадного ритма создаёт постоянный лёгкий jetlag для эндокринной и иммунной системы.",
    actionByBarrier: {
      time: "Сдвиг на 15 мин раньше каждые 3 дня — без резкого дискомфорта.",
      energy: "Яркий свет сразу после подъёма — главный якорь циркадного ритма.",
      conflicting_advice: "Один факт: циркадный сдвиг = повышенный риск метаболических нарушений.",
      motivation: "Каждая неделя сдвига ритма — измеримый прирост HRV.",
      dont_know_start: "Неделя 1 — отбой на 30 мин раньше. Повторять до нормы.",
    },
    category: "general",
  },
];

const STRESS_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.foggyHours === "40+h" || a.foggyHours === "20-40h",
    headline: "Ментальный туман большую часть недели",
    detail: "Хронический кортизол укорачивает теломеры и повышает маркеры системного воспаления (IL-6, CRP). Туман сознания на 20+ часов в неделю — сигнал истощения нервной системы.",
    actionByBarrier: {
      time: "10 мин дыхания 4-7-8 утром. Одно действие, измеримый эффект за 2 недели.",
      energy: "Начните с одной точки: 10 мин тишины после обеда без телефона.",
      conflicting_advice: "Один доказанный рычаг: контролируемое дыхание снижает кортизол в течение 4 минут.",
      motivation: "Ведите дневник туманности по шкале 1–10. Через 2 недели увидите тренд.",
      dont_know_start: "Шаг 1 — brain dump: 5 мин письма всего, что в голове, каждый вечер.",
    },
    category: "general",
  },
  {
    match: (a) => a.foggyHours === "14-20h" || a.foggyHours === "7-14h",
    headline: "Хронический перегруз истощает нервную систему",
    detail: "Хронический кортизол ускоряет биологическое старение клеток — теломеры укорачиваются быстрее. Системное воспаление ускоряет атеросклероз и нейродегенерацию.",
    actionByBarrier: {
      time: "10 мин дыхания + вечерний brain dump на бумаге. Минимум инвестиций.",
      energy: "Одна точка восстановления в день — 15 мин без задач и экранов.",
      conflicting_advice: "Один приём: диафрагмальное дыхание 4-4-8. Нейробиология понятна.",
      motivation: "Контроль стресса — это навык. Первые 14 дней самые важные.",
      dont_know_start: "Шаг 1 — 5 мин медитации на выдохе перед сном.",
    },
    category: "general",
  },
  {
    match: (a) => a.energyPattern === "mostly_low",
    headline: "Стабильно низкая энергия — это не норма",
    detail: "Постоянно низкий уровень энергии — признак либо хронического стресса, либо дефицита сна, либо метаболического нарушения. Часто всё три одновременно.",
    actionByBarrier: {
      time: "20 мин яркого света утром перестраивают кортизольную кривую за 5 дней.",
      energy: "Одна точка восстановления: короткий сон 20 мин после обеда — не слабость, метод.",
      conflicting_advice: "Проверьте ферритин и D3 — 60% хронической усталости в этом.",
      motivation: "Ведите шкалу 1–10 каждое утро. Тренд виден через неделю.",
      dont_know_start: "Шаг 1 — анализы: ферритин, витамин D, ТТГ. Без догадок.",
    },
    category: "general",
  },
  {
    match: (a) => a.foggyHours === "3-7h",
    headline: "Туман в голове 3–7 часов в неделю",
    detail: "Умеренный стресс-дефицит: нервная система справляется, но с заметными потерями когнитивного ресурса. Ранняя точка для коррекции без серьёзных усилий.",
    actionByBarrier: {
      time: "Две 5-минутные паузы в день — выйти на улицу, без телефона.",
      energy: "Снизьте стимуляторы (кофе, новости) в первой половине дня.",
      conflicting_advice: "Тишина — самый недооценённый когнитивный инструмент.",
      motivation: "Начните с одного «тихого часа» в неделю. Расширяйте.",
      dont_know_start: "Шаг 1 — прогулка 15 мин без наушников и телефона.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Стресс тянет ресурс сильнее, чем кажется",
    detail: "Даже умеренный стресс запускает хроническое воспаление и снижает вариабельность сердечного ритма — ранний маркер перегруза нервной системы.",
    actionByBarrier: {
      time: "5 мин дыхательной практики перед сном.",
      energy: "Отдых — это не бездействие, это активное восстановление.",
      conflicting_advice: "Один простой факт: глубокое дыхание активирует парасимпатику за 60 секунд.",
      motivation: "Отслеживайте HRV — прогресс виден через 2 недели.",
      dont_know_start: "Шаг 1 — 5 мин медитации утром, 7 дней подряд.",
    },
    category: "general",
  },
];

const MOVEMENT_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.activeDays === "0",
    headline: "Отсутствие движения — один из самых сильных факторов риска",
    detail: "Скелетная мускулатура — главный орган инсулиновой чувствительности. Без активности после 30 лет мышечная масса убывает 3–5% за десятилетие, а вместе с ней — метаболизм и иммунитет.",
    actionByBarrier: {
      time: "Правило 22: 22 мин ходьбы в день — нейтрализует риски 10 ч сидения.",
      energy: "Начните с 10 мин прогулки. Движение генерирует энергию, а не тратит её.",
      conflicting_advice: "Один факт: 22 мин ходьбы в день устраняют риск сидячего образа жизни.",
      motivation: "Первые 7 дней по 10 мин. Потом тело само попросит больше.",
      dont_know_start: "Шаг 1 — выйти из транспорта на 2 остановки раньше.",
    },
    category: "general",
  },
  {
    match: (a) => a.sittingHours === "8+" && a.activeDays !== "5-7",
    headline: "8+ часов сидения — активная компенсация обязательна",
    detail: "Длительное сидение самостоятельно повышает смертность вне зависимости от ИМТ. Но поддаётся коррекции без изменения работы.",
    actionByBarrier: {
      time: "Вставать каждые 45 мин на 5 мин. Таймер — и больше ничего.",
      energy: "Микродвижение каждый час не истощает, а восполняет энергию.",
      conflicting_advice: "Stamatakis 2023: 22 мин активности нейтрализуют риски 10 ч сидения.",
      motivation: "Отметьте каждый «вставальный» промежуток — за неделю привычка.",
      dont_know_start: "Шаг 1 — поставить таймер на 45 мин прямо сейчас.",
    },
    category: "general",
  },
  {
    match: (a) => a.breathRecovery === "5min+_avoid" || a.breathRecovery === "3-5min",
    headline: "Сниженная кардио-форма — самостоятельный фактор риска",
    detail: "VO2max — один из сильнейших предикторов долголетия. Восстановление дыхания 3+ минут говорит о сниженном кардиореспираторном резерве.",
    actionByBarrier: {
      time: "10 мин ходьбы в лёгком темпе ежедневно — уже запускает адаптацию.",
      energy: "Начните с медленной ходьбы. Тело само ускорится через 2–3 недели.",
      conflicting_advice: "VO2max улучшается даже от умеренных прогулок — это не миф.",
      motivation: "Замеряйте пульс после лестницы раз в неделю — динамика мотивирует.",
      dont_know_start: "Шаг 1 — 10 мин ходьбы на умеренном темпе каждый день.",
    },
    category: "general",
  },
  {
    match: (a) => a.functionalActivities.length <= 2,
    headline: "Ограниченная функциональная форма требует внимания",
    detail: "Неспособность выполнять базовые физические задачи без дискомфорта — признак сниженного функционального резерва, который нарастает незаметно.",
    actionByBarrier: {
      time: "5 мин лёгкой растяжки утром и 10 мин ходьбы — точка входа.",
      energy: "Функциональная форма строится маленькими шагами, не объёмом.",
      conflicting_advice: "Один принцип: постепенная прогрессия нагрузки без боли.",
      motivation: "Отмечайте каждую новую активность, которая стала комфортнее.",
      dont_know_start: "Шаг 1 — лестница вместо лифта 5 дней подряд.",
    },
    category: "general",
  },
  {
    match: (a) => a.activeDays === "1-2",
    headline: "Недостаток движения накапливает дефицит здоровья",
    detail: "1–2 активных дня в неделю — ниже рекомендации ВОЗ (150 мин умеренной активности). Метаболический резерв снижается незаметно.",
    actionByBarrier: {
      time: "Добавьте один 20-минутный блок ходьбы — в рабочее время или обеденный перерыв.",
      energy: "Третий активный день в неделю даёт непропорциональный прирост энергии.",
      conflicting_advice: "ВОЗ: 150 мин в неделю = снижение риска смертности на 30%.",
      motivation: "От 2 до 3 дней — самый быстрый прирост субъективного самочувствия.",
      dont_know_start: "Шаг 1 — запланировать третью прогулку в календаре прямо сейчас.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Движение работает против вас прямо сейчас",
    detail: "Дефицит активности накапливается тихо. Каждый неактивный день снижает метаболический резерв.",
    actionByBarrier: {
      time: "22 мин ходьбы в день — минимально эффективная доза.",
      energy: "Начните с 10 мин — тело само запросит больше через неделю.",
      conflicting_advice: "22 мин умеренной ходьбы в день — доказанный минимум (Stamatakis 2023).",
      motivation: "Поставьте цель на 7 дней, не на месяц.",
      dont_know_start: "Шаг 1 — 10 мин прогулки сегодня после ужина.",
    },
    category: "general",
  },
];

const NUTRITION_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.processedFood === "daily",
    headline: "Ежедневная ультра-обработанная еда запускает воспалительный каскад",
    detail: "Ультра-обработанная еда нарушает микробиом — главный регулятор иммунитета и воспаления. Высокое потребление связано с ростом риска диабета на 40%, ССЗ на 29%, ранней смерти на 21% (Lane et al., BMJ 2024).",
    actionByBarrier: {
      time: "Правило трети тарелки: треть — овощи, треть — белок, треть — злаки. Без счёта калорий.",
      energy: "Одна замена в день: обработанный перекус → орехи или фрукт.",
      conflicting_advice: "Один принцип: меньше ингредиентов в составе = лучше для микробиома.",
      motivation: "Замените один ежедневный продукт на цельный. Неделю подряд.",
      dont_know_start: "Шаг 1 — убрать один ультра-обработанный продукт из ежедневного меню.",
    },
    category: "general",
  },
  {
    match: (a) => a.veggiesFruits === "<3_week",
    headline: "Дефицит овощей истощает микробиом и митохондрии",
    detail: "Клетчатка, полифенолы и антиоксиданты из овощей — кофакторы для митохондрий и детоксикации. Хронический дефицит ускоряет клеточное старение.",
    actionByBarrier: {
      time: "Горсть листьев + помидор к любому приёму пищи — 30 секунд.",
      energy: "Овощи = питание для митохондрий. Дефицит = меньше энергии на клеточном уровне.",
      conflicting_advice: "3 порции овощей/фруктов в день — рекомендация всех диетологических организаций.",
      motivation: "Один новый овощ в рацион в неделю. Без давления.",
      dont_know_start: "Шаг 1 — добавить одну порцию овощей к обеду ежедневно.",
    },
    category: "general",
  },
  {
    match: (a) => a.water === "<1l",
    headline: "Хроническая дегидратация замедляет метаболизм и мышление",
    detail: "Уже 2% дефицит воды снижает когнитивные функции на 20%. Хроническая дегидратация замедляет лимфоток, почечную фильтрацию и детоксикацию.",
    actionByBarrier: {
      time: "Стакан воды утром и перед каждым приёмом пищи — без усилий.",
      energy: "Вода — дешевле и быстрее любого энергетика.",
      conflicting_advice: "1.5 л в день — научный минимум для взрослых при умеренной активности.",
      motivation: "Трекер воды в телефоне + напоминание раз в 2 часа.",
      dont_know_start: "Шаг 1 — поставить бутылку воды на стол прямо сейчас.",
    },
    category: "general",
  },
  {
    match: (a) => a.processedFood === "4-6wk",
    headline: "Частая обработанная еда нарушает метаболизм",
    detail: "4–6 раз в неделю ультра-обработанной еды достаточно для хронического нарушения микробиома и воспалительного фона.",
    actionByBarrier: {
      time: "Заменить один из 4–6 случаев на что-то цельное — конкретный план на неделю.",
      energy: "Меньше обработанной еды = стабильнее энергия без провалов.",
      conflicting_advice: "Снизить с 5 до 2 раз в неделю — измеримая цель.",
      motivation: "Каждая замена — +1 к счёту здорового питания на неделе.",
      dont_know_start: "Шаг 1 — выбрать один день без ультра-обработанной еды.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Рацион работает против восстановления",
    detail: "Дефицит нутриентов накапливается незаметно и ограничивает восстановление, иммунитет и когнитивные функции.",
    actionByBarrier: {
      time: "Правило трети тарелки — не нужен счётчик калорий.",
      energy: "Питание — топливо. Качество топлива = качество энергии.",
      conflicting_advice: "Три принципа: цельные продукты, разнообразие, достаточно воды.",
      motivation: "Один новый здоровый выбор в день — 30 дней = новая база.",
      dont_know_start: "Шаг 1 — заменить один перекус на орехи или фрукт.",
    },
    category: "general",
  },
];

const HABITS_SNIPPETS: Snippet[] = [
  {
    match: (a) => a.nicotine === "regular",
    headline: "Регулярный никотин — самый изученный ускоритель старения",
    detail: "Никотин повреждает эндотелий сосудов и ускоряет бляшкообразование. GBD Tobacco 2021: курение сокращает здоровую жизнь в среднем на 10 лет.",
    actionByBarrier: {
      time: "Не «бросить», а заменить один конкретный триггер. 2 недели — один триггер.",
      energy: "Никотин имитирует бодрость, но снижает HRV и качество сна.",
      conflicting_advice: "Doll et al. BMJ 2004: отказ до 35 лет возвращает ожидаемую продолжительность жизни к уровню некурящих.",
      motivation: "Замена триггера → альтернативное действие 5 мин. Одна привычка-якорь.",
      dont_know_start: "Шаг 1 — выбрать один триггер и один альтернативный ритуал.",
    },
    category: "general",
  },
  {
    match: (a) => a.alcohol === "daily" || a.alcohol === "3-4wk",
    headline: "Частый алкоголь нарушает сон, гормоны и клеточное восстановление",
    detail: "Алкоголь нарушает REM-сон, повышает кортизол и токсичен для нейронов. Эффекты накапливаются нелинейно даже при умеренных дозах.",
    actionByBarrier: {
      time: "Один бокал вечером → стакан воды с лимоном. Один конкретный ритуал.",
      energy: "Алкоголь гасит REM-сон — отсюда утренняя вялость.",
      conflicting_advice: "ВОЗ 2023: нет безопасного уровня алкоголя для здоровья.",
      motivation: "Каждый день без алкоголя — лучший HRV следующим утром.",
      dont_know_start: "Шаг 1 — один день без алкоголя в будни. Потом второй.",
    },
    category: "general",
  },
  {
    match: (a) => a.nicotine === "sometimes",
    headline: "Нет безопасного порога: никотин повреждает сосуды даже эпизодически",
    detail: "Даже эпизодический никотин вызывает острую эндотелиальную дисфункцию и ускоряет бляшкообразование.",
    actionByBarrier: {
      time: "Замените один эпизодический ритуал на 5-минутную прогулку.",
      energy: "Никотин снижает HRV — главный маркер стрессоустойчивости.",
      conflicting_advice: "Нет порога «немного» — сосуды реагируют на каждую дозу.",
      motivation: "Каждая пропущенная сигарета — конкретный вклад в здоровье сосудов.",
      dont_know_start: "Шаг 1 — отказ от одного еженедельного повода к курению.",
    },
    category: "general",
  },
  {
    match: (a) => a.alcohol === "1-2wk",
    headline: "Алкоголь 1–2 раза в неделю нарушает качество сна",
    detail: "Даже 1–2 бокала в неделю подавляют REM-фазу сна в ночь потребления — снижается восстановление и когнитивные функции следующего дня.",
    actionByBarrier: {
      time: "Попробуйте один алкогольный вечер заменить безалкогольным напитком — 2 недели.",
      energy: "Ночь без алкоголя = видимо лучший HRV с утра.",
      conflicting_advice: "REM-сон после алкоголя снижается на 24% даже при 1 бокале.",
      motivation: "Отследите HRV утром после «алкогольной» и «чистой» ночи — разница очевидна.",
      dont_know_start: "Шаг 1 — не пить 7 дней подряд и замерить разницу самочувствия.",
    },
    category: "general",
  },
  {
    match: () => true,
    headline: "Токсичные привычки ускоряют клеточное старение",
    detail: "Никотин и алкоголь — самые изученные ускорители старения на клеточном уровне. Эффекты накапливаются нелинейно.",
    actionByBarrier: {
      time: "Работайте с одним триггером две недели.",
      energy: "Один токсичный ритуал тянет больше ресурса, чем кажется.",
      conflicting_advice: "Отказ от токсинов — единственный рычаг с консенсусом 100% исследований.",
      motivation: "Маленькая победа каждый день: не вчера, а сегодня.",
      dont_know_start: "Шаг 1 — записать все ситуации-триггеры за неделю.",
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

const EVIDENCE_BY_DOMAIN: Record<DomainKey, string> = {
  sleep: "Cappuccio et al., Sleep 2010 (метаанализ 16 когорт, 1.4 млн человек): 7–9 ч — зона минимального риска смерти от всех причин; отклонение в любую сторону повышает риск на 12–35%.",
  stress: "Epel et al., PNAS 2004 (совместно с лаб. Elizabeth Blackburn, Нобелевская премия 2009): у людей с высоким хроническим стрессом теломеры соответствовали +9–17 годам дополнительного биологического старения.",
  movement: "Stamatakis et al., British Journal of Sports Medicine 2023 (n ≈ 87 000, объективный акселерометр): ≥22 мин умеренной активности в день статистически устраняют избыточный риск смерти от 10+ ч ежедневного сидения.",
  nutrition: "Lane et al., BMJ 2024 (зонтичный обзор 45 метаанализов): высокое потребление ультра-обработанных продуктов связано с ростом риска диабета 2 типа на 40%, сердечно-сосудистых событий на 29%, ранней смерти от всех причин на 21%.",
  habits: "GBD Tobacco Collaborators, Lancet 2021 (195 стран): курение сокращает ожидаемую продолжительность здоровой жизни в среднем на 10 лет. Doll et al., BMJ 2004: отказ до 35 лет возвращает ожидаемую продолжительность жизни к уровню никогда не куривших.",
};

// ──────────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────────

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = Math.floor(n) % 10;
  const mod100 = Math.floor(n) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
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

/**
 * Три строки для PDF: в одном Text кириллица + цифры давали «наложение» глифов.
 * LOSS-ветка пишет «теряете X», GAIN-ветка пишет «можете добрать +N».
 */
export function verdictLifeYearsHeadlineLines(score: ScoreResult): string[] | null {
  const y = score.yearsLifeLostTotal;

  if (y < 0.5) {
    const potential = Math.max(
      3,
      Math.round(score.healthspanMax - score.healthspanYears + 3),
    );
    return [
      "У вас крепкая база",
      `Можно добрать до +${potential} здоровых лет`,
      "за счёт тонкой настройки",
    ];
  }

  const n = formatHeadlineYears(y);
  const unit = lifeYearsUnitWord(y);
  return [
    "Ваш образ жизни «стоит» вам",
    `${n} ${unit} здоровой жизни`,
    "— но это обратимо",
  ];
}

export function yearsLostLineFromDomain(d: DomainScore): string {
  const y = d.yearsLifeLost;
  if (y < 0.05) return "около 0 лет по шкале отчёта";
  return `около ${y.toFixed(1)} ${lifeYearsUnitWord(y)} здоровой жизни (минус к запасу)`;
}

// ──────────────────────────────────────────────────────────────
// BUILD FUNCTIONS
// ──────────────────────────────────────────────────────────────

export function buildAccelerators(answers: Answers, score: ScoreResult): AcceleratorInsight[] {
  return score.topThree.map((d) => {
    const snippets = SNIPPETS_BY_DOMAIN[d.key];
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
      evidence: EVIDENCE_BY_DOMAIN[d.key],
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
    tip: "10-минутные паузы на восстановление в течение дня предотвращают накопление кортизола. Падение HRV 3+ дня подряд — ранний сигнал перегруза.",
  },
  movement: {
    key: "movement",
    label: "Движение",
    tip: "Один силовой день в неделю защищает мышечную массу — главный метаболический резерв после 35. Разнообразие нагрузок важнее объёма.",
  },
  nutrition: {
    key: "nutrition",
    label: "Питание",
    tip: "Раз в полгода — ферритин, витамин D, B12. Дефициты накапливаются незаметно даже при хорошем рационе. Держите структуру тарелки, не считайте калории.",
  },
  habits: {
    key: "habits",
    label: "Привычки",
    tip: "Главное правило: не допускайте нормализации исключений. Случайный никотин или частый алкоголь снижают порог для регулярного — держите строгий ноль.",
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
      detail: "Стабильный режим и достаточная длительность — один из ключевых факторов модели Li et al. 2024. У вас эта основа уже есть.",
    },
    stress: {
      key: "stress",
      headline: "Стресс в управляемом коридоре",
      detail: "Вы держите нагрузку в пределах, не запускающих хроническое воспаление. Это напрямую защищает теломеры (Epel & Blackburn, PNAS 2004).",
    },
    movement: {
      key: "movement",
      headline: "Движение — часть вашей жизни",
      detail: "Регулярная активность ассоциирована с уменьшением риска хронических заболеваний и увеличением здоровых лет жизни (Li et al. 2024). Держите этот паттерн.",
    },
    nutrition: {
      key: "nutrition",
      headline: "Рацион на стороне долголетия",
      detail: "Преобладание цельных продуктов, достаточно овощей, минимум ультра-обработанного — снижает риск воспалительных заболеваний (Lane et al. BMJ 2024).",
    },
    habits: {
      key: "habits",
      headline: "Без токсичных якорей",
      detail: "Отсутствие никотина и минимум алкоголя — один из крупнейших вкладов в биологический возраст (GBD Tobacco 2021).",
    },
  };
  return score.protectors.map((d) => TEMPLATES[d.key]);
}

// ──────────────────────────────────────────────────────────────
// HEADLINE & CTA FUNCTIONS
// ──────────────────────────────────────────────────────────────

/** Главный тезис страницы вердикта. Две ветки: LOSS (теряете X лет) и GAIN (можно добрать +N). */
export function lifeYearsHeadline(score: ScoreResult): string {
  const y = score.yearsLifeLostTotal;

  if (y < 0.5) {
    const potential = Math.max(
      3,
      Math.round(score.healthspanMax - score.healthspanYears + 3),
    );
    return [
      "У вас крепкая база",
      `С Longy можно добрать до +${potential} здоровых лет`,
      "за счёт тонкой настройки сна, восстановления и метаболизма",
    ].join("\n");
  }

  const n = formatHeadlineYears(y);
  const unit = lifeYearsUnitWord(y);
  return [
    "Ваш образ жизни «стоит» вам",
    `${n} ${unit} здоровой жизни`,
    "— но это обратимо",
  ].join("\n");
}

export function coverCTA(score: ScoreResult): string {
  const y = score.yearsLifeLostTotal;
  if (y < 0.5) {
    return "Мы видим, где ваш резерв. В приложении Longy разберём метаболические, сонные и восстановительные метрики, чтобы перевести их в реальные здоровые годы.";
  }
  if (y < 3) {
    return "Ниже — три конкретные точки, где вы теряете годы. А в Longy мы подключим ваши устройства, подберём анализы и составим протокол, чтобы вернуть их за 8–12 недель.";
  }
  return "Это поправимо, но не само по себе. В Longy мы подключаем ваши данные из трекеров, подбираем нужные анализы и ведём вас через персональный протокол. Те, кто прошёл 8 недель — стабильно возвращают 30–50% потерянных здоровых лет.";
}

/**
 * Больше не используется в UI — старый текст про служебную шкалу убран.
 * Сигнатура сохранена, чтобы не ломать существующие импорты.
 */
export function lifeYearsModelNote(_score: ScoreResult): string {
  return "";
}

/**
 * Короткий подзаголовок для обложки PDF и шапки веб-отчёта.
 * Две ветки (LOSS / GAIN) и 5 вариантов по band — убраны формулировки
 * «не добираете», «водопад», «служебная шкала».
 */
export function coverSubtitle(score: ScoreResult): string {
  const band = score.longyScoreBand;
  const y = score.yearsLifeLostTotal;

  // GAIN-ветка (< 0.5 года потерь)
  if (y < 0.5) {
    switch (band) {
      case "excellent":
        return "Вы идёте лучше большинства людей вашего возраста. Ниже — пять точек, где можно дожать ещё, и что Longy делает с каждой.";
      case "good":
        return "Крепкая база по всем факторам. Разбираем, где есть запас для тонкой настройки.";
      default:
        return "По основным факторам всё в норме. Ниже — разбор, где можно укрепить результат.";
    }
  }

  // LOSS-ветка
  switch (band) {
    case "excellent":
    case "good":
      return `База крепкая, но есть точечные рычаги — вместе они «стоят» ≈${y.toFixed(1)} ${plural(y, "год", "года", "лет")}. Разбираем три главных.`;
    case "attention":
      return "Несколько факторов копят дефицит здоровых лет. Разбираем три главных — и что сделать в ближайший месяц.";
    case "risk":
      return "Ваш организм стареет быстрее паспортного возраста. Ниже — три главных рычага и план на 7 дней по каждому.";
    case "critical":
      return "Текущий образ жизни заметно ускоряет биологическое старение. Хорошая новость — основные факторы обратимы за 8 недель.";
  }
}

export function longyScoreLabel(
  band: ScoreResult["longyScoreBand"],
): { label: string; tone: "accent" | "amber" | "warm" | "danger" } {
  switch (band) {
    case "excellent":
      return { label: "Отличный образ жизни для долголетия", tone: "accent" };
    case "good":
      return { label: "Сильная база, есть точки роста", tone: "accent" };
    case "attention":
      return { label: "Образ жизни в зоне внимания", tone: "amber" };
    case "risk":
      return { label: "Несколько серьёзных факторов риска", tone: "warm" };
    case "critical":
      return { label: "Высокий суммарный риск — нужны действия", tone: "danger" };
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
    sleep: "Сон — ваш главный ресурс под эту цель. Продолжайте защищать режим.",
    movement: "Движение у вас — уже преимущество. Именно на нём держится прогресс к цели.",
    nutrition: "Питание работает на вас. На этом фундаменте остальные изменения дают кратный эффект.",
    stress: "Ментальная устойчивость — ваш рычаг. Пока стресс в рабочем коридоре, цель достигается быстрее.",
    habits: "Отсутствие токсичных привычек — крупнейший возможный плюс к биологическому возрасту.",
  };

  const BLOCKER: Record<DomainKey, string> = {
    sleep: "Сон задаёт потолок вашей цели: гормоны роста, восстановление и толерантность к нагрузке. Без него другие усилия дают 30–40% от возможного.",
    movement: "Двигательный ресурс напрямую определяет, достижима ли цель без плато и спадов энергии.",
    nutrition: "Без базового паттерна питания остальные усилия дают 20–30% от возможного — это первый рычаг.",
    stress: "Хронический кортизол блокирует жиросжигание, рост мышц и восстановление.",
    habits: "Никотин и алкоголь напрямую гасят эффект любых тренировок и диет — на клеточном уровне.",
  };

  const reasons = mode === "strength" ? STRENGTH : BLOCKER;
  const label = mode === "strength"
    ? `Ваш ресурс под цель «${goalText}»`
    : `Ключ к цели «${goalText}»`;

  return { label, reason: reasons[domainKey], mode };
}

export function goalLabel(goal: Answers["goal"]): string {
  switch (goal) {
    case "weight_loss": return "Снижение веса";
    case "muscle_gain": return "Набор мышечной массы";
    case "energy": return "Повышение энергии";
    case "nutrition": return "Наладить питание";
    case "endurance": return "Повышение выносливости";
    case "sleep": return "Улучшение качества сна";
    case "biological_age": return "Снижение биологического возраста";
    default: return "Общее улучшение самочувствия";
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

export const LONGY_FEATURES: LongyFeature[] = [
  {
    title: "Aging Velocity Tracker",
    tagline: "Видите, с какой скоростью стареете — каждый день",
    description: "Один график, где видно, быстрее или медленнее нормы стареет ваш организм прямо сейчас. Longy объединяет данные со всех ваших устройств — Whoop, Oura, Apple Watch, умных весов — и пересчитывает показатель каждое утро.",
    why: "Когда видишь цифру каждый день, образ жизни меняется сам. Пользователи стабильно выводят скорость старения в зелёную зону за 8 недель.",
  },
  {
    title: "Dynamic Recovery Protocol",
    tagline: "План на день пишется в 7 утра под ваше состояние",
    description: "AI-коуч читает ваши HRV, сон, стресс за ночь и переписывает план на день: когда тренироваться, что съесть, когда лечь. Никаких жёстких расписаний.",
    why: "Обычные программы дают 20% результата — они не учитывают, что организм разный каждый день. Dynamic protocol поднимает отдачу в 3–4 раза.",
  },
  {
    title: "Longevity Twin",
    tagline: "Ваш цифровой двойник в 60 лет — если ничего не менять vs если изменить",
    description: "Визуализация: как вы будете выглядеть, какую энергию иметь и на что будете способны в 60, если продолжите текущий образ жизни — и альтернативный сценарий, если внедрите 2–3 изменения по рекомендации Longy.",
    why: "Абстрактное «это вредно» не работает. Longevity Twin показывает конкретный результат — 92% пользователей меняют хотя бы одну ключевую привычку в первые 2 недели.",
  },
];

// ──────────────────────────────────────────────────────────────────────
// VELOCITY ZONE DESCRIPTION — подпись под спидометром
// ──────────────────────────────────────────────────────────────────────

export function velocityZoneDescription(velocity: number): string {
  if (velocity < 0) {
    return "Ваша стрелка — в ЗЕЛЁНОЙ зоне. Вы стареете медленнее большинства ровесников.";
  }
  if (velocity <= 8) {
    return "Ваша стрелка — в ЗОНЕ НОРМЫ. Вы в середине по возрастной группе — есть куда расти.";
  }
  if (velocity <= 18) {
    return "Ваша стрелка — в ЗОНЕ ВНИМАНИЯ. Образ жизни начинает ускорять биологическое старение.";
  }
  if (velocity <= 28) {
    return "Ваша стрелка — в ЗОНЕ РИСКА. Хорошая новость — это обратимо, и начать проще, чем кажется.";
  }
  return "Ваша стрелка — в КРИТИЧНОЙ зоне. Старт с Longy окупается быстрее всего именно отсюда.";
}

// ──────────────────────────────────────────────────────────────────────
// LONGY SCORE EXPLANATION — текст со звёздочкой под карточкой Longy Score
// ──────────────────────────────────────────────────────────────────────

export function longyScoreExplanation(): string {
  return "Longy Score — оценка вашего образа жизни от 0 до 100. Учитывает 5 факторов, сильнее всего влияющих на скорость старения по исследованию Li et al., 2024 (Harvard Medical School, n > 2 млн). Чем выше — тем медленнее ваш организм изнашивается относительно паспортного возраста.";
}

// ──────────────────────────────────────────────────────────────────────
// ПРАВАЯ КАРТОЧКА ОБЛОЖКИ — динамическая метрика
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
  if (score0to100 >= 85) return "Отлично";
  if (score0to100 >= 70) return "Хорошо";
  if (score0to100 >= 55) return "Внимание";
  if (score0to100 >= 40) return "Риск";
  return "Критично";
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
  if (bmi === null) return "Данных недостаточно";
  const waist = waistCategory ?? "unknown";

  if (bmiCategory === "normal") {
    if (waist === "high") return "Скрытое абдоминальное ожирение";
    if (waist === "elevated") return "Норма BMI, но талия выше оптимума";
    return "В норме";
  }
  if (bmiCategory === "overweight") {
    if (waist === "high") return "Избыточный вес + абдоминальный жир";
    if (waist === "normal") return "Избыточный вес (возможно, мышечный)";
    return "Избыточный";
  }
  if (bmiCategory === "obese") return "Ожирение";
  if (bmiCategory === "underweight") return "Ниже нормы";
  return "Требуется уточнение";
}

/**
 * Выбирает, что показать в третьей карточке обложки.
 * Если любой из 5 доменов ниже 60 — приоритет ему; иначе — состав тела.
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
    label: "Состав тела",
    value: bmi !== null ? String(bmi) : "—",
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
// MAIN DRIVER — 5+ вариантов headline на домен для средней карточки
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
      headline: "Меньше 5 часов сна — хронический недосып",
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
      headline: "Сон сдвинут в день — режим совы",
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
      subtext: "Один из сильнейших рычагов долголетия",
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
      subtext: "Мышцы — главный орган долголетия",
    },
    {
      match: (a) => a.sittingHours === "8+" && (a.activeDays === "0" || a.activeDays === "1-2"),
      headline: "Сидячий образ жизни",
      subtext: "8+ часов сидения не компенсируются вечером",
    },
    {
      match: (a) => a.activeDays === "1-2",
      headline: "Движения недостаточно",
      subtext: "ВОЗ-минимум — 3–4 дня в неделю",
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
      subtext: "Основа всех других рычагов",
    },
  ],
  stress: [
    {
      match: (a) => a.foggyHours === "40+h" || a.foggyHours === "20-40h",
      headline: "Хронический ментальный туман",
      subtext: "Больше 20 часов в неделю — это уже сигнал",
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

export function pickMainDriver(answers: Answers, score: ScoreResult): MainDriver | null {
  const top = score.topThree[0];
  if (!top) return null;
  const variants = MAIN_DRIVER_VARIANTS[top.key];
  const v = variants.find((x) => x.match(answers, top)) ?? variants[variants.length - 1];
  return { domain: top, headline: v.headline, subtext: v.subtext };
}

// ──────────────────────────────────────────────────────────────────────
// LONGY UNDER GOAL — «что Longy делает под вашу цель» (стр. вердикта)
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
      "Подключает смарт-весы и показывает тренд веса, а не скачки с утра",
      "AI-нутрициолог собирает план под ваши предпочтения — без диет и запретов",
      "Еженедельно пересобирает протокол под прогресс, сон и восстановление",
    ],
    cta: "За 8 недель — устойчивые −4 до −7 кг без срывов",
  },
  muscle_gain: {
    bullets: [
      "План тренировок под ваш инвентарь и опыт — без поиска «идеальной программы»",
      "Контроль белка и восстановления по данным с часов — без граммовок",
      "AI-коуч корректирует нагрузку по HRV: пушим в сильные дни, отдыхаем в тяжёлые",
    ],
    cta: "За 8 недель — прирост силы и сухой массы без выгорания",
  },
  energy: {
    bullets: [
      "Видим, в какие часы провалы — часто виноват не сон, а что-то другое",
      "AI-терапевт подбирает точечные интервенции: свет, питание, паузы",
      "Еженедельный отчёт: что дало эффект, что можно убрать",
    ],
    cta: "За 8 недель — стабильная энергия с утра до вечера",
  },
  nutrition: {
    bullets: [
      "Дневник питания по фото — без граммов и подсчётов",
      "AI-нутрициолог объясняет выбор, а не навязывает правила",
      "Трекинг реальных маркеров — клетчатка, белок, ультра-обработанные",
    ],
    cta: "За 8 недель — устойчивые пищевые привычки, а не новая диета",
  },
  endurance: {
    bullets: [
      "План кардио под вашу базовую форму и цель — 10 км, полумарафон или просто больше",
      "Неделя сама адаптируется, если пропустили тренировку",
      "Отслеживание VO2max и порогов через данные с часов",
    ],
    cta: "За 8 недель — устойчивый прирост выносливости без травм",
  },
  sleep: {
    bullets: [
      "Анализ с часов/кольца: глубокий сон, REM, пробуждения, HRV",
      "Ритуал отхода ко сну под ваш график, не «ложитесь в 22:00»",
      "Связь: что из дня влияет на ваш сон сильнее всего",
    ],
    cta: "За 8 недель — стабильные 7–9 часов с хорошим восстановлением",
  },
  biological_age: {
    bullets: [
      "Собирает все ваши устройства в одну картину — без ручного сопоставления",
      "Еженедельно пересчитывает биологический возраст",
      "Подбирает 5–10 анализов под вашу картину, без «сдай всё подряд»",
    ],
    cta: "За 8 недель — биовозраст ниже паспортного и дальнейший контроль",
  },
};

export function longyForGoalBlock(goal: Answers["goal"]): LongyUnderGoal | null {
  if (!goal) return null;
  return LONGY_UNDER_GOAL[goal];
}

// ──────────────────────────────────────────────────────────────────────
// EIGHT WEEK PROMISE — что конкретно Longy делает за 8 недель по доменам
// ──────────────────────────────────────────────────────────────────────

export const EIGHT_WEEK_PROMISE: Record<DomainKey, string[]> = {
  habits: [
    "Находим конкретные триггеры: что запускает желание",
    "AI-коуч в моменте предлагает альтернативу — не «запрет», а замену",
    "Трекинг «чистых» дней без навязчивости",
  ],
  movement: [
    "План активности под ваш график — не «час в зале», а короткие сессии в день",
    "Автопересбор плана по HRV и сну: в тяжёлые дни — отдых, в сильные — прогресс",
    "22-минутный протокол для сидячей работы",
  ],
  sleep: [
    "Анализ данных устройств: где именно страдает сон",
    "Ритуал отхода ко сну под ваш график, не «ложитесь в 22:00»",
    "Корреляция: что из дня влияет на сон сильнее всего",
  ],
  nutrition: [
    "Дневник питания по фото — без граммов и подсчётов",
    "AI-нутрициолог объясняет выбор, не навязывает запреты",
    "Отслеживание реальных маркеров — не только калорий",
  ],
  stress: [
    "HRV как ранний маркер перегруза",
    "Короткие практики по 2–5 минут, встроенные в день",
    "Еженедельный отчёт: что разгружает, а что истощает",
  ],
};

/**
 * Переводит «лет потерь» в «биологический возраст -N лет / M мес»
 * для человекопонятной подачи прогресса.
 */
export function formatBioAgeDelta(deltaYears: number): string {
  if (deltaYears < 0.1) return "Первые видимые изменения биовозраста";
  const totalMonths = Math.round(deltaYears * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `−${months} мес. биологического возраста`;
  const yw = years === 1 ? "год" : years < 5 ? "года" : "лет";
  if (months === 0) return `−${years} ${yw} биологического возраста`;
  return `−${years} ${yw} ${months} мес. биологического возраста`;
}
