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
  Link,
} from "@react-pdf/renderer";
import React from "react";
import path from "path";
import { ScoreResult, DomainScore, DomainKey, WaterfallItem } from "@/lib/scoring";
import {
  AcceleratorInsight,
  ProtectorInsight,
  MaintenanceTip,
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
  pickEightWeekPromise,
  formatBioAgeDelta,
  reportTone,
  longyScorePercentileTop,
  strongestDomain,
  ReportTone,
  pickFourLifeHacks,
  LifeHack,
} from "@/lib/insights";
import { Answers } from "@/lib/types";
import {
  T,
  formatReportDate,
  formatAge,
  tr,
  pluralRu,
  pluralEn,
  getLang,
  healthyYearsUnitRu,
  healthyYearsUnitEn,
} from "@/lib/i18n";

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

/** RU «год/года/лет» или EN year/years рядом с числом. */
const yUnit = (y: number) => tr(healthyYearsUnitRu(y), healthyYearsUnitEn(y));

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
  lime: "#9ACD32",
  amber: "#F5A623",
  good: "#1F7A3A",
};

// Type scale - 8 tiers, modular ratio ~1.2-1.33.
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
    fontWeight: 600,
    fontSize: 26,
    lineHeight: 1.25,
    letterSpacing: -0.5,
    color: PALETTE.text,
  },
  verdictTitleFigures: {
    fontFamily: "Geist",
    fontWeight: 600,
    fontSize: 26,
    lineHeight: 1.2,
    letterSpacing: -0.7,
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
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  chipText: {
    color: PALETTE.textMuted,
    fontSize: FS.caption,
    lineHeight: 1,
    letterSpacing: 0.5,
    textAlign: "center" as const,
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
        {(tone !== "optimize" || score.isGainBranch) && <ProjectionPage score={score} answers={answers} />}
        <RadarPage score={score} protectors={protectors} />
        <GoalPage score={score} answers={answers} />
        <LifeHacksPage score={score} answers={answers} />
        <LongyPage answers={answers} score={score} />
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
        <Link src={T.footer.siteHref}>
          <Text style={{ color: primary, fontSize: FS.caption }}>{T.footer.site}</Text>
        </Link>
        <Text style={{ color: secondary, fontSize: FS.caption }}>{T.footer.email}</Text>
      </View>
      <View style={{ gap: 2, alignItems: "flex-end" }}>
        <Text style={{ color: primary, fontSize: FS.caption }}>{T.footer.notClinical}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Link src={T.footer.privacyHref}>
            <Text style={{ color: secondary, fontSize: FS.caption }}>{T.footer.privacy}</Text>
          </Link>
          <Link src={T.footer.termsHref}>
            <Text style={{ color: secondary, fontSize: FS.caption }}>{T.footer.terms}</Text>
          </Link>
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
        <Link
          src={T.footer.siteHref}
          style={{
            position: "absolute",
            top: 784,
            left: 32,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FS.body }}>{T.footer.site}</Text>
        </Link>
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
          <Link src={T.footer.privacyHref}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FS.body }}>{T.hero.privacyPolicy}</Text>
          </Link>
          <Link src={T.footer.termsHref}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FS.body }}>{T.hero.termsOfService}</Text>
          </Link>
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
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {isOptimize ? T.cover.chipOptimize : T.cover.chip}
          </Text>
        </View>
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

      {/* Celebration percentile card - only for optimize tone */}
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
              if (score.isGainBranch) {
                const topGain = [...score.gainPotentialWaterfall].sort(
                  (a, b) => b.yearsLost - a.yearsLost,
                )[0];
                return (
                  <View style={[styles.card, { flex: 1 }]}>
                    <Text style={styles.mono}>{tr("Главная точка роста", "Main growth lever")}</Text>
                    <Text
                      style={[
                        styles.display,
                        { fontSize: FS.subhead, marginTop: 10, lineHeight: 1.2 },
                      ]}
                    >
                      {topGain?.label ?? "-"}
                    </Text>
                    <Text
                      style={{ color: PALETTE.accent, marginTop: 8, fontSize: FS.body }}
                    >
                      +{(topGain?.yearsLost ?? 0).toFixed(1)} {yUnit(topGain?.yearsLost ?? 0)}{" "}
                      {tr("потенциала", "potential")}
                    </Text>
                  </View>
                );
              }
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
                  <Text
                    style={{ color: PALETTE.warm, marginTop: 8, fontSize: FS.body }}
                  >
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
  // Стрелка спидометра привязана к потере здоровых лет (12 - healthspanYears).
  // 0 = стрелка слева (Лучше нормы), 12 = справа (Критическое).
  const velocity = score.yearsLifeLostTotal;
  const isGain = score.isGainBranch;
  const verdictText = isGain
    ? tr(
        "Ниже - разбор по 5 факторам вашего образа жизни. Что уже работает на вас и где ещё есть запас для точечной настройки.",
        "Below is a breakdown across 5 lifestyle factors: what already works for you and where targeted upside remains.",
      )
    : tr(
        "Ниже - разбор по 5 факторам вашего образа жизни. Сколько лет здоровой жизни «стоит» каждый из них и что можно вернуть с Longy",
        "Below is a breakdown across 5 lifestyle factors: how many healthy years each one currently costs and what can be recovered in 8 weeks with Longy.",
      );

  return (
    <Page size="A4" style={styles.page}>
      {/* Фоновое изображение - full-bleed, без вуали */}
      <Image
        src={imagePath("bg8.jpg")}
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
      <Header ordinal="03" label={tr("Главный вывод", "Main takeaway")} onDark />

      {/* Картон 1: вердикт + подзаголовок */}
      <View
        wrap={false}
        style={{
          gap: 8,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 14,
        }}
      >
        <View style={styles.chip}>
          <Text style={styles.chipText}>{tr("Вердикт", "Verdict")}</Text>
        </View>
        {(() => {
          const lines = verdictLifeYearsHeadlineLines(score, answers);
          if (!lines) {
            return (
              <Text style={styles.verdictTitle}>
                {tr("Потерь здоровых лет по этой модели почти не видно", "Almost no healthy-life loss is visible in this model")}
              </Text>
            );
          }
          return (
            <View style={{ gap: 8 }}>
              {lines[0] ? <Text style={styles.verdictTitle}>{lines[0]}</Text> : null}
              {lines[1] ? <Text style={styles.verdictTitleFigures}>{lines[1]}</Text> : null}
              {lines[2] ? <Text style={styles.verdictTitle}>{lines[2]}</Text> : null}
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

      {/* Картон 2: спидометр + легенда */}
      <View
        wrap={false}
        style={{
          marginTop: 10,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 12,
        }}
      >
        <View style={{ alignItems: "center", gap: 2 }}>
          <Text style={[styles.mono, { textAlign: "center" }]}>
            {tr("Где вы сейчас находитесь по вашей скорости старения", "Where you currently stand by aging speed")}
          </Text>
          <SpeedometerSvg velocity={velocity} width={210} />
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
                <LegendPill color={PALETTE.calm} label={tr("Лучше нормы", "Below norm")} active={zone === "below"} />
                <LegendPill color={PALETTE.lime} label={tr("Норма", "Normal")} active={zone === "normal"} />
                <LegendPill color={PALETTE.amber} label={tr("Ускоренное", "Accelerated")} active={zone === "acceleration"} />
                <LegendPill color={PALETTE.warm} label={tr("Высокий риск", "High risk")} active={zone === "risk"} />
                <LegendPill color={PALETTE.danger} label={tr("Критическое", "Critical")} active={zone === "critical"} />
              </>
            );
          })()}
        </View>
      </View>

      <Footer onDark />
    </Page>
  );
};

const GoalPage: React.FC<{ score: ScoreResult; answers: Answers }> = ({
  score,
  answers,
}) => (
  <Page size="A4" style={styles.page}>
    <Header ordinal="07" label={tr("Ваша цель", "Your goal")} />

    <View wrap={false} style={{ flexDirection: "row", gap: 10 }}>
      <View style={[styles.card, { flex: 1 }]}>
        <Text style={styles.mono}>{tr("Ваша цель", "Your goal")}</Text>
        <Text style={{ color: PALETTE.text, marginTop: 6, fontSize: FS.label }}>
          {goalLabel(answers.goal)}
        </Text>
      </View>
      <View style={[styles.card, { flex: 1 }]}>
        <Text style={styles.mono}>{tr("Трекеры", "Trackers")}</Text>
        <Text style={{ color: PALETTE.text, marginTop: 6, fontSize: FS.label }}>
          {answers.trackers && answers.trackers.length > 0
            ? answers.trackers.map(trackerLabel).join(", ")
            : tr("Пока не используете", "Not using yet")}
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
                  {tr("Как Longy работает на вашу цель", "How Longy works toward your goal")}
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

const HealthspanStrip: React.FC<{ score: ScoreResult }> = ({ score }) => {
  if (score.isGainBranch) return <HealthspanStripGain score={score} />;
  return <HealthspanStripLoss score={score} />;
};

const healthspanStripStyle = {
  marginTop: 10,
  borderRadius: 16,
  padding: 12,
  backgroundColor: PALETTE.bgSoft,
  borderWidth: 1,
  borderColor: PALETTE.border,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 14,
};

const progressBarOuter = {
  marginTop: 10,
  height: 6,
  borderRadius: 3,
  backgroundColor: "#E8E8E8",
  overflow: "hidden" as const,
  flexDirection: "row" as const,
};

const HealthspanStripLoss: React.FC<{ score: ScoreResult }> = ({ score }) => {
  const years = score.healthspanYears;
  const max = score.healthspanMax;
  const gap = Math.max(0, Math.round((max - years) * 10) / 10);
  const fillPct = Math.max(0, Math.min(1, years / max));
  const gapColor =
    gap >= 5 ? PALETTE.danger : gap >= 3 ? PALETTE.warm : gap >= 1.5 ? PALETTE.amber : PALETTE.accent;
  const uYears = healthyYearsUnitRu(years);
  const uMax = healthyYearsUnitRu(max);
  const uGap = healthyYearsUnitRu(gap);
  const narrative =
    gap < 1
      ? tr(
          `Ваш образ жизни уже даёт почти максимум — +${years.toFixed(1)} ${uYears} из возможных +${max} ${uMax}.* Отчёт показывает, где можно добрать остальное.`,
          `Your lifestyle already realizes most of its potential: +${years.toFixed(1)} out of +${max} healthy years.* This report highlights where to capture the remaining upside.`,
        )
      : tr(
          `Идеальный образ жизни по 5 факторам даёт до +${max} ${uMax} здоровой жизни.* Сейчас у вас +${years.toFixed(1)} ${uYears} — ещё на +${gap} ${uGap} можно продлить.`,
          `An ideal lifestyle across 5 factors can add up to +${max} healthy years.* You currently realize +${years.toFixed(1)} - about +${gap} remain in reserve.`,
        );

  return (
    <View style={healthspanStripStyle}>
      <View style={{ minWidth: 140 }}>
        <Text style={styles.mono}>Healthspan · Li et al. 2024</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
          <Text style={[styles.numStat, { fontSize: FS.display, color: gapColor }]}>
            +{gap.toFixed(1)}
          </Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>
            {getLang() === "en" ? "years can be gained" : `${healthyYearsUnitRu(gap)} возможно получить`}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, lineHeight: 1.5 }}>
          {narrative}
        </Text>
        <View style={progressBarOuter}>
          <View
            style={{
              width: `${Math.round(fillPct * 100)}%`,
              height: "100%",
              backgroundColor: PALETTE.accent,
              opacity: 0.5,
            }}
          />
          <View style={{ flex: 1, height: "100%", backgroundColor: gapColor }} />
        </View>
      </View>
    </View>
  );
};

const HealthspanStripGain: React.FC<{ score: ScoreResult }> = ({ score }) => {
  const gain = Math.max(1, Math.round(score.gainPotentialYears));
  const fillPct = Math.min(1, score.gainPotentialYears / 5);

  return (
    <View style={healthspanStripStyle}>
      <View style={{ minWidth: 140 }}>
        <Text style={styles.mono}>{tr("Дополнительный потенциал", "Additional upside")}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
          <Text style={[styles.numStat, { fontSize: FS.display, color: PALETTE.accent }]}>
            +{gain}
          </Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>
            {getLang() === "en" ? "years can be added" : `${healthyYearsUnitRu(gain)} можно добрать`}
          </Text>
        </View>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.caption, marginTop: 4 }}>
          {tr("сверх 12-летнего healthspan Li et al.", "above the +12-year Li et al. healthspan model")}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, lineHeight: 1.5 }}>
          {tr(
            `Ваш образ жизни уже работает на вас - 12 лет healthspan по Li et al. в кармане.* Дальше Longy подключает данные с устройств, нутригенетику и маркеры воспаления, чтобы добрать ещё ~${gain} ${healthyYearsUnitRu(gain)} через precision-настройку.`,
            `Your lifestyle baseline is already working in your favor. The +12-year Li et al. healthspan model is largely realized.* Next, Longy uses wearable data, nutrigenetics, and inflammation markers to unlock about ~${gain} more years through precision tuning.`,
          )}
        </Text>
        <View style={progressBarOuter}>
          <View
            style={{
              width: `${Math.round(fillPct * 100)}%`,
              height: "100%",
              backgroundColor: PALETTE.accent,
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
  // Совпадает с isGainBranch (longyScore ≥ 90), чтобы вердикт «У вас крепкая
  // база / +N лет» не противоречил странице ускорителей.
  const isOptimizing = score.isGainBranch;

  return (
    <Page size="A4" style={styles.page}>
      <Header
        ordinal="04"
        label={isOptimizing ? tr("Тонкая настройка", "Fine tuning") : tr("Топ-3 ускорителя", "Top-3 accelerators")}
      />
      <View wrap={false} style={{ gap: 12 }}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {isOptimizing ? tr("Потенциал для улучшения", "Marginal upside") : tr("Ваши личные драйверы", "Your personal drivers")}
          </Text>
        </View>
        <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.15 }]}>
          {isOptimizing
            ? tr("Где есть потенциал для роста", "Where growth potential remains")
            : tr("Что отнимает у вас годы здоровой жизни", "What's taking away your healthy-life years")}
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body }}>
          {isOptimizing
            ? tr(
                "У вас крепкая база. Ниже - три домена с самым большим потенциалом для роста. Каждый шаг небольшой, но они усиливают друг друга.",
                "You already have a strong baseline. Below are the three domains with the highest marginal upside. Each step is small, but together they compound.",
              )
            : tr(
                "Отсортировано по влиянию на потерю здоровых лет. Идите от верхней карточки вниз — первый блок даст самый быстрый эффект.",
                "Sorted by impact on healthy-life loss. Work top-down - the first item gives the fastest return.",
              )}
        </Text>
      </View>

      <View style={{ marginTop: 20, gap: 10 }}>
        {accelerators.map((acc, idx) => {
          const dom = score.domains[acc.key];
          const dotColor = isOptimizing ? PALETTE.calm : colorFor(dom.velocityContribution);
          const actionBorderColor = isOptimizing ? PALETTE.calm : PALETTE.accent;
          const actionBg = isOptimizing ? "#EBF8F1" : "#FEF0EB";
          const actionLabel = isOptimizing ? tr("Как усилить", "How to amplify") : tr("Что делать", "What to do");
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

const ProjectionPage: React.FC<{ score: ScoreResult; answers: Answers }> = ({ score, answers }) => {
  const proj = score.projection;
  const hasLeverage = proj.deltaScore > 0;
  const tone = reportTone(score);
  const isOptimize = tone === "optimize";
  const isGain = score.isGainBranch;
  const maintenanceTips = !isGain && isOptimize && !hasLeverage ? buildMaintenanceTips(score) : [];

  let chipLabel: string;
  let headline: string;
  let subhead: string | null;
  let headerLabel: string;
  if (isGain) {
    chipLabel = tr("Дополнительный потенциал", "Additional upside");
    headline = tr("Сколько лет может дать каждый домен", "How many years can be gained in each domain");
    subhead =
      tr(
        "Все 5 доменов уже на сильной базе. Ниже - гипотетический бонус, который Longy даёт через точные инструменты по каждому домену.",
        "All 5 domains are already on a strong baseline. Below is the hypothetical bonus Longy can add through precision tools in each domain.",
      );
    headerLabel = tr("Дополнительный потенциал", "Additional upside");
  } else if (isOptimize) {
    chipLabel = tr("Реализованный потенциал", "Realized potential");
    headline = tr("Сколько здоровых лет вы уже набираете", "How many healthy years you already realize");
    subhead = tr(
      `Healthspan-модель даёт до +${score.healthspanMax} ${healthyYearsUnitRu(score.healthspanMax)} за идеальный образ жизни. Вы сейчас набираете +${score.healthspanYears.toFixed(1)} ${healthyYearsUnitRu(score.healthspanYears)}.`,
      `The Healthspan model gives up to +${score.healthspanMax} years for an ideal lifestyle. You are currently realizing +${score.healthspanYears.toFixed(1)}.`,
    );
    headerLabel = tr("Реализованный потенциал", "Realized potential");
  } else {
    chipLabel = tr("Из чего складывается потеря лет", "Where year loss comes from");
    headline = tr(
      "Сколько здоровых лет отнимает каждый домен - и что можно точно вернуть",
      "How many healthy years each domain costs - and what can be recovered",
    );
    subhead = null;
    headerLabel = tr("Стоимость и прогноз", "Cost and projection");
  }

  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="05" label={headerLabel} />
      <View wrap={false} style={{ gap: 8 }}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{chipLabel}</Text>
        </View>
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

      {/* Waterfall: gain - бонус по доменам; иначе loss или RealizedPotential */}
      <View wrap={false} style={{ marginTop: isGain ? 8 : 14 }}>
        {isGain ? (
          <>
            <Text style={styles.mono}>
              {tr(
                `Потенциал · +${score.gainPotentialYears.toFixed(1)} ${healthyYearsUnitRu(score.gainPotentialYears)} можно добрать`,
                `Potential · +${score.gainPotentialYears.toFixed(1)} years can be gained`,
              )}
            </Text>
            <View style={{ marginTop: 6 }}>
              <WaterfallSvg
                items={score.gainPotentialWaterfall}
                totalYears={score.gainPotentialYears}
                width={515}
                height={120}
                mode="gain"
              />
            </View>
          </>
        ) : score.yearsLifeLostTotal < 1 ? (
          <RealizedPotentialBlock score={score} />
        ) : (
          <>
            <Text style={styles.mono}>
              {tr(
                `График-водопад · ≈${score.yearsLifeLostTotal.toFixed(1)} ${healthyYearsUnitRu(score.yearsLifeLostTotal)} здоровой жизни`,
                `Waterfall · ≈${score.yearsLifeLostTotal.toFixed(1)} healthy years`,
              )}
            </Text>
            <View style={{ marginTop: 6 }}>
              <WaterfallSvg
                items={score.velocityWaterfall}
                totalYears={score.yearsLifeLostTotal}
                width={515}
                height={135}
              />
            </View>
          </>
        )}
      </View>

      {/* Нижний блок: gain → GainGrid, optimize без leverage → maintenance, optimize → maintain, остальное → рост */}
      {isGain ? (
        <GainGrid score={score} />
      ) : isOptimize ? (
        maintenanceTips.length > 0 ? (
          <MaintenanceGrid tips={maintenanceTips} />
        ) : (
          <MaintainProjectionBlock score={score} />
        )
      ) : (
        <View
          wrap={false}
          style={{
            marginTop: 10,
            borderRadius: 14,
            padding: 10,
            backgroundColor: PALETTE.bgSoft,
            borderWidth: 1,
            borderColor: PALETTE.border,
          }}
        >
          <Text style={styles.mono}>
            {tr("Если улучшить топ-3 · 8 недель с Longy", "If you fix top-3 · 8 weeks with Longy")}
          </Text>

          <View style={{ marginTop: 6, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <ImpactPreviewSvg
              scoreNow={proj.longyScoreNow}
              scoreTarget={proj.longyScoreTarget}
              width={240}
              height={130}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.display, { fontSize: FS.subhead, lineHeight: 1.2 }]}>
                {formatBioAgeDelta(proj.yearsLifeLostNow - proj.yearsLifeLostTarget)}
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: FS.caption, lineHeight: 1.35 }}>
                Longy Health Score вырастет с{" "}
                <Text style={{ color: PALETTE.textMuted }}>{proj.longyScoreNow}</Text>{" "}
                до <Text style={{ color: PALETTE.accent }}>{proj.longyScoreTarget}</Text>.
                Вот что конкретно Longy делает по трём главным факторам:
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
            {proj.targets.map((d) => {
              const bullets = pickEightWeekPromise(d.key, score, answers);
              return (
                <View key={d.key} style={{ flex: 1, gap: 2 }}>
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
                    <View key={i} style={{ flexDirection: "row", gap: 3, marginLeft: 2 }}>
                      <Text style={{ color: PALETTE.accent, fontSize: FS.caption }}>·</Text>
                      <Text
                        style={{
                          color: PALETTE.text,
                          fontSize: FS.caption,
                          lineHeight: 1.3,
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

  const monoLabel =
    gap < 0.5
      ? `Потерь здоровых лет по модели почти не видно - +${years.toFixed(1)} ${healthyYearsUnitRu(years)} из ${max}`
      : `Небольшой резерв здоровых лет - +${years.toFixed(1)} ${healthyYearsUnitRu(years)} из ${max}, ещё +${gap.toFixed(1)} ${healthyYearsUnitRu(gap)} можно вернуть`;

  return (
    <View>
      <Text style={styles.mono}>
        {monoLabel}
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
      Если сохраните режим - 12 месяцев вперёд
    </Text>
    <Text
      style={[
        styles.display,
        { fontSize: FS.subhead, marginTop: 8, lineHeight: 1.25 },
      ]}
    >
      Longy Health Score удержится около {score.longyScore} ± 3
    </Text>
    <Text
      style={{
        color: PALETTE.textMuted,
        fontSize: FS.body,
        marginTop: 8,
        lineHeight: 1.55,
      }}
    >
      На вашей базе главный риск - постепенно съезжать. Стресс в проектах, сбитый
      сон на выходных, пропущенные тренировки в командировках. Longy замечает
      ранние сигналы и возвращает в режим до того, как показатели упадут.
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

const GAIN_DESCRIPTIONS: Record<DomainKey, string> = {
  sleep:
    "Непрерывный анализ HRV, REM и глубоких фаз сна, вашего хронотипа. Подбираем тонкие сдвиги времени отбоя по вашим данным, а не общим рекомендациям.",
  movement:
    "План тренировок строится по вашим реальным данным восстановления. Прогресс там, где организм готов; отдых - там, где ресурс на исходе.",
  nutrition:
    "Нутригенетика и маркеры воспаления. Точная настройка под ваш генотип и микробиом - то, что общими рекомендациями не закрыть.",
  habits:
    "Держать ноль и не сорваться. Анализ маркеров регенерации поможет заметить откат до того, как он закрепится.",
  stress:
    "Обратная связь по HRV в реальном времени. Заметим перегруз до того, как он накопится в кортизоле и воспалении.",
};

const GainGrid: React.FC<{ score: ScoreResult }> = ({ score }) => {
  const items = score.gainPotentialWaterfall.filter((i) => i.yearsLost > 0);

  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <Text style={styles.mono}>Что Longy добавляет сверху · по каждому домену</Text>
      <View style={{ marginTop: 6, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {items.map((it) => {
          const desc = GAIN_DESCRIPTIONS[it.key as DomainKey];
          return (
            <View
              key={it.key}
              style={{
                width: "48%",
                borderRadius: 12,
                padding: 9,
                backgroundColor: "#FEF8F4",
                borderWidth: 1,
                borderColor: PALETTE.accent,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Text style={[styles.mono, { color: PALETTE.accent }]}>
                  {shortLabelFor(it.key, it.label)}
                </Text>
                <Text style={{ color: PALETTE.accent, fontSize: FS.label, fontWeight: "bold" }}>
                  +{it.yearsLost.toFixed(1)} {healthyYearsUnitRu(it.yearsLost)}
                </Text>
              </View>
              <Text
                style={{
                  color: PALETTE.textMuted,
                  fontSize: FS.caption,
                  lineHeight: 1.45,
                  marginTop: 6,
                }}
              >
                {desc}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
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
      {/* Background image - full-bleed, без вуали */}
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
      <Header ordinal="06" label={tr("Карта состояния", "State map")} onDark />
      <View wrap={false} style={{ gap: 8 }}>
        <Text
          style={{
            alignSelf: "flex-start",
            paddingTop: 5,
            paddingBottom: 3,
            paddingHorizontal: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#FFFFFF",
            color: "#FFFFFF",
            fontSize: FS.caption,
            lineHeight: 1,
            letterSpacing: 0.5,
            textAlign: "center",
            backgroundColor: "transparent",
          }}
        >
          {tr("5 доменов", "5 domains")}
        </Text>
        <Text
          style={[
            styles.display,
            { fontSize: FS.headline, color: "#FFFFFF", lineHeight: 1.2 },
          ]}
        >
          {tr("Где вы сейчас - по каждой оси здоровья", "Where you are now across each health axis")}
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: FS.body,
            maxWidth: 460,
            lineHeight: 1.4,
            marginTop: 8,
          }}
        >
          {tr(
            "100 - оптимальный уровень. Чем ближе к центру, тем больше здоровых лет вы теряете за счёт этого домена.",
            "100 is the optimal level. The closer to the center, the more this domain contributes to healthy-life loss.",
          )}
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
        <Text style={[styles.mono, { color: "#FFFFFF" }]}>{tr("Что вас защищает", "What protects you")}</Text>
        <Text style={[styles.display, { fontSize: FS.subhead, marginTop: 4, color: "#FFFFFF" }]}>
          {tr("Сильные стороны", "Strong sides")}
        </Text>
        {protectors.length === 0 ? (
          <View style={[styles.card, { marginTop: 8, padding: 12 }]}>
            <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, lineHeight: 1.5 }}>
              {tr(
                "Пока ни один домен не вышел в зелёную зону. Это не приговор, а стартовая точка. У 86% пользователей Longy хотя бы один домен переходит в зелёную зону за 8 недель.",
                "There are no domains in a protective zone yet. This is not a verdict - this is your starting point. In 86% of users, at least one domain moves into the green zone within 8 weeks.",
              )}
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

const LIFE_HACK_DOMAIN_LABEL: Record<DomainKey, string> = {
  sleep: "Сон",
  stress: "Стресс",
  movement: "Движение",
  nutrition: "Питание",
  habits: "Привычки",
};

// Маленькие SVG-иконки 14×14 для карточек лайфхаков.
type LifeHackIconSpec = { d: string; mode: "fill" | "stroke" };
const LIFE_HACK_ICON: Record<DomainKey, LifeHackIconSpec> = {
  // полумесяц
  sleep: { d: "M 11.5 7.5 A 5 5 0 1 1 6.5 2.5 A 3.8 3.8 0 0 0 11.5 7.5 Z", mode: "fill" },
  // ЭКГ / линия сердечного ритма
  stress: { d: "M 1 7 L 4 7 L 5 5 L 6.5 9.5 L 8 3 L 9 7 L 13 7", mode: "stroke" },
  // молния / энергия
  movement: { d: "M 8.5 1 L 3 8 L 6.5 8 L 5.5 13 L 11 6 L 7.5 6 L 9 1 Z", mode: "fill" },
  // лист
  nutrition: { d: "M 2 12 C 2 6 6 2 12 2 C 12 8 8 12 2 12 Z", mode: "fill" },
  // сердце
  habits: { d: "M 7 12 C 4 9.2 1 7 1 4.5 C 1 2.7 2.5 1.5 4 1.5 C 5.5 1.5 6.5 2.5 7 3.5 C 7.5 2.5 8.5 1.5 10 1.5 C 11.5 1.5 13 2.7 13 4.5 C 13 7 10 9.2 7 12 Z", mode: "fill" },
};

const LifeHackIcon: React.FC<{ domain: DomainKey; color: string }> = ({ domain, color }) => {
  const spec = LIFE_HACK_ICON[domain];
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      {spec.mode === "fill" ? (
        <Path d={spec.d} fill={color} />
      ) : (
        <Path
          d={spec.d}
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </Svg>
  );
};

const LifeHackCard: React.FC<{
  domain: DomainKey;
  hack: LifeHack;
  wide?: boolean;
}> = ({ domain, hack, wide }) => (
  <View
    wrap={false}
    style={{
      width: wide ? "100%" : "48.5%",
      borderRadius: 14,
      padding: 14,
      backgroundColor: "#EAF5EF",
      borderWidth: 1,
      borderColor: PALETTE.good,
      gap: 6,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <LifeHackIcon domain={domain} color={PALETTE.good} />
      <Text style={[styles.mono, { color: PALETTE.good, flex: 1 }]}>
        {LIFE_HACK_DOMAIN_LABEL[domain].toUpperCase()}
      </Text>
    </View>
    <Text
      style={{
        fontSize: FS.label,
        fontWeight: 700,
        color: PALETTE.text,
        lineHeight: 1.35,
      }}
    >
      {hack.title}
    </Text>
    <Text style={{ fontSize: FS.body, color: PALETTE.text, lineHeight: 1.5 }}>
      {hack.hack}
    </Text>
    <Text
      style={{
        fontSize: FS.caption,
        color: PALETTE.textMuted,
        lineHeight: 1.45,
        marginTop: 2,
      }}
    >
      {tr("Почему работает: ", "Why it works: ")}{hack.why}
    </Text>
  </View>
);

const LifeHacksPage: React.FC<{ score: ScoreResult; answers: Answers }> = ({
  score,
  answers,
}) => {
  const hacks = pickFourLifeHacks(score, answers);
  return (
    <Page size="A4" style={styles.page}>
      <Header ordinal="08" label={tr("Лайфхаки", "Life hacks")} />
      <View wrap={false} style={{ gap: 8 }}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {tr("Лайфхаки, которые работают", "Small habits that work")}
          </Text>
        </View>
        <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.15 }]}>
          {tr("4 простых приёма, которые ", "4 simple habits that ")}
          <Text style={{ color: PALETTE.accent }}>
            {tr("легко встроить в день", "fit into any day")}
          </Text>
        </Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: FS.body, maxWidth: 480 }}>
          {tr(
            "Большие перемены пугают и срываются. Эти - встроятся в день незаметно, но дадут результат.",
            "Big overhauls feel scary and fall apart. These slip into your day quietly - but still move the needle.",
          )}
        </Text>
      </View>

      <View
        style={{
          marginTop: 22,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <LifeHackCard domain="sleep" hack={hacks.sleep} />
        <LifeHackCard domain="stress" hack={hacks.stress} />
        <LifeHackCard domain="movement" hack={hacks.movement} />
        <LifeHackCard domain="nutrition" hack={hacks.nutrition} />
      </View>

      <Footer />
    </Page>
  );
};

type EVBreakthrough = {
  titleRu: string;
  titleEn: string;
  bodyRu: string;
  bodyEn: string;
  cite: string;
};

const ESCAPE_VELOCITY_BREAKTHROUGHS: EVBreakthrough[] = [
  {
    titleRu: "Клеточное перепрограммирование",
    titleEn: "Cellular reprogramming",
    bodyRu:
      "Команда Дэвида Синклера в Harvard вернула зрение старым мышам, частично сбросив эпигенетический возраст сетчатки. Altos Labs привлекла $3 млрд на масштабирование на ткани и органы.",
    bodyEn:
      "David Sinclair's team at Harvard restored vision in old mice by partially resetting the epigenetic age of the retina. Altos Labs raised $3B to scale this to tissues and organs.",
    cite: "Lu et al., Nature 2020",
  },
  {
    titleRu: "Senolytics — препараты против «старых» клеток",
    titleEn: "Senolytics — drugs that clear senescent cells",
    bodyRu:
      "Дазатиниб + кверцетин в клиническом испытании снизили нагрузку senescent-клеток у пожилых пациентов с диабетической болезнью почек. Mayo Clinic ведёт >15 параллельных trials.",
    bodyEn:
      "Dasatinib + quercetin reduced senescent-cell burden in elderly patients with diabetic kidney disease in a clinical trial. Mayo Clinic is running >15 parallel trials.",
    cite: "Hickson et al., EBioMedicine 2019",
  },
  {
    titleRu: "AlphaFold + AI-driven discovery",
    titleEn: "AlphaFold + AI-driven discovery",
    bodyRu:
      "DeepMind открыл структуру 200+ млн белков. Insilico Medicine довела полностью AI-разработанный препарат до Phase 2 за 30 месяцев против стандартных 84.",
    bodyEn:
      "DeepMind opened up 200M+ protein structures. Insilico Medicine took a fully AI-designed drug to Phase 2 in 30 months — versus the standard 84.",
    cite: "Ren et al., Nat Biotech 2024",
  },
  {
    titleRu: "Ксенотрансплантация и биопечать",
    titleEn: "Xenotransplantation & bioprinting",
    bodyRu:
      "Свиная почка успешно пересажена живому человеку (NYU Langone, март 2024). Свиное сердце — пациенту в Maryland (2022). Прогноз FDA — first-line одобрения в горизонте 5–10 лет.",
    bodyEn:
      "A pig kidney was successfully transplanted into a living human (NYU Langone, March 2024). A pig heart was implanted in a Maryland patient (2022). FDA forecast: first-line approvals within 5–10 years.",
    cite: "Locke et al., NEJM 2024",
  },
];

const LongyPage: React.FC<{ answers: Answers; score: ScoreResult }> = ({ answers, score }) => {
  const baseYears = score.isGainBranch
    ? score.gainPotentialYears
    : score.yearsLifeLostTotal;
  const n = Math.max(1, Math.round(baseYears));
  const yearsWordRu = pluralRu(n, "год", "года", "лет");
  const yearsWordEn = pluralEn(n, "year", "years");

  // Возрастная проекция (если возраст известен).
  const rawAge =
    typeof answers.age === "number" ? answers.age : Number(answers.age);
  const age = Number.isFinite(rawAge) && rawAge > 0 ? Math.round(rawAge) : null;

  // Базовые значения: текущая ожидаемая продолжительность жизни ~80,
  // с темпом Oeppen & Vaupel (≈3 мес/год) +4-5 лет за оставшийся горизонт,
  // с прорывами +15 лет, с LEV - открытый верхний предел (визуально 130).
  const baseLE = 80;
  const traj = age
    ? {
        none: baseLE,
        trend2024: baseLE + 4,
        breakthroughs: baseLE + 35,
        lev: 130,
      }
    : null;

  // Шкала бара: от 50 до 130 лет (визуально лучше различает разницу).
  const BAR_MIN = 50;
  const BAR_MAX = 130;
  const widthPct = (y: number) =>
    Math.min(100, Math.max(0, ((y - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100));

  const PROJECTION_ROWS = traj
    ? [
        { label: tr("Без действий", "Without action"), years: traj.none, value: `≈${traj.none}`, color: PALETTE.textFaint },
        { label: tr("С темпом роста 2026", "With current 2026 growth pace"), years: traj.trend2024, value: `≈${traj.trend2024}`, color: PALETTE.lime },
        { label: tr("С медицинскими прорывами", "With medical breakthroughs"), years: traj.breakthroughs, value: `${traj.breakthroughs}+`, color: PALETTE.amber },
        { label: tr("С Longevity Escape Velocity*", "With Longevity Escape Velocity*"), years: traj.lev, value: "∞", color: PALETTE.accent },
      ]
    : [];

  return (
  <Page size="A4" style={styles.page}>
    <Header ordinal="09" label={tr("Эффект эскалации", "Escape velocity")} />

    {/* HERO: маленькое +N → огромное +50 */}
    <View wrap={false} style={{ gap: 6 }}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>
          {tr("Почему это важно", "Why this matters")}
        </Text>
      </View>
      <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.1 }]}>
        {tr("Самый дорогой риск - не дожить до прорыва науки.", "The costliest risk is not living to see the science breakthrough.")}
      </Text>
    </View>

    <View
      wrap={false}
      style={{
        marginTop: 14,
        backgroundColor: PALETTE.bgSoft,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.border,
        padding: 14,
      }}
    >
      {/* Заголовки 3 колонок */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ minWidth: 70, alignItems: "flex-start" }}>
          <Text style={[styles.mono, { color: PALETTE.textFaint }]}>
            {tr("сегодня", "today")}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.mono, { color: PALETTE.textFaint }]}>
            {tr("медицинские прорывы", "medical breakthroughs")}
          </Text>
        </View>
        <View style={{ minWidth: 100, alignItems: "flex-start" }}>
          <Text style={[styles.mono, { color: PALETTE.accent }]}>
            {tr("потенциал", "potential")}
          </Text>
        </View>
      </View>

      {/* Цифры + стрелка */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
        {/* +N */}
        <View style={{ minWidth: 70 }}>
          <Text
            style={{
              fontFamily: "Geist",
              fontWeight: 700,
              fontSize: 36,
              color: PALETTE.text,
              lineHeight: 1,
              letterSpacing: -1.4,
            }}
          >
            +{n}
          </Text>
          <Text style={{ fontSize: 9, color: PALETTE.textMuted, marginTop: 2 }}>
            {tr(yearsWordRu, yearsWordEn)}
          </Text>
        </View>

        {/* Стрелка + подпись */}
        <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <Svg width={260} height={12} viewBox="0 0 260 12">
            <Path
              d="M 0 6 L 250 6 M 242 1 L 253 6 L 242 11"
              stroke={PALETTE.accent}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={{ fontSize: 8, color: PALETTE.textFaint, textAlign: "center", lineHeight: 1.2 }}>
            reprogramming · senolytics · AI discovery · xeno · mRNA
          </Text>
        </View>

        {/* +50 */}
        <View style={{ minWidth: 100 }}>
          <Text
            style={{
              fontFamily: "Geist",
              fontWeight: 700,
              fontSize: 60,
              color: PALETTE.accent,
              lineHeight: 1,
              letterSpacing: -2.5,
            }}
          >
            +50
          </Text>
          <Text style={{ fontSize: 9, color: PALETTE.accent, marginTop: 2, fontWeight: 600 }}>
            {tr(`${healthyYearsUnitRu(50)} здоровой жизни`, "years of healthy life")}
          </Text>
        </View>
      </View>

      {/* TIMELINE - внизу, тики + годы */}
      {(() => {
        const startYear = new Date().getFullYear();
        const years = [0, 2, 4, 6, 8].map((i) => startYear + i);
        // Ширина страницы 515 минус padding карточки 14×2 = 487.
        const W = 487;
        const H = 14;
        const N_TICKS = 40;
        return (
          <View style={{ marginTop: 12 }}>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              {/* Базовая линия */}
              <Path d={`M 0 ${H / 2} L ${W} ${H / 2}`} stroke={PALETTE.textFaint} strokeWidth={0.4} />
              {/* Тики */}
              {Array.from({ length: N_TICKS + 1 }).map((_, i) => {
                const x = (i * W) / N_TICKS;
                const isMajor = i % 10 === 0;
                const isToday = i === 0;
                const stroke = isToday ? PALETTE.text : PALETTE.textFaint;
                const strokeW = isToday ? 1.6 : isMajor ? 1.0 : 0.5;
                const top = isToday ? 0 : isMajor ? 2 : 5;
                const bottom = isToday ? H : isMajor ? H - 2 : H - 5;
                return (
                  <Path
                    key={i}
                    d={`M ${x} ${top} L ${x} ${bottom}`}
                    stroke={stroke}
                    strokeWidth={strokeW}
                  />
                );
              })}
            </Svg>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
              {years.map((y, i) => (
                <Text
                  key={y}
                  style={{
                    fontSize: 10,
                    color: i === 0 ? PALETTE.text : PALETTE.textFaint,
                    fontWeight: i === 0 ? 700 : 400,
                  }}
                >
                  {y}
                </Text>
              ))}
            </View>
          </View>
        );
      })()}
    </View>

    {/* ПЕРСОНАЛЬНАЯ ПРОЕКЦИЯ ПО ВОЗРАСТУ */}
    {traj && (
      <View wrap={false} style={{ marginTop: 16, gap: 4 }}>
        <Text style={styles.mono}>
          {tr(
            `ВАМ СЕЙЧАС ${age}. ПО ТЕКУЩИМ ТРАЕКТОРИЯМ ВЫ ДОЖИВЁТЕ ДО:`,
            `YOU ARE ${age} NOW. CURRENT TRAJECTORIES TAKE YOU TO:`,
          )}
        </Text>
        <View style={{ gap: 2, marginTop: 1 }}>
          {PROJECTION_ROWS.map((row) => (
            <View
              key={row.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  width: 170,
                  fontSize: 9,
                  color: PALETTE.textMuted,
                }}
              >
                {row.label}
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 9,
                  backgroundColor: "#F0F0F0",
                  borderRadius: 4.5,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${widthPct(row.years)}%`,
                    height: 9,
                    backgroundColor: row.color,
                    borderRadius: 4.5,
                  }}
                />
              </View>
              <Text
                style={{
                  width: 36,
                  textAlign: "right",
                  fontSize: row.value === "∞" ? 16 : 9.5,
                  lineHeight: row.value === "∞" ? 1 : undefined,
                  fontWeight: 700,
                  color: row.color === PALETTE.textFaint ? PALETTE.text : row.color,
                }}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    )}

    {/* КАРТОЧКИ ПРОРЫВОВ - сжато (без wrap=false на контейнере) */}
    <View style={{ marginTop: 16, gap: 4 }}>
      <Text style={styles.mono}>
        {tr("Что уже работает в лабораториях", "What is already working in labs")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
        {ESCAPE_VELOCITY_BREAKTHROUGHS.map((b) => (
          <View
            key={b.titleEn}
            wrap={false}
            style={[
              styles.card,
              { width: "49.4%", padding: 4, gap: 0, borderRadius: 7 },
            ]}
          >
            <Text style={[styles.display, { fontSize: 8.5, lineHeight: 1.1 }]}>
              {tr(b.titleRu, b.titleEn)}
            </Text>
            <Text style={{ color: PALETTE.text, fontSize: 7, lineHeight: 1.2, marginTop: 1 }}>
              {tr(b.bodyRu, b.bodyEn)}
            </Text>
            <Text style={{ color: PALETTE.textFaint, fontSize: 6, marginTop: 1 }}>
              {b.cite}
            </Text>
          </View>
        ))}
      </View>
    </View>

    {/* CLOSING - расширенный нарратив */}
    <View style={{ marginTop: 14, gap: 5, width: "100%" }}>
      <Text
        style={{
          color: PALETTE.text,
          fontSize: 8.5,
          lineHeight: 1.35,
        }}
      >
        {tr(
          "Логика *longevity escape velocity проста: первая рабочая терапия не обязана решить всё. Достаточно, если она купит человеку время до следующей, более сильной волны медицины. Aubrey de Grey ещё в 2004 году описывал сценарий, в котором первые терапии могли бы дать около 20 дополнительных лет, чтобы дождаться следующего поколения вмешательств.",
          "The logic of *longevity escape velocity is simple: the first working therapy does not have to solve everything. It is enough if it buys time until the next, stronger wave of medicine. Aubrey de Grey described in 2004 a scenario where the first therapies could give about 20 additional years - enough to reach the next generation of interventions.",
        )}
      </Text>
      <Text
        style={{
          width: "100%",
          color: PALETTE.accent,
          fontSize: 10,
          fontWeight: "bold",
          lineHeight: 1.3,
          textAlign: "center",
          marginTop: 1,
          marginBottom: 1,
        }}
      >
        {tr(
          "Поэтому Longy - не про красивый wellness. Longy - про время.",
          "That is why Longy is not about pretty wellness. Longy is about time.",
        )}
      </Text>
      <Text
        style={{
          color: PALETTE.text,
          fontSize: 8.5,
          lineHeight: 1.35,
        }}
      >
        {tr(
          "Сохранить вам окно 5-10 лет - а оно завтра может конвертироваться в доступ к медицине, способной прибавлять десятки лет. В доклинике комбинированные геропротекторные подходы уже дают +27-30% к жизни - сильный сигнал, куда идёт наука.",
          "Preserve your 5-10 year window — which tomorrow can convert into access to medicine capable of adding decades. In preclinical models combined geroprotectors already deliver +27-30% lifespan — a strong signal of where the science is heading.",
        )}
      </Text>
    </View>

    <Footer />
  </Page>
  );
};

const FinalPage: React.FC<{
  name: string;
  score: ScoreResult;
  answers: Answers;
}> = () => {
  const bullets: { text: string; bold?: boolean }[] = [
    {
      text: tr(
        "Команда: Сертифицированный менеджер здоровья, AI-нутрициолог + AI-спортивный тренер + AI-терапевт - работают вместе, видят полную картину и дают согласованные рекомендации.",
        "Team: certified health manager, AI nutritionist + AI sports trainer + AI therapist—they work together, see the full picture, and give coordinated recommendations.",
      ),
    },
    { text: tr("План, который подстраивается под ваше состояние каждый день", "A plan that adapts to your daily state") },
    { text: tr("Главная цель + 3 приоритета на сегодня - не список на 20 пунктов", "One primary goal + 3 priorities for today, not a 20-item checklist") },
    {
      text: tr(
        "В основе - методология Longy, разработанная командой наших экспертов - биологов, реальных тренеров - на основе гарвардского исследования о факторах долголетия.",
        "At the core is Longy's methodology, built by our experts—biologists and practicing coaches—based on Harvard research on longevity factors.",
      ),
    },
    { text: tr("Тренировки под ваш уровень и восстановление", "Training matched to your level and recovery") },
    { text: tr("Интеграция с Whoop, Garmin, Apple Watch, Oura, Strava, умными весами и другими трекерами", "Integrations with Whoop, Garmin, Apple Watch, Oura, Strava, smart scales, and other trackers") },
    { text: tr("Работает даже без девайсов - начните с базовой информации о себе", "Works even without devices - start with basic self-reported data") },
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
            top: 88,
            left: 40,
            width: 515,
            fontFamily: "Geist",
            fontWeight: 600,
            fontSize: 22,
            lineHeight: 1.2,
            letterSpacing: -0.3,
            textAlign: "center",
            color: PALETTE.text,
          }}
        >
          {tr(
            "Ваша модель здоровья уже в Longy.\nСкачайте приложение и запустите персональную систему движения к вашей цели.",
            "Your health model is already in Longy.\nDownload the app and start your personalized system on the path to your goal.",
          )}
        </Text>

        {/* Intro: below headline (3–4 lines @ 22pt) — do not overlap */}
        <Text
          style={{
            position: "absolute",
            top: 204,
            left: 40,
            width: 515,
            fontSize: 10.5,
            lineHeight: 1.38,
            textAlign: "center",
            color: PALETTE.text,
          }}
        >
          {tr(
            "Это не повтор отчёта. Longy уже собрал для вас первые шаги, ежедневный фокус и рекомендации AI агентов. Система адаптируется под ваше состояние и помогает двигаться каждый день.",
            "This is not a recap of the report. Longy has already pulled together your first steps, daily focus, and AI agent recommendations. The system adapts to how you feel and helps you move forward every day.",
          )}
        </Text>

        {/* Main card: phone + right col */}
        <View
          style={{
            position: "absolute",
            top: 260,
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
              top: 8,
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
                marginBottom: 12,
              }}
            >
              {tr("Что ждёт вас в приложении:", "What awaits you in the app:")}
            </Text>

            <View style={{ gap: 8, marginBottom: 14 }}>
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

            {/* CTA: App Store */}
            <Link
              src="https://apps.apple.com/us/app/longy-ai/id6758518609"
              style={{ width: 215, marginBottom: 14, textDecoration: "none" }}
            >
              <View
                style={{
                  width: 215,
                  height: 42,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: PALETTE.accent,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <View style={{ marginTop: 3 }}>
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path
                      fill="#FFFFFF"
                      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                    />
                  </Svg>
                </View>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: FS.label,
                    fontWeight: 500,
                    lineHeight: 1,
                    textAlign: "center",
                  }}
                >
                  {tr("Скачать приложение", "Download the app")}
                </Text>
              </View>
            </Link>

            {/* Mini links */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Link src={T.footer.siteHref}>
                <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>{T.footer.site}</Text>
              </Link>
              <Text style={{ color: PALETTE.textFaint, fontSize: FS.body }}>{T.footer.email}</Text>
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
          {tr("Не является клиническим диагнозом", "Not a clinical diagnosis")}
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
          <Link src={T.footer.privacyHref}>
            <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption }}>{T.footer.privacy}</Text>
          </Link>
          <Link src={T.footer.termsHref}>
            <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption }}>{T.footer.terms}</Text>
          </Link>
        </View>
      </View>
    </Page>
  );
};

const MethodologyPage: React.FC = () => (
  <Page size="A4" style={styles.page}>
    <Header ordinal="10" label={tr("Методология", "Methodology")} />
    <View wrap={false} style={{ gap: 8 }}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>{tr("Методология отчёта", "Report methodology")}</Text>
      </View>
      <Text style={[styles.display, { fontSize: FS.headline, lineHeight: 1.15 }]}>
        {tr("На чём построен этот отчёт", "What this report is built on")}
      </Text>
      <Text
        style={{
          color: PALETTE.textMuted,
          fontSize: FS.body,
          maxWidth: 480,
          lineHeight: 1.4,
        }}
      >
        {tr(
          "Скрининговые инструменты и исследовательская база, на которые опирается аудит здоровья Longy.",
          "Clinical screening instruments and research evidence that Longy relies on.",
        )}
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
      {tr(
        "Отчёт построен на клинически валидированных скрининговых инструментах с подтверждёнными психометрическими свойствами: Insomnia Severity Index (ISI-7) для оценки сна, Perceived Stress Scale (PSS-10) и PROMIS Fatigue 7a для стресса и энергии, Duke Activity Status Index (DASI) и IPAQ-SF для функционального статуса и физической активности, Mini-EAT для питания.",
        "This report is built on clinically validated screening instruments with established psychometric properties: Insomnia Severity Index (ISI-7) for sleep assessment, Perceived Stress Scale (PSS-10) and PROMIS Fatigue 7a for stress and energy, Duke Activity Status Index (DASI) and IPAQ-SF for functional status and physical activity, and Mini-EAT for nutrition.",
      )}
    </Text>
    <Text style={{ color: PALETTE.text, fontSize: FS.body, lineHeight: 1.55, marginTop: 10 }}>
      {tr(
        "* Методология Longy вдохновлена исследованием Li et al. (Harvard Medical School, J Intern Med 2024) о 5 факторах долголетия, дающих до +12 лет здоровой жизни на выборке 2 млн+ человек. Применён собственный алгоритм калибровки под скрининговый контекст. Longy - wellness-сервис: выводы не заменяют медицинскую диагностику и консультацию врача. При хронических заболеваниях обсуждайте любые изменения образа жизни с лечащим врачом.",
        "* Longy methodology is inspired by Li et al. (Harvard Medical School, J Intern Med 2024) on 5 longevity factors associated with up to +12 healthy years in a 2M+ cohort. A proprietary calibration algorithm is applied for screening context. Longy is a wellness service: conclusions do not replace medical diagnosis or physician consultation. If you have chronic conditions, discuss lifestyle changes with your treating physician.",
      )}
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
  const widthPct = `${Math.max(2, Math.min(100, domain.score0to100))}%`;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text style={{ color: PALETTE.text, fontSize: FS.body }}>{domain.label}</Text>
          <Text style={{ color: PALETTE.textFaint, fontSize: FS.caption, marginTop: 2 }}>
            {tr(
              `≈${domain.yearsLifeLost.toFixed(1)} ${healthyYearsUnitRu(domain.yearsLifeLost)} в модели`,
              `≈${domain.yearsLifeLost.toFixed(1)} years in model`,
            )}
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
          width: "100%",
        }}
      >
        <View style={{ width: widthPct, height: 5, backgroundColor: color, borderRadius: 3 }} />
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
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        marginBottom: 3,
      }}
    />
    <Text
      style={{
        color: active ? PALETTE.text : PALETTE.textMuted,
        fontSize: FS.caption,
        fontWeight: active ? 700 : 400,
        lineHeight: 1.2,
      }}
    >
      {label}
    </Text>
  </View>
);

// Years-lost (0..12) → zone key, used to highlight the active LegendPill.
function velocityZoneKey(
  yearsLost: number,
): "below" | "normal" | "acceleration" | "risk" | "critical" {
  if (yearsLost < 1) return "below";
  if (yearsLost < 3) return "normal";
  if (yearsLost < 6) return "acceleration";
  if (yearsLost < 9) return "risk";
  return "critical";
}

const WaterfallSvg = ({
  items,
  totalYears,
  width,
  height,
  mode = "loss",
}: {
  items: WaterfallItem[];
  totalYears: number;
  width: number;
  height: number;
  mode?: "loss" | "gain";
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
    const color =
      mode === "gain"
        ? PALETTE.accent
        : isPositive
          ? colorFor(item.delta)
          : PALETTE.calm;
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
    mode === "gain"
      ? PALETTE.good
      : totalYears > 6
        ? PALETTE.warm
        : totalYears > 2
          ? PALETTE.amber
          : PALETTE.accent;

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
        {tr("лет", "years")}
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
              {yv.toFixed(1)} {getLang() === "en" ? healthyYearsUnitEn(yv) : healthyYearsUnitRu(yv)}
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
          {mode === "gain" ? "+" : "≈"}
          {totalYears.toFixed(1)} {getLang() === "en" ? healthyYearsUnitEn(totalYears) : healthyYearsUnitRu(totalYears)}
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
          {tr("Итого", "Total")}
        </Text>
      </View>
    </View>
  );
};

const shortLabelFor = (key: string, fallback: string): string => {
  const map: Record<string, string> = {
    stress: tr("Стресс", "Stress"),
    sleep: tr("Сон", "Sleep"),
    movement: tr("Движение", "Movement"),
    nutrition: tr("Питание", "Nutrition"),
    habits: tr("Привычки", "Habits"),
    bmi: tr("ИМТ / талия", "BMI / waist"),
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
        {tr("Сейчас", "Now")}
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
        {tr("8 недель", "8 weeks")}
      </Text>
    </View>
  );
};

const SpeedometerSvg = ({ velocity, width }: { velocity: number; width: number }) => {
  // velocity здесь = потеря здоровых лет (0..12).
  const size = width;
  const min = 0;
  const max = 12;
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
      {arc(bp(0), bp(1), PALETTE.calm, "a1")}
      {arc(bp(1), bp(3), PALETTE.lime, "a2")}
      {arc(bp(3), bp(6), PALETTE.amber, "a3")}
      {arc(bp(6), bp(9), PALETTE.warm, "a4")}
      {arc(bp(9), bp(12), PALETTE.danger, "a5")}

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

const radarShortLabel = (key: DomainKey): string => {
  const map: Record<DomainKey, string> = {
    sleep: tr("Сон", "Sleep"),
    movement: tr("Движение", "Movement"),
    nutrition: tr("Питание", "Nutrition"),
    stress: tr("Стресс", "Stress"),
    habits: tr("Привычки", "Habits"),
  };
  return map[key];
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

  // Позиция для подписи оси - чуть дальше максимального радиуса.
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
              {radarShortLabel(d.key)}
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
      return tr("Ниже нормы", "Below normal");
    case "normal":
      return tr("В норме", "Normal");
    case "overweight":
      return tr("Избыточный", "Overweight");
    case "obese":
      return tr("Ожирение", "Obese");
    default:
      return "-";
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
      return tr("Смарт-весы", "Smart scales");
    case "smart_mattress":
      return tr("Смарт-матрас", "Smart mattress");
    case "other":
      return tr("Другое", "Other");
    case "none":
      return "-";
    default:
      return t;
  }
}

export default Report;

// Silence unused key param warnings (domain keys are strongly typed above).
export const _unused: DomainKey | null = null;
