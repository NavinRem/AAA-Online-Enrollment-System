const request = require("supertest");
const express = require("express");
const { describe, it, before, after } = require("mocha");
// We need to mock firebase-admin before importing the routes/controllers
// because they initialize the app immediately.
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Firestore
const dbMock = {
  collection: (name) => {
    if (name === "registrations") {
      return {
        add: async (data) => {
          return { id: "mock-id-123" };
        },
        get: async () => {
          // Mocking snapshot for getAllRegistrations
          return {
            docs: [
              {
                id: "mock-doc-1",
                data: () => ({ name: "Test User", email: "test@example.com" }),
              },
            ],
          };
        },
        doc: (id) => {
          return {
            get: async () => {
              if (id === "existing-id") {
                return {
                  exists: true,
                  id: "existing-id",
                  data: () => ({ name: "Existing User" }),
                };
              } else {
                return { exists: false };
              }
            },
          };
        },
      };
    }
    return {};
  },
};

const firebaseAdminMock = {
  initializeApp: () => {},
  getFirestore: () => dbMock,
};

// Use proxyquire to inject mocks
const registrationController = proxyquire(
  "../src/controllers/registrationController",
  {
    "firebase-admin/app": firebaseAdminMock,
    "firebase-admin/firestore": firebaseAdminMock,
  },
);

// Since routes import controller, we need to restructure how we test slightly
// or simply test the controller directly if we can't easily mock the express app chain
// without major refactoring of index.js.
//
// However, let's try to mock the whole route chain or just test the express app using dependencies.
// To make `index.js` testable without actually starting a server or connecting to real firebase,
// we'll need to mock the imports inside `index.js`.

const registrationRoutes = express.Router();
registrationRoutes.post("/", registrationController.createRegistration);
registrationRoutes.get("/", registrationController.getAllRegistrations);
registrationRoutes.get("/:id", registrationController.getRegistration);

const app = express();
app.use(express.json());
app.use("/registrations", registrationRoutes);

describe("Registration API", () => {
  describe("POST /registrations", () => {
    it("should create a new registration", async () => {
      const res = await request(app).post("/registrations").send({
        name: "John Doe",
        email: "john@example.com",
        eventId: "event-123",
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.id, "mock-id-123");
      assert.strictEqual(res.body.message, "Registration successful");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app).post("/registrations").send({
        name: "John Doe",
        // Missing email and eventId
      });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error);
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
