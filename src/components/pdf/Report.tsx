import {
  Document,
  Page,
  Text,
  View,
  Image,
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
  reportTone,
  longyScorePercentileTop,
  strongestDomain,
  ReportTone,
} from "@/lib/insights";
import { Answers } from "@/lib/types";
import { T, formatReportDate, formatAge } from "@/lib/i18n";

const ReportDateContext = React.createContext<string>("");

const fontPath = (rel: string) => path.join(process.cwd(), "src/assets/fonts", rel);
const imagePath = (rel: string) => path.join(process.cwd(), "src/assets/images", rel);

const GOAL_IMAGE: Record<string, string> = {
  weight_loss: "goals/weight_loss_ru.jpg",
  muscle_gain: "goals/nabor_ru.jpg",
  energy: "goals/energy_ru.jpg",
  nutrition: "goals/nutrition_ru.jpg",
  endurance: "goals/bio_age_ru.jpg",
  sleep: "goals/sleep_ru.jpg",
  biological_age: "goals/bio_age_ru.jpg",
};

const goalImagePath = (goal: string): string | null => {
  const file = GOAL_IMAGE[goal];
  return file ? imagePath(file) : null;
};

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
  border: "#E0E0E0",
  text: "#000000",
  textMuted: "#5A5A5A",
  textFaint: "#9E9E9E",
  accent: "#EA4E1C",
  warm: "#D9481C",
  danger: "#C03A2B",
  calm: "#00B158",
  amber: "#F5A623",
};

// Type scale — 8 tiers, modular ratio ~1.2–1.33.
// Usage: caption (meta/legends) · body (paragraphs) · label (card titles / bold body)
// · subhead (section sub-titles) · headline (page titles) · display (big numbers)
// · displayLg (cover scores) · hero (hero-cover only).
const FS = {
  caption: 9,
  body: 11,
  label: 13,
  subhead: 18,
  headline: 24,
  display: 32,
  displayLg: 44,
  hero: 48,
} as const;

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
    fontSize: FS.body,
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
    fontSize: FS.label,
    fontWeight: 600,
    color: PALETTE.text,
    letterSpacing: -0.3,
  },
  mono: {
    fontFamily: "Geist",
    fontSize: FS.caption,
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
    fontSize: FS.display,
    lineHeight: 1.25,
    letterSpacing: -0.6,
    color: PALETTE.text,
  },
  verdictTitleFigures: {
    fontFamily: "Geist",
    fontWeight: 700,
    fontSize: FS.display,
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
    fontSize: FS.caption,
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 16,
    padding: 16,
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
    fontSize: FS.caption,
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
  const name = (answers.name ?? "").trim();
  const date = formatReportDate();
  const tone = reportTone(score);

  return (
    <ReportDateContext.Provider value={date}>
      <Document title={`Longy audit · ${name || "report"}`}>
        <HeroCoverPage name={name} date={date} age={typeof answers.age === "number" ? answers.age : Number(answers.age) || null} />
        <CoverPage score={score} answers={answers} />
        <VerdictPage score={score} answers={answers} />
        <AcceleratorsPage accelerators={accelerators} score={score} />
        {tone !== "optimize" && <ProjectionPage score={score} />}
        <RadarPage score={score} protectors={protectors} />
        <LongyPage answers={answers} />
        <FinalPage name={name} score={score} answers={answers} />
        <MethodologyPage />
      </Document>
    </ReportDateContext.Provider>
  );
};


const Header = (props?: { ordinal?: string; label?: string; onDark?: boolean }) => {
  const date = React.useContext(ReportDateContext);
  const onDark = props?.onDark ?? false;
  const titleColor = onDark ? "#FFFFFF" : PALETTE.textFaint;
  const dateColor = onDark ? "#FFFFFF" : PALETTE.accent;
  const dividerColor = onDark ? "#FFFFFF" : PALETTE.textFaint;
  return (
    <View style={{ marginBottom: 20 }} fixed>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Image
          src={imagePath(onDark ? "logo-white.png" : "logo.png")}
          style={{ width: 80, objectFit: "contain" }}
        />
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontFamily: "Geist",
              fontWeight: 500,
              fontSize: FS.label,
              color: titleColor,
            }}
          >
            {T.header.title}
          </Text>
          <Text
            style={{
              fontFamily: "Geist",
              fontWeight: 500,
              fontSize: FS.label,
              color: dateColor,
              marginTop: 4,
            }}
          >
            {date}
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: dividerColor,
          marginTop: 10,
        }}
      />
    </View>
  );
};

const Footer = ({ onDark = false }: { onDark?: boolean } = {}) => {
  const primary = onDark ? "#FFFFFF" : PALETTE.textMuted;
  const secondary = onDark ? "#FFFFFF" : PALETTE.textFaint;
  const borderColor = onDark ? "#FFFFFF" : PALETTE.border;
  return (
    <View style={[styles.pageFooter, { borderTopColor: borderColor }]} fixed>
      <View style={{ gap: 2 }}>
        <Text style={{ color: primary, fontSize: FS.caption }}>{T.footer.site}</Text>
        <Text style={{ color: secondary, fontSize: FS.caption }}>{T.footer.email}</Text>
      </View>
      <View style={{ gap: 2, alignItems: "flex-end" }}>
        <Text style={{ color: primary, fontSize: FS.caption }}>{T.footer.notClinical}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text style={{ color: secondary, fontSize: FS.caption }}>{T.footer.privacy}</Text>
          <Text style={{ color: secondary, fontSize: FS.caption }}>{T.footer.terms}</Text>
        </View>
      </View>
    </View>
  );
};

const HeroCoverPage: React.FC<{
  name: string;
  date: string;
  age: number | null;
}> = ({ name, date, age }) => {
  const PAGE_W = 595;
  const PAGE_H = 842;

  const displayName = name || T.hero.emptyName;
  const subtitleText =
    age && age > 0 ? `${displayName}, ${formatAge(age)}` : displayName;
  const subtitleFontSize =
    subtitleText.length > 32 ? 22 : subtitleText.length > 24 ? 26 : 30;

  return (
    <Page
      size="A4"
      style={{
        backgroundColor: PALETTE.accent,
        color: "#FFFFFF",
        fontFamily: "Geist",
        padding: 0,
        margin: 0,
      }}
    >
      <View
        wrap={false}
        style={{
          width: PAGE_W,
          height: PAGE_H,
          position: "relative",
          backgroundColor: PALETTE.accent,
        }}
      >
        {/* Background image */}
        <Image
          src={imagePath("velo.png")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: PAGE_W,
            height: PAGE_H,
            objectFit: "cover",
            opacity: 0.35,
          }}
        />

        {/* Gradient overlay: approximate linear-gradient top→bottom with two stacked semi-transparent layers */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: PAGE_W,
            height: PAGE_H / 2,
            backgroundColor: PALETTE.accent,
            opacity: 0.3,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: PAGE_H / 2,
            left: 0,
            width: PAGE_W,
            height: PAGE_H / 2,
            backgroundColor: PALETTE.accent,
            opacity: 0.7,
          }}
        />

        {/* Logo */}
        <Image
          src={imagePath("logo-white.png")}
          style={{
            position: "absolute",
            top: 32,
            left: 32,
            width: 101,
            objectFit: "contain",
          }}
        />

        {/* Main content block */}
        <View
          style={{
            position: "absolute",
            top: 318,
            left: 32,
            width: 530,
          }}
        >
          <Text
            style={{
              fontFamily: "Geist",
              fontWeight: 500,
              fontSize: FS.hero,
              lineHeight: 1.15,
              color: "#FFFFFF",
              marginBottom: 6,
            }}
          >
            {T.hero.reportTitle}
          </Text>
          <Text
            style={{
              fontFamily: "Geist",
              fontWeight: 400,
              fontSize: subtitleFontSize,
              lineHeight: 1.2,
              color: "#FFFFFF",
              opacity: 0.9,
            }}
          >
            {subtitleText}
          </Text>
          <Text
            style={{
              fontFamily: "Geist",
              fontWeight: 600,
              fontSize: FS.subhead,
              color: "#FFFFFF",
              marginTop: 36,
            }}
          >
            {date}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            position: "absolute",
            top: 776,
            left: 25,
            width: 545,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
        />

        {/* Footer */}
        <Text
          style={{
            position: "absolute",
            top: 784,
            left: 32,
            color: "rgba(255,255,255,0.7)",
            fontSize: FS.body,
          }}
        >
          {T.footer.site}
        </Text>
        <Text
          style={{
            position: "absolute",
            top: 784,
            right: 32,
            color: "rgba(255,255,255,0.7)",
            fontSize: FS.body,
          }}
        >
          {T.hero.notClinical}
        </Text>
        <Text
          style={{
            position: "absolute",
            top: 800,
            left: 32,
            color: "rgba(255,255,255,0.7)",
            fontSize: FS.body,
          }}
        >
          {T.footer.email}
        </Text>
        <View
          style={{
            position: "absolute",
            top: 800,
            right: 32,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FS.body }}>{T.hero.privacyPolicy}</Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FS.body }}>{T.hero.termsOfService}</Text>
        </View>
      </View>
    </Page>
  );
};

const CoverPage: React.FC<{ score: ScoreResult; answers: Answers }> = ({ score, answers }) => {
  const tone = reportTone(score);
  const isOptimize = tone === "optimize";
  const topPct = longyScorePercentileTop(score.longyScore);

  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="02" label={T.cover.ordinal} />
      <View wrap={false} style={{ marginTop: 20, gap: 16 }}>
        <Text style={styles.chip}>
          {isOptimize ? T.cover.chipOptimize : T.cover.chip}
        </Text>
        <Text style={[styles.display, { fontSize: FS.displayLg, lineHeight: 1.08, letterSpacing: 0 }]}>
          {isOptimize ? (
            <>
              {T.cover.headlineOptimizeLine1}
              {"\n"}
              <Text style={{ color: PALETTE.accent }}>{T.cover.headlineOptimizeAccent}</Text>
              {T.cover.headlineOptimizeLine2}
            </>
          ) : (
            <>
              {T.cover.headlineLine1}
              {"\n"}
              <Text style={{ color: PALETTE.accent }}>{T.cover.headlineAccent}</Text>
              {T.cover.headlineLine2}
              {"\n"}
              {T.cover.headlineLine3}
            </>
          )}
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, maxWidth: 440, lineHeight: 1.5 }}>
          {coverSubtitle(score)}
        </Text>
        <Text
          style={{
            color: PALETTE.textFaint,
            fontSize: FS.caption,
            letterSpacing: 0.4,
            marginTop: 2,
          }}
        >
          {T.cover.methodology}
        </Text>
      </View>

      {/* Celebration percentile card — only for optimize tone */}
      {isOptimize && (
        <View
          wrap={false}
          style={{
            marginTop: 20,
            borderRadius: 16,
            padding: 14,
            backgroundColor: "#EBF8F1",
            borderWidth: 1,
            borderColor: PALETTE.calm,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text
            style={[
              styles.numStat,
              { fontSize: FS.display, color: PALETTE.calm, minWidth: 70 },
            ]}
          >
            TOP {topPct}%
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.mono, { color: PALETTE.calm }]}>
              {T.cover.percentileChip}
            </Text>
            <Text
              style={{
                color: PALETTE.text,
                fontSize: FS.body,
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              {T.cover.topPercent(topPct)}
            </Text>
          </View>
        </View>
      )}

      <View wrap={false} style={{ marginTop: isOptimize ? 16 : 44, flexDirection: "row", gap: 12 }}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.mono}>{T.cover.longyScore}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 10 }}>
            <Text
              style={[
                styles.numStat,
                { fontSize: FS.displayLg, color: longyScoreTone(score.longyScoreBand) },
              ]}
            >
              {score.longyScore}
            </Text>
            <Text style={{ color: PALETTE.textFaint, fontSize: FS.label }}>{T.cover.outOf100}</Text>
          </View>
          <Text style={{ color: PALETTE.textMuted, marginTop: 10, fontSize: FS.body }}>
            {longyScoreLabel(score.longyScoreBand).label}
          </Text>
        </View>

        {isOptimize
          ? (() => {
              const best = strongestDomain(score);
              return (
                <View style={[styles.card, { flex: 1 }]}>
                  <Text style={[styles.mono, { color: PALETTE.calm }]}>
                    {T.cover.strongestSupport}
                  </Text>
                  <Text style={[styles.display, { fontSize: FS.subhead, marginTop: 10, lineHeight: 1.2 }]}>
                    {best.label}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                    <Text style={[styles.numStat, { fontSize: FS.headline, color: PALETTE.calm }]}>
                      {best.score0to100}
                    </Text>
                    <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>/ 100</Text>
                  </View>
                </View>
              );
            })()
          : (() => {
              const md = pickMainDriver(answers, score);
              if (!md) {
                return (
                  <View style={[styles.card, { flex: 1 }]}>
                    <Text style={styles.mono}>{T.cover.mainDriver}</Text>
                    <Text style={[styles.display, { fontSize: FS.subhead, marginTop: 10, lineHeight: 1.15 }]}>
                      {T.cover.mainDriverEmpty}
                    </Text>
                  </View>
                );
              }
              return (
                <View style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.mono}>{T.cover.mainDriver}</Text>
                  <Text style={[styles.display, { fontSize: FS.subhead, marginTop: 10, lineHeight: 1.2 }]}>
                    {md.headline}
                  </Text>
                  <Text style={{ color: PALETTE.textMuted, marginTop: 6, fontSize: FS.body, lineHeight: 1.4 }}>
                    {md.subtext}
                  </Text>
                  <Text style={{ color: PALETTE.warm, marginTop: 8, fontSize: FS.body }}>
                    {T.cover.yearsOfLife(md.domain.yearsLifeLost.toFixed(1))}
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
                <Text style={[styles.numStat, { fontSize: FS.displayLg, color: valueColor }]}>
                  {m.value}
                </Text>
                {m.type === "domain" && (
                  <Text style={{ color: PALETTE.textFaint, fontSize: FS.label }}>{T.cover.outOf100}</Text>
                )}
              </View>
              <Text style={{ color: PALETTE.textMuted, marginTop: 10, fontSize: FS.body }}>
                {m.sublabel}
              </Text>
            </View>
          );
        })()}
      </View>

      <Text
        style={{
          color: PALETTE.textFaint,
          fontSize: FS.caption,
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
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, maxWidth: 480, marginTop: 6 }}>
          {verdictText}
        </Text>
      </View>

      <View wrap={false}>
        <HealthspanStrip score={score} />
      </View>

      <View wrap={false} style={{ marginTop: 12 }}>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={[styles.mono, { textAlign: "center" }]}>
            Где вы сейчас находитесь по вашей скорости старения
          </Text>
          <SpeedometerSvg velocity={velocity} width={220} />
          <Text
            style={{
              color: PALETTE.text,
              fontSize: FS.body,
              fontWeight: "bold",
              textAlign: "center",
              maxWidth: 440,
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {velocityZoneDescription(velocity)}
          </Text>
        </View>

        <View
          style={{
            marginTop: 8,
            flexDirection: "row",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {(() => {
            const zone = velocityZoneKey(velocity);
            return (
              <>
                <LegendPill color={PALETTE.calm} label="Ниже нормы" active={zone === "below"} />
                <LegendPill color={PALETTE.accent} label="Норма" active={zone === "normal"} />
                <LegendPill color={PALETTE.amber} label="Ускорение" active={zone === "acceleration"} />
                <LegendPill color={PALETTE.warm} label="Риск" active={zone === "risk"} />
                <LegendPill color={PALETTE.danger} label="Критично" active={zone === "critical"} />
              </>
            );
          })()}
        </View>
      </View>

      <View wrap={false} style={{ marginTop: 24, flexDirection: "row", gap: 10 }}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.mono}>Ваша цель</Text>
          <Text style={{ color: PALETTE.text, marginTop: 6, fontSize: FS.label }}>
            {goalLabel(answers.goal)}
          </Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.mono}>Трекеры</Text>
          <Text style={{ color: PALETTE.text, marginTop: 6, fontSize: FS.label }}>
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
              <Text style={[styles.display, { fontSize: FS.label, lineHeight: 1.2 }]}>
                {score.goalDomainScore.label}
              </Text>
              <Text style={{ color: tone, fontSize: FS.body }}>
                {score.goalDomainScore.score0to100}/100
              </Text>
            </View>
            <Text
              style={{
                color: PALETTE.textMuted,
                fontSize: FS.body,
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
                      <Text style={{ color: PALETTE.accent, fontSize: FS.body }}>·</Text>
                      <Text style={{ color: PALETTE.text, fontSize: FS.body, lineHeight: 1.5, flex: 1 }}>
                        {b}
                      </Text>
                    </View>
                  ))}
                  <Text
                    style={{
                      color: PALETTE.accent,
                      fontSize: FS.body,
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

      {(() => {
        const imgPath = goalImagePath(answers.goal);
        if (!imgPath) return null;
        return (
          <View
            wrap={false}
            style={{
              marginTop: 16,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Image
              src={imgPath}
              style={{ width: "100%", objectFit: "cover" }}
            />
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
              { fontSize: FS.display, color: gapColor },
            ]}
          >
            +{gap.toFixed(1)}
          </Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>лет возможно получить</Text>
        </View>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.caption, marginTop: 4 }}>
          сейчас у вас +{years.toFixed(1)} из максимальных +{max}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, lineHeight: 1.5 }}>
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
        <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.15 }]}>
          {isOptimizing
            ? "Где есть потенциал для роста"
            : "Что именно «стоит» в годах здоровой жизни"}
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body }}>
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
                <Text style={[styles.display, { fontSize: FS.subhead, marginTop: 4 }]}>
                  {acc.headline}
                </Text>
                {!isOptimizing && (
                  <Text style={{ color: dotColor, fontSize: FS.body, marginTop: 4 }}>
                    {acc.yearsLostEstimate}
                  </Text>
                )}
                <Text
                  style={{
                    color: PALETTE.textMuted,
                    marginTop: 8,
                    fontSize: FS.body,
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
                    style={{ color: PALETTE.text, fontSize: FS.body, marginTop: 4, lineHeight: 1.5 }}
                  >
                    {acc.action}
                  </Text>
                </View>

                <Text
                  style={{
                    color: PALETTE.textFaint,
                    fontSize: FS.caption,
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
  const tone = reportTone(score);
  const isOptimize = tone === "optimize";
  const maintenanceTips = isOptimize && !hasLeverage ? buildMaintenanceTips(score) : [];
  const chipLabel = isOptimize
    ? "Реализованный потенциал"
    : "Из чего складывается потеря лет";
  const headline = isOptimize
    ? "Сколько здоровых лет вы уже набираете"
    : "Сколько здоровых лет «стоит» каждый домен — и что вернуть, если починить топ-3";
  const subhead = isOptimize
    ? `Healthspan-модель даёт до +${score.healthspanMax} лет за идеальный образ жизни. Вы сейчас набираете +${score.healthspanYears.toFixed(1)}.`
    : null;

  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="05" label={isOptimize ? "Реализованный потенциал" : "Цена и проекция"} />
      <View wrap={false} style={{ gap: 8 }}>
        <Text style={styles.chip}>{chipLabel}</Text>
        <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.1 }]}>
          {headline}
        </Text>
        {subhead && (
          <Text
            style={{
              color: PALETTE.textMuted,
              fontSize: FS.body,
              maxWidth: 480,
              lineHeight: 1.4,
            }}
          >
            {subhead}
          </Text>
        )}
      </View>

      {/* Waterfall или fallback */}
      <View wrap={false} style={{ marginTop: 14 }}>
        {score.yearsLifeLostTotal < 1 ? (
          <RealizedPotentialBlock score={score} />
        ) : (
          <>
            <Text style={styles.mono}>
              Waterfall · ≈{score.yearsLifeLostTotal.toFixed(1)} лет здоровой жизни
            </Text>
            <View style={{ marginTop: 6 }}>
              <WaterfallSvg
                items={score.velocityWaterfall}
                totalYears={score.yearsLifeLostTotal}
                width={515}
                height={160}
              />
            </View>
          </>
        )}
      </View>

      {/* Нижний блок: поддержание (optimize без leverage), рост (fix/recover), или maintain-view */}
      {isOptimize ? (
        maintenanceTips.length > 0 ? (
          <MaintenanceGrid tips={maintenanceTips} />
        ) : (
          <MaintainProjectionBlock score={score} />
        )
      ) : (
        <View
          wrap={false}
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 14,
            backgroundColor: PALETTE.bgSoft,
            borderWidth: 1,
            borderColor: PALETTE.border,
          }}
        >
          <Text style={styles.mono}>Если закрыть топ-3 · 8 недель с Longy</Text>

          <View style={{ marginTop: 8, flexDirection: "row", gap: 14, alignItems: "center" }}>
            <ImpactPreviewSvg
              scoreNow={proj.longyScoreNow}
              scoreTarget={proj.longyScoreTarget}
              width={180}
              height={90}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.display, { fontSize: FS.subhead, lineHeight: 1.2 }]}>
                {formatBioAgeDelta(proj.yearsLifeLostNow - proj.yearsLifeLostTarget)}
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: FS.caption, lineHeight: 1.45 }}>
                Longy Score вырастет с{" "}
                <Text style={{ color: PALETTE.textMuted }}>{proj.longyScoreNow}</Text>{" "}
                до <Text style={{ color: PALETTE.accent }}>{proj.longyScoreTarget}</Text>.
                Вот что конкретно Longy делает по трём главным рычагам:
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 10, gap: 6 }}>
            {proj.targets.map((d) => {
              const bullets = EIGHT_WEEK_PROMISE[d.key] ?? [];
              return (
                <View key={d.key} style={{ gap: 2 }}>
                  <Text
                    style={{
                      color: PALETTE.accent,
                      fontSize: FS.caption,
                      fontWeight: "bold",
                    }}
                  >
                    {d.label}
                  </Text>
                  {bullets.map((b, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 4, marginLeft: 4 }}>
                      <Text style={{ color: PALETTE.accent, fontSize: FS.caption }}>·</Text>
                      <Text
                        style={{
                          color: PALETTE.text,
                          fontSize: FS.caption,
                          lineHeight: 1.4,
                          flex: 1,
                        }}
                      >
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

const RealizedPotentialBlock: React.FC<{ score: ScoreResult }> = ({ score }) => {
  const years = score.healthspanYears;
  const max = score.healthspanMax;
  const gap = Math.max(0, Math.round((max - years) * 10) / 10);
  const fillPct = Math.max(0, Math.min(1, years / max));
  const domains = Object.values(score.domains);
  const strongestDomains = [...domains]
    .sort((a, b) => b.score0to100 - a.score0to100)
    .slice(0, 3);

  return (
    <View>
      <Text style={styles.mono}>
        Потерь здоровых лет по модели почти не видно — +{years.toFixed(1)} из {max}
      </Text>

      <View
        style={{
          marginTop: 10,
          height: 14,
          borderRadius: 7,
          backgroundColor: "#EBEBEB",
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        <View
          style={{
            width: `${Math.round(fillPct * 100)}%`,
            height: "100%",
            backgroundColor: PALETTE.calm,
          }}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <Text style={{ color: PALETTE.calm, fontSize: FS.caption, fontWeight: 600 }}>
          +{years.toFixed(1)} реализовано
        </Text>
        <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption }}>
          +{gap.toFixed(1)} в запасе
        </Text>
      </View>

      <View
        style={{
          marginTop: 16,
          flexDirection: "row",
          gap: 10,
        }}
      >
        {strongestDomains.map((d) => (
          <View
            key={d.key}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#EBF8F1",
              borderWidth: 1,
              borderColor: PALETTE.calm,
            }}
          >
            <Text style={[styles.mono, { color: PALETTE.calm }]}>{d.label}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 4,
                marginTop: 6,
              }}
            >
              <Text style={[styles.numStat, { fontSize: FS.headline, color: PALETTE.calm }]}>
                {d.score0to100}
              </Text>
              <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption }}>/ 100</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const MaintainProjectionBlock: React.FC<{ score: ScoreResult }> = ({ score }) => (
  <View
    wrap={false}
    style={{
      marginTop: 24,
      borderRadius: 18,
      padding: 18,
      backgroundColor: "#EBF8F1",
      borderWidth: 1,
      borderColor: PALETTE.calm,
    }}
  >
    <Text style={[styles.mono, { color: PALETTE.calm }]}>
      Если сохраните режим — 12 месяцев вперёд
    </Text>
    <Text
      style={[
        styles.display,
        { fontSize: FS.subhead, marginTop: 8, lineHeight: 1.25 },
      ]}
    >
      Longy Score удержится около {score.longyScore} ± 3
    </Text>
    <Text
      style={{
        color: PALETTE.textMuted,
        fontSize: FS.body,
        marginTop: 8,
        lineHeight: 1.55,
      }}
    >
      На вашей базе основной риск — дрейф: стресс в проектах, смещение сна на
      выходных, реже силовая тренировка в поездках. Longy ловит ранние сигналы
      и возвращает к привычному режиму до того, как показатели упадут.
    </Text>
    <View style={{ marginTop: 12, gap: 6 }}>
      <Text style={{ color: PALETTE.calm, fontSize: FS.body, fontWeight: 600 }}>
        Что удерживает результат
      </Text>
      {[
        "Еженедельный чек-ин по HRV и качеству сна",
        "Предупреждение, если паттерн уходит от нормы 3+ дня",
        "Квартальные протоколы: VO₂max, гликация, биомаркеры",
      ].map((line, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 6, marginLeft: 6 }}>
          <Text style={{ color: PALETTE.calm, fontSize: FS.body }}>·</Text>
          <Text
            style={{
              color: PALETTE.text,
              fontSize: FS.body,
              lineHeight: 1.5,
              flex: 1,
            }}
          >
            {line}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

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
            style={{ color: PALETTE.textMuted, fontSize: FS.body, marginTop: 6, lineHeight: 1.5 }}
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
      {/* Background image — full-bleed, без вуали */}
      <Image
        src={imagePath("bg3.jpg")}
        fixed
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 595,
          height: 842,
          objectFit: "cover",
        }}
      />
      <Header ordinal="06" label="Карта состояния" onDark />
      <View wrap={false} style={{ gap: 8 }}>
        <Text
          style={{
            alignSelf: "flex-start",
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#FFFFFF",
            color: "#FFFFFF",
            fontSize: FS.caption,
            letterSpacing: 0.5,
            backgroundColor: "transparent",
          }}
        >
          5 доменов
        </Text>
        <Text style={[styles.display, { fontSize: FS.headline, color: "#FFFFFF" }]}>
          Где вы сейчас — по каждой оси здоровья
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: FS.body,
            maxWidth: 460,
            lineHeight: 1.4,
          }}
        >
          100 — оптимальный уровень. Чем ближе к центру, тем больше этот домен добавляет к
          оценке потери здоровых лет.
        </Text>
      </View>

      <View
        wrap={false}
        style={{
          marginTop: 12,
          flexDirection: "row",
          gap: 14,
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: PALETTE.border,
        }}
      >
        <RadarSvg domains={domains} size={210} />
        <View style={{ flex: 1, gap: 6 }}>
          {domains.map((d) => (
            <DomainRow key={d.key} domain={d} />
          ))}
        </View>
      </View>

      <View wrap={false} style={{ marginTop: 14 }}>
        <Text style={[styles.mono, { color: "#FFFFFF" }]}>Что вас защищает</Text>
        <Text style={[styles.display, { fontSize: FS.subhead, marginTop: 4, color: "#FFFFFF" }]}>
          Сильные стороны
        </Text>
        {protectors.length === 0 ? (
          <View style={[styles.card, { marginTop: 8, padding: 12 }]}>
            <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, lineHeight: 1.5 }}>
              Пока нет доменов в защитной зоне. Это не приговор — это стартовая точка. У 86%
              пользователей Longy хотя бы один домен переходит в зелёную зону за 8 недель.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 8, flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {protectors.map((p) => (
              <View
                key={p.key}
                wrap={false}
                style={[
                  styles.card,
                  { flex: 1, minWidth: 220, padding: 12 },
                ]}
              >
                <Text style={[styles.display, { fontSize: FS.label }]}>
                  {p.headline}
                </Text>
                <Text
                  style={{
                    color: PALETTE.textMuted,
                    fontSize: FS.caption,
                    marginTop: 4,
                    lineHeight: 1.45,
                  }}
                >
                  {p.detail}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Footer onDark />
    </Page>
  );
};

const LongyPage: React.FC<{ answers: Answers }> = () => (
  <Page size="A4" style={styles.page}>
    <Header ordinal="07" label="Как Longy берёт это на себя" />
    <View wrap={false} style={{ gap: 8 }}>
      <Text style={styles.chip}>Longy · Ваш AI health manager</Text>
      <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.15 }]}>
        Три вещи, которых нет больше{"\n"}ни в одном приложении
      </Text>
      <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, maxWidth: 480, lineHeight: 1.4 }}>
        Longy объединяет данные с Whoop, Oura, Apple Watch, Garmin и умных весов. Внутри
        работают AI-нутрициолог, AI-коуч, AI-терапевт и health manager — одновременно.
      </Text>
    </View>

    <View style={{ marginTop: 12, gap: 8 }}>
      {LONGY_FEATURES.map((f, i) => (
        <View
          key={f.title}
          wrap={false}
          style={[
            styles.card,
            { flexDirection: "row", gap: 12, padding: 14 },
          ]}
        >
          <View style={{ width: 40 }}>
            <Text
              style={[
                styles.display,
                { fontSize: FS.headline, color: PALETTE.accent, lineHeight: 1 },
              ]}
            >
              0{i + 1}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.display, { fontSize: FS.label }]}>{f.title}</Text>
            <Text style={{ color: PALETTE.accent, fontSize: FS.caption, marginTop: 3 }}>
              {f.tagline}
            </Text>
            <Text
              style={{
                color: PALETTE.textMuted,
                fontSize: FS.body,
                marginTop: 6,
                lineHeight: 1.45,
              }}
            >
              {f.description}
            </Text>
            <Text
              style={{
                color: PALETTE.textFaint,
                fontSize: FS.caption,
                marginTop: 6,
                lineHeight: 1.4,
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
}> = () => {
  const bullets: { text: string; bold?: boolean }[] = [
    { text: "Приложение Longy", bold: true },
    { text: "Ваша команда: Консьерж здоровья + Тренер + Нутрициолог + Врач", bold: true },
    { text: "Удобный план, настраиваемый под вас" },
    { text: "Главная цель + 3 приоритета на каждый день" },
    { text: "Тренировки, работающие для вас" },
    { text: "Выполнимые рекомендации" },
    { text: "Подключение носимых устройств и данных анализов" },
  ];

  return (
    <Page
      size="A4"
      style={{
        backgroundColor: PALETTE.bg,
        fontFamily: "Geist",
        padding: 0,
      }}
    >
      <View wrap={false} style={{ width: 595, height: 842, position: "relative" }}>
        {/* Centered logo */}
        <Image
          src={imagePath("logo.png")}
          style={{
            position: "absolute",
            top: 40,
            left: 595 / 2 - 40,
            width: 80,
            objectFit: "contain",
          }}
        />

        {/* Headline */}
        <Text
          style={{
            position: "absolute",
            top: 92,
            left: 40,
            width: 515,
            fontFamily: "Geist",
            fontWeight: 600,
            fontSize: FS.display,
            lineHeight: 1.15,
            letterSpacing: -0.3,
            textAlign: "center",
            color: PALETTE.text,
          }}
        >
          Не добавляйте себе ещё один план. Добавьте команду.
        </Text>

        {/* Intro paragraph */}
        <Text
          style={{
            position: "absolute",
            top: 186,
            left: 40,
            width: 515,
            fontSize: FS.body,
            lineHeight: 1.45,
            textAlign: "center",
            color: PALETTE.text,
          }}
        >
          Большинство срывается не потому, что «плохой план». А потому что вы один. Longy — это
          когда рядом про-команда, которая держит ритм и помогает не откатываться. Наука в
          основе — сервис в исполнении.
        </Text>

        {/* Main card: phone + right col */}
        <View
          style={{
            position: "absolute",
            top: 268,
            left: 33,
            width: 530,
            height: 485,
            borderRadius: 20,
            backgroundColor: PALETTE.bgSoft,
            padding: 18,
          }}
        >
          {/* Phone image */}
          <Image
            src={imagePath("longy_app_phone.png")}
            style={{
              position: "absolute",
              top: 11,
              left: 12,
              width: 227,
              height: 464,
              borderRadius: 24,
              objectFit: "cover",
            }}
          />

          {/* Right column */}
          <View
            style={{
              position: "absolute",
              top: 20,
              left: 255,
              width: 262,
            }}
          >
            <Text
              style={{
                fontSize: FS.subhead,
                lineHeight: 1.25,
                fontWeight: 600,
                letterSpacing: -0.3,
                color: PALETTE.text,
                marginBottom: 16,
              }}
            >
              Что вы получаете с Longy:
            </Text>

            <View style={{ gap: 8, marginBottom: 18 }}>
              {bullets.map((b, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 6 }}>
                  <Text
                    style={{
                      fontSize: FS.body,
                      lineHeight: 1.4,
                      color: PALETTE.text,
                      fontWeight: b.bold ? 700 : 400,
                    }}
                  >
                    ·
                  </Text>
                  <Text
                    style={{
                      fontSize: FS.body,
                      lineHeight: 1.4,
                      letterSpacing: -0.3,
                      color: PALETTE.text,
                      fontWeight: b.bold ? 700 : 400,
                      flex: 1,
                    }}
                  >
                    {b.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* CTA button */}
            <View
              style={{
                width: 215,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: PALETTE.accent,
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: FS.label,
                  fontWeight: 500,
                }}
              >
                Продолжить с Longy
              </Text>
            </View>

            {/* Mini links */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>longy.ai</Text>
              <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>info@longy.ai</Text>
            </View>
          </View>
        </View>

        {/* Footer divider */}
        <View
          style={{
            position: "absolute",
            left: 25,
            bottom: 56,
            width: 545,
            height: 1,
            backgroundColor: PALETTE.textFaint,
          }}
        />

        {/* Footer */}
        <Text
          style={{
            position: "absolute",
            left: 31,
            bottom: 32,
            fontSize: FS.caption,
            color: PALETTE.textFaint,
          }}
        >
          Не является клиническим диагнозом
        </Text>
        <View
          style={{
            position: "absolute",
            right: 25,
            bottom: 32,
            flexDirection: "row",
            gap: 14,
          }}
        >
          <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption }}>Конфиденциальность</Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption }}>Условия</Text>
        </View>
      </View>
    </Page>
  );
};

const MethodologyPage: React.FC = () => (
  <Page size="A4" style={styles.page}>
    <Header ordinal="09" label="Методология" />
    <View wrap={false} style={{ gap: 8 }}>
      <Text style={styles.chip}>Методология отчёта</Text>
      <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.15 }]}>
        На чём построен этот отчёт
      </Text>
      <Text
        style={{
          color: PALETTE.textMuted,
          fontSize: FS.body,
          maxWidth: 480,
          lineHeight: 1.4,
        }}
      >
        Скрининговые инструменты и исследовательская база, на которые опирается Longy.
      </Text>
    </View>

    <ScientificCredibilityBlock />

    <Footer />
  </Page>
);

const SCIENTIFIC_INSTRUMENTS = [
  { file: "logos/1.jpg", alt: "University of Pennsylvania" },
  { file: "logos/2.jpg", alt: "National Institutes of Health" },
  { file: "logos/3.jpg", alt: "International Mediation Campus" },
  { file: "logos/4.jpg", alt: "Duke Health" },
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
    <Text style={{ color: PALETTE.text, fontSize: FS.body, lineHeight: 1.55 }}>
      Отчёт построен на клинически валидированных скрининговых инструментах с
      подтверждёнными психометрическими свойствами: Insomnia Severity Index (ISI-7) для
      оценки сна, Perceived Stress Scale (PSS-10) и PROMIS Fatigue 7a для стресса и
      энергии, Duke Activity Status Index (DASI) и IPAQ-SF для функционального статуса и
      физической активности, Mini-EAT для питания.
    </Text>
    <Text style={{ color: PALETTE.text, fontSize: FS.body, lineHeight: 1.55, marginTop: 10 }}>
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
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {SCIENTIFIC_INSTRUMENTS.map((inst) => (
        <View
          key={inst.alt}
          style={{
            flex: 1,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={imagePath(inst.file)}
            style={{ height: 32, maxWidth: "100%", objectFit: "contain" }}
          />
        </View>
      ))}
    </View>
  </View>
);

const RoadmapRow = ({ num, text }: { num: string; text: string }) => (
  <View
    wrap={false}
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
        { fontSize: FS.subhead, color: PALETTE.accent, width: 80 },
      ]}
    >
      {num}
    </Text>
    <Text style={{ color: PALETTE.text, fontSize: FS.body, flex: 1, lineHeight: 1.5 }}>{text}</Text>
  </View>
);

const DomainRow = ({ domain }: { domain: DomainScore }) => {
  const color = domainColor(domain);
  const width = Math.max(4, (domain.score0to100 / 100) * 200);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text style={{ color: PALETTE.text, fontSize: FS.body }}>{domain.label}</Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption, marginTop: 2 }}>
            ≈{domain.yearsLifeLost.toFixed(1)} лет в модели
          </Text>
        </View>
        <Text style={{ color, fontSize: FS.body, fontFamily: "Geist" }}>{domain.score0to100}</Text>
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

const LegendPill = ({
  color,
  label,
  active,
}: {
  color: string;
  label: string;
  active?: boolean;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: active ? color : PALETTE.border,
      backgroundColor: active ? "#FFFFFF" : "transparent",
    }}
  >
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    <Text
      style={{
        color: active ? PALETTE.text : PALETTE.textMuted,
        fontSize: FS.caption,
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </Text>
  </View>
);

// Velocity → zone key, used to highlight the active LegendPill.
function velocityZoneKey(
  velocity: number,
): "below" | "normal" | "acceleration" | "risk" | "critical" {
  if (velocity < 0) return "below";
  if (velocity < 8) return "normal";
  if (velocity < 18) return "acceleration";
  if (velocity < 28) return "risk";
  return "critical";
}

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
  const padLeft = 28;
  const padRight = 16;
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

  const yTickStep = maxCum > 8 ? 2 : 1;
  const yTicks: number[] = [];
  for (let v = Math.ceil(minCum); v <= Math.floor(maxCum); v += yTickStep) {
    yTicks.push(v);
  }
  if (!yTicks.includes(0)) yTicks.push(0);
  yTicks.sort((a, b) => a - b);

  return (
    <View style={{ width, height, position: "relative" }}>
      <Svg width={width} height={height}>
        {/* Сетка: горизонтальные линии на каждом тике */}
        {yTicks.map((t) => (
          <Line
            key={`grid-${t}`}
            x1={padLeft}
            y1={yFor(t)}
            x2={width - padRight}
            y2={yFor(t)}
            stroke={t === 0 ? PALETTE.textMuted : PALETTE.border}
            strokeWidth={t === 0 ? 1 : 0.5}
            strokeDasharray={t === 0 ? undefined : "2 3"}
          />
        ))}

        {/* Ось Y: вертикальная линия слева */}
        <Line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={height - padBottom}
          stroke={PALETTE.textMuted}
          strokeWidth={1}
        />

        {/* Риски (tick marks) на оси Y */}
        {yTicks.map((t) => (
          <Line
            key={`tick-${t}`}
            x1={padLeft - 4}
            y1={yFor(t)}
            x2={padLeft}
            y2={yFor(t)}
            stroke={PALETTE.textMuted}
            strokeWidth={1}
          />
        ))}

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

      {/* Подписи тиков на оси Y */}
      {yTicks.map((t) => (
        <Text
          key={`ylbl-${t}`}
          style={{
            position: "absolute",
            top: yFor(t) - 4,
            left: 0,
            width: padLeft - 8,
            textAlign: "right",
            fontSize: 7,
            color: PALETTE.textMuted,
          }}
        >
          {t > 0 ? `+${t}` : `${t}`}
        </Text>
      ))}

      {/* Заголовок оси Y */}
      <Text
        style={{
          position: "absolute",
          top: padTop - 4,
          left: 0,
          width: padLeft - 8,
          textAlign: "right",
          fontSize: 7,
          color: PALETTE.textFaint,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        лет
      </Text>

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
            fontSize: FS.caption,
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
          fontSize: FS.subhead,
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
          fontSize: FS.subhead,
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
                fontSize: FS.caption,
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
