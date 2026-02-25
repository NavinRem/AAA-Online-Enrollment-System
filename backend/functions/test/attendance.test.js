const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Attendance Service
const attendanceServiceMock = {
  markCheckIn: async (data) => {
    return { status: "checked-in", ...data };
  },
  markCheckOut: async (data) => {
    return { status: "checked-out", ...data };
  },
  getAttendanceHistory: async (studentId) => {
    return [{ sessionId: "session-1", status: "present" }];
  },
  getAttendanceLogs: async (sessionId) => {
    return [{ studentId: "student-1", status: "present" }];
  },
  requestMakeUpSession: async (data) => {
    return { status: "requested", ...data };
  },
};

// Mock Controller
const attendanceController = proxyquire(
  "../src/controllers/attendanceController",
  {
    "../services/attendanceService": attendanceServiceMock,
  },
);

// Setup App
const app = express();
app.use(express.json());

app.post("/attendance/check-in", attendanceController.markCheckIn);
app.post("/attendance/check-out", attendanceController.markCheckOut);
app.get(
  "/attendance/history/:studentId",
  attendanceController.getAttendanceHistory,
);
app.get("/attendance/logs/:sessionId", attendanceController.getAttendanceLogs);
app.post("/attendance/makeup", attendanceController.requestMakeUpSession);

describe("Attendance Controller", () => {
  describe("POST /attendance/check-in", () => {
    it("should check in", async () => {
      const res = await request(app).post("/attendance/check-in").send({
        studentId: "student-1",
        sessionId: "session-1",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, "checked-in");
    });
  });

  describe("POST /attendance/check-out", () => {
    it("should check out", async () => {
      const res = await request(app).post("/attendance/check-out").send({
        studentId: "student-1",
        sessionId: "session-1",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, "checked-out");
    });
  });

  describe("GET /attendance/history/:studentId", () => {
    it("should return history", async () => {
      const res = await request(app).get("/attendance/history/student-1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
    });
  });

  describe("GET /attendance/logs/:sessionId", () => {
    it("should return logs", async () => {
      const res = await request(app).get("/attendance/logs/session-1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
    });
  });

  describe("POST /attendance/makeup", () => {
    it("should request make up", async () => {
      const res = await request(app).post("/attendance/makeup").send({
        originalSessionId: "session-1",
        targetSessionId: "session-2",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, "requested");
    });
  });
});
