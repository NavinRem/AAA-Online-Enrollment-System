<<<<<<< HEAD
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { HttpsError } = require("firebase-functions/v2/https");

initializeApp();

exports.createStudent = onCall(async (request) => {
  const db = getFirestore();
  // request.data contains the parameters passed from the client
  const { name, email, age } = request.data;

  // Basic validation
  if (!name || !email) {
    throw new HttpsError(
      "invalid-argument",
      'The function must be called with arguments "name" and "email".',
    );
  }

  try {
    // Add a new document to the "students" collection
    const result = await db.collection("students").add({
      name: name,
      email: email,
      age: age || null,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      id: result.id,
      message: `Student ${name} created successfully.`,
    };
  } catch (error) {
    throw new HttpsError(
      "internal",
      "Unable to create student document.",
      error,
    );
  }
});
=======
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

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
>>>>>>> d378767 (feat: Implement full stack registration system)
