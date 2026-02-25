const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Progress Service
const progressServiceMock = {
  getStudentProgress: async (id) => {
    if (id === "not-found") throw new Error("Progress not found");
    return { studentId: id, level: "Intermediate" };
  },
};

// Mock Controller
const progressController = proxyquire("../src/controllers/progressController", {
  "../services/progressService": progressServiceMock,
});

// Setup App
const app = express();
app.use(express.json());

app.get("/progress/:id", progressController.getStudentProgress);

describe("Progress Controller", () => {
  describe("GET /progress/:id", () => {
    it("should return progress", async () => {
      const res = await request(app).get("/progress/student-1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.level, "Intermediate");
    });

    it("should handle invalid id", async () => {
      const res = await request(app).get("/progress/not-found");
      assert.strictEqual(res.status, 500);
    });
  });
});
