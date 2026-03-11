const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class CategoryService {
  async getAllCategories() {
    const snapshot = await db.collection("categories").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async createCategory(categoryData) {
    const { name } = categoryData;
    if (!name) throw new Error("Category name is required");

    const forbiddenKeywords = ["term", "level", "category", "session", "program", "course"];
    const lowerName = name.toLowerCase();
    const foundKeyword = forbiddenKeywords.find(keyword => lowerName.includes(keyword));

    if (foundKeyword) {
      throw new Error(`Category name cannot contain the word "${foundKeyword}" to prevent inconsistency.`);
    }

    // Case-insensitive uniqueness check
    const snapshot = await db.collection("categories").get();
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.trim().toLowerCase()
    );

    if (exists) {
      throw new Error(`Category "${name}" already exists`);
    }

    const data = {
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("categories").add(data);
    return { id: docRef.id, ...data };
  }

  async deleteCategory(id) {
    await db.collection("categories").doc(id).delete();
    return { message: "Category deleted successfully" };
  }
}

module.exports = new CategoryService();
