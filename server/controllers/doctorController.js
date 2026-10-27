const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const { asyncHandler } = require("../middleware/errorHandler");

// @desc    List all doctors, optionally filtered by specialization/language/search
// @route   GET /api/doctors
// @access  Public
const getDoctors = asyncHandler(async (req, res) => {
  const { specialization, language, search } = req.query;

  const profileFilter = {};
  if (specialization) profileFilter.specialization = new RegExp(specialization, "i");
  if (language) profileFilter.languages = language;

  let profiles = await DoctorProfile.find(profileFilter).populate({
    path: "user",
    select: "name email profileImage preferredLanguage isActive",
  });

  profiles = profiles.filter((p) => p.user && p.user.isActive);

  if (search) {
    const re = new RegExp(search, "i");
    profiles = profiles.filter((p) => re.test(p.user.name) || re.test(p.specialization));
  }

  res.status(200).json({ success: true, count: profiles.length, doctors: profiles });
});

// @desc    Get a single doctor's public profile + user info
// @route   GET /api/doctors/:id  (id = DoctorProfile._id OR user id)
// @access  Public
const getDoctorById = asyncHandler(async (req, res) => {
  let profile = await DoctorProfile.findById(req.params.id).populate({
    path: "user",
    select: "name email profileImage preferredLanguage",
  });

  if (!profile) {
    profile = await DoctorProfile.findOne({ user: req.params.id }).populate({
      path: "user",
      select: "name email profileImage preferredLanguage",
    });
  }

  if (!profile) {
    return res.status(404).json({ success: false, message: "Doctor not found" });
  }

  res.status(200).json({ success: true, doctor: profile });
});

// @desc    Create or update the logged-in doctor's profile
// @route   POST /api/doctors/profile
// @access  Private (doctor)
const upsertDoctorProfile = asyncHandler(async (req, res) => {
  const { specialization, qualifications, experience, languages, bio, consultationFee, availability, isAcceptingPatients } = req.body;

  let profile = await DoctorProfile.findOne({ user: req.user._id });

  const update = {};
  if (specialization !== undefined) update.specialization = specialization;
  if (qualifications !== undefined) update.qualifications = qualifications;
  if (experience !== undefined) update.experience = experience;
  if (languages !== undefined) update.languages = languages;
  if (bio !== undefined) update.bio = bio;
  if (consultationFee !== undefined) update.consultationFee = consultationFee;
  if (availability !== undefined) update.availability = availability;
  if (isAcceptingPatients !== undefined) update.isAcceptingPatients = isAcceptingPatients;

  if (profile) {
    profile = await DoctorProfile.findOneAndUpdate({ user: req.user._id }, update, { new: true });
  } else {
    profile = await DoctorProfile.create({ user: req.user._id, specialization: specialization || "General Physician", ...update });
  }

  res.status(200).json({ success: true, doctor: profile });
});

// @desc    Get the logged-in doctor's own profile
// @route   GET /api/doctors/me/profile
// @access  Private (doctor)
const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id }).populate("user", "name email profileImage");
  res.status(200).json({ success: true, doctor: profile });
});

module.exports = { getDoctors, getDoctorById, upsertDoctorProfile, getMyDoctorProfile };
