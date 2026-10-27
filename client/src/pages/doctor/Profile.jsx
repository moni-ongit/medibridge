import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/Spinner.jsx";

const ALL_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "hi", label: "Hindi" },
];

export default function DoctorProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    specialization: "",
    qualifications: "",
    experience: 0,
    consultationFee: 0,
    bio: "",
    languages: [],
  });

  useEffect(() => {
    api.get("/doctors/me/profile").then((res) => {
      const p = res.data.doctor;
      if (p) {
        setForm({
          specialization: p.specialization || "",
          qualifications: p.qualifications || "",
          experience: p.experience || 0,
          consultationFee: p.consultationFee || 0,
          bio: p.bio || "",
          languages: p.languages || [],
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggleLanguage = (code) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter((l) => l !== code)
        : [...prev.languages, code],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/doctors/profile", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Doctor Profile</h1>
      <p className="mt-1 text-sm text-ink-500">{user?.name} · {user?.email}</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        {saved && <p className="rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-700">{t("common.saved")}</p>}

        <div>
          <label className="label-field">Specialization</label>
          <input className="input-field" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
        </div>
        <div>
          <label className="label-field">Qualifications</label>
          <input className="input-field" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Experience (years)</label>
            <input type="number" min={0} className="input-field" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label-field">{t("doctors.consultationFee")} (₹)</label>
            <input type="number" min={0} className="input-field" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label-field">Bio</label>
          <textarea rows={4} className="input-field" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div>
          <label className="label-field">{t("doctors.speaks")}</label>
          <div className="flex flex-wrap gap-2">
            {ALL_LANGUAGES.map((lang) => (
              <button
                type="button"
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`rounded-full border-2 px-4 py-1.5 text-sm transition ${
                  form.languages.includes(lang.code) ? "border-teal-600 bg-teal-50 text-teal-700" : "border-ink-100 text-ink-500"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? t("common.loading") : t("common.save")}</button>
      </form>
    </div>
  );
}
