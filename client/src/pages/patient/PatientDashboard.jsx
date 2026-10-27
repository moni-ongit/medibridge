import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import Spinner from "../../components/Spinner.jsx";

const LANG_NAMES = { en: "English", ta: "Tamil", hi: "Hindi" };

export default function PatientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/appointments").then((res) => setAppointments(res.data.appointments)).finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const past = appointments.filter((a) => ["completed", "cancelled"].includes(a.status));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-ink-400">{t("dashboard.patient.welcome")},</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900">{user?.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {t("dashboard.patient.preferredLanguage")}: {LANG_NAMES[user?.preferredLanguage] || user?.preferredLanguage}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.patient.upcomingAppointments")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-teal-700">{upcoming.length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.patient.recentConsultations")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{past.length}</p>
        </div>
        <Link to="/doctors" className="card flex flex-col justify-between bg-teal-600 text-white hover:bg-teal-700">
          <p className="text-xs uppercase tracking-wide text-white/70">{t("dashboard.patient.findDoctors")}</p>
          <p className="mt-2 font-display text-lg font-semibold">{t("hero.findDoctor")} →</p>
        </Link>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-900">{t("dashboard.patient.upcomingAppointments")}</h2>
          <Link to="/patient/appointments" className="text-sm font-semibold text-teal-700 hover:underline">{t("common.viewAll")}</Link>
        </div>

        {loading ? (
          <Spinner size={28} />
        ) : upcoming.length === 0 ? (
          <p className="text-ink-400">{t("appointments.noAppointments")}</p>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((a) => (
              <AppointmentCard key={a._id} appointment={a} viewerRole="patient" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
