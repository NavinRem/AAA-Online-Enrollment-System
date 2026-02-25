const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class StudentService {
  // Create Student (previously registerStudentProfile)
  async createStudent(studentData) {
    const { parentID, fullname, dob, medical_note } = studentData;

    if (!parentID || !fullname || !dob) {
      throw new Error("Parent ID, Full Name, and Date of Birth are required");
    }

    // Check if parent exists? Optional but good practice.
    // const parentRef = db.collection("user").doc(parentID); ...

    const studentRef = db.collection("student").doc();
    const data = {
      parentID,
      fullname,
      DoB: dob,
      medical_note: medical_note || "None",
      createdAt: new Date().toISOString(),
    };

    await studentRef.set(data);
    return { id: studentRef.id, message: "Student created successfully" };
  }

  // Get Student by ID
  async getStudent(id) {
    const doc = await db.collection("student").doc(id).get();
    if (!doc.exists) {
      throw new Error("Student not found");
    }
    return { id: doc.id, ...doc.data() };
  }

  // Update Student (General)
  async updateStudent(id, updateData) {
    const studentRef = db.collection("student").doc(id);
    const doc = await studentRef.get();

    if (!doc.exists) {
      throw new Error("Student not found");
    }

    // Prevent overwriting immutable fields if necessary (like id, createdAt)
    // For now, accept all updates but set updatedAt
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

  // Update Medical Info (Specific helper, can just use updateStudent but nice to have explicit)
  async updateMedicalInfo(id, medical_note) {
    if (!medical_note) {
      throw new Error("Medical note is required");
    }
    return this.updateStudent(id, { medical_note });
  }

  // Get Students by Parent ID
  async getStudentsByParent(parentId) {
    const snapshot = await db
      .collection("student")
      .where("parentID", "==", parentId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Get All Students (for Admin/Instructor)
  async getAllStudents() {
    const snapshot = await db.collection("student").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}

module.exports = new StudentService();
