import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FEATURES = [
  { icon: "🌐", key: "multilingual" },
  { icon: "💬", key: "translation" },
  { icon: "📹", key: "video" },
  { icon: "👤", key: "interpreter" },
];

const STEPS = ["step1", "step2", "step3", "step4", "step5"];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-mist-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24 lg:px-8">
          <div>
            <span className="badge bg-teal-50 text-teal-700">MediBridge · English · தமிழ் · हिन्दी</span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
              {t("hero.headline")}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">
              {t("hero.subheading")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary">{t("hero.getStarted")}</Link>
              <Link to="/doctors" className="btn-secondary">{t("hero.findDoctor")}</Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-ink-400">
              <div><span className="font-display text-2xl font-semibold text-ink-900">3</span> languages supported</div>
              <div className="h-8 w-px bg-ink-100" />
              <div><span className="font-display text-2xl font-semibold text-ink-900">24/7</span> interpreter access</div>
            </div>
          </div>

          <div className="relative">
            <div className="card !p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink-100 bg-ink-900 px-5 py-3 text-white">
                <span className="text-sm font-medium">Live Consultation</span>
                <span className="flex items-center gap-1.5 text-xs text-teal-300">
                  <span className="h-2 w-2 rounded-full bg-teal-400" /> Connected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-ink-800 p-4">
                <div className="aspect-[4/5] rounded-xl bg-ink-600/60 grid place-items-center text-3xl">👩‍⚕️</div>
                <div className="aspect-[4/5] rounded-xl bg-ink-600/60 grid place-items-center text-3xl">🧑</div>
              </div>
              <div className="space-y-2 p-4">
                <div className="rounded-lg bg-mist-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Patient · Tamil</p>
                  <p className="text-sm text-ink-800">"எனக்கு தலைவலி இருக்கிறது"</p>
                </div>
                <div className="rounded-lg bg-teal-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">Translated · English</p>
                  <p className="text-sm text-ink-900">"I have a headache."</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 -z-10 h-full w-full rounded-2xl bg-amber-100 sm:-right-6 sm:-top-6" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-ink-900">{t("features.title")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.key} className="card">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-2xl">{f.icon}</span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{t(`features.${f.key}.title`)}</h3>
              <p className="mt-2 text-sm text-ink-500">{t(`features.${f.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold">{t("howItWorks.title")}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-5">
            {STEPS.map((step, idx) => (
              <div key={step} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-teal-400 font-display text-lg text-teal-300">
                  {idx + 1}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{t(`howItWorks.${step}.title`)}</h3>
                <p className="mt-2 text-sm text-ink-100/70">{t(`howItWorks.${step}.desc`)}</p>
                {idx < STEPS.length - 1 && (
                  <div className="mt-6 hidden h-px w-full bg-white/10 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-semibold text-ink-900">{t("hero.headline")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-500">{t("hero.subheading")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/register" className="btn-primary">{t("hero.getStarted")}</Link>
          <Link to="/doctors" className="btn-secondary">{t("hero.findDoctor")}</Link>
        </div>
      </section>
    </div>
  );
}
