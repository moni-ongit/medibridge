import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import getSocket from "../../services/socket.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function InterpreterDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = () =>
    Promise.all([
      api.get("/interpreter/profile/me"),
      api.get("/interpreter/requests"),
    ]).then(([profileRes, requestsRes]) => {
      setProfile(profileRes.data.interpreter);
      setRequests(requestsRes.data.requests);
    });

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));

    const socket = getSocket();
    socket.emit("interpreter:subscribe");
    const onNewRequest = () => load();
    socket.on("interpreter:new-request", onNewRequest);
    return () => socket.off("interpreter:new-request", onNewRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await api.post("/interpreter/profile", { isAvailable: !profile?.isAvailable });
      setProfile(res.data.interpreter);
    } finally {
      setToggling(false);
    }
  };

  const waiting = requests.filter((r) => r.status === "waiting");
  const active = requests.filter((r) => r.status === "accepted" && r.interpreter?._id === user._id);
  const completed = requests.filter((r) => r.status === "completed");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-ink-400">{t("dashboard.patient.welcome")},</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900">{user?.name}</h1>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">{t("dashboard.interpreter.availability")}</p>
          <p className="text-sm text-ink-500">
            {profile?.isAvailable ? t("dashboard.interpreter.available") : t("dashboard.interpreter.unavailable")}
          </p>
        </div>
        <button
          onClick={handleToggleAvailability}
          disabled={toggling}
          className={`relative h-8 w-14 rounded-full transition ${profile?.isAvailable ? "bg-teal-600" : "bg-ink-100"}`}
          aria-pressed={profile?.isAvailable}
        >
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${profile?.isAvailable ? "left-7" : "left-1"}`} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.interpreter.pendingRequests")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-amber-600">{waiting.length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.interpreter.activeConsultation")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-teal-700">{active.length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-ink-400">{t("dashboard.interpreter.completed")}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{completed.length}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">{t("dashboard.interpreter.pendingRequests")}</h2>
        {loading ? (
          <Spinner size={28} />
        ) : waiting.length === 0 ? (
          <p className="text-ink-400">No pending requests right now.</p>
        ) : (
          <div className="space-y-3">
            {waiting.slice(0, 3).map((r) => (
              <div key={r._id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{r.doctor?.name} ↔ {r.patient?.name}</p>
                  <p className="text-sm text-ink-500">{r.sourceLanguage.toUpperCase()} → {r.targetLanguage.toUpperCase()}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {active.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">{t("dashboard.interpreter.activeConsultation")}</h2>
          {active.map((r) => (
            <button
              key={r._id}
              onClick={() => navigate(`/consultation/${r.appointment}`)}
              className="card flex w-full items-center justify-between text-left hover:border-teal-300"
            >
              <span className="font-medium text-ink-900">{r.doctor?.name} ↔ {r.patient?.name}</span>
              <span className="text-sm font-semibold text-teal-700">Join call →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
