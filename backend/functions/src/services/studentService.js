const { db, COLLECTIONS } = require("../config/database");
const profileHelper = require("../utils/profileHelper");
const branchService = require("./branchService");

class StudentService {
  async createStudent(studentData) {
    const { parentId, name, dob, medicalNote } = studentData;

    if (!parentId || !name || !dob) {
      throw new Error("Parent ID, Name, and Date of Birth are required");
    }

    const parentDoc = await db
      .collection(COLLECTIONS.PARENT)
      .doc(parentId)
      .get();
    if (!parentDoc.exists)
      throw new Error(`Parent not found with ID: ${parentId}`);

    const pData = parentDoc.data();
    const parentInfo = profileHelper.getUserSnapshot(parentId, pData);

    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id;
    const now = new Date().toISOString();

    const data = {
      parentId,
      parentInfo,
      name,
      dob,
      medicalNote: medicalNote || "None",
      profileURL: studentData.profileURL || studentData.profile || null,
      status: "Inactive",
      createdAt: now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.STUDENT).doc(studentId), data);

    const snapshot = profileHelper.getStudentSnapshot(studentId, data);
    const studentInfo = pData.studentInfo || [];
    studentInfo.push(snapshot);

    batch.update(db.collection(COLLECTIONS.PARENT).doc(parentId), {
      studentInfo,
    });

    await batch.commit();

    return { id: studentId, message: "Student registered successfully" };
  }

  async getStudent(id) {
    const doc = await db.collection(COLLECTIONS.STUDENT).doc(id).get();
    if (!doc.exists) throw new Error("Student not found");
    return { id: doc.id, ...doc.data() };
  }

  async updateStudent(id, updateData) {
    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id);
    const doc = await studentRef.get();
    if (!doc.exists) throw new Error("Student not found");

    const currentData = doc.data();
    const parentId = currentData.parentId;
    const now = new Date().toISOString();

    const mergedData = { ...updateData, updatedAt: now };

    Object.keys(mergedData).forEach(
      (key) => mergedData[key] === undefined && delete mergedData[key],
    );

    const batch = db.batch();
    batch.update(studentRef, mergedData);

    const syncFields = ["name", "dob", "medicalNote", "profileURL"];
    const shouldSync = Object.keys(updateData).some((key) =>
      syncFields.includes(key),
    );

    if (shouldSync) {
      const snapshot = profileHelper.getStudentSnapshot(id, {
        ...currentData,
        ...updateData,
      });
      await this._syncStudentMirrors(id, snapshot, parentId, batch);
    }

    await batch.commit();

    return { message: "Student updated successfully" };
  }

  async getStudentsByParentID(parentId) {
    const snapshot = await db
      .collection(COLLECTIONS.STUDENT)
      .where("parentId", "==", parentId)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getAllStudents() {
    const snapshot = await db.collection(COLLECTIONS.STUDENT).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async _syncStudentMirrors(sid, snapshot, parentId, batch) {
    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId);
    const parentDoc = await parentRef.get();

    if (parentDoc.exists) {
      let studentInfo = parentDoc.data().studentInfo || [];
      const index = studentInfo.findIndex((s) => s.id === sid);
      if (index !== -1) {
        studentInfo[index] = snapshot;
      } else {
        studentInfo.push(snapshot);
      }
      batch.update(parentRef, { studentInfo });
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where("studentId", "==", sid)
      .get();
    enrollmentsSnap.forEach((eDoc) =>
      batch.update(eDoc.ref, { student: snapshot }),
    );
  }
}

module.exports = new StudentService();
