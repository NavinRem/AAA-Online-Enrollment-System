const { db, COLLECTIONS } = require("../config/database");
const userService = require("./userService");
const profileHelper = require("../utils/profileHelper");

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
      teachers,
      startDate,
      endDate,
    } = programData;

    if (!title || !termId || !levelId) {
      throw new Error("Title, Term, and Level are required");
    }

    const snapshot = await db
      .collection(COLLECTIONS.PROGRAM)
      .where("title", "==", title.trim())
      .where("termId", "==", termId)
      .where("levelId", "==", levelId)
      .get();

    if (!snapshot.empty) {
      throw new Error(
        `A program with title "${title}" already exists for this term and level`,
      );
    }

    const data = {
      title: title.trim(),
      categoryId: categoryId,
      category: category,
      description: description,
      price: parseFloat(price),
      totalSessions: parseInt(numberSessions),
      level: level,
      status: status,
      levelId: levelId,
      termId: termId,
      schedule: schedule,
      profileURL: profile,
      teachers: teachers,
      startDate: startDate,
      endDate: endDate,
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

    const programs = [{ id: doc.id, ...doc.data() }];
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
          name: u.name,
          profileURL: u.profileURL,
        };
      }
    });

    const categoriesSnapshot = await db.collection(COLLECTIONS.CATEGORY).get();
    const categoriesMap = {};
    const levelsMap = {};

    categoriesSnapshot.docs.forEach((doc) => {
      categoriesMap[doc.id] = doc.data().name;
    });

    await Promise.all(
      categoriesSnapshot.docs.map(async (catDoc) => {
        const levelsSnapshot = await catDoc.ref
          .collection(COLLECTIONS.LEVEL)
          .get();
        levelsSnapshot.docs.forEach((lvlDoc) => {
          levelsMap[lvlDoc.id] = lvlDoc.data().name;
        });
      }),
    );

    return programs.map((program) => {
      let rawTeachers = program.teachers || [];
      if (rawTeachers.length === 0 && (program.teacherId || program.uid)) {
        rawTeachers = [
          {
            id: program.teacherId,
            name: program.teacherName,
          },
        ];
      }

      const hydratedTeachers = rawTeachers
        .map((t) => {
          const teacherId = typeof t === "string" ? t : t.id;
          if (!teacherId) return null;

          return (
            teachersMap[teacherId] ||
            (typeof t === "object"
              ? { ...t, profile: "" }
              : { id: t, name: "Unknown", profile: "" })
          );
        })
        .filter(Boolean);

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

    if (updateData.profile && !updateData.profileURL) {
      data.profileURL = updateData.profile;
      delete data.profile;
    }

    await ref.update(data);

    if (
      updateData.title ||
      updateData.category ||
      updateData.price ||
      updateData.profileURL ||
      updateData.profile
    ) {
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

    const program = profileHelper.getProgramSnapshot(pid, programDoc.data());
    const batch = db.batch();

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where("programId", "==", pid)
      .get();

    enrollmentsSnap.forEach((doc) => {
      batch.update(doc.ref, { program });
    });

    await batch.commit();
    console.log(
      `Cascading Program sync completed for ${pid} across ${enrollmentsSnap.size} enrollments.`,
    );
  }

  async deleteProgram(id) {
    await db.collection(COLLECTIONS.PROGRAM).doc(id).delete();
    return { message: "Program deleted successfully" };
  }
}

module.exports = new ProgramService();
