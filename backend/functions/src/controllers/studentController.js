const studentService = require("../services/studentService");

/**
 * @route POST /students
 * @description Create a new student
 */
exports.createStudent = async (req, res) => {
  try {
    const result = await studentService.createStudent(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes("are required")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /students/:id
 * @description Get a student by ID
 */
exports.getStudent = async (req, res) => {
  try {
    const student = await studentService.getStudent(req.params.id);
    res.status(200).json(student);
  } catch (error) {
    if (error.message === "Student not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /students/:id
 * @description Update a student profile
 */
exports.updateStudent = async (req, res) => {
  try {
    const result = await studentService.updateStudent(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Student not found") {
      return res.status(404).json({ error: error.message });
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
 * @route GET /students/parent/:parentId
 * @description Get all students for a parent
 */
exports.getStudentsByParent = async (req, res) => {
  try {
    const students = await studentService.getStudentsByParent(
      req.params.parentId,
    );
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /students
 * @description Get ALL students (Admin/Instructor)
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
