const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const AppointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentDate: {
      type: String, // ISO date string e.g. "2026-09-05"
      required: true,
    },
    appointmentTime: {
      type: String, // e.g. "10:30"
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    reason: {
      type: String,
      default: "",
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "ta", "hi"],
      default: "en",
    },
    videoRoomId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
