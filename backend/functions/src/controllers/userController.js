const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore("registration");

/**
 * @route POST /users
 * @description Create or update a user profile
 */
exports.createOrUpdateUser = async (req, res) => {
  try {
    const { uid, email, role, name, profileURL } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "User ID (uid) is required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userData = {
      email,
      role: role || "student", // Default to student
      name,
      profileURL,
      updatedAt: new Date().toISOString(),
    };

    // If creating new, add createdAt
    const doc = await userRef.get();
    if (!doc.exists) {
      userData.createdAt = new Date().toISOString();
    }

    await userRef.set(userData, { merge: true });

    res.status(200).json({ message: "User profile updated successfully", uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users
 * @description Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/:uid
 * @description Get a single user by ID
 */
exports.getUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ uid: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
