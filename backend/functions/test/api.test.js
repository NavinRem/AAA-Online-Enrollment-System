const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Registration Service
const registrationServiceMock = {
  createEnrollment: async (data) => {
    if (!data.email || !data.eventId)
      throw new Error("studentId, courseId, and sessionId are required");
    return { id: "mock-id-123", ...data };
  },
  getAllRegistrations: async () => {
    return [{ id: "mock-doc-1", name: "Test User", email: "test@example.com" }];
  },
  getRegistration: async (id) => {
    if (id === "existing-id") {
      return { id: "existing-id", name: "Existing User" };
    }
    throw new Error("Registration not found");
  },
};

// Use proxyquire to inject mocks
const registrationController = proxyquire(
  "../src/controllers/registrationController",
  {
    "../services/registrationService": registrationServiceMock,
  },
);

const registrationRoutes = express.Router();
// Updated to use createEnrollment
registrationRoutes.post("/", registrationController.createEnrollment);
registrationRoutes.get("/", registrationController.getAllRegistrations);
registrationRoutes.get("/:id", registrationController.getRegistration);

const app = express();
app.use(express.json());
app.use("/registrations", registrationRoutes);

describe("Registration API", () => {
  describe("POST /registrations", () => {
    it("should create a new enrollment", async () => {
      const res = await request(app).post("/registrations").send({
        name: "John Doe",
        email: "john@example.com",
        eventId: "event-123",
        studentId: "student-1", // added based on likely requirement
        courseId: "course-1", // added
        sessionId: "session-1", // added
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.id, "mock-id-123");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app).post("/registrations").send({
        name: "John Doe",
        // Missing email and eventId
      });

      // The mock throws "studentId, courseId, and sessionId are required" for missing fields
      // The controller catches this and returns 400
      assert.strictEqual(res.status, 400);
    });
  });

  describe("GET /registrations", () => {
    it("should return all registrations", async () => {
      const res = await request(app).get("/registrations");

      assert.strictEqual(res.status, 200);
      assert.strictEqual(Array.isArray(res.body), true);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].name, "Test User");
    });
  });

  describe("GET /registrations/:id", () => {
    it("should return a single registration", async () => {
      const res = await request(app).get("/registrations/existing-id");

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, "existing-id");
      assert.strictEqual(res.body.name, "Existing User");
    });

    it("should return 404 for non-existent registration", async () => {
      const res = await request(app).get("/registrations/non-existent-id");

      assert.strictEqual(res.status, 404);
    });
  });
});
