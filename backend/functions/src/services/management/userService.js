const { getAuth } = require("firebase-admin/auth");
const { db, COLLECTIONS } = require("../../config/database");

class UserService {
  /**
   * Helper to resolve the correct collection for a user
   * If role is unknown, it will try to find the user in all collections
   */
  async _resolveTargetCollection(uid, roleHint = null) {
    if (roleHint) {
      const role = roleHint.toLowerCase();
      if (role === "admin") return COLLECTIONS.ADMIN;
      if (role === "teacher") return COLLECTIONS.TEACHER;
      if (role === "guardian") return COLLECTIONS.GUARDIAN;
      return COLLECTIONS.PARENT;
    }

    // Fallback: Check all collections if no role hint
    const collections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
    for (const col of collections) {
      const doc = await db.collection(col).doc(uid).get();
      if (doc.exists) return col;
    }
    return COLLECTIONS.PARENT; // Default fallback for new creations
  }

  async registerParentAccount(userData) {
    let { uid, email, role, name, profile, phone, password } = userData;
    const targetRole = role || "parent";

    // Auth logic remains the same
    if (!uid) {
      if (!email) throw new Error("Email is required to create an account");
      try {
        const userConfig = { email, displayName: name || null };
        if (password) userConfig.password = password;
        const userRecord = await getAuth().createUser(userConfig);
        uid = userRecord.uid;
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          const userRecord = await getAuth().getUserByEmail(email);
          uid = userRecord.uid;
        } else {
          throw error;
        }
      }
    }

    const collectionName = await this._resolveTargetCollection(uid, targetRole);
    const userRef = db.collection(collectionName).doc(uid);
    
    // Set custom claims for role-based security
    try {
      await getAuth().setCustomUserClaims(uid, { role: targetRole });
      console.log(`Set custom claims for ${uid} as ${targetRole}`);
    } catch (err) {
      console.warn(`Failed to set custom claims for ${uid}:`, err.message);
    }

    const data = {
      email,
      role: targetRole,
      name: name || null,
      profile: profile || null,
      phone: phone || null,
      status: userData.status || "Active",
      updatedAt: new Date().toISOString(),
    };
 
    const doc = await userRef.get();
    if (!doc.exists) {
      data.createdAt = new Date().toISOString();
    }

    await userRef.set(data, { merge: true });
    return { uid, message: "Parent account registered successfully", isNew: !doc.exists };
  }

  async getUserRole(uid) {
    // Try to get role from custom claims first (fastest)
    try {
      const userRecord = await getAuth().getUser(uid);
      if (userRecord.customClaims && userRecord.customClaims.role) {
        return { uid: userRecord.uid, role: userRecord.customClaims.role };
      }
    } catch (err) {
      console.warn(`Failed to fetch custom claims for ${uid}:`, err.message);
    }

    // Fallback to Firestore scan
    const collections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
    for (const col of collections) {
      const doc = await db.collection(col).doc(uid).get();
      if (doc.exists) return { uid: doc.id, role: doc.data().role || "parent" };
    }
    throw new Error("User not found");
  }

  async getAllUsers() {
    const collections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
    const results = await Promise.all(collections.map(col => db.collection(col).get()));
    
    const allUsers = [];
    results.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        allUsers.push({ uid: doc.id, ...doc.data() });
      });
    });
    return allUsers;
  }

  async getUser(uid) {
    const collections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
    for (const col of collections) {
      const doc = await db.collection(col).doc(uid).get();
      if (doc.exists) return { uid: doc.id, ...doc.data() };
    }
    throw new Error("User not found");
  }

  async updateUser(uid, updateData) {
    if (!uid) throw new Error("User ID (uid) is required");
    
    // Determine which collection they belong to
    const collectionName = await this._resolveTargetCollection(uid, updateData.role);
    const userRef = db.collection(collectionName).doc(uid);
    
    // Sync custom claims if role is changed
    if (updateData.role) {
      try {
        await getAuth().setCustomUserClaims(uid, { role: updateData.role });
      } catch (err) {
        console.warn(`Failed to sync custom claims on update for ${uid}:`, err.message);
      }
    }

    const cleanData = { ...updateData };
    delete cleanData.uid;
    cleanData.updatedAt = new Date().toISOString();

    await userRef.set(cleanData, { merge: true });
    return { uid, message: "User updated successfully" };
  }

  async deleteUser(uid) {
    if (!uid) throw new Error("User ID (uid) is required");
    
    const collectionName = await this._resolveTargetCollection(uid);
    const userRef = db.collection(collectionName).doc(uid);
    
    try {
      await getAuth().deleteUser(uid);
    } catch (error) {
      console.warn(`Auth deletion warning for ${uid}:`, error.message);
    }

    await userRef.delete();
    return { uid, message: "User deleted successfully" };
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
