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
      if (role === "parent") return COLLECTIONS.PARENT;
    }

    // Comprehensive Fallback: Scan all role-specific collections
    const collections = [
      COLLECTIONS.PARENT,
      COLLECTIONS.GUARDIAN,
      COLLECTIONS.ADMIN,
      COLLECTIONS.TEACHER,
    ];
    for (const col of collections) {
      const doc = await db.collection(col).doc(uid).get();
      if (doc.exists) return col;
    }
    
    // Last resort for new accounts with no role hint
    return COLLECTIONS.PARENT;
  }

  async registerParentAccount(userData) {
    let { uid, email, name, profile, phone, password } = userData;
    
    // SECURITY: Strictly enforce role for public registration
    // If no role specified, default to parent. If role is provided, only allow parent/guardian.
    const requestedRole = (userData.role || "parent").toLowerCase();
    const targetRole = ["parent", "guardian"].includes(requestedRole) ? requestedRole : "parent";

    // Auth logic remains the same
    if (!uid) {
      if (!email) throw new Error("Email is required to create an account");
      try {
        const userConfig = { email, displayName: name || null };
        if (password) userConfig.password = password;
        const userRecord = await getAuth().createUser(userConfig);
        uid = userRecord.uid;
      } catch (error) {
        if (error.code === "auth/email-already-exists") {
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
    return {
      uid,
      message: "Parent account registered successfully",
      isNew: !doc.exists,
    };
  }

  /**
   * Protected method for creating Admin/Teacher accounts
   */
  async registerStaffAccount(userData) {
    let { uid, email, role, name, profile, phone } = userData;
    const targetRole = (role || "teacher").toLowerCase();

    if (!["admin", "teacher", "instructor"].includes(targetRole)) {
      throw new Error("Invalid staff role provided");
    }

    // Ensure user exists in Auth, or create them
    if (!uid) {
      if (!email) throw new Error("Email is required for staff account");
      try {
        const userRecord = await getAuth().createUser({ email, displayName: name || null });
        uid = userRecord.uid;
      } catch (err) {
        if (err.code === "auth/email-already-exists") {
          const userRecord = await getAuth().getUserByEmail(email);
          uid = userRecord.uid;
        } else throw err;
      }
    }

    const collectionName = await this._resolveTargetCollection(uid, targetRole);
    const userRef = db.collection(collectionName).doc(uid);

    // Securely set the role claim
    await getAuth().setCustomUserClaims(uid, { role: targetRole });

    const data = {
      email,
      role: targetRole,
      name: name || null,
      profile: profile || null,
      phone: phone || null,
      status: "Active",
      updatedAt: new Date().toISOString(),
    };

    const doc = await userRef.get();
    if (!doc.exists) data.createdAt = new Date().toISOString();

    await userRef.set(data, { merge: true });
    return { uid, role: targetRole, message: "Staff account created successfully" };
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
    const collections = [
      COLLECTIONS.PARENT,
      COLLECTIONS.GUARDIAN,
      COLLECTIONS.ADMIN,
      COLLECTIONS.TEACHER,
    ];
    for (const col of collections) {
      const doc = await db.collection(col).doc(uid).get();
      if (doc.exists) return { uid: doc.id, role: doc.data().role || "parent" };
    }
    throw new Error("User not found");
  }

  async getAllUsers() {
    const collections = [
      COLLECTIONS.PARENT,
      COLLECTIONS.GUARDIAN,
      COLLECTIONS.ADMIN,
      COLLECTIONS.TEACHER,
    ];
    const results = await Promise.all(
      collections.map((col) => db.collection(col).get()),
    );

    const allUsers = [];
    results.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        allUsers.push({ uid: doc.id, ...doc.data() });
      });
    });
    return allUsers;
  }

  async getUser(uid) {
    if (!uid) throw new Error("User ID (uid) is required");
    
    const collections = [
      COLLECTIONS.PARENT,
      COLLECTIONS.GUARDIAN,
      COLLECTIONS.ADMIN,
      COLLECTIONS.TEACHER,
    ];
    
    for (const col of collections) {
      const doc = await db.collection(col).doc(uid).get();
      if (doc.exists) {
        return { 
          uid: doc.id, 
          ...doc.data(),
          name: doc.data().name || "User",
          profile: doc.data().profile || "/src/assets/images/profiles/avatar-man.png"
        };
      }
    }
    throw new Error(`User not found with ID: ${uid}`);
  }

  async updateUser(uid, updateData) {
    if (!uid) throw new Error("User ID (uid) is required");

    // Determine which collection they belong to
    const collectionName = await this._resolveTargetCollection(
      uid,
      updateData.role,
    );
    const userRef = db.collection(collectionName).doc(uid);

    // Sync custom claims if role is changed
    if (updateData.role) {
      try {
        await getAuth().setCustomUserClaims(uid, { role: updateData.role });
      } catch (err) {
        console.warn(
          `Failed to sync custom claims on update for ${uid}:`,
          err.message,
        );
      }
    }

    const cleanData = { 
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Eliminate all legacy fields from being re-written
    delete cleanData.uid;
    delete cleanData.fullName;
    delete cleanData.username;
    delete cleanData.profileURL;
    delete cleanData.childProfileURL;

    const batch = db.batch();
    batch.set(userRef, cleanData, { merge: true });

    // Sync to linked students if relevant fields changed
    const syncFields = ["name", "email", "phone", "role", "profile"];
    const shouldSync = Object.keys(updateData).some((key) =>
      syncFields.includes(key),
    );

    if (shouldSync) {
      const userDoc = await userRef.get();
      const userData = { ...userDoc.data(), ...updateData };

      // Standardize the mirroring snapshot
      const parentInfo = {
        id: uid,
        name: userData.name || userData.email || "Parent",
        email: userData.email || "N/A",
        phone: userData.phone || "N/A",
        role: userData.role || "guardian",
        roleDisplay: userData.role === "parent" ? "Parent" : (userData.role || "Guardian"),
        profile: userData.profile || "/src/assets/images/profiles/avatar-man.png",
      };

      // Find all students for this parent
      const studentsSnap = await db
        .collection(COLLECTIONS.STUDENT)
        .where("parentId", "==", uid)
        .get();

      studentsSnap.forEach((sDoc) => {
        // Update global student record
        batch.update(sDoc.ref, {
          parentInfo,
        });

        // Update sub-collection record
        const subRef = db
          .collection(collectionName)
          .doc(uid)
          .collection("students")
          .doc(sDoc.id);
        batch.set(
          subRef,
          {
            parentInfo,
          },
          { merge: true },
        );
      });
    }

    await batch.commit();
    return {
      uid,
      message: "User updated and mirrored to all student records successfully",
    };
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
