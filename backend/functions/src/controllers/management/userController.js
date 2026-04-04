const userService = require("../../services/management/userService");
const studentService = require("../../services/management/studentService");
const { db, COLLECTIONS } = require("../../config/database");

/**
 * @route POST /users
 * @description Create or update a user profile
 */
/**
 * @route POST /users/registerParentAccount
 * @description Create or update a parent account
 */
exports.registerParentAccount = async (req, res) => {
  try {
    const result = await userService.registerParentAccount(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /users/registerStaffAccount
 * @description Create a staff account (Admin only)
 */
exports.registerStaffAccount = async (req, res) => {
  try {
    const result = await userService.registerStaffAccount(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users
 * @description Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/:uid
 * @description Get a single user by ID
 */
exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUser(req.params.uid);
    res.status(200).json(user);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/:uid/role
 * @description Get user role
 */
exports.getUserRole = async (req, res) => {
  try {
    const roleData = await userService.getUserRole(req.params.uid);
    res.status(200).json(roleData);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /users/:uid/registerStudentProfile
 * @description Add a student/child to a parent's account (Root 'student' collection)
 */
exports.registerStudentProfile = async (req, res) => {
  try {
    const result = await studentService.createStudent({
      ...req.body,
      parentId: req.params.uid,
    });
    res.status(201).json(result);
  } catch (error) {
    if (error.message === "Parent ID, Full Name, and Date of Birth are required") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /students/:id/medical
 * @description Update medical info for a student
 */
exports.updateMedicalInfo = async (req, res) => {
  try {
    const result = await studentService.updateMedicalInfo(
      req.params.id,
      req.body.medicalNote,
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Medical note is required") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Student not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/:uid/students
 * @description Get all students/children for a parent
 */
exports.getStudentsByParentID = async (req, res) => {
  try {
    const students = await studentService.getStudentsByParentID(req.params.uid);
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /users/:uid
 * @description Update user profile
 */
exports.updateUser = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.uid, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route DELETE /users/:uid
 * @description Delete user account
 */
exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.uid);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/allStudents
 * @description Get all students (admin only in UI logic usually)
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * @route POST /users/run-standardization
 * @description Standardize name and profile fields, and implement mirroring
 */
exports.runStandardization = async (req, res) => {
  try {
    console.log("Starting deep data synchronization and mirroring...");
    const userRoleCollections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
    const parentMap = {}; // uid -> ParentSnapshot
    const studentMap = {}; // studentId -> StudentSnapshot
    let processedCount = 0;

    // 1. Map all Users (Parents/Guardians/Staff)
    for (const col of userRoleCollections) {
      const snap = await db.collection(col).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        const uid = doc.id;
        
        // Ensure name exists
        const name = data.name || data.fullName || data.username || "User";
        const email = data.email || "N/A";
        const phone = data.phone || "N/A";
        const role = data.role || (col === COLLECTIONS.GUARDIAN ? "guardian" : "parent");
        const profile = data.profile || data.profileURL || null;
        const profileURL = data.profileURL || data.profile || null;

        parentMap[uid] = {
          id: uid,
          name,
          email,
          phone,
          role,
          roleDisplay: role === "parent" ? "Parent" : role.charAt(0).toUpperCase() + role.slice(1),
          profile,
          profileURL
        };

        // Standardize top-level fields while we are here
        await doc.ref.update({
          name,
          profile,
          profileURL,
          role
        });
        processedCount++;
      }
    }

    // 2. Map all Students
    const studentsSnap = await db.collection(COLLECTIONS.STUDENT).get();
    for (const doc of studentsSnap.docs) {
      const data = doc.data();
      const sid = doc.id;
      
      const name = data.name || data.fullName || "Student";
      const dob = data.dob || data.DoB || null;
      const medicalNote = data.medicalNote || "None";
      const profile = data.profile || data.profileURL || data.childProfileURL || null;
      const profileURL = data.profileURL || data.profile || data.childProfileURL || null;
      const parentId = data.parentId;

      studentMap[sid] = {
        id: sid,
        name,
        dob,
        medicalNote,
        profile,
        profileURL,
        parentId
      };

      // Standardize top-level fields
      await doc.ref.update({
        name,
        dob,
        medicalNote,
        profile,
        profileURL
      });
      processedCount++;
    }

    // 3. Mirror Parent Info INTO Students
    const studentIds = Object.keys(studentMap);
    for (const sid of studentIds) {
      const sData = studentMap[sid];
      if (sData.parentId && parentMap[sData.parentId]) {
        const parentInfo = parentMap[sData.parentId];
        await db.collection(COLLECTIONS.STUDENT).doc(sid).set({ parentInfo }, { merge: true });
        
        // Also update sub-collection if it exists
        const parentCol = await studentService._resolveParentCollection(sData.parentId);
        const subRef = db.collection(parentCol).doc(sData.parentId).collection("students").doc(sid);
        const subDoc = await subRef.get();
        if (subDoc.exists) {
          await subRef.set({ parentInfo }, { merge: true });
        }
      }
    }

    // 4. Mirror Student List INTO Parents/Guardians
    const parentIds = Object.keys(parentMap);
    for (const uid of parentIds) {
      const studentsForParent = Object.values(studentMap)
        .filter(s => s.parentId === uid)
        .map(s => ({
          id: s.id,
          name: s.name,
          dob: s.dob,
          medicalNote: s.medicalNote,
          profile: s.profile,
          profileURL: s.profileURL
        }));
      
      if (studentsForParent.length > 0) {
        const parentCol = parentMap[uid].role === "guardian" ? COLLECTIONS.GUARDIAN : COLLECTIONS.PARENT;
        await db.collection(parentCol).doc(uid).update({
          studentInfo: studentsForParent
        });
      }
    }

    res.status(200).json({
      message: "Deep Data Synchronization & Mirroring completed successfully",
      stats: {
        totalProcessed: processedCount,
        parentsMapped: Object.keys(parentMap).length,
        studentsMapped: Object.keys(studentMap).length
      }
    });
  } catch (err) {
    console.error("Standardization API failed:", err);
    res.status(500).json({ error: err.message });
  }
};
