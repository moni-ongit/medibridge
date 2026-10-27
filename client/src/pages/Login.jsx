import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const dest = location.state?.from || `/${user.role}/dashboard`;
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t("auth.loginTitle")}</h1>

      <div className="mt-6 rounded-xl bg-mist-50 p-4 text-xs text-ink-500">
        Demo accounts (password <code className="font-mono text-ink-800">Demo@1234</code>):
        <br />patient@medibridge.demo · doctor@medibridge.demo · interpreter@medibridge.demo
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="rounded-lg bg-signal-500/10 px-4 py-2 text-sm text-signal-600">{error}</p>}
        <div>
          <label className="label-field" htmlFor="email">{t("common.email")}</label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="password">{t("common.password")}</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("common.loading") : t("auth.signIn")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="font-semibold text-teal-700 hover:underline">
          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
}
