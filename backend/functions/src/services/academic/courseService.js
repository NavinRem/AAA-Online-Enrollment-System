const { db, COLLECTIONS } = require("../../config/database");

class CourseService {
  async createCourse(courseData) {
    const { title, category, categoryId, description, price, numberSessions, level, status, levelId, termId, schedule, imageURL } =
      courseData;

    if (!title || !termId || !levelId) {
      throw new Error("Title, Term, and Level are required");
    }

    // Uniqueness check: Title + Term + Level
    const snapshot = await db.collection(COLLECTIONS.COURSE)
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
      numberSessions: parseInt(numberSessions) || 0,
      level: level || "beginner",
      status: status || "Active",
      levelId: levelId || null,
      termId: termId || null,
      schedule: schedule || null, // { day, time, duration }
      imageURL: imageURL || "",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTIONS.COURSE).add(data);
    return { id: docRef.id, message: "Course created successfully" };
  }

  async getAllCourses() {
    const coursesSnapshot = await db.collection(COLLECTIONS.COURSE).get();
    const courses = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch all terms for mapping
    const termsSnapshot = await db.collection(COLLECTIONS.TERM).get();
    const termsMap = {};
    termsSnapshot.docs.forEach((doc) => {
      termsMap[doc.id] = doc.data().name;
    });

    const levelsMap = {};
    const categoriesSnapshot = await db.collection(COLLECTIONS.CATEGORY).get();
    
    await Promise.all(
      categoriesSnapshot.docs.map(async (catDoc) => {
        const levelsSnapshot = await catDoc.ref.collection(COLLECTIONS.LEVEL).get();
        levelsSnapshot.docs.forEach((lvlDoc) => {
          levelsMap[lvlDoc.id] = lvlDoc.data().name;
        });
      })
    );

    return courses.map((course) => ({
      ...course,
      levelName: levelsMap[course.levelId] || course.level || "Beginner",
      termName: termsMap[course.termId] || "Term 1 2026",
    }));
  }

  async getCourse(courseId) {
    const doc = await db.collection(COLLECTIONS.COURSE).doc(courseId).get();
    if (!doc.exists) throw new Error("Course not found");
    return { id: doc.id, ...doc.data() };
  }

  async updateCourse(id, updateData) {
    const ref = db.collection(COLLECTIONS.COURSE).doc(id);
    await ref.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    return { message: "Course updated successfully" };
  }

  async deleteCourse(id) {
    await db.collection(COLLECTIONS.COURSE).doc(id).delete();
    return { message: "Course deleted successfully" };
  }
}

module.exports = new CourseService();
