const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const admin = require("firebase-admin");

admin.initializeApp();
// Force deploy trigger

// Import Routes
const enrollmentRoutes = require("./src/routes/enrollments");
const userRoutes = require("./src/routes/users");
const courseRoutes = require("./src/routes/courses");
const sessionRoutes = require("./src/routes/sessions");
const studentRoutes = require("./src/routes/students");

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true })); // Allow all origins for now (adjust for production)
app.use(express.json());

// Routes
app.use("/enrollments", enrollmentRoutes);
app.use("/users", userRoutes);
app.use("/courses", courseRoutes);
app.use("/sessions", sessionRoutes);
app.use("/students", studentRoutes);
app.use("/payments", require("./src/routes/payments"));
app.use("/attendance", require("./src/routes/attendance"));
app.use("/progress", require("./src/routes/progress"));
app.use("/categories", require("./src/routes/categories"));
app.use("/terms", require("./src/routes/terms"));
app.use("/uploads", require("./src/routes/uploads"));

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Online Enrollment System API is running!");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

// Export the API
exports.api = onRequest(app);
