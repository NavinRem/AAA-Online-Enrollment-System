import { firestore } from '@/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc 
} from 'firebase/firestore';

class BranchService {
  constructor() {
    this.db = firestore;
    this.collectionName = 'branches';
  }

  async getAllBranches() {
    try {
      const querySnapshot = await getDocs(collection(this.db, this.collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  async getBranch(id) {
    try {
      const docSnap = await getDoc(doc(this.db, this.collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  }

  /**
   * Standardized Branch Snapshot for Student records
   */
  getBranchSnapshot(branch) {
    if (!branch) return null;
    return {
      id: branch.id,
      name: branch.name,
      abbr: branch.abbr
    };
  }
}

export default new BranchService();
