import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import AppointmentCard from "../../components/AppointmentCard.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function DoctorAppointments() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => api.get("/appointments").then((res) => setAppointments(res.data.appointments));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const handleConfirm = async (id) => {
    await api.put(`/appointments/${id}`, { status: "confirmed" });
    load();
  };
  const handleCancel = async (id) => {
    await api.delete(`/appointments/${id}`);
    load();
  };

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);
  const filters = ["all", "pending", "confirmed", "completed", "cancelled"];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t("appointments.myAppointments")}</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition ${
              filter === f ? "border-teal-600 bg-teal-50 text-teal-700" : "border-ink-100 text-ink-500 hover:border-ink-200"
            }`}
          >
            {f === "all" ? "All" : t(`appointments.status.${f}`)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <Spinner size={28} />
        ) : filtered.length === 0 ? (
          <p className="text-ink-400">{t("appointments.noAppointments")}</p>
        ) : (
          filtered.map((a) => (
            <AppointmentCard key={a._id} appointment={a} viewerRole="doctor" onCancel={handleCancel} onConfirm={handleConfirm} />
          ))
        )}
      </div>
    </div>
  );
}
