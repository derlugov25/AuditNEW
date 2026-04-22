import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen vignette overflow-hidden">
      <div className="grain absolute inset-0" />

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-accent-primary/20 grid place-items-center">
            <div className="h-3 w-3 rounded-full bg-accent-primary" />
          </div>
          <span className="display text-xl tracking-tight">Longy</span>
        </div>
        <span className="chip">Beta · Audit v1</span>
      </nav>

      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20">
        <div className="flex flex-col items-start gap-8">
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
            На базе Li et al., J Intern Med 2024
          </span>

          <h1 className="display text-[11vw] sm:text-7xl md:text-[88px] leading-[0.95] tracking-[-0.04em] max-w-4xl">
            Что именно
            <br />
            <span className="gradient-text italic">ускоряет старение</span>
            <br />
            вашего организма
          </h1>

          <p className="max-w-2xl text-white/70 text-lg md:text-xl leading-relaxed">
            23 вопроса. 5 минут. Персональный PDF-отчёт с разбором трёх ваших самых
            сильных ускорителей старения — и конкретным планом, как их развернуть.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/quiz" className="btn-primary text-lg">
              Пройти аудит бесплатно
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <span className="btn-ghost pointer-events-none">PDF-отчёт сразу после прохождения</span>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            number="01"
            title="Потеря здоровых лет"
            body="Главный тезис отчёта: сколько лет здоровой жизни «стоит» ваш текущий образ жизни — по модели Li et al., 2024"
          />
          <FeatureCard
            number="02"
            title="Топ-3 ускорителя"
            body="Персональная диаграмма: что именно сокращает вашу продолжительность жизни сильнее всего"
          />
          <FeatureCard
            number="03"
            title="Что делать сегодня"
            body="Три точечных действия на неделю и разбор, как Longy берёт ведение на себя"
          />
        </div>

        <div className="mt-16 border-t border-white/5 pt-10 flex flex-col md:flex-row gap-8 md:items-center md:justify-between">
          <p className="text-white/50 max-w-xl leading-relaxed">
            Longy работает с данными Whoop, Oura, Apple Watch, Garmin и умных весов. Внутри —
            AI-нутрициолог, AI-коуч, AI-терапевт и health manager, которые видят полную картину.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Whoop", "Oura", "Apple Watch", "Garmin", "Strava"].map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6 md:p-8">
      <div className="mono text-xs text-accent-primary/80">{number}</div>
      <h3 className="display text-2xl mt-6 tracking-tight">{title}</h3>
      <p className="mt-3 text-white/60 leading-relaxed">{body}</p>
    </div>
  );
}
