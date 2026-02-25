const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Session Service
const sessionServiceMock = {
  createSession: async (data) => {
    if (!data.course_id) throw new Error("course_id is required");
    return { id: "mock-session-id", ...data };
  },
  getAvailableSessions: async (courseId) => {
    return [{ id: "session-1", courseId }];
  },
  validateCapacity: async (sessionId) => {
    if (sessionId === "full-session") throw new Error("Session is full");
    if (sessionId === "not-found") throw new Error("Session not found");
    return { available: true };
  },
  getSession: async (sessionId) => {
    if (sessionId === "not-found") throw new Error("Session not found");
    return { id: sessionId, name: "Test Session" };
  },
  assignInstructor: async (sessionId, instructors) => {
    return { id: sessionId, instructors };
  },
  getInstructorRoster: async (sessionId) => {
    return [{ id: "instructor-1", name: "Dr. Smith" }];
  },
  syncStudentCounts: async (sessionId) => {
    return { id: sessionId, studentCount: 10 };
  },
};

// Mock Firebase Imports for Controller (if any direct usage) or just proxy the service
const sessionController = proxyquire("../src/controllers/sessionController", {
  "../services/sessionService": sessionServiceMock,
});

// Setup Express App
const app = express();
app.use(express.json());

// Setup Routes directly using the controller to avoid loading the real router which might have other dependencies
app.post("/sessions", sessionController.createSession);
app.get("/courses/:id/sessions", sessionController.getAvailableSessions);
app.get("/sessions/:id/validate", sessionController.validateCapacity);
app.get("/sessions/:id", sessionController.getSession);
app.put("/sessions/:id/instructor", sessionController.assignInstructor);
app.get("/sessions/:id/roster", sessionController.getInstructorRoster);
app.post("/sessions/sync-counts", sessionController.syncStudentCounts);

describe("Session Controller", () => {
  describe("POST /sessions", () => {
    it("should create a new session", async () => {
      const res = await request(app).post("/sessions").send({
        course_id: "course-123",
        date: "2023-10-10",
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.id, "mock-session-id");
    });

    it("should return 400 if course_id is missing", async () => {
      const res = await request(app).post("/sessions").send({
        date: "2023-10-10",
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, "course_id is required");
    });
  });

  describe("GET /courses/:id/sessions", () => {
    it("should return available sessions for a course", async () => {
      const res = await request(app).get("/courses/course-123/sessions");
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.strictEqual(res.body[0].courseId, "course-123");
    });
  });

  describe("GET /sessions/:id/validate", () => {
    it("should validate capacity", async () => {
      const res = await request(app).get("/sessions/valid-session/validate");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.available, true);
    });

    it("should return 404 if session not found", async () => {
      const res = await request(app).get("/sessions/not-found/validate");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Session not found");
    });
  });

  describe("GET /sessions/:id", () => {
    it("should return session details", async () => {
      const res = await request(app).get("/sessions/session-123");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, "session-123");
    });

    it("should return 404 if session not found", async () => {
      const res = await request(app).get("/sessions/not-found");
      assert.strictEqual(res.status, 404); // Note: Controller returns { message: ... } for 404 in this case
      assert.strictEqual(res.body.message, "Session not found");
    });
  });

  describe("PUT /sessions/:id/instructor", () => {
    it("should assign instructors", async () => {
      const res = await request(app)
        .put("/sessions/session-123/instructor")
        .send({
          instructors: ["inst-1"],
        });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body.instructors, ["inst-1"]);
    });
  });

  describe("GET /sessions/:id/roster", () => {
    it("should return instructor roster", async () => {
      const res = await request(app).get("/sessions/session-123/roster");
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
    });
  });

  describe("POST /sessions/sync-counts", () => {
    it("should sync student counts", async () => {
      const res = await request(app).post("/sessions/sync-counts").send({
        sessionId: "session-123",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.studentCount, 10);
    });
  });
});
