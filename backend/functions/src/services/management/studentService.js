const { db, COLLECTIONS } = require("../../config/database");

class StudentService {
  /**
   * Helper to find which collection the parent belongs to (parents or guardians)
   */
  async _resolveParentCollection(parentId) {
    if (!parentId) throw new Error("Parent ID is required");
    
    // Scan all possible parent-like collections
    const collections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN];
    for (const col of collections) {
      const doc = await db.collection(col).doc(parentId).get();
      if (doc.exists) return col;
    }
    
    throw new Error(`Parent or Guardian not found with ID: ${parentId}`);
  }

  /**
   * Snapshot Helpers (Standardized across the system)
   */
  _getParentSnapshot(parentId, pData) {
    return {
      id: parentId,
      name: pData.name || pData.email || "Parent",
      email: pData.email || "N/A",
      phone: pData.phone || "N/A",
      role: pData.role || "guardian",
      roleDisplay:
        pData.role === "parent" ? "Parent" : pData.role || "Guardian",
      profile: pData.profile || pData.profileURL || null,
      profileURL: pData.profileURL || pData.profile || null,
    };
  }

  _getStudentSnapshot(studentId, sData) {
    return {
      id: studentId,
      name: sData.name || "Student",
      dob: sData.dob || null,
      medicalNote: sData.medicalNote || "None",
      profile: sData.profile || sData.profileURL || null,
      profileURL: sData.profileURL || sData.profile || null,
    };
  }

  async createStudent(studentData) {
    const { parentId, name, dob, medicalNote, profile } = studentData;

    if (!parentId || !name || !dob) {
      throw new Error("Parent ID, Name, and Date of Birth are required");
    }

    const parentCol = await this._resolveParentCollection(parentId);
    const parentDoc = await db.collection(parentCol).doc(parentId).get();
    const pData = parentDoc.data();

    const parentInfo = this._getParentSnapshot(parentId, pData);

    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id;

    // Support all possible profile source fields during creation
    const profileVal = profile || studentData.profileURL || studentData.childProfileURL || "/src/assets/images/profiles/avatar-boy.png";
    const data = {
      parentId,
      parentInfo, // Mirror full snapshot
      name,
      dob,
      medicalNote: medicalNote || "None",
      profile: profileVal,
      status: "Inactive",
      created: new Date().toISOString(),
    };

    const batch = db.batch();

    // 1. Save to global students collection
    const globalRef = db.collection(COLLECTIONS.STUDENT).doc(studentId);
    batch.set(globalRef, data);

    // 2. Save to parent sub-collection
    const subRef = db
      .collection(parentCol)
      .doc(parentId)
      .collection("students")
      .doc(studentId);
    batch.set(subRef, data);

    // 3. Update Parent's mirrored info
    const studentSnapshot = this._getStudentSnapshot(studentId, data);

    // New 'studentInfo' array snapshot
    const currentStudentInfo = pData.studentInfo || [];
    currentStudentInfo.push(studentSnapshot);

    batch.update(db.collection(parentCol).doc(parentId), {
      studentInfo: currentStudentInfo,
    });

    await batch.commit();
    return {
      id: studentId,
      message: "Student registered successfully with integrated mirroring",
    };
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
    const parentCol = await this._resolveParentCollection(parentId);

    const mergedData = {
      ...updateData,
      updated: new Date().toISOString(),
    };

    // Clean undefined
    Object.keys(mergedData).forEach(
      (key) => mergedData[key] === undefined && delete mergedData[key],
    );

    const batch = db.batch();

    // Update global
    batch.update(studentRef, mergedData);

    // Update parent sub-collection
    const subRef = db
      .collection(parentCol)
      .doc(parentId)
      .collection("students")
      .doc(id);
    batch.update(subRef, mergedData);

    // Update Parent's mirrored snapshots if profile changes
    if (
      updateData.name ||
      updateData.dob ||
      updateData.medicalNote ||
      updateData.profile ||
      updateData.profileURL ||
      updateData.childProfileURL
    ) {
      const parentDoc = await db.collection(parentCol).doc(parentId).get();
      const pData = parentDoc.data();

      const newSnapshot = this._getStudentSnapshot(id, {
        ...currentData,
        ...updateData,
      });

      // Update new 'studentInfo' array with THE FULL SNAPSHOT
      let studentInfo = pData.studentInfo || [];
      studentInfo = studentInfo.map((s) => (s.id === id ? newSnapshot : s));

      // If for some reason it's not in the array yet, add it
      if (!studentInfo.find((s) => s.id === id)) {
        studentInfo.push(newSnapshot);
      }

      batch.update(db.collection(parentCol).doc(parentId), { studentInfo });
    }

    await batch.commit();
    return {
      message: "Student updated successfully across all mirrored collections",
    };
  }

  async getStudentsByParentID(parentId) {
    try {
      const parentCol = await this._resolveParentCollection(parentId);
      const snapshot = await db
        .collection(parentCol)
        .doc(parentId)
        .collection("students")
        .get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn("Falling back to global search for students:", e.message);
    }

    const snapshot = await db
      .collection(COLLECTIONS.STUDENT)
      .where("parentId", "==", parentId)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getAllStudents() {
    const studentsSnapshot = await db.collection(COLLECTIONS.STUDENT).get();
    return studentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async updateMedicalInfo(id, medicalNote) {
    return this.updateStudent(id, { medicalNote: medicalNote || "None" });
  }
}

module.exports = new StudentService();
