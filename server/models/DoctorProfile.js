const mongoose = require("mongoose");

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    slots: [{ type: String }], // e.g. ["09:00", "09:30", "10:00"]
  },
  { _id: false }
);

const DoctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualifications: {
      type: String,
      default: "",
    },
    experience: {
      type: Number, // years
      default: 0,
    },
    languages: [{ type: String }], // ["en", "ta", "hi"]
    bio: {
      type: String,
      default: "",
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    availability: [AvailabilitySlotSchema],
    rating: {
      type: Number,
      default: 4.8,
    },
    isAcceptingPatients: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", DoctorProfileSchema);
