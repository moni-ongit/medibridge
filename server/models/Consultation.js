const mongoose = require("mongoose");

const TranscriptEntrySchema = new mongoose.Schema(
  {
    speakerRole: { type: String, enum: ["patient", "doctor", "interpreter"] },
    speakerName: String,
    originalText: String,
    originalLanguage: String,
    translatedText: String,
    translatedLanguage: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConsultationSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["patient", "doctor", "interpreter"] },
      },
    ],
    roomId: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "ended"],
      default: "scheduled",
    },
    transcript: [TranscriptEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", ConsultationSchema);
