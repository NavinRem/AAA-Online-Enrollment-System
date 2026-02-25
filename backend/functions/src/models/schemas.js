const Joi = require("joi");

// Course Schema
const courseSchema = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().default("Robotic"),
  description: Joi.string().allow(""),
  price: Joi.number().min(0).default(0),
  number_session: Joi.number().integer().min(0).default(0), // Kept strictly as per original code usage
  level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .default("beginner"),
});

// Student Schema
const studentSchema = Joi.object({
  parentID: Joi.string().required(), // Matches Firestore Rules
  fullname: Joi.string().required(),
  dateOfBirth: Joi.date().required(), // Standardized to camelCase in Schema, need to map from input
  medical_note: Joi.string().allow("").optional(),
  active: Joi.boolean().default(true),
});

// Enrollment Schema
const enrollmentSchema = Joi.object({
  studentID: Joi.string().required(), // Matches Firestore Rules
  courseID: Joi.string().required(),
  sessionID: Joi.string().required(),
  parentID: Joi.string().required(), // Matches Firestore Rules
  status: Joi.string()
    .valid("pending", "confirmed", "cancelled")
    .default("pending"),
  paymentStatus: Joi.string()
    .valid("unpaid", "paid", "refunded")
    .default("unpaid"),
  enrolledAt: Joi.date().default(Date.now),
});

// Session Schema
const sessionSchema = Joi.object({
  courseID: Joi.string().required(),
  instructors: Joi.array().items(Joi.string()).default([]),
  capacity: Joi.number().integer().min(1).default(20),
  num_student: Joi.number().integer().min(0).default(0),
  schedule: Joi.string().required(), // e.g. "Mon-Wed 09:00-11:00"
  status: Joi.string().valid("open", "closed", "full").default("open"),
});

module.exports = {
  courseSchema,
  studentSchema,
  enrollmentSchema,
  sessionSchema,
};
