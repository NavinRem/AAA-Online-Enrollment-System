const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

admin.initializeApp();
// Force deploy trigger

// Import Routes
// --- Core Enrollment & Payments ---
const enrollmentRoutes = require("./src/routes/core/enrollments");
const paymentRoutes = require("./src/routes/core/payments");

// --- Student & Parent Management ---
const studentRoutes = require("./src/routes/management/students");
const userRoutes = require("./src/routes/management/users");

// --- Academic Content ---
const courseRoutes = require("./src/routes/academic/courses");
const sessionRoutes = require("./src/routes/academic/sessions");
const categoryRoutes = require("./src/routes/academic/categories");
const levelRoutes = require("./src/routes/academic/levels");
const termRoutes = require("./src/routes/academic/terms");

// --- Administrative & Academic Tracking ---
const attendanceRoutes = require("./src/routes/tracking/attendance");
const progressRoutes = require("./src/routes/tracking/progress");
const uploadRoutes = require("./src/routes/tracking/uploads");

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
// --- Core Enrollment & Payments ---
app.use("/enrollments", enrollmentRoutes);
app.use("/payments", paymentRoutes);

// --- Student & Parent Management ---
app.use("/students", studentRoutes);
app.use("/users", userRoutes);

// --- Academic Content ---
app.use("/courses", courseRoutes);
app.use("/sessions", sessionRoutes);
app.use("/categories", categoryRoutes);
app.use("/levels", levelRoutes);
app.use("/terms", termRoutes);

// --- Administrative & Academic Tracking ---
app.use("/attendance", attendanceRoutes);
app.use("/progress", progressRoutes);
app.use("/uploads", uploadRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Online Enrollment System API is running!");
});

// Error Handling Middleware
app.use((err, res) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

// Export the API
exports.api = onRequest(app);
