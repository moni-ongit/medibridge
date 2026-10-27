import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";

const ROLES = [
  { value: "patient", icon: "🧑" },
  { value: "doctor", icon: "🩺" },
  { value: "interpreter", icon: "🗣️" },
];

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    preferredLanguage: "en",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t("common.somethingWrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t("auth.registerTitle")}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-signal-500/10 px-4 py-2 text-sm text-signal-600">{error}</p>}

        <div>
          <label className="label-field">{t("auth.iAm")}</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                className={`rounded-xl border-2 px-3 py-3 text-center text-sm font-medium transition ${
                  form.role === r.value ? "border-teal-600 bg-teal-50 text-teal-700" : "border-ink-100 text-ink-500 hover:border-ink-200"
                }`}
              >
                <div className="text-xl">{r.icon}</div>
                {t(`auth.${r.value}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="name">{t("common.name")}</label>
          <input id="name" required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label className="label-field" htmlFor="email">{t("common.email")}</label>
          <input id="email" type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="label-field" htmlFor="password">{t("common.password")}</label>
          <input id="password" type="password" required minLength={6} className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        <div>
          <label className="label-field" htmlFor="phone">{t("common.phone")}</label>
          <input id="phone" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <label className="label-field" htmlFor="lang">{t("auth.preferredLanguage")}</label>
          <select id="lang" className="input-field" value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}>
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("common.loading") : t("auth.createAccount")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-semibold text-teal-700 hover:underline">{t("auth.signIn")}</Link>
      </p>
    </div>
  );
}
