const { db, COLLECTIONS } = require("../../config/database");
const userService = require("../management/userService");

class ProgramService {
  async createProgram(programData) {
    const { 
      title, 
      category, 
      categoryId, 
      description, 
      price, 
      numberSessions, 
      level, 
      status, 
      levelId, 
      termId, 
      schedule, 
      profile, 
      teachers, // Array of { id, name }
      startDate,
      endDate 
    } = programData;

    if (!title || !termId || !levelId) {
      throw new Error("Title, Term, and Level are required");
    }

    // Uniqueness check: Title + Term + Level
    const snapshot = await db.collection(COLLECTIONS.PROGRAM)
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
      totalSessions: parseInt(numberSessions) || 0, // Standardize naming
      level: level || "level",
      status: status || "Active",
      levelId: levelId || null,
      termId: termId || null,
      schedule: schedule || null,
      profileURL: profile || programData.profileURL || null,
      teachers: teachers || [],
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTIONS.PROGRAM).add(data);
    return { id: docRef.id, message: "Program created successfully" };
  }

  /**
   * Standardized Program Snapshot for Mirroring
   */
  _getProgramSnapshot(programId, data) {
    return {
      id: programId,
      title: data.title || "Program",
      category: data.category || "N/A",
      totalSessions: data.totalSessions || 10,
      price: data.price || 0,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      profileURL: data.profileURL || data.profile || null,
      teachers: data.teachers || [],
    };
  }

  async getAllPrograms() {
    const programsSnapshot = await db.collection(COLLECTIONS.PROGRAM).get();
    const programs = programsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return this._hydratePrograms(programs);
  }

  async getProgram(programId) {
    const doc = await db.collection(COLLECTIONS.PROGRAM).doc(programId).get();
    if (!doc.exists) throw new Error("Program not found");
    
    const programs = [ { id: doc.id, ...doc.data() } ];
    const hydrated = await this._hydratePrograms(programs);
    return hydrated[0];
  }

  async _hydratePrograms(programs) {
    if (!programs || programs.length === 0) return [];

    const termsSnapshot = await db.collection(COLLECTIONS.TERM).get();
    const termsMap = {};
    termsSnapshot.docs.forEach((doc) => {
      termsMap[doc.id] = doc.data().name;
    });

    const allUsers = await userService.getAllUsers();
    const teachersMap = {};
    allUsers.forEach((u) => {
      if (["teacher", "instructor", "admin"].includes(u.role)) {
        teachersMap[u.uid] = {
          id: u.uid,
          name: u.name || u.email || "Unknown",
          profileURL: u.profileURL || u.profile || null
        };
      }
    });

    const categoriesSnapshot = await db.collection(COLLECTIONS.CATEGORY).get();
    const categoriesMap = {};
    const levelsMap = {};
    
    categoriesSnapshot.docs.forEach(doc => {
      categoriesMap[doc.id] = doc.data().name;
    });
    
    await Promise.all(
      categoriesSnapshot.docs.map(async (catDoc) => {
        const levelsSnapshot = await catDoc.ref.collection(COLLECTIONS.LEVEL).get();
        levelsSnapshot.docs.forEach((lvlDoc) => {
          levelsMap[lvlDoc.id] = lvlDoc.data().name;
        });
      })
    );

    return programs.map((program) => {
      let rawTeachers = program.teachers || [];
      if (rawTeachers.length === 0 && (program.teacherId || program.uid)) {
        rawTeachers = [{ id: program.teacherId || program.uid, name: program.teacherName || "Unknown" }];
      }
      
      const hydratedTeachers = rawTeachers.map(t => {
        const teacherId = typeof t === 'string' ? t : (t.id || t.uid);
        if (!teacherId) return null;
        
        return teachersMap[teacherId] || (typeof t === 'object' ? { ...t, profile: "" } : { id: t, name: "Unknown", profile: "" });
      }).filter(Boolean);

      return {
        ...program,
        teachers: hydratedTeachers,
        category: categoriesMap[program.categoryId] || program.category,
        levelName: levelsMap[program.levelId] || program.level,
        termName: termsMap[program.termId],
      };
    });
  }

  async updateProgram(id, updateData) {
    const ref = db.collection(COLLECTIONS.PROGRAM).doc(id);
    const data = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    // Standardize profileURL if profile passed
    if (updateData.profile && !updateData.profileURL) {
      data.profileURL = updateData.profile;
      delete data.profile;
    }

    await ref.update(data);

    // Cascading sync to Enrollments
    if (updateData.title || updateData.category || updateData.price || updateData.profileURL || updateData.profile) {
      await this._syncProgramMirrors(id);
    }

    return { id, message: "Program updated successfully" };
  }

  /**
   * Deep Mirrored Sync for Programs
   * Cascades Program changes to linked Enrollments.
   */
  async _syncProgramMirrors(pid) {
    const programDoc = await db.collection(COLLECTIONS.PROGRAM).doc(pid).get();
    if (!programDoc.exists) return;

    const program = this._getProgramSnapshot(pid, programDoc.data());
    const batch = db.batch();

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where("programId", "==", pid)
      .get();

    enrollmentsSnap.forEach((doc) => {
      batch.update(doc.ref, { program });
    });

    await batch.commit();
    console.log(`✅ Cascading Program sync completed for ${pid} across ${enrollmentsSnap.size} enrollments.`);
  }

  async deleteProgram(id) {
    await db.collection(COLLECTIONS.PROGRAM).doc(id).delete();
    return { message: "Program deleted successfully" };
  }
}

module.exports = new ProgramService();
