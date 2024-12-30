import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateUniqueCompanyCode = async () => {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = generateRandomCode();
    
    // Kiểm tra xem mã đã tồn tại chưa
    const q = query(collection(db, 'companies'), where('company_code', '==', code));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      isUnique = true;
    }
  }
  
  return code;
};
