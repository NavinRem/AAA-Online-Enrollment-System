const request = require("supertest");
const express = require("express");
const { describe, it } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const assert = require("assert");

// Mock Payment Service
const paymentServiceMock = {
  initiatePayment: async (data) => {
    return { transactionId: "mock-txn-123", status: "pending", ...data };
  },
  verifyPayment: async (transactionId) => {
    if (transactionId === "invalid") throw new Error("Invalid transaction");
    return { transactionId, status: "success" };
  },
  getPaymentHistory: async (userId) => {
    return [{ transactionId: "txn-1", amount: 100 }];
  },
};

// Mock Controller
const paymentController = proxyquire("../src/controllers/paymentController", {
  "../services/paymentService": paymentServiceMock,
});

// Setup App
const app = express();
app.use(express.json());

app.post("/payments", paymentController.initiatePayment);
app.post("/payments/verify", paymentController.verifyPayment);
app.get("/payments/history/:userId", paymentController.getPaymentHistory);

describe("Payment Controller", () => {
  describe("POST /payments", () => {
    it("should initiate payment", async () => {
      const res = await request(app).post("/payments").send({
        amount: 100,
        currency: "USD",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.transactionId, "mock-txn-123");
    });
  });

  describe("POST /payments/verify", () => {
    it("should verify payment", async () => {
      const res = await request(app).post("/payments/verify").send({
        transactionId: "txn-123",
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, "success");
    });

    it("should handle error", async () => {
      const res = await request(app).post("/payments/verify").send({
        transactionId: "invalid",
      });
      assert.strictEqual(res.status, 500);
    });
  });

  describe("GET /payments/history/:userId", () => {
    it("should return history", async () => {
      const res = await request(app).get("/payments/history/user-1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
    });
  });
});
