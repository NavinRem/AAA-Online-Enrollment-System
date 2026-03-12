const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class StudentService {
  async createStudent(studentData) {
    const { parentId, fullName, dob, medicalNote } = studentData;

    if (!parentId || !fullName || !dob) {
      throw new Error("Parent ID, Full Name, and Date of Birth are required");
    }

    const studentRef = db.collection("student").doc();
    const data = {
      parentId,
      fullName,
      dob,
      medicalNote: medicalNote || "None",
      status: "Studying",
      createdAt: new Date().toISOString(),
    };

    await studentRef.set(data);
    return { id: studentRef.id, message: "Student created successfully" };
  }

  async getStudent(id) {
    const doc = await db.collection("student").doc(id).get();
    if (!doc.exists) {
      throw new Error("Student not found");
    }
    return { id: doc.id, ...doc.data() };
  }

  async updateStudent(id, updateData) {
    const studentRef = db.collection("student").doc(id);
    const doc = await studentRef.get();

    if (!doc.exists) {
      throw new Error("Student not found");
    }

    const data = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(data).forEach(
      (key) => data[key] === undefined && delete data[key],
    );

    await studentRef.update(data);
    return { message: "Student updated successfully" };
  }

  async getStudentsByParent(parentId) {
    const snapshot = await db
      .collection("student")
      .where("parentId", "==", parentId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getAllStudents() {
    // Fetch all students and enrich with parent names
    const studentsSnapshot = await db.collection("student").get();
    const usersSnapshot = await db.collection("user").where("role", "in", ["parent", "guardian"]).get();

    const parentsMap = {};
    usersSnapshot.forEach((doc) => {
      parentsMap[doc.id] = doc.data().name || "Unknown Parent";
    });

    return studentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        parentName: parentsMap[data.parentId] || "Unknown Parent",
        ...data,
      };
    });
  }

  async updateMedicalInfo(id, medicalNote) {
    const studentRef = db.collection("student").doc(id);
    const doc = await studentRef.get();
    if (!doc.exists) throw new Error("Student not found");

    await studentRef.update({
      medicalNote: medicalNote || "None",
      updatedAt: new Date().toISOString(),
    });
    return { message: "Medical information updated successfully" };
  }
}

module.exports = new StudentService();
