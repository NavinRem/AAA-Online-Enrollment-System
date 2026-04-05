const { db, COLLECTIONS } = require("../config/database");

class PaymentService {
  // Initiate Payment
  async initiatePayment(paymentData) {
    const { enrollmentId, amount, method, parentId } = paymentData;
    // Placeholder: Integrate with Stripe/PayPal here

    const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc();
    const data = {
      enrollmentId,
      parentId, // Required by Security Rules
      amount,
      method: method || "credit_card",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await paymentRef.set(data);
    return {
      transactionId: paymentRef.id,
      clientSecret: "placeholder_secret_for_frontend",
      message: "Payment initiated",
    };
  }

  // Verify Payment
  async verifyPayment(transactionId) {
    const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc(transactionId);
    const doc = await paymentRef.get();

    if (!doc.exists) throw new Error("Transaction not found");

    // Placeholder verification logic
    await paymentRef.update({
      status: "completed",
      updatedAt: new Date().toISOString(),
    });

    // Update Enrollment Status
    const payment = doc.data();
    if (payment.enrollmentId) {
      await db
        .collection(COLLECTIONS.ENROLLMENT)
        .doc(payment.enrollmentId)
        .update({
          paymentStatus: "paid",
          status: "confirmed",
        });
    }

    return { status: "success", message: "Payment verified" };
  }

  // Get Payment History
  async getPaymentHistory(userId) {
    if (!userId) {
      throw new Error("User ID is required to fetch payment history");
    }

    const snapshot = await db
      .collection(COLLECTIONS.PAYMENT)
      .where("parentId", "==", userId)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Admin: Get All Payments
  async getAllPayments() {
    const snapshot = await db.collection(COLLECTIONS.PAYMENT).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = new PaymentService();
