import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const STEPS = ["step1", "step2", "step3", "step4", "step5"];
const ICONS = ["🌐", "🔍", "📅", "📹", "💬"];

export default function HowItWorks() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="badge bg-teal-50 text-teal-700">{t("nav.howItWorks")}</span>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-900">{t("howItWorks.title")}</h1>

      <ol className="mt-12 space-y-8">
        {STEPS.map((step, idx) => (
          <li key={step} className="flex gap-5">
            <div className="flex flex-col items-center">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-600 text-xl text-white">
                {ICONS[idx]}
              </span>
              {idx < STEPS.length - 1 && <span className="mt-2 h-full w-px flex-1 bg-ink-100" />}
            </div>
            <div className="pb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Step {idx + 1}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-ink-900">{t(`howItWorks.${step}.title`)}</h3>
              <p className="mt-2 text-ink-500">{t(`howItWorks.${step}.desc`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <Link to="/register" className="btn-primary">{t("hero.getStarted")}</Link>
      </div>
    </div>
  );
}
