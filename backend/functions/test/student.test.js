const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Student Service
const studentServiceMock = {
  createStudent: async (data) => {
    return { id: "mock-student-id", ...data };
  },
  getAllStudents: async () => {
    return [{ id: "student-1", name: "Student One" }];
  },
  getStudent: async (id) => {
    if (id === "not-found") throw new Error("Student not found");
    return { id: id, name: "Student One" };
  },
  updateStudent: async (id, data) => {
    return { id: id, ...data };
  },
  deleteStudent: async (id) => {
    return { message: "Student deleted successfully" };
  },
};

// Mock Controller
const studentController = proxyquire("../src/controllers/studentController", {
  "../services/studentService": studentServiceMock,
});

// Setup App
const app = express();
app.use(express.json());

app.post("/students", studentController.createStudent);
app.get("/students", studentController.getAllStudents);
app.get("/students/:id", studentController.getStudent);
app.put("/students/:id", studentController.updateStudent);
// Note: deleteStudent might not be exposed in controller based on typical patterns, but checking file first would be better.
// Assuming it exists based on standard CRUD. I will check the file content from view_file output in next step if needed, but for now assuming standard.
// Wait, I submitted view_file in parallel. I should probably wait or use what I know. Be safe and only include what I see in the file.
// Since I scheduled view_file and write_to_file in PARALLEL, I am guessing the content.
// Actually, I am writing this tool call in the SAME turn as view_file.
// This is risky if I don't know the methods.
// BUT, I can see the previous file list showed studentController.js size is considerable.
// I will blindly assume standard CRUD for now, and fix if it fails or if I see the content is different.
// Ideally I should have waited.
// Let's stick to what is likely there. createStudent, getAllStudents, getStudent, updateStudent are standard.

app.put("/students/:id", studentController.updateStudent);

describe("Student Controller", () => {
  describe("POST /students", () => {
    it("should create a new student", async () => {
      const res = await request(app).post("/students").send({
        name: "New Student",
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.id, "mock-student-id");
    });
  });

  describe("GET /students", () => {
    it("should return all students", async () => {
      const res = await request(app).get("/students");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
    });
  });

  describe("GET /students/:id", () => {
    it("should return a student", async () => {
      const res = await request(app).get("/students/student-1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, "student-1");
    });

    it("should return 404 if not found", async () => {
      const res = await request(app).get("/students/not-found");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Student not found");
    });
  });

  describe("PUT /students/:id", () => {
    it("should update a student", async () => {
      const res = await request(app).put("/students/student-1").send({
        name: "Updated Name",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, "Updated Name");
    });
  });
});
