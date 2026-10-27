const InterpreterRequest = require("../models/InterpreterRequest");
const InterpreterProfile = require("../models/InterpreterProfile");
const Appointment = require("../models/Appointment");
const { asyncHandler } = require("../middleware/errorHandler");

// @desc    Create a human interpreter request during a consultation
// @route   POST /api/interpreter/request
// @access  Private (doctor or patient)
const createInterpreterRequest = asyncHandler(async (req, res, next) => {
  const { appointmentId, sourceLanguage, targetLanguage } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found" });
  }

  const request = await InterpreterRequest.create({
    appointment: appointment._id,
    requestedBy: req.user._id,
    doctor: appointment.doctor,
    patient: appointment.patient,
    sourceLanguage,
    targetLanguage,
    roomId: appointment.videoRoomId,
    status: "waiting",
  });

  const populated = await request.populate([
    { path: "requestedBy", select: "name role" },
    { path: "doctor", select: "name" },
    { path: "patient", select: "name" },
  ]);

  // Broadcast to all available interpreters via Socket.IO
  const io = req.app.get("io");
  if (io) {
    io.to("interpreters").emit("interpreter:new-request", populated);
  }

  res.status(201).json({ success: true, request: populated });
});

// @desc    Get interpreter requests (interpreters see 'waiting' ones + their own history)
// @route   GET /api/interpreter/requests
// @access  Private (interpreter)
const getInterpreterRequests = asyncHandler(async (req, res) => {
  let filter;
  if (req.user.role === "interpreter") {
    filter = { $or: [{ status: "waiting" }, { interpreter: req.user._id }] };
  } else {
    filter = { requestedBy: req.user._id };
  }

  const requests = await InterpreterRequest.find(filter)
    .populate("requestedBy", "name role")
    .populate("doctor", "name")
    .populate("patient", "name")
    .populate("interpreter", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: requests.length, requests });
});

// @desc    Accept or decline an interpreter request
// @route   PUT /api/interpreter/request/:id
// @access  Private (interpreter)
const updateInterpreterRequest = asyncHandler(async (req, res) => {
  const { status } = req.body; // "accepted" | "declined" | "completed"

  const request = await InterpreterRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Interpreter request not found" });
  }

  if (status === "accepted") {
    request.interpreter = req.user._id;
    request.status = "accepted";

    await InterpreterProfile.findOneAndUpdate({ user: req.user._id }, {});
  } else if (status) {
    request.status = status;
  }

  await request.save();

  const populated = await request.populate([
    { path: "requestedBy", select: "name role" },
    { path: "doctor", select: "name" },
    { path: "patient", select: "name" },
    { path: "interpreter", select: "name" },
  ]);

  const io = req.app.get("io");
  if (io) {
    io.to(request.roomId).emit("interpreter:status-update", populated);
    io.to("interpreters").emit("interpreter:request-taken", { id: request._id, status: request.status });
  }

  res.status(200).json({ success: true, request: populated });
});

// @desc    Create/update the logged-in interpreter's profile (languages, availability)
// @route   POST /api/interpreter/profile
// @access  Private (interpreter)
const upsertInterpreterProfile = asyncHandler(async (req, res) => {
  const { languages, experience, bio, isAvailable } = req.body;

  const update = {};
  if (languages !== undefined) update.languages = languages;
  if (experience !== undefined) update.experience = experience;
  if (bio !== undefined) update.bio = bio;
  if (isAvailable !== undefined) update.isAvailable = isAvailable;

  const profile = await InterpreterProfile.findOneAndUpdate({ user: req.user._id }, update, {
    new: true,
    upsert: true,
  });

  res.status(200).json({ success: true, interpreter: profile });
});

// @desc    Get the logged-in interpreter's own profile
// @route   GET /api/interpreter/profile/me
// @access  Private (interpreter)
const getMyInterpreterProfile = asyncHandler(async (req, res) => {
  const profile = await InterpreterProfile.findOne({ user: req.user._id }).populate("user", "name email profileImage");
  res.status(200).json({ success: true, interpreter: profile });
});

module.exports = {
  createInterpreterRequest,
  getInterpreterRequests,
  updateInterpreterRequest,
  upsertInterpreterProfile,
  getMyInterpreterProfile,
};
