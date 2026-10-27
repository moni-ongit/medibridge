import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="badge bg-teal-50 text-teal-700">{t("nav.about")}</span>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-900">
        Care shouldn't stop at a language barrier.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-600">
        Millions of patients with Limited English Proficiency struggle to navigate telemedicine platforms,
        describe their symptoms accurately, or fully understand a doctor's instructions. MediBridge was built
        to close that gap — combining a fully multilingual interface, real-time translated subtitles during
        video consultations, and on-demand human interpreters for moments that need a person, not just an
        algorithm.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="card">
          <h3 className="font-display text-lg font-semibold text-ink-900">Our mission</h3>
          <p className="mt-2 text-sm text-ink-500">Make quality healthcare equally accessible regardless of the language a patient speaks.</p>
        </div>
        <div className="card">
          <h3 className="font-display text-lg font-semibold text-ink-900">Our approach</h3>
          <p className="mt-2 text-sm text-ink-500">Pair machine translation for speed with human interpreters for nuance and trust.</p>
        </div>
        <div className="card">
          <h3 className="font-display text-lg font-semibold text-ink-900">Who we serve</h3>
          <p className="mt-2 text-sm text-ink-500">Patients, doctors, and interpreters working together across English, Tamil, and Hindi — with more languages planned.</p>
        </div>
      </div>

      <div className="mt-16 rounded-2xl bg-mist-50 p-8">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Built as an open architecture</h2>
        <p className="mt-3 text-ink-600">
          MediBridge ships with demo-friendly mock translation and speech services so it runs without any paid
          API keys. The service layer is structured so a real speech-to-text or translation provider can be
          connected later with no changes to the rest of the application.
        </p>
      </div>
    </div>
  );
}
