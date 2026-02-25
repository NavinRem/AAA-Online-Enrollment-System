const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class CourseService {
  async createCourse(courseData) {
    const { title, category, description, price, number_session, level } =
      courseData;

    const data = {
      title,
      category: category || "Robotic",
      description: description || "",
      price: parseFloat(price) || 0,
      number_session: parseInt(number_session) || 0,
      level: level || "beginner",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("course").add(data);
    return { id: docRef.id, message: "Course created successfully" };
  }

  async getAllCourses() {
    const snapshot = await db.collection("course").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getCourse(id) {
    const doc = await db.collection("course").doc(id).get();
    if (!doc.exists) {
      throw new Error("Course not found");
    }
    return { id: doc.id, ...doc.data() };
  }

  // 21. CRUD/ManageCourse - Update
  async updateCourse(id, updateData) {
    const ref = db.collection("course").doc(id);
    await ref.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    return { message: "Course updated successfully" };
  }

  // 21. CRUD/ManageCourse - Delete
  async deleteCourse(id) {
    await db.collection("course").doc(id).delete();
    return { message: "Course deleted successfully" };
  }
}

module.exports = new CourseService();
