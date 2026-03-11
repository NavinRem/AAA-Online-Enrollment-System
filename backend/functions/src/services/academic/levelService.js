const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class LevelService {
  async getAllLevels(categoryId) {
    if (!categoryId) return [];
    const snapshot = await db.collection("categories").doc(categoryId).collection("levels").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async createLevel(categoryId, levelData) {
    const { name } = levelData;
    if (!categoryId) throw new Error("Category ID is required");
    if (!name) throw new Error("Level name is required");

    const forbiddenKeywords = ["term", "category", "program", "course"];
    const lowerName = name.toLowerCase();
    const foundKeyword = forbiddenKeywords.find(keyword => lowerName.includes(keyword));

    if (foundKeyword) {
      throw new Error(`Level name cannot contain the word "${foundKeyword}" to prevent inconsistency.`);
    }

    // Case-insensitive uniqueness check within category
    const snapshot = await db.collection("categories").doc(categoryId).collection("levels").get();
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.trim().toLowerCase()
    );

    if (exists) {
      throw new Error(`Level "${name}" already exists in this category`);
    }

    const data = {
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("categories").doc(categoryId).collection("levels").add(data);
    return { id: docRef.id, ...data };
  }

  async deleteLevel(categoryId, id) {
    await db.collection("categories").doc(categoryId).collection("levels").doc(id).delete();
    return { message: "Level deleted successfully" };
  }
}

module.exports = new LevelService();
