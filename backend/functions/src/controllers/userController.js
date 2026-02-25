const userService = require("../services/userService");

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
    const result = await userService.registerStudentProfile(
      req.params.uid,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.message === "Full Name and Date of Birth are required") {
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
    const result = await userService.updateMedicalInfo(
      req.params.id,
      req.body.medical_note,
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
    const students = await userService.getStudentsByParentID(req.params.uid);
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
