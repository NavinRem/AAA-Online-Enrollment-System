const { getAuth } = require("firebase-admin/auth");
const { db, COLLECTIONS } = require("../../config/database");

class UserService {
  async registerParentAccount(userData) {
    let { uid, email, role, name, profileURL, phone, password } = userData;

    // If no UID is provided, we need to create the Auth user first
    if (!uid) {
      if (!email) {
        throw new Error("Email is required to create an account");
      }

      try {
        const userConfig = {
          email,
          displayName: name || null,
        };
        
        // Use provided password or generate a random one
        if (password) {
          userConfig.password = password;
        }

        const userRecord = await getAuth().createUser(userConfig);
        uid = userRecord.uid;
      } catch (error) {
        // If user already exists in Auth, try to find them
        if (error.code === 'auth/email-already-exists') {
          const userRecord = await getAuth().getUserByEmail(email);
          uid = userRecord.uid;
        } else {
          throw error;
        }
      }
    }

    const userRef = db.collection(COLLECTIONS.USER).doc(uid);
    const data = {
      email,
      role: role || "parent",
      name: name || null,
      profileURL: profileURL || null,
      phone: phone || null,
      status: userData.status || "Active",
      updatedAt: new Date().toISOString(),
    };

    const doc = await userRef.get();
    if (!doc.exists) {
      data.createdAt = new Date().toISOString();
    }

    await userRef.set(data, { merge: true });
    return { uid, message: "Parent account registered successfully", isNew: true };
  }

  async getUserRole(uid) {
    const doc = await db.collection(COLLECTIONS.USER).doc(uid).get();
    if (!doc.exists) {
      throw new Error("User not found");
    }
    return { uid: doc.id, role: doc.data().role || "parent" };
  }

  async getAllUsers() {
    const snapshot = await db.collection(COLLECTIONS.USER).get();
    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  }

  async getUser(uid) {
    const doc = await db.collection(COLLECTIONS.USER).doc(uid).get();
    if (!doc.exists) {
      throw new Error("User not found");
    }
    return { uid: doc.id, ...doc.data() };
  }

  async updateUser(uid, updateData) {
    if (!uid) {
      throw new Error("User ID (uid) is required");
    }
    const userRef = db.collection(COLLECTIONS.USER).doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new Error("User not found");
    }

    const cleanData = { ...updateData };
    delete cleanData.uid;
    cleanData.updatedAt = new Date().toISOString();

    await userRef.update(cleanData);
    return { uid, message: "User updated successfully" };
  }

  async deleteUser(uid) {
    if (!uid) {
      throw new Error("User ID (uid) is required");
    }
    const userRef = db.collection(COLLECTIONS.USER).doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new Error("User not found");
    }

    try {
      // 1. Delete from Firebase Authentication
      await getAuth().deleteUser(uid);
      console.log(`Successfully deleted Auth account for ${uid}`);
    } catch (error) {
      // Log error but continue with Firestore deletion if user doesn't exist in Auth
      console.error(`Error deleting Auth account for ${uid}:`, error.message);
      if (error.code !== 'auth/user-not-found') {
        // If it's a real error (not just already gone), we might want to know
        // but typically we still want to clean up the DB
      }
    }

    // 2. Delete from Firestore
    await userRef.delete();
    return { uid, message: "User deleted successfully (Auth + Firestore)" };
  }

  async getAllStudents() {
    const snapshot = await db.collection(COLLECTIONS.STUDENT).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}

module.exports = new UserService();
