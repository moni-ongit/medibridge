import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo-only: no backend endpoint for contact form yet.
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="badge bg-teal-50 text-teal-700">{t("nav.contact")}</span>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-900">{t("footer.contactUs")}</h1>
      <p className="mt-4 max-w-lg text-ink-600">Questions, feedback, or partnership ideas — we'd love to hear from you.</p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          {sent && <p className="rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-700">Thanks! Your message has been noted (demo mode — no email is actually sent).</p>}
          <div>
            <label className="label-field" htmlFor="c-name">{t("common.name")}</label>
            <input id="c-name" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-field" htmlFor="c-email">{t("common.email")}</label>
            <input id="c-email" type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label-field" htmlFor="c-message">Message</label>
            <textarea id="c-message" required rows={5} className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">{t("common.submit")}</button>
        </form>

        <div className="card h-fit">
          <h3 className="font-display text-lg font-semibold text-ink-900">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-600">
            <li>📧 support@medibridge.demo</li>
            <li>📞 +91 98765 43210</li>
            <li>📍 Chennai, Tamil Nadu, India</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
