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
    console.log("Starting data standardization and mirroring...");
    const userRoleCollections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
    const userMap = {}; // uid -> { name, profile }
    let processedCount = 0;

    // 1. Process all user collections
    for (const col of userRoleCollections) {
      const snap = await db.collection(col).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        const updateData = {};
        
        // Rename fullName/username -> name
        if (data.fullName) { updateData.name = data.fullName; updateData.fullName = null; }
        if (data.username) { updateData.name = data.username; updateData.username = null; }
        
        // Rename profileURL -> profile
        if (data.profileURL) { updateData.profile = data.profileURL; updateData.profileURL = null; }
        
        if (Object.keys(updateData).length > 0) {
          await db.collection(col).doc(doc.id).set(updateData, { merge: true });
        }
        
        userMap[doc.id] = {
          name: updateData.name || data.name || data.fullName || "Unknown",
          profile: updateData.profile || data.profile || data.profileURL || null
        };
        processedCount++;
      }
    }

    // 2. Process Students collection and Mirror Parent Info
    const studentsSnap = await db.collection(COLLECTIONS.STUDENT).get();
    const parentChildrenMap = {}; // parentId -> [ {id, name} ]

    for (const doc of studentsSnap.docs) {
      const data = doc.data();
      const updateData = {};
      
      // Rename fullName -> name
      if (data.fullName) { updateData.name = data.fullName; updateData.fullName = null; }
      
      // Rename childProfileURL -> profile
      if (data.childProfileURL) { updateData.profile = data.childProfileURL; updateData.childProfileURL = null; }
      
      // Mirror Parent Info
      if (data.parentId && userMap[data.parentId]) {
        updateData.parentName = userMap[data.parentId].name;
        updateData.parentProfile = userMap[data.parentId].profile;
      }
      
      if (Object.keys(updateData).length > 0) {
        await db.collection(COLLECTIONS.STUDENT).doc(doc.id).set(updateData, { merge: true });
      }

      // Prepare for Parent mirroring
      if (data.parentId) {
        if (!parentChildrenMap[data.parentId]) parentChildrenMap[data.parentId] = [];
        parentChildrenMap[data.parentId].push({
          id: doc.id,
          name: updateData.name || data.name || data.fullName || "Unknown Child"
        });
      }
      processedCount++;
    }

    // 3. Mirror Student list in Parents/Guardians (Modern snapshot array)
    for (const parentId in parentChildrenMap) {
      // Find which collection the parent belongs to
      let parentCol = COLLECTIONS.PARENT;
      const gDoc = await db.collection(COLLECTIONS.GUARDIAN).doc(parentId).get();
      if (gDoc.exists) parentCol = COLLECTIONS.GUARDIAN;
      
      // We use the full snapshots from the map
      await db.collection(parentCol).doc(parentId).set({
        studentInfo: parentChildrenMap[parentId]
      }, { merge: true });
    }

    // 4. Standardize PROGRAMS
    const programSnapshot = await db.collection(COLLECTIONS.PROGRAM).get();
    for (const doc of programSnapshot.docs) {
      const data = doc.data();
      const updateData = {};
      
      if (data.profileURL) {
        updateData.profile = data.profileURL;
        updateData.profileURL = null;
      }

      if (Object.keys(updateData).length > 0) {
        await doc.ref.update(updateData);
        processedCount++;
      }
    }

    res.status(200).json({
      message: "Refactor & Mirroring completed successfully",
      totalProcessed: processedCount,
      stats: {
        users: Object.keys(userMap).length,
        students: studentsSnap.size,
        programs: programSnapshot.size
      }
    });
  } catch (err) {
    console.error("Standardization API failed:", err);
    res.status(500).json({ error: err.message });
  }
};
