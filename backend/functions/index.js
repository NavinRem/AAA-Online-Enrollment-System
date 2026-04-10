const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { db, COLLECTIONS } = require("./src/config/database");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

const { limiter } = require("./src/config/limiters");

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
const termRoutes = require("./src/routes/terms");
const branchRoutes = require("./src/routes/branches");
const classRoutes = require("./src/routes/classes");


// --- Administrative & Academic Tracking ---
const uploadRoutes = require("./src/routes/uploads");

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
apiRouter.use("/users", userRoutes);

// --- Academic Content ---
apiRouter.use("/programs", programRoutes);
apiRouter.use("/sessions", sessionRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/terms", termRoutes);
apiRouter.use("/branches", branchRoutes);
apiRouter.use("/classes", classRoutes);


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
