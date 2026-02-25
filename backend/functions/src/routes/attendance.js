const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

router.post("/check-in", attendanceController.markCheckIn);
router.post("/check-out", attendanceController.markCheckOut);
router.get("/student/:studentId", attendanceController.getAttendanceHistory);
router.get("/session/:sessionId", attendanceController.getAttendanceLogs);
router.post("/make-up", attendanceController.requestMakeUpSession);

module.exports = router;
