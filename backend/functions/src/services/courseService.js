const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class CourseService {
  async createCourse(courseData) {
    const { title, category, categoryId, description, price, number_session, level, status, levelId, termId, schedule, imageURL } =
      courseData;

    if (!title || !termId || !levelId) {
      throw new Error("Title, Term, and Level are required");
    }

    // Uniqueness check: Title + Term + Level
    const snapshot = await db.collection("courses")
      .where("title", "==", title.trim())
      .where("termId", "==", termId)
      .where("levelId", "==", levelId)
      .get();

    if (!snapshot.empty) {
      throw new Error(`A program with title "${title}" already exists for this term and level`);
    }

    const data = {
      title: title.trim(),
      categoryId: categoryId || null,
      category: category || "Other",
      description: description || "",
      price: parseFloat(price) || 0,
      number_session: parseInt(number_session) || 0,
      level: level || "beginner",
      status: status || "Active",
      levelId: levelId || null,
      termId: termId || null,
      schedule: schedule || null, // { day, time, duration }
      imageURL: imageURL || "",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("courses").add(data);
    return { id: docRef.id, message: "Course created successfully" };
  }

  async getAllCourses() {
    const coursesSnapshot = await db.collection("courses").get();
    const courses = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch all terms for mapping
    const termsSnapshot = await db.collection("terms").get();
    const termsMap = {};
    termsSnapshot.docs.forEach((doc) => {
      termsMap[doc.id] = doc.data().name;
    });

    // Resolve levels manually instead of collectionGroup (to avoid index requirement)
    const levelsMap = {};
    const categoriesSnapshot = await db.collection("categories").get();
    
    // Fetch levels for each category
    await Promise.all(
      categoriesSnapshot.docs.map(async (catDoc) => {
        const levelsSnapshot = await catDoc.ref.collection("levels").get();
        levelsSnapshot.docs.forEach((lvlDoc) => {
          levelsMap[lvlDoc.id] = lvlDoc.data().name;
        });
      })
    );

    // Enrich courses with names
    return courses.map((course) => ({
      ...course,
      levelName: levelsMap[course.levelId] || course.level || "Beginner",
      termName: termsMap[course.termId] || "Term 1 2026",
    }));
  }

  async getCourse(courseId) {
    const doc = await db.collection("courses").doc(courseId).get();
    if (!doc.exists) throw new Error("Course not found");
    return { id: doc.id, ...doc.data() };
  }

  // 21. CRUD/ManageCourse - Update
  async updateCourse(id, updateData) {
    const ref = db.collection("courses").doc(id);
    await ref.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    return { message: "Course updated successfully" };
  }

  // 21. CRUD/ManageCourse - Delete
  async deleteCourse(id) {
    await db.collection("courses").doc(id).delete();
    return { message: "Course deleted successfully" };
  }
}

module.exports = new CourseService();
