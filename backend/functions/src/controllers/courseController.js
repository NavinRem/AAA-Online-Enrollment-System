const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore("registration");

exports.createCourse = async (req, res) => {
  try {
    const { title, description, instructor, schedule, capacity } = req.body;

    const courseData = {
      title,
      description,
      instructor,
      schedule,
      capacity: parseInt(capacity),
      enrolledCount: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("courses").add(courseData);
    res
      .status(201)
      .json({ id: docRef.id, message: "Course created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const snapshot = await db.collection("courses").get();
    const courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const doc = await db.collection("courses").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
