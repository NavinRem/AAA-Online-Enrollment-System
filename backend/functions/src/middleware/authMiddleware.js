const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

/**
 * Middleware to verify Firebase ID Token from Authorization header
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "No authentication token provided"
    });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // { uid, email, role, etc. }
    next();
  } catch (error) {
    logger.error("Token verification failed:", error.message);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired authentication token"
    });
  }
};

/**
 * Middleware to check for Admin role
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Administrative privileges are required for this operation"
    });
  }
  next();
};

/**
 * Middleware to check for Staff role (Admin or Teacher)
 */
const isStaff = (req, res, next) => {
  if (!req.user || !["admin", "teacher", "instructor"].includes(req.user.role)) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Staff privileges are required for this operation"
    });
  }
  next();
};

/**
 * Middleware to ensure the user is accessing their own data or is Admin
 * Usage: path parameter must be called :uid
 */
const isOwnerOrAdmin = (req, res, next) => {
  const targetUid = req.params.uid;
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  if (req.user.uid === targetUid || req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      error: "Forbidden",
      message: "You do not have permission to access this resource"
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isStaff,
  isOwnerOrAdmin
};
