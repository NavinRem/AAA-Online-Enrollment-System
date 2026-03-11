const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class TermService {
  async getAllTerms() {
    const snapshot = await db.collection("terms").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async createTerm(termData) {
    const { name } = termData;
    if (!name) throw new Error("Term name is required");

    const forbiddenKeywords = ["category", "level", "program", "course"];
    const lowerName = name.toLowerCase();
    const foundKeyword = forbiddenKeywords.find(keyword => lowerName.includes(keyword));

    if (foundKeyword) {
      throw new Error(`Term name cannot contain the word "${foundKeyword}" to prevent inconsistency.`);
    }

    // Case-insensitive uniqueness check
    const snapshot = await db.collection("terms").get();
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.trim().toLowerCase()
    );

    if (exists) {
      throw new Error(`Term "${name}" already exists`);
    }

    const data = {
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("terms").add(data);
    return { id: docRef.id, ...data };
  }

  async deleteTerm(id) {
    await db.collection("terms").doc(id).delete();
    return { message: "Term deleted successfully" };
  }
}

module.exports = new TermService();
