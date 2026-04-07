const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { db, COLLECTIONS } = require("./src/config/database");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Import Routes
// --- Core Enrollment & Payments ---
const enrollmentRoutes = require("./src/routes/enrollments");
const paymentRoutes = require("./src/routes/payments");

// --- Student & Parent Management ---
const studentRoutes = require("./src/routes/students");
const userRoutes = require("./src/routes/users");

// --- Academic Content ---
const programRoutes = require("./src/routes/programs");
const sessionRoutes = require("./src/routes/sessions");
const categoryRoutes = require("./src/routes/categories");
const levelRoutes = require("./src/routes/levels");
const termRoutes = require("./src/routes/terms");
const branchRoutes = require("./src/routes/branches");

// --- Administrative & Academic Tracking ---
// NOTE: attendance and progress routes were removed/flattened
const uploadRoutes = require("./src/routes/uploads");

const app = express();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: "Too many requests from this IP, please try again later",
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 registration attempts per hour
  message:
    "Too many accounts created from this IP, please try again in an hour",
});

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(limiter);
app.use(express.json());

const apiRouter = express.Router();

// --- Core Enrollment & Payments ---
apiRouter.use("/enrollments", enrollmentRoutes);
apiRouter.use("/payments", paymentRoutes);

// --- Student & Parent Management ---
apiRouter.use("/students", studentRoutes);
apiRouter.use("/users", registrationLimiter, userRoutes);

// --- Academic Content ---
apiRouter.use("/programs", programRoutes);
apiRouter.use("/sessions", sessionRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/terms", termRoutes);
apiRouter.use("/branches", branchRoutes);

// --- Administrative & Academic Recording ---
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
    path: req.path,
  });
  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    suggestion: "Check your VITE_API_URL or endpoint paths.",
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error("API Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
    path: req.path,
  });
});

// Export the API
exports.api = onRequest(app);
