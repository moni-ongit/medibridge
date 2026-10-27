import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

export default function PatientProfile() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    preferredLanguage: user?.preferredLanguage || "en",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", form);
      updateUser(res.data.user);
      i18n.changeLanguage(form.preferredLanguage);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t("nav.dashboard")} · Profile</h1>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        {saved && <p className="rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-700">{t("common.saved")}</p>}

        <div>
          <label className="label-field">{t("common.email")}</label>
          <input className="input-field bg-mist-50" value={user?.email} disabled />
        </div>
        <div>
          <label className="label-field" htmlFor="name">{t("common.name")}</label>
          <input id="name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label-field" htmlFor="phone">{t("common.phone")}</label>
          <input id="phone" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label-field" htmlFor="lang">{t("dashboard.patient.preferredLanguage")}</label>
          <select id="lang" className="input-field" value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}>
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? t("common.loading") : t("common.save")}</button>
      </form>
    </div>
  );
}
