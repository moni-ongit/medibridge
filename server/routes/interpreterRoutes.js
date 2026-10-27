const express = require("express");
const router = express.Router();
const {
  createInterpreterRequest,
  getInterpreterRequests,
  updateInterpreterRequest,
  upsertInterpreterProfile,
  getMyInterpreterProfile,
} = require("../controllers/interpreterController");
const { protect, authorize } = require("../middleware/auth");

router.post("/request", protect, authorize("doctor", "patient"), createInterpreterRequest);
router.get("/requests", protect, getInterpreterRequests);
router.put("/request/:id", protect, authorize("interpreter"), updateInterpreterRequest);
router.post("/profile", protect, authorize("interpreter"), upsertInterpreterProfile);
router.get("/profile/me", protect, authorize("interpreter"), getMyInterpreterProfile);

module.exports = router;
