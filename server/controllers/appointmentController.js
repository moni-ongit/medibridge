const { v4: uuidv4 } = require("uuid");
const Appointment = require("../models/Appointment");
const Consultation = require("../models/Consultation");
const { asyncHandler } = require("../middleware/errorHandler");
const { getScheduleWindow } = require("../utils/schedule");

/** Plain-object copy of an appointment with its join-window info attached. */
const withSchedule = (appointment) => {
  const obj = typeof appointment.toObject === "function" ? appointment.toObject() : { ...appointment };
  obj.schedule = getScheduleWindow(obj);
  return obj;
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (patient)
const createAppointment = asyncHandler(async (req, res) => {
  const { doctor, appointmentDate, appointmentTime, reason, preferredLanguage } = req.body;

  if (!doctor || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ success: false, message: "Doctor, date, and time are required" });
  }

  // The slot must be a real date/time whose consultation window has not already closed
  const slot = getScheduleWindow({ appointmentDate, appointmentTime, status: "pending" });
  if (slot.state === "invalid") {
    return res.status(400).json({ success: false, message: "Invalid appointment date or time" });
  }
  if (slot.state === "ended") {
    return res.status(400).json({ success: false, message: "You cannot book a time that has already passed" });
  }

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor,
    appointmentDate,
    appointmentTime,
    reason: reason || "",
    preferredLanguage: preferredLanguage || req.user.preferredLanguage,
    videoRoomId: uuidv4(),
  });

  await Consultation.create({
    appointment: appointment._id,
    roomId: appointment.videoRoomId,
    participants: [
      { user: req.user._id, role: "patient" },
      { user: doctor, role: "doctor" },
    ],
  });

  const populated = await appointment.populate([
    { path: "patient", select: "name email preferredLanguage" },
    { path: "doctor", select: "name email" },
  ]);

  res.status(201).json({ success: true, appointment: withSchedule(populated) });
});

// @desc    Get appointments for the logged-in user (patient or doctor)
// @route   GET /api/appointments
// @access  Private
const getAppointments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "patient") filter.patient = req.user._id;
  else if (req.user.role === "doctor") filter.doctor = req.user._id;
  else {
    return res.status(403).json({ success: false, message: "Only patients and doctors have appointments" });
  }

  if (req.query.status) filter.status = req.query.status;

  const appointments = await Appointment.find(filter)
    .populate("patient", "name email preferredLanguage profileImage")
    .populate("doctor", "name email profileImage")
    .sort({ appointmentDate: 1, appointmentTime: 1 });

  res.status(200).json({ success: true, count: appointments.length, appointments: appointments.map(withSchedule) });
});

// @desc    Get a single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("patient", "name email preferredLanguage profileImage")
    .populate("doctor", "name email profileImage");

  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found" });
  }

  const isParticipant =
    appointment.patient._id.equals(req.user._id) || appointment.doctor._id.equals(req.user._id);
  if (!isParticipant && req.user.role !== "interpreter") {
    return res.status(403).json({ success: false, message: "Not authorized to view this appointment" });
  }

  res.status(200).json({ success: true, appointment: withSchedule(appointment) });
});

// @desc    Update appointment status / details
// @route   PUT /api/appointments/:id
// @access  Private (doctor or patient who owns it)
const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found" });
  }

  const isDoctor = appointment.doctor.equals(req.user._id);
  const isPatient = appointment.patient.equals(req.user._id);
  if (!isDoctor && !isPatient) {
    return res.status(403).json({ success: false, message: "Not authorized to update this appointment" });
  }

  const { status, appointmentDate, appointmentTime, reason } = req.body;

  // Only the doctor may move an appointment; otherwise a patient could
  // reschedule it to "now" and walk around the scheduled join window.
  if ((appointmentDate !== undefined || appointmentTime !== undefined) && !isDoctor) {
    return res.status(403).json({ success: false, message: "Only the doctor can reschedule an appointment" });
  }

  if (status !== undefined) {
    const allowedStatuses = isDoctor ? ["pending", "confirmed", "completed", "cancelled"] : ["cancelled", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({ success: false, message: `You cannot set the status to "${status}"` });
    }
    if (status === "completed" && getScheduleWindow(appointment).state === "too_early") {
      return res.status(400).json({ success: false, message: "A consultation cannot be completed before its scheduled time" });
    }
    appointment.status = status;
  }

  if (reason !== undefined) appointment.reason = reason;

  if (appointmentDate !== undefined) appointment.appointmentDate = appointmentDate;
  if (appointmentTime !== undefined) appointment.appointmentTime = appointmentTime;
  if (appointmentDate !== undefined || appointmentTime !== undefined) {
    const slot = getScheduleWindow(appointment);
    if (slot.state === "invalid") {
      return res.status(400).json({ success: false, message: "Invalid appointment date or time" });
    }
    if (slot.state === "ended") {
      return res.status(400).json({ success: false, message: "You cannot reschedule to a time that has already passed" });
    }
  }

  await appointment.save();
  res.status(200).json({ success: true, appointment: withSchedule(appointment) });
});

// @desc    Cancel/delete an appointment
// @route   DELETE /api/appointments/:id
// @access  Private (doctor or patient who owns it)
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found" });
  }

  const isOwner = appointment.patient.equals(req.user._id) || appointment.doctor.equals(req.user._id);
  if (!isOwner) {
    return res.status(403).json({ success: false, message: "Not authorized to cancel this appointment" });
  }

  appointment.status = "cancelled";
  await appointment.save();

  res.status(200).json({ success: true, message: "Appointment cancelled", appointment });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
