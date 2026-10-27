const Appointment = require("../models/Appointment");
const InterpreterRequest = require("../models/InterpreterRequest");
const { getScheduleWindow } = require("../utils/schedule");

/**
 * Decides whether `user` may join the video room `roomId` right now.
 *
 * Rules:
 *   1. The room must belong to a real appointment.
 *   2. The user must be that appointment's patient or doctor, or an
 *      interpreter whose request for it was accepted.
 *   3. The current time must be inside the appointment's join window
 *      (see utils/schedule.js) and the appointment must not be cancelled.
 *
 * @param {string} roomId  Appointment.videoRoomId
 * @param {{id: string, role: string}} user  authenticated user
 * @param {Date} [now]
 * @returns {Promise<{allowed: boolean, reason?: string, schedule?: object, appointment?: object}>}
 */
async function checkRoomAccess(roomId, user, now = new Date()) {
  if (typeof roomId !== "string" || !roomId) return { allowed: false, reason: "not_found" };

  const appointment = await Appointment.findOne({ videoRoomId: roomId });
  if (!appointment) return { allowed: false, reason: "not_found" };

  const userId = String(user.id);
  let isParticipant = String(appointment.patient) === userId || String(appointment.doctor) === userId;

  if (!isParticipant && user.role === "interpreter") {
    const accepted = await InterpreterRequest.exists({
      appointment: appointment._id,
      interpreter: user.id,
      status: "accepted",
    });
    isParticipant = Boolean(accepted);
  }

  if (!isParticipant) return { allowed: false, reason: "not_participant" };

  const schedule = getScheduleWindow(appointment, now);
  if (!schedule.canJoin) return { allowed: false, reason: schedule.state, schedule };

  return { allowed: true, appointment, schedule };
}

module.exports = { checkRoomAccess };
