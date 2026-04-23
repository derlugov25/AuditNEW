import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Line,
  Polygon,
  Circle,
  G,
  Font,
} from "@react-pdf/renderer";
import React from "react";
import path from "path";
import { ScoreResult, DomainScore, DomainKey, WaterfallItem } from "@/lib/scoring";
import {
  AcceleratorInsight,
  ProtectorInsight,
  MaintenanceTip,
  LONGY_FEATURES,
  goalLabel,
  longyScoreLabel,
  goalDomainHeadline,
  coverSubtitle,
  coverCTA,
  verdictLifeYearsHeadlineLines,
  buildMaintenanceTips,
  velocityZoneDescription,
  longyScoreExplanation,
  pickRightCardMetric,
  pickMainDriver,
  longyForGoalBlock,
  EIGHT_WEEK_PROMISE,
  formatBioAgeDelta,
} from "@/lib/insights";
import { Answers } from "@/lib/types";

const fontPath = (rel: string) => path.join(process.cwd(), "src/assets/fonts", rel);

Font.register({
  family: "Geist",
  fonts: [
    { src: fontPath("Geist-Regular.ttf"), fontWeight: 400 },
    { src: fontPath("Geist-Medium.ttf"), fontWeight: 500 },
    { src: fontPath("Geist-SemiBold.ttf"), fontWeight: 600 },
    { src: fontPath("Geist-Bold.ttf"), fontWeight: 700 },
  ],
});

const PALETTE = {
  bg: "#FFFFFF",
  bgSoft: "#F7F7F7",
  border: "#E8E8E8",
  text: "#000000",
  textMuted: "#4A4A4A",
  textFaint: "#B2B2B2",
  accent: "#EA4E1C",
  warm: "#D94010",
  danger: "#c0392b",
  calm: "#00B158",
  amber: "#F5A623",
};

const colorFor = (v: number): string => {
  if (v >= 10) return PALETTE.danger;
  if (v >= 5) return PALETTE.warm;
  if (v >= 2) return PALETTE.amber;
  return PALETTE.calm;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bg,
    color: PALETTE.text,
    paddingTop: 40,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 70,
    fontFamily: "Geist",
    fontSize: 11,
    lineHeight: 1.55,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PALETTE.accent,
  },
  brandName: {
    fontFamily: "Geist",
    fontSize: 14,
    fontWeight: 600,
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  mono: {
    fontFamily: "Geist",
    fontSize: 9,
    letterSpacing: 1,
    color: PALETTE.textFaint,
    textTransform: "uppercase",
  },
  display: {
    fontFamily: "Geist",
    fontWeight: 600,
    color: PALETTE.text,
    letterSpacing: -0.5,
  },
  verdictTitle: {
    fontFamily: "Geist",
    fontWeight: 700,
    fontSize: 28,
    lineHeight: 1.25,
    letterSpacing: -0.6,
    color: PALETTE.text,
  },
  verdictTitleFigures: {
    fontFamily: "Geist",
    fontWeight: 700,
    fontSize: 30,
    lineHeight: 1.2,
    letterSpacing: -0.8,
    color: PALETTE.text,
  },
  numStat: {
    fontFamily: "Geist",
    fontWeight: 700,
    color: PALETTE.text,
    letterSpacing: -1.2,
    lineHeight: 1,
  },
  chip: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    color: PALETTE.textMuted,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 20,
    padding: 18,
    backgroundColor: PALETTE.bgSoft,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    color: PALETTE.textFaint,
    fontSize: 8,
  },
});

interface ReportProps {
  answers: Answers;
  score: ScoreResult;
  accelerators: AcceleratorInsight[];
  protectors: ProtectorInsight[];
}

export const Report: React.FC<ReportProps> = ({
  answers,
  score,
  accelerators,
  protectors,
}) => {
  const date = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const name = (answers.name ?? "").trim();

  return (
    <Document title={`Longy audit · ${name || "report"}`}>
      <TitlePage name={name} date={date} />
      <CoverPage score={score} answers={answers} />
      <VerdictPage score={score} answers={answers} />
      <AcceleratorsPage accelerators={accelerators} score={score} />
      <ProjectionPage score={score} />
      <RadarPage score={score} protectors={protectors} />
      <LongyPage answers={answers} />
      <FinalPage name={name} score={score} answers={answers} />
    </Document>
  );
};

const TitlePage: React.FC<{ name: string; date: string }> = ({ name, date }) => {
  const displayName = name || "—";
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.brand}>
        <View style={styles.brandDot} />
        <Text style={styles.brandName}>Longy</Text>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          gap: 32,
        }}
      >
        <View style={{ gap: 14 }}>
          <Text
            style={{
              color: PALETTE.textFaint,
              fontSize: 10,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Персональный отчёт
          </Text>
          <Text
            style={[
              styles.display,
              {
                fontSize: 64,
                lineHeight: 1.02,
                maxWidth: 480,
              },
            ]}
          >
            {displayName}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: PALETTE.border,
            maxWidth: 120,
          }}
        />

        <Text
          style={{
            color: PALETTE.textMuted,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {date}
        </Text>
      </View>

      <Footer />
    </Page>
  );
};

const Header = ({ ordinal, label }: { ordinal: string; label: string }) => (
  <View style={styles.pageHeader}>
    <View style={styles.brand}>
      <View style={styles.brandDot} />
      <Text style={styles.brandName}>Longy</Text>
    </View>
    <Text style={styles.mono}>
      {ordinal} · {label}
    </Text>
  </View>
);

const Footer = () => (
  <View style={styles.pageFooter} fixed>
    <View style={{ gap: 2 }}>
      <Text style={{ color: PALETTE.textMuted, fontSize: 9 }}>longy.ai</Text>
      <Text style={{ color: PALETTE.textFaint, fontSize: 9 }}>info@longy.ai</Text>
    </View>
    <View style={{ gap: 2, alignItems: "flex-end" }}>
      <Text style={{ color: PALETTE.textMuted, fontSize: 9 }}>Not a clinical diagnosis</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Text style={{ color: PALETTE.textFaint, fontSize: 9 }}>Конфиденциальность</Text>
        <Text style={{ color: PALETTE.textFaint, fontSize: 9 }}>Условия</Text>
      </View>
    </View>
  </View>
);

const CoverPage: React.FC<{ score: ScoreResult; answers: Answers }> = ({ score, answers }) => {
  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="02" label="Обложка" />
      <View wrap={false} style={{ marginTop: 20, gap: 16 }}>
        <Text style={styles.chip}>Потеря здоровых лет</Text>
        <Text style={[styles.display, { fontSize: 40, lineHeight: 1.08, letterSpacing: 0 }]}>
          Ваш организм{"\n"}
          <Text style={{ color: PALETTE.accent }}>стареет</Text>{" "}
          не так, как{"\n"}
          календарь
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: 12, maxWidth: 440, lineHeight: 1.5 }}>
          {coverSubtitle(score)}
        </Text>
        <Text
          style={{
            color: PALETTE.textFaint,
            fontSize: 9,
            letterSpacing: 0.4,
            marginTop: 2,
          }}
        >
          Методология: Li et al., J Intern Med 2024 · 5 доменов · 21 параметр + хронические заболевания
        </Text>
      </View>

      <View wrap={false} style={{ marginTop: 44, flexDirection: "row", gap: 12 }}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.mono}>Longy Score *</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 10 }}>
            <Text
              style={[
                styles.numStat,
                { fontSize: 44, color: longyScoreTone(score.longyScoreBand) },
              ]}
            >
              {score.longyScore}
            </Text>
            <Text style={{ color: PALETTE.textFaint, fontSize: 14 }}>/ 100</Text>
          </View>
          <Text style={{ color: PALETTE.textMuted, marginTop: 10, fontSize: 10 }}>
            {longyScoreLabel(score.longyScoreBand).label}
          </Text>
        </View>

        {(() => {
          const md = pickMainDriver(answers, score);
          if (!md) {
            return (
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.mono}>Главный драйвер</Text>
                <Text style={[styles.display, { fontSize: 18, marginTop: 10, lineHeight: 1.15 }]}>—</Text>
              </View>
            );
          }
          return (
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.mono}>Главный драйвер</Text>
              <Text style={[styles.display, { fontSize: 16, marginTop: 10, lineHeight: 1.2 }]}>
                {md.headline}
              </Text>
              <Text style={{ color: PALETTE.textMuted, marginTop: 6, fontSize: 10, lineHeight: 1.4 }}>
                {md.subtext}
              </Text>
              <Text style={{ color: PALETTE.warm, marginTop: 8, fontSize: 10 }}>
                ≈{md.domain.yearsLifeLost.toFixed(1)} лет здоровой жизни
              </Text>
            </View>
          );
        })()}

        {(() => {
          const m = pickRightCardMetric(score);
          const valueColor =
            m.tone === "danger"
              ? PALETTE.danger
              : m.tone === "warn"
                ? PALETTE.warm
                : PALETTE.text;
          return (
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.mono}>{m.label}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                <Text style={[styles.numStat, { fontSize: 40, color: valueColor }]}>
                  {m.value}
                </Text>
                {m.type === "domain" && (
                  <Text style={{ color: PALETTE.textFaint, fontSize: 14 }}>/ 100</Text>
                )}
              </View>
              <Text style={{ color: PALETTE.textMuted, marginTop: 10, fontSize: 10 }}>
                {m.sublabel}
              </Text>
            </View>
          );
        })()}
      </View>

      <Text
        style={{
          color: PALETTE.textFaint,
          fontSize: 8,
          lineHeight: 1.4,
          marginTop: 10,
          maxWidth: 480,
        }}
      >
        * {longyScoreExplanation()}
      </Text>

      <Footer />
    </Page>
  );
};

const VerdictPage: React.FC<{ score: ScoreResult; answers: Answers }> = ({
  score,
  answers,
}) => {
  const velocity = score.agingVelocityPct;
  const isGain = score.yearsLifeLostTotal < 0.5;
  const verdictText = isGain
    ? "Ниже — разбор по 5 факторам вашего образа жизни. Что уже работает на вас и где ещё есть запас для точечной настройки."
    : "Ниже — разбор по 5 факторам вашего образа жизни. Сколько лет здоровой жизни «стоит» каждый из них и что можно вернуть за 8 недель с Longy.";

  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="03" label="Главный вывод" />
      <View wrap={false} style={{ gap: 12 }}>
        <Text style={styles.chip}>Вердикт</Text>
        {(() => {
          const lines = verdictLifeYearsHeadlineLines(score);
          if (!lines) {
            return (
              <Text style={styles.verdictTitle}>
                Потерь здоровых лет по этой модели почти не видно
              </Text>
            );
          }
          return (
            <View style={{ gap: 8 }}>
              <Text style={styles.verdictTitle}>{lines[0]}</Text>
              <Text style={styles.verdictTitleFigures}>{lines[1]}</Text>
              <Text style={styles.verdictTitle}>{lines[2]}</Text>
            </View>
          );
        })()}
        <Text style={{ color: PALETTE.textMuted, fontSize: 12, maxWidth: 480, marginTop: 6 }}>
          {verdictText}
        </Text>
      </View>

      <View wrap={false}>
        <HealthspanStrip score={score} />
      </View>

      <View wrap={false} style={{ marginTop: 18, alignItems: "center", gap: 6 }}>
        <Text style={[styles.mono, { textAlign: "center" }]}>
          Где вы сейчас находитесь по вашей скорости старения
        </Text>
        <SpeedometerSvg velocity={velocity} width={300} />
        <Text
          style={{
            color: PALETTE.text,
            fontSize: 11,
            fontWeight: "bold",
            textAlign: "center",
            maxWidth: 440,
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {velocityZoneDescription(velocity)}
        </Text>
      </View>

      <View
        wrap={false}
        style={{
          marginTop: 10,
          flexDirection: "row",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <LegendPill color={PALETTE.calm} label="Ниже нормы" />
        <LegendPill color={PALETTE.accent} label="Норма" />
        <LegendPill color={PALETTE.amber} label="Внимание" />
        <LegendPill color={PALETTE.warm} label="Риск" />
        <LegendPill color={PALETTE.danger} label="Критично" />
      </View>

      <View wrap={false} style={{ marginTop: 24, flexDirection: "row", gap: 10 }}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.mono}>Ваша цель</Text>
          <Text style={{ color: PALETTE.text, marginTop: 6, fontSize: 13 }}>
            {goalLabel(answers.goal)}
          </Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.mono}>Трекеры</Text>
          <Text style={{ color: PALETTE.text, marginTop: 6, fontSize: 13 }}>
            {answers.trackers && answers.trackers.length > 0
              ? answers.trackers.map(trackerLabel).join(", ")
              : "Пока не используете"}
          </Text>
        </View>
      </View>

      {(() => {
        const g = goalDomainHeadline(
          answers.goal,
          score.goalDomain,
          score.goalDomainScore?.score0to100 ?? null,
        );
        if (!g || !score.goalDomainScore) return null;
        const tone = g.mode === "strength" ? PALETTE.accent : PALETTE.warm;
        return (
          <View
            wrap={false}
            style={{
              marginTop: 14,
              borderRadius: 14,
              padding: 14,
              backgroundColor: "#FEF0EB",
              borderWidth: 1,
              borderColor: tone,
            }}
          >
            <Text style={[styles.mono, { color: tone }]}>{g.label}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 8,
                marginTop: 6,
              }}
            >
              <Text style={[styles.display, { fontSize: 15, lineHeight: 1.2 }]}>
                {score.goalDomainScore.label}
              </Text>
              <Text style={{ color: tone, fontSize: 11 }}>
                {score.goalDomainScore.score0to100}/100
              </Text>
            </View>
            <Text
              style={{
                color: PALETTE.textMuted,
                fontSize: 10,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {g.reason}
            </Text>
            {(() => {
              const lg = longyForGoalBlock(answers.goal);
              if (!lg) return null;
              return (
                <View style={{ marginTop: 12, gap: 6 }}>
                  <Text style={[styles.mono, { color: PALETTE.accent }]}>
                    Что Longy делает под вашу цель
                  </Text>
                  {lg.bullets.map((b, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 6 }}>
                      <Text style={{ color: PALETTE.accent, fontSize: 10 }}>·</Text>
                      <Text style={{ color: PALETTE.text, fontSize: 10, lineHeight: 1.5, flex: 1 }}>
                        {b}
                      </Text>
                    </View>
                  ))}
                  <Text
                    style={{
                      color: PALETTE.accent,
                      fontSize: 11,
                      fontWeight: "bold",
                      marginTop: 4,
                    }}
                  >
                    {lg.cta}
                  </Text>
                </View>
              );
            })()}
          </View>
        );
      })()}

      <Footer />
    </Page>
  );
};

const HealthspanStrip: React.FC<{ score: ScoreResult }> = ({ score }) => {
  const years = score.healthspanYears;
  const max = score.healthspanMax;
  const gap = Math.max(0, Math.round((max - years) * 10) / 10);
  const fillPct = Math.max(0, Math.min(1, years / max));
  const gapColor =
    gap >= 5 ? PALETTE.danger : gap >= 3 ? PALETTE.warm : gap >= 1.5 ? PALETTE.amber : PALETTE.accent;
  const narrative =
    gap < 1
      ? `Ваш образ жизни уже реализует почти весь потенциал — +${years.toFixed(1)} из возможных +${max} здоровых лет.* Отчёт подсвечивает точки, где можно дожать остаток.`
      : `Идеальный образ жизни по 5 факторам даёт до +${max} дополнительных здоровых лет.* Сейчас вы набираете +${years.toFixed(1)} — ещё +${gap} остаются в запасе и возвращаются привычками.`;

  return (
    <View
      style={{
        marginTop: 18,
        borderRadius: 16,
        padding: 16,
        backgroundColor: PALETTE.bgSoft,
        borderWidth: 1,
        borderColor: PALETTE.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 18,
      }}
    >
      <View style={{ minWidth: 140 }}>
        <Text style={styles.mono}>Healthspan · Li et al. 2024</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 6,
            marginTop: 6,
          }}
        >
          <Text
            style={[
              styles.numStat,
              { fontSize: 36, color: gapColor },
            ]}
          >
            +{gap.toFixed(1)}
          </Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: 11 }}>лет возможно получить</Text>
        </View>
        <Text style={{ color: PALETTE.textMuted, fontSize: 9, marginTop: 4 }}>
          сейчас у вас +{years.toFixed(1)} из максимальных +{max}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: PALETTE.textMuted, fontSize: 11, lineHeight: 1.5 }}>
          {narrative}
        </Text>
        <View
          style={{
            marginTop: 10,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#E8E8E8",
            overflow: "hidden",
            flexDirection: "row",
          }}
        >
          <View
            style={{
              width: `${Math.round(fillPct * 100)}%`,
              height: "100%",
              backgroundColor: PALETTE.accent,
              opacity: 0.5,
            }}
          />
          <View
            style={{
              flex: 1,
              height: "100%",
              backgroundColor: gapColor,
            }}
          />
        </View>
      </View>
    </View>
  );
};

const AcceleratorsPage: React.FC<{
  accelerators: AcceleratorInsight[];
  score: ScoreResult;
}> = ({ accelerators, score }) => {
  const isOptimizing =
    score.longyScoreBand === "excellent" || score.longyScoreBand === "good";

  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="04" label={isOptimizing ? "Тонкая настройка" : "Топ-3 ускорителя"} />
      <View wrap={false} style={{ gap: 12 }}>
        <Text style={styles.chip}>
          {isOptimizing ? "Маржинальный потенциал" : "Ваши личные драйверы"}
        </Text>
        <Text style={[styles.display, { fontSize: 26, lineHeight: 1.15 }]}>
          {isOptimizing
            ? "Где есть потенциал для роста"
            : "Что именно «стоит» в годах здоровой жизни"}
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: 11 }}>
          {isOptimizing
            ? "У вас крепкая база. Ниже — три домена с наибольшим маржинальным потенциалом. Каждый шаг небольшой, но они усиливают друг друга."
            : "Отсортировано по влиянию на потерю здоровых лет. Работайте сверху вниз — первый даст самый быстрый эффект."}
        </Text>
      </View>

      <View style={{ marginTop: 20, gap: 10 }}>
        {accelerators.map((acc, idx) => {
          const dom = score.domains[acc.key];
          const dotColor = isOptimizing ? PALETTE.calm : colorFor(dom.velocityContribution);
          const actionBorderColor = isOptimizing ? PALETTE.calm : PALETTE.accent;
          const actionBg = isOptimizing ? "#EBF8F1" : "#FEF0EB";
          const actionLabel = isOptimizing ? "Как усилить" : "Что делать";
          return (
            <View
              wrap={false}
              key={acc.key}
              style={[styles.card, { flexDirection: "row", gap: 14 }]}
            >
              <View style={{ width: 54, alignItems: "center" }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#F0F0F0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: dotColor,
                    }}
                  />
                </View>
                <Text style={[styles.mono, { marginTop: 8 }]}>#{idx + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.mono}>{dom.label}</Text>
                <Text style={[styles.display, { fontSize: 16, marginTop: 4 }]}>
                  {acc.headline}
                </Text>
                {!isOptimizing && (
                  <Text style={{ color: dotColor, fontSize: 10, marginTop: 4 }}>
                    {acc.yearsLostEstimate}
                  </Text>
                )}
                <Text
                  style={{
                    color: PALETTE.textMuted,
                    marginTop: 8,
                    fontSize: 11,
                    lineHeight: 1.5,
                  }}
                >
                  {acc.detail}
                </Text>

                <View
                  style={{
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: actionBorderColor,
                    backgroundColor: actionBg,
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <Text style={[styles.mono, { color: actionBorderColor }]}>{actionLabel}</Text>
                  <Text
                    style={{ color: PALETTE.text, fontSize: 11, marginTop: 4, lineHeight: 1.5 }}
                  >
                    {acc.action}
                  </Text>
                </View>

                <Text
                  style={{
                    color: PALETTE.textFaint,
                    fontSize: 9,
                    marginTop: 8,
                  }}
                >
                  {acc.evidence}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Footer />
    </Page>
  );
};

const ProjectionPage: React.FC<{ score: ScoreResult }> = ({ score }) => {
  const proj = score.projection;
  const hasLeverage = proj.deltaScore > 0;
  const isOptimizing =
    score.longyScoreBand === "excellent" || score.longyScoreBand === "good";
  const maintenanceTips = isOptimizing && !hasLeverage ? buildMaintenanceTips(score) : [];

  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="05" label={isOptimizing && !hasLeverage ? "Протокол поддержания" : "Цена и проекция"} />
      <View wrap={false} style={{ gap: 12 }}>
        <Text style={styles.chip}>
          {isOptimizing && !hasLeverage ? "Стратегия удержания результата" : "Из чего складывается потеря лет"}
        </Text>
        <Text style={[styles.display, { fontSize: 26, lineHeight: 1.15 }]}>
          {isOptimizing && !hasLeverage
            ? "Как закрепить то, что уже работает"
            : "Сколько здоровых лет «стоит» каждый домен — и что вернуть, если починить топ-3"}
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: 11, maxWidth: 480 }}>
          {isOptimizing && !hasLeverage
            ? "Ваши домены уже на сильном уровне. Главная задача теперь — системное поддержание. Ниже — конкретные правила по каждому домену."
            : "Слева — разложение потери здоровых лет по доменам (модель отчёта). Справа — проекция Longy Score, если подтянуть три главных ускорителя до уровня 75/100."}
        </Text>
      </View>

      {/* Waterfall: всегда показываем, даже для отличников — информативен */}
      <View wrap={false} style={{ marginTop: 22 }}>
        <Text style={styles.mono}>
          Waterfall · ≈{score.yearsLifeLostTotal.toFixed(1)} лет здоровой жизни
        </Text>
        <View style={{ marginTop: 10 }}>
          <WaterfallSvg
            items={score.velocityWaterfall}
            totalYears={score.yearsLifeLostTotal}
            width={515}
            height={200}
          />
        </View>
      </View>

      {/* Нижний блок: проекция роста ИЛИ протокол поддержания */}
      {isOptimizing && !hasLeverage ? (
        <MaintenanceGrid tips={maintenanceTips} />
      ) : (
        <View
          wrap={false}
          style={{
            marginTop: 24,
            borderRadius: 18,
            padding: 18,
            backgroundColor: PALETTE.bgSoft,
            borderWidth: 1,
            borderColor: PALETTE.border,
          }}
        >
          <Text style={styles.mono}>Если закрыть топ-3 · 8 недель с Longy</Text>

          <View style={{ marginTop: 12, flexDirection: "row", gap: 18, alignItems: "center" }}>
            <ImpactPreviewSvg
              scoreNow={proj.longyScoreNow}
              scoreTarget={proj.longyScoreTarget}
              width={230}
              height={130}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.display, { fontSize: 18, lineHeight: 1.25 }]}>
                {formatBioAgeDelta(proj.yearsLifeLostNow - proj.yearsLifeLostTarget)}
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: 11, lineHeight: 1.55 }}>
                Longy Score вырастет с{" "}
                <Text style={{ color: PALETTE.textMuted }}>{proj.longyScoreNow}</Text>{" "}
                до <Text style={{ color: PALETTE.accent }}>{proj.longyScoreTarget}</Text>.
                Вот что конкретно Longy делает по трём главным рычагам:
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {proj.targets.map((d) => {
              const bullets = EIGHT_WEEK_PROMISE[d.key] ?? [];
              return (
                <View key={d.key} style={{ gap: 4 }}>
                  <Text
                    style={{
                      color: PALETTE.accent,
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  >
                    {d.label}
                  </Text>
                  {bullets.map((b, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 6, marginLeft: 6 }}>
                      <Text style={{ color: PALETTE.accent, fontSize: 10 }}>·</Text>
                      <Text style={{ color: PALETTE.text, fontSize: 10, lineHeight: 1.5, flex: 1 }}>
                        {b}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      )}

      <Footer />
    </Page>
  );
};

const MaintenanceGrid: React.FC<{ tips: MaintenanceTip[] }> = ({ tips }) => (
  <View wrap={false} style={{ marginTop: 24, gap: 8 }}>
    <Text style={styles.mono}>Протокол поддержания · по каждому домену</Text>
    <View style={{ marginTop: 6, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {tips.map((t) => (
        <View
          key={t.key}
          style={[styles.card, { flex: 1, minWidth: 220 }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: PALETTE.calm }}
            />
            <Text style={[styles.mono, { color: PALETTE.calm }]}>{t.label}</Text>
          </View>
          <Text
            style={{ color: PALETTE.textMuted, fontSize: 10, marginTop: 6, lineHeight: 1.5 }}
          >
            {t.tip}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const RadarPage: React.FC<{
  score: ScoreResult;
  protectors: ProtectorInsight[];
}> = ({ score, protectors }) => {
  const domains = Object.values(score.domains);
  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="06" label="Карта состояния" />
      <View style={{ gap: 12 }}>
        <Text style={styles.chip}>5 доменов</Text>
        <Text style={[styles.display, { fontSize: 26 }]}>
          Где вы сейчас — по каждой оси здоровья
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: 11, maxWidth: 460 }}>
          100 — оптимальный уровень. Чем ближе к центру, тем больше этот домен добавляет к
          оценке потери здоровых лет.
        </Text>
      </View>

      <View wrap={false} style={{ marginTop: 18, flexDirection: "row", gap: 18, alignItems: "center" }}>
        <RadarSvg domains={domains} size={260} />
        <View style={{ flex: 1, gap: 8 }}>
          {domains.map((d) => (
            <DomainRow key={d.key} domain={d} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 22 }}>
        <Text style={styles.mono}>Что вас защищает</Text>
        <Text style={[styles.display, { fontSize: 18, marginTop: 6 }]}>Сильные стороны</Text>
        {protectors.length === 0 ? (
          <View style={[styles.card, { marginTop: 10 }]}>
            <Text style={{ color: PALETTE.textMuted, fontSize: 11, lineHeight: 1.6 }}>
              Пока нет доменов в защитной зоне. Это не приговор — это стартовая точка. У 86%
              пользователей Longy хотя бы один домен переходит в зелёную зону за 8 недель.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 10, flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {protectors.map((p) => (
              <View key={p.key} style={[styles.card, { flex: 1, minWidth: 220 }]}>
                <Text style={[styles.display, { fontSize: 14 }]}>{p.headline}</Text>
                <Text
                  style={{
                    color: PALETTE.textMuted,
                    fontSize: 10,
                    marginTop: 6,
                    lineHeight: 1.55,
                  }}
                >
                  {p.detail}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Footer />
    </Page>
  );
};

const LongyPage: React.FC<{ answers: Answers }> = () => (
  <Page size="A4" style={styles.page}>
    <Header ordinal="07" label="Как Longy берёт это на себя" />
    <View style={{ gap: 12 }}>
      <Text style={styles.chip}>Longy · Ваш AI health manager</Text>
      <Text style={[styles.display, { fontSize: 26, lineHeight: 1.15 }]}>
        Три вещи, которых нет больше{"\n"}ни в одном приложении
      </Text>
      <Text style={{ color: PALETTE.textMuted, fontSize: 11, maxWidth: 480 }}>
        Longy объединяет данные с Whoop, Oura, Apple Watch, Garmin и умных весов. Внутри
        работают AI-нутрициолог, AI-коуч, AI-терапевт и health manager — одновременно.
      </Text>
    </View>

    <View style={{ marginTop: 20, gap: 10 }}>
      {LONGY_FEATURES.map((f, i) => (
        <View key={f.title} style={[styles.card, { flexDirection: "row", gap: 14 }]}>
          <View style={{ width: 48 }}>
            <Text
              style={[
                styles.display,
                { fontSize: 28, color: PALETTE.accent, lineHeight: 1 },
              ]}
            >
              0{i + 1}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.display, { fontSize: 17 }]}>{f.title}</Text>
            <Text style={{ color: PALETTE.accent, fontSize: 10, marginTop: 4 }}>
              {f.tagline}
            </Text>
            <Text
              style={{
                color: PALETTE.textMuted,
                fontSize: 11,
                marginTop: 8,
                lineHeight: 1.55,
              }}
            >
              {f.description}
            </Text>
            <Text
              style={{
                color: PALETTE.textFaint,
                fontSize: 10,
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              {f.why}
            </Text>
          </View>
        </View>
      ))}
    </View>

    <Footer />
  </Page>
);

const FinalPage: React.FC<{
  name: string;
  score: ScoreResult;
  answers: Answers;
}> = ({ name, score, answers }) => {
  const conditionsRaw = answers.conditions ?? [];
  const hasConditions = conditionsRaw.some(
    (c) => c && c !== "none" && c !== "prefer_not_to_say",
  );
  const cta = coverCTA(score);

  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="08" label="Следующий шаг" />
      <View style={{ gap: 14 }}>
        <Text style={styles.chip}>Глубокий аудит в приложении Longy</Text>
        <Text style={[styles.display, { fontSize: 30, lineHeight: 1.12 }]}>
          {name ? `${name}, ` : ""}этот отчёт — первый срез.{"\n"}
          <Text style={{ color: PALETTE.accent }}>Глубже мы идём в приложении.</Text>
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: 12, maxWidth: 480, lineHeight: 1.55 }}>
          В Longy мы подключаем данные с ваших устройств (Whoop, Oura, Apple Watch),
          анализируем сон, HRV, стресс и активность в динамике, подбираем 5–10 анализов
          под вашу картину и составляем протокол на 8 недель.
          {hasConditions ? " С учётом ваших диагнозов и противопоказаний." : ""}
        </Text>
      </View>

      <View style={{ marginTop: 22, gap: 10 }}>
        <RoadmapRow num="7 дней" text="Подключение устройств и первые 3 шага протокола" />
        <RoadmapRow num="21 день" text="Видимые изменения HRV, сна и энергии" />
        <RoadmapRow
          num="8 недель"
          text={`Проекция: Longy Score ${score.longyScore} → ${score.projection.longyScoreTarget}, минус ~${Math.max(
            0,
            Math.round(
              (score.yearsLifeLostTotal - score.projection.yearsLifeLostTarget) * 10,
            ) / 10,
          )} лет потерь здоровья`}
        />
        <RoadmapRow num="6 месяцев" text="Повторные анализы, динамика биомаркеров, корректировка плана" />
      </View>

      <View
        style={{
          marginTop: 24,
          borderRadius: 20,
          padding: 20,
          backgroundColor: PALETTE.bgSoft,
          borderWidth: 1,
          borderColor: PALETTE.accent,
        }}
      >
        <Text style={[styles.mono, { color: PALETTE.accent }]}>Что дальше</Text>
        <Text style={[styles.display, { fontSize: 18, marginTop: 6, lineHeight: 1.25 }]}>
          Получить глубокий аудит в приложении
        </Text>
        <Text
          style={{
            color: PALETTE.textMuted,
            fontSize: 11,
            marginTop: 8,
            lineHeight: 1.55,
          }}
        >
          {cta}
        </Text>
        <Text style={{ color: PALETTE.accent, fontSize: 12, marginTop: 12, fontWeight: 600 }}>
          longy.health/app
        </Text>
      </View>

      <ScientificCredibilityBlock />

      <Footer />
    </Page>
  );
};

const SCIENTIFIC_INSTRUMENTS = [
  "University of Pennsylvania",
  "National Institutes of Health",
  "International Mediation Campus",
  "Duke Health",
];

const ScientificCredibilityBlock: React.FC = () => (
  <View
    wrap={false}
    style={{
      marginTop: 18,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: PALETTE.border,
      backgroundColor: "#FFFFFF",
    }}
  >
    <Text style={{ color: PALETTE.text, fontSize: 10, lineHeight: 1.55 }}>
      Отчёт построен на клинически валидированных скрининговых инструментах с
      подтверждёнными психометрическими свойствами: Insomnia Severity Index (ISI-7) для
      оценки сна, Perceived Stress Scale (PSS-10) и PROMIS Fatigue 7a для стресса и
      энергии, Duke Activity Status Index (DASI) и IPAQ-SF для функционального статуса и
      физической активности, Mini-EAT для питания.
    </Text>
    <Text style={{ color: PALETTE.text, fontSize: 10, lineHeight: 1.55, marginTop: 10 }}>
      * Методология Longy вдохновлена исследованием Li et al. (Harvard Medical School,
      J Intern Med 2024) о 5 факторах долголетия, дающих до +12 лет здоровой жизни на
      выборке 2 млн+ человек. Применён собственный алгоритм калибровки под
      скрининговый контекст. Longy — wellness-сервис: выводы не заменяют медицинскую
      диагностику и консультацию врача. При хронических заболеваниях обсуждайте любые
      изменения образа жизни с лечащим врачом.
    </Text>
    <View
      style={{
        marginTop: 14,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {SCIENTIFIC_INSTRUMENTS.map((label) => (
        <View
          key={label}
          style={{
            borderWidth: 1,
            borderColor: PALETTE.border,
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 10,
            backgroundColor: PALETTE.bgSoft,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              color: PALETTE.textMuted,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const RoadmapRow = ({ num, text }: { num: string; text: string }) => (
  <View
    style={{
      flexDirection: "row",
      borderWidth: 1,
      borderColor: PALETTE.border,
      borderRadius: 14,
      padding: 14,
      gap: 14,
      alignItems: "center",
    }}
  >
    <Text
      style={[
        styles.display,
        { fontSize: 16, color: PALETTE.accent, width: 80 },
      ]}
    >
      {num}
    </Text>
    <Text style={{ color: PALETTE.text, fontSize: 11, flex: 1, lineHeight: 1.5 }}>{text}</Text>
  </View>
);

const DomainRow = ({ domain }: { domain: DomainScore }) => {
  const color = domainColor(domain);
  const width = Math.max(4, (domain.score0to100 / 100) * 200);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text style={{ color: PALETTE.text, fontSize: 10 }}>{domain.label}</Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: 8, marginTop: 2 }}>
            ≈{domain.yearsLifeLost.toFixed(1)} лет в модели
          </Text>
        </View>
        <Text style={{ color, fontSize: 10, fontFamily: "Geist" }}>{domain.score0to100}</Text>
      </View>
      <View
        style={{
          height: 5,
          borderRadius: 3,
          backgroundColor: "#EBEBEB",
          overflow: "hidden",
        }}
      >
        <View style={{ width, height: 5, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
};

const LegendPill = ({ color, label }: { color: string; label: string }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: PALETTE.border,
    }}
  >
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    <Text style={{ color: PALETTE.textMuted, fontSize: 8 }}>{label}</Text>
  </View>
);

const WaterfallSvg = ({
  items,
  totalYears,
  width,
  height,
}: {
  items: WaterfallItem[];
  totalYears: number;
  width: number;
  height: number;
}) => {
  const padLeft = 110;
  const padRight = 40;
  const padTop = 10;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const allY = items.map((i) => i.yearsLost);
  const positives = allY.filter((d) => d > 0).reduce((s, d) => s + d, 0);
  const negatives = allY.filter((d) => d < 0).reduce((s, d) => s + d, 0);

  const maxCum = Math.max(positives, totalYears + 0.5);
  const minCum = Math.min(negatives, 0);
  const yRange = maxCum - minCum || 1;

  const yFor = (value: number) => {
    const frac = (maxCum - value) / yRange;
    return padTop + frac * chartH;
  };

  const cols = items.length + 1;
  const colW = chartW / cols;
  const barW = Math.min(28, colW * 0.6);

  const baselineY = yFor(0);

  let cumulative = 0;
  const bars = items.map((item, i) => {
    const startCum = cumulative;
    cumulative += item.yearsLost;
    const endCum = cumulative;
    const high = Math.max(startCum, endCum);
    const low = Math.min(startCum, endCum);
    const yTop = yFor(high);
    const yBot = yFor(low);
    const x = padLeft + i * colW + (colW - barW) / 2;
    const isPositive = item.yearsLost >= 0;
    const color = isPositive ? colorFor(item.delta) : PALETTE.calm;
    return {
      key: item.key,
      label: item.label,
      yearsLost: item.yearsLost,
      x,
      yTop,
      yBot,
      color,
      startCum,
      endCum,
    };
  });

  const totalX = padLeft + items.length * colW + (colW - barW) / 2;
  const totalYTop = yFor(Math.max(0, totalYears));
  const totalYBot = yFor(Math.min(0, totalYears));
  const totalColor =
    totalYears > 6 ? PALETTE.warm : totalYears > 2 ? PALETTE.amber : PALETTE.accent;

  return (
    <View style={{ width, height, position: "relative" }}>
      <Svg width={width} height={height}>
        {/* Шкала слева: метки 0 и max */}
        <Line
          x1={padLeft}
          y1={baselineY}
          x2={width - padRight}
          y2={baselineY}
          stroke={PALETTE.border}
          strokeWidth={1}
        />

        {/* Столбцы доменов */}
        {bars.map((b, i) => {
          const next = i < bars.length - 1 ? bars[i + 1] : null;
          return (
            <G key={b.key}>
              <Path
                d={`M ${b.x} ${b.yTop} L ${b.x + barW} ${b.yTop} L ${b.x + barW} ${b.yBot} L ${b.x} ${b.yBot} Z`}
                fill={b.color}
                opacity={0.85}
              />
              {next && (
                <Line
                  x1={b.x + barW}
                  y1={yFor(b.endCum)}
                  x2={next.x}
                  y2={yFor(b.endCum)}
                  stroke={PALETTE.textFaint}
                  strokeWidth={0.8}
                  strokeDasharray="2 2"
                />
              )}
            </G>
          );
        })}

        {/* Итоговый столбец */}
        <Path
          d={`M ${totalX} ${totalYTop} L ${totalX + barW} ${totalYTop} L ${totalX + barW} ${totalYBot} L ${totalX} ${totalYBot} Z`}
          fill={totalColor}
        />
        <Line
          x1={bars.length > 0 ? bars[bars.length - 1].x + barW : padLeft}
          y1={yFor(cumulative)}
          x2={totalX}
          y2={yFor(cumulative)}
          stroke={PALETTE.textFaint}
          strokeWidth={0.8}
          strokeDasharray="2 2"
        />
      </Svg>

      {/* Подписи баров снизу и значений сверху */}
      {bars.map((b) => {
        const labelTop = b.yearsLost >= 0 ? b.yTop - 14 : b.yBot + 2;
        const yv = b.yearsLost;
        return (
          <View key={`lbl-${b.key}`} style={{ position: "absolute", left: b.x - 18, width: barW + 36 }}>
            <Text
              style={{
                position: "absolute",
                top: labelTop,
                width: barW + 36,
                textAlign: "center",
                fontSize: 8,
                color: b.color,
                fontWeight: 600,
              }}
            >
              {yv > 0 ? "+" : ""}
              {yv.toFixed(1)} лет
            </Text>
            <Text
              style={{
                position: "absolute",
                top: height - padBottom + 4,
                width: barW + 36,
                textAlign: "center",
                fontSize: 7,
                color: PALETTE.textMuted,
                lineHeight: 1.2,
              }}
            >
              {shortLabelFor(b.key, b.label)}
            </Text>
          </View>
        );
      })}

      {/* Итоговая подпись */}
      <View style={{ position: "absolute", left: totalX - 18, width: barW + 36 }}>
        <Text
          style={{
            position: "absolute",
            top: totalYTop - 14,
            width: barW + 36,
            textAlign: "center",
            fontSize: 9,
            color: totalColor,
            fontWeight: 700,
          }}
        >
          ≈{totalYears.toFixed(1)} лет
        </Text>
        <Text
          style={{
            position: "absolute",
            top: height - padBottom + 4,
            width: barW + 36,
            textAlign: "center",
            fontSize: 7,
            color: PALETTE.text,
            fontWeight: 600,
          }}
        >
          Итого
        </Text>
      </View>
    </View>
  );
};

const shortLabelFor = (key: string, fallback: string): string => {
  const map: Record<string, string> = {
    stress: "Стресс",
    sleep: "Сон",
    movement: "Движение",
    nutrition: "Питание",
    habits: "Привычки",
    bmi: "ИМТ / талия",
  };
  return map[key] ?? fallback;
};

const ImpactPreviewSvg = ({
  scoreNow,
  scoreTarget,
  width,
  height,
}: {
  scoreNow: number;
  scoreTarget: number;
  width: number;
  height: number;
}) => {
  const padTop = 28;
  const padBottom = 26;
  const chartH = height - padTop - padBottom;
  const barW = 54;
  const gap = 30;
  const groupW = barW * 2 + gap;
  const leftX = (width - groupW) / 2;
  const rightX = leftX + barW + gap;

  const scale = (value: number) => (value / 100) * chartH;
  const nowH = scale(scoreNow);
  const targetH = scale(scoreTarget);
  const baseY = padTop + chartH;

  const nowColor = scoreNow >= 70 ? PALETTE.accent : scoreNow >= 55 ? PALETTE.amber : PALETTE.warm;

  return (
    <View style={{ width, height, position: "relative" }}>
      <Svg width={width} height={height}>
        {/* Сетка 25/50/75/100 */}
        {[25, 50, 75, 100].map((v) => {
          const y = padTop + chartH - scale(v);
          return (
            <Line
              key={v}
              x1={10}
              y1={y}
              x2={width - 10}
              y2={y}
              stroke={PALETTE.border}
              strokeWidth={0.6}
              strokeDasharray="2 3"
            />
          );
        })}

        {/* Now bar */}
        <Path
          d={`M ${leftX} ${baseY - nowH} L ${leftX + barW} ${baseY - nowH} L ${leftX + barW} ${baseY} L ${leftX} ${baseY} Z`}
          fill={nowColor}
          opacity={0.85}
        />
        {/* Target bar */}
        <Path
          d={`M ${rightX} ${baseY - targetH} L ${rightX + barW} ${baseY - targetH} L ${rightX + barW} ${baseY} L ${rightX} ${baseY} Z`}
          fill={PALETTE.accent}
        />

        {/* Baseline */}
        <Line
          x1={10}
          y1={baseY}
          x2={width - 10}
          y2={baseY}
          stroke={PALETTE.border}
          strokeWidth={1}
        />

        {/* Arrow between tops */}
        <Path
          d={`M ${leftX + barW + 4} ${baseY - nowH + 2} L ${rightX - 4} ${baseY - targetH + 2}`}
          stroke={PALETTE.accent}
          strokeWidth={1.2}
          strokeDasharray="3 2"
        />
      </Svg>

      {/* Value labels */}
      <Text
        style={{
          position: "absolute",
          top: baseY - nowH - 20,
          left: leftX,
          width: barW,
          textAlign: "center",
          fontSize: 16,
          fontFamily: "Geist",
          fontWeight: 700,
          color: nowColor,
        }}
      >
        {scoreNow}
      </Text>
      <Text
        style={{
          position: "absolute",
          top: baseY - targetH - 20,
          left: rightX,
          width: barW,
          textAlign: "center",
          fontSize: 16,
          fontFamily: "Geist",
          fontWeight: 700,
          color: PALETTE.accent,
        }}
      >
        {scoreTarget}
      </Text>

      {/* Bottom labels */}
      <Text
        style={{
          position: "absolute",
          top: baseY + 6,
          left: leftX,
          width: barW,
          textAlign: "center",
          fontSize: 8,
          color: PALETTE.textMuted,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        Сейчас
      </Text>
      <Text
        style={{
          position: "absolute",
          top: baseY + 6,
          left: rightX,
          width: barW,
          textAlign: "center",
          fontSize: 8,
          color: PALETTE.accent,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        8 недель
      </Text>
    </View>
  );
};

const SpeedometerSvg = ({ velocity, width }: { velocity: number; width: number }) => {
  const size = width;
  const min = -10;
  const max = 40;
  const clamped = Math.max(min, Math.min(max, velocity));
  const pct = (clamped - min) / (max - min);

  const radius = size / 2 - 22;
  const cx = size / 2;
  const cy = size * 0.55;
  const startAngle = Math.PI;
  const totalAngle = Math.PI;

  const toXY = (angle: number, r: number) => ({
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
  });

  const needleAngle = startAngle + totalAngle * pct;
  const needleEnd = toXY(needleAngle, radius - 14);

  const bp = (v: number) => (v - min) / (max - min);

  const arc = (fromPct: number, toPct: number, color: string, key: string) => {
    const a1 = startAngle + totalAngle * fromPct;
    const a2 = startAngle + totalAngle * toPct;
    const p1 = toXY(a1, radius);
    const p2 = toXY(a2, radius);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return (
      <Path
        key={key}
        d={`M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`}
        stroke={color}
        strokeWidth={14}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  return (
    <Svg width={size} height={size * 0.7}>
      {arc(bp(-10), bp(0), PALETTE.calm, "a1")}
      {arc(bp(0), bp(8), PALETTE.accent, "a2")}
      {arc(bp(8), bp(18), PALETTE.amber, "a3")}
      {arc(bp(18), bp(28), PALETTE.warm, "a4")}
      {arc(bp(28), bp(40), PALETTE.danger, "a5")}

      <Line
        x1={cx}
        y1={cy}
        x2={needleEnd.x}
        y2={needleEnd.y}
        stroke={PALETTE.text}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={7} fill={PALETTE.bg} stroke={PALETTE.accent} strokeWidth={2} />
    </Svg>
  );
};

const RADAR_SHORT_LABEL: Record<DomainKey, string> = {
  sleep: "Сон",
  movement: "Движение",
  nutrition: "Питание",
  stress: "Стресс",
  habits: "Привычки",
};

const RadarSvg = ({ domains, size }: { domains: DomainScore[]; size: number }) => {
  const n = domains.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 42;

  const pointFor = (i: number, value: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = (value / 100) * radius;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  // Позиция для подписи оси — чуть дальше максимального радиуса.
  const labelFor = (i: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = radius + 18;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    return { x, y, angle };
  };

  const poly = domains.map((d, i) => {
    const p = pointFor(i, d.score0to100);
    return `${p.x},${p.y}`;
  });

  const labelBoxWidth = 80;
  const labelBoxHeight = 26;

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size}>
        {[25, 50, 75, 100].map((v) => (
          <Polygon
            key={v}
            points={domains
              .map((_, i) => {
                const p = pointFor(i, v);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke={PALETTE.border}
            strokeWidth={1}
          />
        ))}
        {domains.map((_, i) => {
          const p = pointFor(i, 100);
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth={1}
            />
          );
        })}
        <Polygon
          points={poly.join(" ")}
          fill={PALETTE.accent}
          fillOpacity={0.12}
          stroke={PALETTE.accent}
          strokeWidth={1.5}
        />
        {domains.map((d, i) => {
          const p = pointFor(i, d.score0to100);
          return (
            <Circle key={`p-${i}`} cx={p.x} cy={p.y} r={3} fill={PALETTE.accent} />
          );
        })}
      </Svg>
      {domains.map((d, i) => {
        const l = labelFor(i);
        const left = l.x - labelBoxWidth / 2;
        const top = l.y - labelBoxHeight / 2;
        return (
          <View
            key={`lbl-${d.key}`}
            style={{
              position: "absolute",
              left,
              top,
              width: labelBoxWidth,
              height: labelBoxHeight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 9,
                color: d.isGoalFocus ? PALETTE.accent : PALETTE.textMuted,
                fontWeight: d.isGoalFocus ? 600 : 400,
                letterSpacing: 0.3,
                textAlign: "center",
              }}
            >
              {RADAR_SHORT_LABEL[d.key]}
            </Text>
            <Text
              style={{
                fontSize: 8,
                color: PALETTE.textFaint,
                marginTop: 1,
              }}
            >
              {d.score0to100}/100
            </Text>
          </View>
        );
      })}
    </View>
  );
};

function longyScoreTone(band: ScoreResult["longyScoreBand"]): string {
  switch (band) {
    case "excellent":
    case "good":
      return PALETTE.accent;
    case "attention":
      return PALETTE.amber;
    case "risk":
      return PALETTE.warm;
    case "critical":
      return PALETTE.danger;
  }
}

function bmiLabel(c: ScoreResult["bmiCategory"]): string {
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

function domainColor(d: DomainScore): string {
  if (d.score0to100 >= 80) return PALETTE.accent;
  if (d.score0to100 >= 60) return PALETTE.calm;
  if (d.score0to100 >= 40) return PALETTE.amber;
  if (d.score0to100 >= 25) return PALETTE.warm;
  return PALETTE.danger;
}

function trackerLabel(t: string): string {
  switch (t) {
    case "whoop":
      return "Whoop";
    case "oura":
      return "Oura";
    case "apple_watch":
      return "Apple Watch";
    case "garmin":
      return "Garmin";
    case "smart_scales":
      return "Смарт-весы";
    case "smart_mattress":
      return "Смарт-матрас";
    case "other":
      return "Другое";
    case "none":
      return "—";
    default:
      return t;
  }
}

export default Report;

// Silence unused key param warnings (domain keys are strongly typed above).
export const _unused: DomainKey | null = null;
