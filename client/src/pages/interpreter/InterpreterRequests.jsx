import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import getSocket from "../../services/socket.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function InterpreterRequests() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = () => api.get("/interpreter/requests").then((res) => setRequests(res.data.requests));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));

    const socket = getSocket();
    socket.emit("interpreter:subscribe");
    const refresh = () => load();
    socket.on("interpreter:new-request", refresh);
    socket.on("interpreter:request-taken", refresh);
    return () => {
      socket.off("interpreter:new-request", refresh);
      socket.off("interpreter:request-taken", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (id, status) => {
    setActingId(id);
    try {
      const res = await api.put(`/interpreter/request/${id}`, { status });
      if (status === "accepted") {
        navigate(`/consultation/${res.data.request.appointment}`);
      } else {
        load();
      }
    } finally {
      setActingId(null);
    }
  };

  const waiting = requests.filter((r) => r.status === "waiting");
  const mine = requests.filter((r) => r.interpreter?._id === user._id && r.status !== "waiting");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">{t("dashboard.interpreter.pendingRequests")}</h1>
        {loading ? (
          <div className="mt-6"><Spinner size={28} /></div>
        ) : waiting.length === 0 ? (
          <p className="mt-6 text-ink-400">No pending requests right now.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {waiting.map((r) => (
              <div key={r._id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{r.doctor?.name} ↔ {r.patient?.name}</p>
                  <p className="text-sm text-ink-500">
                    {r.sourceLanguage.toUpperCase()} → {r.targetLanguage.toUpperCase()} · requested by {r.requestedBy?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={actingId === r._id}
                    onClick={() => handleAction(r._id, "accepted")}
                    className="btn-primary !px-4 !py-2 text-xs"
                  >
                    {t("dashboard.interpreter.accept")}
                  </button>
                  <button
                    disabled={actingId === r._id}
                    onClick={() => handleAction(r._id, "declined")}
                    className="btn-secondary !px-4 !py-2 text-xs"
                  >
                    {t("dashboard.interpreter.decline")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-ink-900">History</h2>
        {mine.length === 0 ? (
          <p className="mt-4 text-ink-400">No history yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {mine.map((r) => (
              <div key={r._id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{r.doctor?.name} ↔ {r.patient?.name}</p>
                  <p className="text-sm text-ink-500">{r.sourceLanguage.toUpperCase()} → {r.targetLanguage.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} label={r.status} />
                  {r.status === "accepted" && (
                    <button onClick={() => navigate(`/consultation/${r.appointment}`)} className="btn-secondary !px-4 !py-2 text-xs">
                      Rejoin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
