import { db } from '../firebase/config';
import { 
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

export const createCompany = async (companyData) => {
  try {
    // Kiểm tra company_code đã tồn tại chưa
    const codeQuery = query(
      collection(db, 'companies'), 
      where('company_code', '==', companyData.company_code)
    );
    const codeSnapshot = await getDocs(codeQuery);
    
    if (!codeSnapshot.empty) {
      throw new Error('Mã công ty đã tồn tại');
    }

    const docRef = await addDoc(collection(db, 'companies'), {
      ...companyData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...companyData
    };
  } catch (error) {
    throw new Error('Tạo công ty thất bại: ' + error.message);
  }
};

export const getCompanies = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'companies'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Lấy danh sách công ty thất bại: ' + error.message);
  }
};

export const updateCompany = async (companyId, updateData) => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      ...updateData,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    throw new Error('Cập nhật công ty thất bại: ' + error.message);
  }
};
