const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const admin = require("firebase-admin");

// Import Routes
const registrationRoutes = require("./src/routes/registrations");

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true })); // Allow all origins for now (adjust for production)
app.use(express.json());

// Routes
app.use("/registrations", registrationRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Online Registration System API is running!");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

// Export the API
exports.api = onRequest(app);
