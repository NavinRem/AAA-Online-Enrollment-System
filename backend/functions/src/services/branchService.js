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

  async createBranch(data) {
    const id = data.abbr || data.id;
    if (!id) throw new Error("Branch ID or Abbreviation is required");

    const ref = db.collection(COLLECTIONS.BRANCH).doc(id);
    const doc = await ref.get();
    if (doc.exists) throw new Error("Branch with this Abbreviation already exists");

    const branchData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ref.set(branchData);
    return { id, ...branchData };
  }

  async updateBranch(id, data) {
    const ref = db.collection(COLLECTIONS.BRANCH).doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error("Branch not found");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await ref.update(updateData);
    return { id, ...updateData };
  }

  async deleteBranch(id) {
    const ref = db.collection(COLLECTIONS.BRANCH).doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error("Branch not found");

    await ref.delete();
    return { id, message: "Branch deleted successfully" };
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
