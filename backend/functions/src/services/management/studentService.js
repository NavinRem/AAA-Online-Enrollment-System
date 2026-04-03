const { db, COLLECTIONS } = require("../../config/database");

class StudentService {
  /**
   * Helper to find which collection the parent belongs to (parents or guardians)
   */
  async _resolveParentCollection(parentId) {
    const parentDoc = await db.collection(COLLECTIONS.PARENT).doc(parentId).get();
    if (parentDoc.exists) return COLLECTIONS.PARENT;
    
    const guardianDoc = await db.collection(COLLECTIONS.GUARDIAN).doc(parentId).get();
    if (guardianDoc.exists) return COLLECTIONS.GUARDIAN;
    
    throw new Error("Parent or Guardian not found");
  }

  async createStudent(studentData) {
    const { parentId, name, dob, medicalNote, profile } = studentData;

    if (!parentId || !name || !dob) {
      throw new Error("Parent ID, Name, and Date of Birth are required");
    }

    const parentCol = await this._resolveParentCollection(parentId);
    const parentDoc = await db.collection(parentCol).doc(parentId).get();
    const pData = parentDoc.data();
    const parentName = pData.name || "Unknown Parent";
    const parentProfile = pData.profile || null;

    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id;
    
    const data = {
      parentId,
      parentName,
      parentProfile,
      name,
      dob,
      medicalNote: medicalNote || "None",
      profile: profile || null,
      status: "Inactive",
      created: new Date().toISOString(),
    };

    const batch = db.batch();
    
    // 1. Save to global students collection
    const globalRef = db.collection(COLLECTIONS.STUDENT).doc(studentId);
    batch.set(globalRef, data);

    // 2. Save to parent sub-collection
    const subRef = db.collection(parentCol).doc(parentId).collection("students").doc(studentId);
    batch.set(subRef, data);

    // 3. Update Parent's mirrored children array
    const currentChildren = parentDoc.data().children || [];
    currentChildren.push({ id: studentId, name });
    batch.update(db.collection(parentCol).doc(parentId), { children: currentChildren });

    await batch.commit();
    return { id: studentId, message: "Student registered successfully with parent mirroring" };
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
    const subRef = db.collection(parentCol).doc(parentId).collection("students").doc(id);
    batch.update(subRef, mergedData);

    // Update Parent's mirrored children array if name changed
    if (updateData.name) {
      const parentDoc = await db.collection(parentCol).doc(parentId).get();
      let children = parentDoc.data().children || [];
      children = children.map(c => c.id === id ? { ...c, name: updateData.name } : c);
      batch.update(db.collection(parentCol).doc(parentId), { children });
    }

    await batch.commit();
    return { message: "Student updated successfully and synced with parent" };
  }

  async getStudentsByParentID(parentId) {
    try {
      const parentCol = await this._resolveParentCollection(parentId);
      const snapshot = await db.collection(parentCol).doc(parentId).collection("students").get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn("Falling back to global search for students:", e.message);
    }

    const snapshot = await db.collection(COLLECTIONS.STUDENT).where("parentId", "==", parentId).get();
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
