const { db, COLLECTIONS } = require("../../config/database");

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
      imageURL, 
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
      numberSessions: parseInt(numberSessions) || 0,
      level: level || "beginner",
      status: status || "Active",
      levelId: levelId || null,
      termId: termId || null,
      schedule: schedule || null,
      imageURL: imageURL || null,
      teachers: teachers || [], // Array of { id, name }
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTIONS.PROGRAM).add(data);
    return { id: docRef.id, message: "Program created successfully" };
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

  // Helper method to hydrate program data (Terms, Categories, Levels, Teachers)
  async _hydratePrograms(programs) {
    if (!programs || programs.length === 0) return [];

    // Fetch all terms for mapping
    const termsSnapshot = await db.collection(COLLECTIONS.TERM).get();
    const termsMap = {};
    termsSnapshot.docs.forEach((doc) => {
      termsMap[doc.id] = doc.data().name;
    });

    // Fetch all teachers for hydration
    const usersSnapshot = await db.collection(COLLECTIONS.USER).where("role", "in", ["teacher", "instructor"]).get();
    const teachersMap = {};
    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      teachersMap[doc.id] = {
        id: doc.id,
        name: userData.name || userData.email || "Unknown",
        profileURL: userData.profileURL || null
      };
    });

    // Fetch all categories and levels
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
      // Fallback for legacy data/single teacherId
      if (rawTeachers.length === 0 && (program.teacherId || program.uid)) {
        rawTeachers = [{ id: program.teacherId || program.uid, name: program.teacherName || "Unknown" }];
      }
      
      const hydratedTeachers = rawTeachers.map(t => {
        const teacherId = typeof t === 'string' ? t : (t.id || t.uid);
        if (!teacherId) return null;
        
        return teachersMap[teacherId] || (typeof t === 'object' ? { ...t, profileURL: "" } : { id: t, name: "Unknown", profileURL: "" });
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
    await ref.update(data);
    return { id, message: "Program updated successfully" };
  }

  async deleteProgram(id) {
    await db.collection(COLLECTIONS.PROGRAM).doc(id).delete();
    return { message: "Program deleted successfully" };
  }
}

module.exports = new ProgramService();
