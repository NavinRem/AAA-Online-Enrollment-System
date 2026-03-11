const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class UserService {
  async registerParentAccount(userData) {
    const { uid, email, role, name, profileURL, phone } = userData;

    if (!uid) {
      throw new Error("User ID (uid) is required");
    }

    const userRef = db.collection("user").doc(uid);
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
    return { uid, message: "Parent account registered successfully" };
  }

  async getUserRole(uid) {
    const doc = await db.collection("user").doc(uid).get();
    if (!doc.exists) {
      throw new Error("User not found");
    }
    return { uid: doc.id, role: doc.data().role || "parent" };
  }

  async getAllUsers() {
    const snapshot = await db.collection("user").get();
    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  }

  async getUser(uid) {
    const doc = await db.collection("user").doc(uid).get();
    if (!doc.exists) {
      throw new Error("User not found");
    }
    return { uid: doc.id, ...doc.data() };
  }

  async updateUser(uid, updateData) {
    if (!uid) {
      throw new Error("User ID (uid) is required");
    }
    const userRef = db.collection("user").doc(uid);
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
    const userRef = db.collection("user").doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new Error("User not found");
    }

    await userRef.delete();
    return { uid, message: "User deleted successfully" };
  }
}

module.exports = new UserService();
