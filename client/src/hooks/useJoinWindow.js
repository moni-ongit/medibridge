import { useEffect, useMemo, useState } from "react";

/** "MM:SS", "H:MM:SS", or "Nd HH:MM:SS" for long waits. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Live view of an appointment's join window.
 *
 * `schedule` is the object the API attaches to every appointment. The
 * server's clock is authoritative: we measure how far the browser clock is
 * from `schedule.serverTime` once, then correct for it, so a wrong device
 * clock cannot open the room early (the server also re-checks on join).
 *
 * Returns { state, canJoin, msToOpen, countdown, ... } where state is
 * "open" | "too_early" | "ended" | "cancelled" | "invalid".
 * If there is no schedule at all it reports canJoin: true and lets the
 * server decide.
 */
export default function useJoinWindow(schedule) {
  const clockOffset = useMemo(
    () => (schedule?.serverTime ? Date.parse(schedule.serverTime) - Date.now() : 0),
    [schedule?.serverTime]
  );
  const [, forceTick] = useState(0);

  const opensAt = schedule?.opensAt ? Date.parse(schedule.opensAt) : null;
  const closesAt = schedule?.closesAt ? Date.parse(schedule.closesAt) : null;
  const now = Date.now() + clockOffset;

  let state = "open";
  if (!schedule) state = "open";
  else if (schedule.state === "cancelled" || schedule.state === "invalid") state = schedule.state;
  else if (opensAt !== null && now < opensAt) state = "too_early";
  else if (closesAt !== null && now > closesAt) state = "ended";

  // Re-render every second until the window has closed for good
  const keepTicking = Boolean(schedule) && state !== "ended" && state !== "cancelled" && state !== "invalid";
  useEffect(() => {
    if (!keepTicking) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [keepTicking]);

  const msToOpen = state === "too_early" && opensAt !== null ? opensAt - now : 0;

  return {
    state,
    canJoin: state === "open",
    msToOpen,
    countdown: formatCountdown(msToOpen),
    startsAtDate: schedule?.startsAtDate,
    startsAtTime: schedule?.startsAtTime,
    opensAtTime: schedule?.opensAtTime,
    earlyMinutes: schedule?.earlyMinutes,
  };
}
