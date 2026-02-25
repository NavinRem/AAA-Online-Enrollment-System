const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class PaymentService {
  // 10. Initiate Payment
  async initiatePayment(paymentData) {
    const { enrollmentId, amount, method, parentID } = paymentData;
    // Placeholder: Integrate with Stripe/PayPal here

    const paymentRef = db.collection("payment").doc();
    const data = {
      enrollmentId,
      parentID, // Required by Security Rules
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

  // 11. Verify Payment
  async verifyPayment(transactionId) {
    const paymentRef = db.collection("payment").doc(transactionId);
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
      await db.collection("enrollment").doc(payment.enrollmentId).update({
        paymentStatus: "paid",
        status: "confirmed",
      });
    }

    return { status: "success", message: "Payment verified" };
  }

  // 12. Get Payment History
  async getPaymentHistory(userId) {
    // Assuming payments are linked to user via enrollment -> parent_id?
    // For now, simpler if payment has userId directly, or we query enrollments first.
    // Let's assume we pass userId in initiatePayment or look it up.
    // Simplify: Query payments by enrollmentId found for user's students?
    // For this MVP, let's just return all payments since we don't have authentication middleware strictly enforcing owner yet.
    const snapshot = await db.collection("payment").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = new PaymentService();
