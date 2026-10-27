const jwt = require("jsonwebtoken");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const InterpreterProfile = require("../models/InterpreterProfile");
const { asyncHandler } = require("../middleware/errorHandler");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @desc    Register a new user (patient, doctor, or interpreter)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, preferredLanguage, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "Name, email, password, and role are required" });
  }

  if (!["patient", "doctor", "interpreter"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    preferredLanguage: preferredLanguage || "en",
    phone: phone || "",
  });

  // Auto-create an empty profile so doctor/interpreter dashboards work immediately
  if (role === "doctor") {
    await DoctorProfile.create({ user: user._id, specialization: "General Physician", languages: [preferredLanguage || "en"] });
  } else if (role === "interpreter") {
    await InterpreterProfile.create({ user: user._id, languages: [preferredLanguage || "en"] });
  }

  const token = generateToken(user._id);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const token = generateToken(user._id);
  res.status(200).json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Get current logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update current logged-in user's basic profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, preferredLanguage, profileImage } = req.body;

  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (preferredLanguage !== undefined) req.user.preferredLanguage = preferredLanguage;
  if (profileImage !== undefined) req.user.profileImage = profileImage;

  await req.user.save();
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, getProfile, updateProfile };
