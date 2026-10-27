import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function MyAppointments() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  const load = () => api.get("/appointments").then((res) => setAppointments(res.data.appointments));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    await api.delete(`/appointments/${id}`);
    load();
  };

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const past = appointments.filter((a) => ["completed", "cancelled"].includes(a.status));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t("appointments.myAppointments")}</h1>

      <div className="mt-6 flex gap-2 border-b border-ink-100">
        {["upcoming", "past"].map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === tabKey ? "border-teal-600 text-teal-700" : "border-transparent text-ink-400 hover:text-ink-600"
            }`}
          >
            {t(`appointments.${tabKey}`)} ({tabKey === "upcoming" ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <Spinner size={28} />
        ) : list.length === 0 ? (
          <p className="text-ink-400">{t("appointments.noAppointments")}</p>
        ) : (
          list.map((a) => <AppointmentCard key={a._id} appointment={a} viewerRole="patient" onCancel={handleCancel} />)
        )}
      </div>
    </div>
  );
}
