import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/appointments").then((res) => setAppointments(res.data.appointments)).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((a) => a.appointmentDate === today && a.status !== "cancelled");
  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const completed = appointments.filter((a) => a.status === "completed");
  const uniquePatients = new Set(appointments.map((a) => a.patient?._id)).size;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-ink-400">{t("dashboard.patient.welcome")},</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900">{user?.name}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.doctor.todayAppointments")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-teal-700">{todayAppointments.length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.doctor.upcomingConsultations")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{upcoming.length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.doctor.patientList")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{uniquePatients}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.doctor.history")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{completed.length}</p>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-900">{t("dashboard.doctor.todayAppointments")}</h2>
          <Link to="/doctor/appointments" className="text-sm font-semibold text-teal-700 hover:underline">{t("common.viewAll")}</Link>
        </div>
        {loading ? (
          <Spinner size={28} />
        ) : todayAppointments.length === 0 ? (
          <p className="text-ink-400">{t("appointments.noAppointments")}</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((a) => (
              <AppointmentCard key={a._id} appointment={a} viewerRole="doctor" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
