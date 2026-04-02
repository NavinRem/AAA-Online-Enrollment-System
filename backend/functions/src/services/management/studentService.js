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
    const { parentId, fullName, dob, medicalNote, childProfileURL } = studentData;

    if (!parentId || !fullName || !dob) {
      throw new Error("Parent ID, Full Name, and Date of Birth are required");
    }

    const parentCol = await this._resolveParentCollection(parentId);
    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id;
    
    const data = {
      parentId,
      fullName,
      name: fullName, // Sync with name for naming consistency fix
      dob,
      medicalNote: medicalNote || "None",
      childProfileURL: childProfileURL || null,
      status: "Inactive",
      createdAt: new Date().toISOString(),
    };

    const batch = db.batch();
    
    // 1. Save to global students collection
    const globalRef = db.collection(COLLECTIONS.STUDENT).doc(studentId);
    batch.set(globalRef, data);

    // 2. Save to parent sub-collection
    const subRef = db.collection(parentCol).doc(parentId).collection("students").doc(studentId);
    batch.set(subRef, data);

    await batch.commit();
    return { id: studentId, message: "Student registered successfully in both global and parent records" };
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
      updatedAt: new Date().toISOString(),
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

    await batch.commit();
    return { message: "Student updated successfully in all locations" };
  }

  async getStudentsByParentID(parentId) {
    // We can now try to read from sub-collections directly if we want, 
    // but the where query on global is still fine and very reliable.
    try {
      const parentCol = await this._resolveParentCollection(parentId);
      const snapshot = await db.collection(parentCol).doc(parentId).collection("students").get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn("Falling back to global search for students:", e.message);
    }

    // Fallback to global search
    const snapshot = await db.collection(COLLECTIONS.STUDENT).where("parentId", "==", parentId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getAllStudents() {
    const studentsSnapshot = await db.collection(COLLECTIONS.STUDENT).get();
    
    // Fetch all parents and guardians to get names
    const [parentsSnap, guardiansSnap] = await Promise.all([
      db.collection(COLLECTIONS.PARENT).get(),
      db.collection(COLLECTIONS.GUARDIAN).get()
    ]);

    const parentsMap = {};
    parentsSnap.forEach(doc => parentsMap[doc.id] = doc.data().name || "Unknown Parent");
    guardiansSnap.forEach(doc => parentsMap[doc.id] = doc.data().name || "Unknown Guardian");

    return studentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        parentName: parentsMap[data.parentId] || "N/A",
        ...data,
      };
    });
  }

  async updateMedicalInfo(id, medicalNote) {
    return this.updateStudent(id, { medicalNote: medicalNote || "None" });
  }
}

module.exports = new StudentService();
