const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

exports.createRegistration = async (req, res) => {
  try {
    console.log("Create Registration Body:", JSON.stringify(req.body));
    const data = req.body;

    const docRef = await db.collection("registrations").add({
      ...data,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllRegistrations = async (req, res) => {
  try {
    const snapshot = await db.collection("registrations").get();
    const registrations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRegistration = async (req, res) => {
  try {
    const doc = await db.collection("registrations").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
