const mongoose = require("mongoose");

const InterpreterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    languages: [{ type: String }], // languages the interpreter can translate between
    experience: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterpreterProfile", InterpreterProfileSchema);
