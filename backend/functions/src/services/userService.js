const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class UserService {
  // Register Parent Account
  async registerParentAccount(userData) {
    const { uid, email, role, name, profileURL, phone } = userData;

    if (!uid) {
      throw new Error("User ID (uid) is required");
    }

    const userRef = db.collection("user").doc(uid);
    const data = {
      email,
      role: role || "parent", // Default to parent
      name: name || null,
      profileURL: profileURL || null,
      phone: phone || null,
      updatedAt: new Date().toISOString(),
    };

    // If creating new, add createdAt
    const doc = await userRef.get();
    if (!doc.exists) {
      data.createdAt = new Date().toISOString();
    }

    await userRef.set(data, { merge: true });
    return { uid, message: "Parent account registered successfully" };
  }

  // Get User Role
  async getUserRole(uid) {
    const doc = await db.collection("user").doc(uid).get();
    if (!doc.exists) {
      throw new Error("User not found");
    }
    return { uid: doc.id, role: doc.data().role || "parent" };
  }

  // Register Student Profile
  async registerStudentProfile(parentUid, studentData) {
    const { fullname, dob, medical_note } = studentData;

    if (!fullname || !dob) {
      throw new Error("Full Name and Date of Birth are required");
    }

    // Creating a new document in the ROOT 'student' collection
    const studentRef = db.collection("student").doc();

    const data = {
      parentID: parentUid, // FK to User
      fullname,
      DoB: dob, // Storing as 'DoB' per schema
      medical_note: medical_note || "None",
      createdAt: new Date().toISOString(),
    };

    await studentRef.set(data);
    return {
      id: studentRef.id,
      message: "Student profile registered successfully",
    };
  }

  // Update Medical Info
  async updateMedicalInfo(studentId, medical_note) {
    if (!medical_note) {
      throw new Error("Medical note is required");
    }

    const studentRef = db.collection("student").doc(studentId);
    const doc = await studentRef.get();

    if (!doc.exists) {
      throw new Error("Student not found");
    }

    await studentRef.update({
      medical_note,
      updatedAt: new Date().toISOString(),
    });
    return { message: "Medical info updated successfully" };
  }

  // Get Students by Parent ID
  async getStudentsByParentID(uid) {
    // Query the ROOT 'student' collection where parent_id matches
    const snapshot = await db
      .collection("student")
      .where("parentID", "==", uid)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Get All Users
  async getAllUsers() {
    const snapshot = await db.collection("user").get();
    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  }

  // Get User by ID
  async getUser(uid) {
    const doc = await db.collection("user").doc(uid).get();
    if (!doc.exists) {
      throw new Error("User not found");
    }
    return { uid: doc.id, ...doc.data() };
  }
}

module.exports = new UserService();
