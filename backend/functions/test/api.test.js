const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Enrollment Service
const enrollmentServiceMock = {
  createEnrollment: async (data) => {
    if (!data.email || !data.eventId)
      throw new Error("studentId, courseId, and sessionId are required");
    return { id: "mock-id-123", ...data };
  },
  getAllEnrollments: async () => {
    return [{ id: "mock-doc-1", name: "Test User", email: "test@example.com" }];
  },
  getEnrollment: async (id) => {
    if (id === "existing-id") {
      return { id: "existing-id", name: "Existing User" };
    }
    throw new Error("Enrollment not found");
  },
};

// Use proxyquire to inject mocks
const enrollmentController = proxyquire(
  "../src/controllers/core/enrollmentController",
  {
    "../../services/core/enrollmentService": enrollmentServiceMock,
  },
);

const enrollmentRoutes = express.Router();
// Updated to use createEnrollment
enrollmentRoutes.post("/", enrollmentController.createEnrollment);
enrollmentRoutes.get("/", enrollmentController.getAllEnrollments);
enrollmentRoutes.get("/:id", enrollmentController.getEnrollment);

const app = express();
app.use(express.json());
app.use("/enrollments", enrollmentRoutes);

describe("Enrollment API", () => {
  describe("POST /enrollments", () => {
    it("should create a new enrollment", async () => {
      const res = await request(app).post("/enrollments").send({
        name: "John Doe",
        email: "john@example.com",
        eventId: "event-123",
        studentId: "student-1", 
        courseId: "course-1", 
        sessionId: "session-1", 
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.id, "mock-id-123");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app).post("/enrollments").send({
        name: "John Doe",
        // Missing email and eventId
      });

      // The mock throws "studentId, courseId, and sessionId are required" for missing fields
      // The controller catches this and returns 400
      assert.strictEqual(res.status, 400);
    });
  });

  describe("GET /enrollments", () => {
    it("should return all enrollments", async () => {
      const res = await request(app).get("/enrollments");

      assert.strictEqual(res.status, 200);
      assert.strictEqual(Array.isArray(res.body), true);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].name, "Test User");
    });
  });

  describe("GET /enrollments/:id", () => {
    it("should return a single enrollment", async () => {
      const res = await request(app).get("/enrollments/existing-id");

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, "existing-id");
      assert.strictEqual(res.body.name, "Existing User");
    });

    it("should return 404 for non-existent enrollment", async () => {
      const res = await request(app).get("/enrollments/non-existent-id");

      assert.strictEqual(res.status, 404);
    });
  });
});
