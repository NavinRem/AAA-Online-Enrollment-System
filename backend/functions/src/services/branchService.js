const { db, COLLECTIONS } = require("../config/database");

class BranchService {
  async getAllBranches() {
    const snapshot = await db.collection(COLLECTIONS.BRANCH).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getBranch(id) {
    const doc = await db.collection(COLLECTIONS.BRANCH).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Standardized Branch Snapshot for Mirroring in Student records
   */
  getBranchSnapshot(id, data) {
    if (!id || !data) return null;
    return {
      id: id,
      name: data.name,
      abbr: data.abbr,
    };
  }

  async seedBranches() {
    const branches = [
      { id: "FM", name: "Funmall", abbr: "FM" },
      { id: "OCIC", name: "OCIC", abbr: "OCIC" },
      { id: "AEON", name: "AEON", abbr: "AEON" },
      { id: "PH", name: "Peng Hout", abbr: "PH" },
      { id: "CM", name: "Chip Mong", abbr: "CM" },
    ];

    for (const branch of branches) {
      const { id, ...data } = branch;
      const ref = db.collection(COLLECTIONS.BRANCH).doc(id);
      await ref.set({
        ...data,
        updatedAt: new Date().toISOString(),
      });
    }

    console.log("✅ Branches seeded successfully");
  }
}

module.exports = new BranchService();
