const express = require("express");
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  upsertDoctorProfile,
  getMyDoctorProfile,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", getDoctors);
router.get("/me/profile", protect, authorize("doctor"), getMyDoctorProfile);
router.post("/profile", protect, authorize("doctor"), upsertDoctorProfile);
router.get("/:id", getDoctorById);

module.exports = router;
