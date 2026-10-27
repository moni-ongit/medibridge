import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import useJoinWindow from "../hooks/useJoinWindow.js";

export default function AppointmentCard({ appointment, viewerRole, onCancel, onConfirm }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const otherParty = viewerRole === "patient" ? appointment.doctor : appointment.patient;
  // A call can be started from here only for live appointments...
  const isLive = appointment.status === "confirmed" || appointment.status === "pending";
  // ...and only while the scheduled join window is open (see useJoinWindow)
  const win = useJoinWindow(appointment.schedule);

  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700">
          {otherParty?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-display text-base font-semibold text-ink-900">{otherParty?.name || "Unknown"}</p>
          <p className="text-sm text-ink-500">
            {appointment.appointmentDate} · {appointment.appointmentTime}
          </p>
          {appointment.reason && <p className="mt-0.5 text-xs text-ink-400">"{appointment.reason}"</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={appointment.status} label={t(`appointments.status.${appointment.status}`)} />
        {isLive && win.state === "open" && (
          <button
            onClick={() => navigate(`/consultation/${appointment._id}`)}
            className="btn-primary !px-4 !py-2 text-xs"
          >
            {t("appointments.joinCall")}
          </button>
        )}
        {isLive && win.state === "too_early" && (
          <button
            type="button"
            disabled
            title={t("consultation.schedule.joinFromNote", { minutes: win.earlyMinutes })}
            className="btn-secondary !px-4 !py-2 text-xs !border-ink-100 !text-ink-400 cursor-not-allowed hover:!bg-transparent hover:!text-ink-400"
          >
            {t("consultation.schedule.joinOpensAt", { time: win.opensAtTime })}
          </button>
        )}
        {isLive && win.state === "ended" && (
          <span className="text-xs text-ink-400">{t("consultation.schedule.windowClosed")}</span>
        )}
        {viewerRole === "doctor" && appointment.status === "pending" && onConfirm && (
          <button onClick={() => onConfirm(appointment._id)} className="btn-secondary !px-4 !py-2 text-xs">
            {t("appointments.status.confirmed")}
          </button>
        )}
        {appointment.status !== "cancelled" && appointment.status !== "completed" && onCancel && (
          <button onClick={() => onCancel(appointment._id)} className="text-xs font-semibold text-signal-500 hover:underline">
            {t("appointments.cancelAppointment")}
          </button>
        )}
      </div>
    </div>
  );
}
