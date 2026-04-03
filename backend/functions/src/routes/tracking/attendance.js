const express = require("express");
const router = express.Router();
const attendanceController = require("../../controllers/tracking/attendanceController");
const { verifyToken, isStaff, isAdmin } = require("../../middleware/authMiddleware");

// All attendance routes require authentication
router.use(verifyToken);

router.post("/check-in", isStaff, attendanceController.markCheckIn);
router.post("/check-out", isStaff, attendanceController.markCheckOut);
router.get("/student/:studentId", attendanceController.getAttendanceHistory);
router.get("/session/:sessionId", isStaff, attendanceController.getAttendanceLogs);
router.post("/make-up", attendanceController.requestMakeUpSession);

module.exports = router;
