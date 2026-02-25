const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Course Service
const courseServiceMock = {
  createCourse: async (data) => {
    return { id: "mock-course-id", ...data };
  },
  getAllCourses: async () => {
    return [{ id: "course-1", title: "Math" }];
  },
  getCourse: async (id) => {
    if (id === "not-found") throw new Error("Course not found");
    return { id: id, title: "Math" };
  },
  updateCourse: async (id, data) => {
    return { id: id, ...data };
  },
  deleteCourse: async (id) => {
    return { message: "Course deleted successfully" };
  },
};

// Mock Controller
const courseController = proxyquire("../src/controllers/courseController", {
  "../services/courseService": courseServiceMock,
});

// Setup App
const app = express();
app.use(express.json());

app.post("/courses", courseController.createCourse);
app.get("/courses", courseController.getAllCourses);
app.get("/courses/:id", courseController.getCourse);
app.put("/courses/:id", courseController.updateCourse);
app.delete("/courses/:id", courseController.deleteCourse);

describe("Course Controller", () => {
  describe("POST /courses", () => {
    it("should create a new course", async () => {
      const res = await request(app).post("/courses").send({
        title: "History 101",
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.id, "mock-course-id");
    });
  });

  describe("GET /courses", () => {
    it("should return all courses", async () => {
      const res = await request(app).get("/courses");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
    });
  });

  describe("GET /courses/:id", () => {
    it("should return a course", async () => {
      const res = await request(app).get("/courses/course-1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, "course-1");
    });

    it("should return 404 if not found", async () => {
      const res = await request(app).get("/courses/not-found");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.message, "Course not found");
    });
  });

  describe("PUT /courses/:id", () => {
    it("should update a course", async () => {
      const res = await request(app).put("/courses/course-1").send({
        title: "Advanced Math",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.title, "Advanced Math");
    });
  });

  describe("DELETE /courses/:id", () => {
    it("should delete a course", async () => {
      const res = await request(app).delete("/courses/course-1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, "Course deleted successfully");
    });
  });
});
