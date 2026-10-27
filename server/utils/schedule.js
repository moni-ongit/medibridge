/**
 * schedule.js
 * ----------------------------------------------------------------
 * Single source of truth for WHEN a consultation room can be joined.
 *
 * Appointments store a plain date ("2026-10-12") and time ("09:30").
 * Those are wall-clock values in the clinic's timezone, so we convert
 * them to a real instant using a fixed UTC offset from the environment.
 *
 *   opensAt  = start - JOIN_EARLY_MINUTES
 *   closesAt = start + JOIN_CLOSE_AFTER_MINUTES
 *
 * The room is joinable only while opensAt <= now <= closesAt and the
 * appointment is not cancelled. The window only limits JOINING; people
 * already in a call are never kicked out when it closes.
 */

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function getConfig() {
  return {
    // India Standard Time (UTC+5:30) by default
    offsetMinutes: num(process.env.APPOINTMENT_UTC_OFFSET_MINUTES, 330),
    earlyMinutes: num(process.env.JOIN_EARLY_MINUTES, 5),
    closeAfterMinutes: num(process.env.JOIN_CLOSE_AFTER_MINUTES, 45),
  };
}

/** Convert a clinic-local date + time string pair into a UTC Date (or null if invalid). */
function parseStart(dateStr, timeStr, offsetMinutes) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
  const t = /^(\d{1,2}):(\d{2})$/.exec(String(timeStr || ""));
  if (!d || !t) return null;

  const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [hour, minute] = [Number(t[1]), Number(t[2])];
  if (hour > 23 || minute > 59) return null;

  const asUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  // Reject dates that "roll over" (e.g. 2026-02-31)
  if (asUtc.getUTCFullYear() !== year || asUtc.getUTCMonth() !== month - 1 || asUtc.getUTCDate() !== day) {
    return null;
  }
  return new Date(asUtc.getTime() - offsetMinutes * 60000);
}

/** Format an instant as clinic-local { date: "YYYY-MM-DD", time: "HH:mm" }. */
function toLocalParts(instant, offsetMinutes) {
  const iso = new Date(instant.getTime() + offsetMinutes * 60000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/**
 * @param {{appointmentDate: string, appointmentTime: string, status?: string}} appointment
 * @param {Date} [now]
 * @returns {object} window info; `state` is one of
 *   "open" | "too_early" | "ended" | "cancelled" | "invalid"
 */
function getScheduleWindow(appointment, now = new Date()) {
  const cfg = getConfig();
  const startsAt = parseStart(appointment.appointmentDate, appointment.appointmentTime, cfg.offsetMinutes);

  if (!startsAt) {
    return { state: "invalid", canJoin: false, serverTime: now.toISOString() };
  }

  const opensAt = new Date(startsAt.getTime() - cfg.earlyMinutes * 60000);
  const closesAt = new Date(startsAt.getTime() + cfg.closeAfterMinutes * 60000);

  let state = "open";
  if (appointment.status === "cancelled") state = "cancelled";
  else if (now < opensAt) state = "too_early";
  else if (now > closesAt) state = "ended";

  return {
    state,
    canJoin: state === "open",
    startsAt: startsAt.toISOString(),
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    // Clinic-local labels for display (so every user sees the booked time)
    startsAtDate: toLocalParts(startsAt, cfg.offsetMinutes).date,
    startsAtTime: toLocalParts(startsAt, cfg.offsetMinutes).time,
    opensAtTime: toLocalParts(opensAt, cfg.offsetMinutes).time,
    closesAtTime: toLocalParts(closesAt, cfg.offsetMinutes).time,
    earlyMinutes: cfg.earlyMinutes,
    // The client uses this to correct for a wrong local clock
    serverTime: now.toISOString(),
  };
}

module.exports = { getScheduleWindow, parseStart, toLocalParts, getConfig };
