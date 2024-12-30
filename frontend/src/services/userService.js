import { db } from '../firebase/config';
import { 
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { auth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const createUser = async (userData, password) => {
  try {
    // Tạo user authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      password
    );

    // Tạo document trong collection users
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username: userData.username,
      email: userData.email,
      role: userData.role || 'user',
      company_id: userData.company_id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return userCredential.user;
  } catch (error) {
    throw new Error('Tạo người dùng thất bại: ' + error.message);
  }
};

export const getUsers = async (companyId = null) => {
  try {
    let usersQuery = collection(db, 'users');
    
    if (companyId) {
      usersQuery = query(usersQuery, where('company_id', '==', companyId));
    }

    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Lấy danh sách người dùng thất bại: ' + error.message);
  }
};
