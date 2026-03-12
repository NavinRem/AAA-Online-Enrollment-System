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

const apiRouter = express.Router();

// --- Core Enrollment & Payments ---
apiRouter.use("/enrollments", enrollmentRoutes);
apiRouter.use("/payments", paymentRoutes);

// --- Student & Parent Management ---
apiRouter.use("/students", studentRoutes);
apiRouter.use("/users", userRoutes);

// --- Academic Content ---
apiRouter.use("/courses", courseRoutes);
apiRouter.use("/sessions", sessionRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/levels", levelRoutes);
apiRouter.use("/terms", termRoutes);

// --- Administrative & Academic Tracking ---
apiRouter.use("/attendance", attendanceRoutes);
apiRouter.use("/progress", progressRoutes);
apiRouter.use("/uploads", uploadRoutes);

// Main app uses both prefixed and non-prefixed routes for maximum compatibility
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Online Enrollment System API is running!");
});

// Catch-all 404 handler for debugging path mismatches
app.use((req, res, next) => {
  logger.warn("404 Not Found:", {
    method: req.method,
    url: req.originalUrl,
    path: req.path
  });
  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    suggestion: "Check your VITE_API_URL or endpoint paths."
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error("API Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
    path: req.path
  });
});

// Export the API
exports.api = onRequest(app);
