import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { initFirebase } from '../firebase/config';

let auth;
let db;

const configureProviders = () => {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  facebookProvider.setCustomParameters({
    'display': 'popup'
  });
};

initFirebase().then(firebase => {
  auth = firebase.auth;
  db = firebase.db;
  configureProviders();
});

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Thêm hàm xử lý đăng nhập social chung
const handleSocialLogin = async (authResult, role, companyData) => {
  const { user } = authResult;
  let company_id;

  if (role === 'user') {
    // Kiểm tra và lấy company_id cho user
    const companyQuery = query(
      collection(db, 'companies'),
      where('company_code', '==', companyData.companyCode)
    );
    const companySnapshot = await getDocs(companyQuery);
    
    if (companySnapshot.empty) {
      throw new Error('Mã công ty không tồn tại');
    }
    company_id = companySnapshot.docs[0].id;
  } else if (role === 'admin') {
    // Tạo company mới cho admin
    const companiesRef = collection(db, 'companies');
    const newCompanyRef = doc(companiesRef);
    
    await setDoc(newCompanyRef, {
      company_name: companyData.companyName,
      company_code: companyData.companyCode,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    company_id = newCompanyRef.id;
  }

  // Lưu thông tin user vào database
  const userData = {
    username: user.displayName || 'Người dùng',
    email: user.email,
    role: role,
    company_id: company_id,
    avatar: user.photoURL,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };

  await setDoc(doc(db, 'users', user.uid), userData);

  return { user, userData };
};

export const loginWithGoogle = async (role = null, companyData = null) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (!role) return result; // Trả về kết quả nếu chỉ đăng nhập

    // Xử lý tạo tài khoản mới với role và thông tin công ty
    const socialData = await handleSocialLogin(result, role, companyData);
    return socialData;
  } catch (error) {
    throw new Error('Đăng nhập Google thất bại: ' + error.message);
  }
};

export const loginWithFacebook = async (role = null, companyData = null) => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    if (!role) return result; // Trả về kết quả nếu chỉ đăng nhập

    // Xử lý tạo tài khoản mới với role và thông tin công ty
    const socialData = await handleSocialLogin(result, role, companyData);
    return socialData;
  } catch (error) {
    throw new Error('Đăng nhập Facebook thất bại: ' + error.message);
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    return {
      user: userCredential.user,
      userData: userDoc.data()
    };
  } catch (error) {
    throw new Error('Đăng nhập thất bại: ' + error.message);
  }
};

export const registerWithEmail = async (email, password, userData) => {
  try {
    // Kiểm tra company_code nếu là user
    if (userData.role === 'user') {
      const companyQuery = query(
        collection(db, 'companies'),
        where('company_code', '==', userData.company_code)
      );
      const companySnapshot = await getDocs(companyQuery);
      
      if (companySnapshot.empty) {
        throw new Error('Mã công ty không tồn tại');
      }
      // Lấy company_id từ document đầu tiên
      userData.company_id = companySnapshot.docs[0].id;
    }

    // Tạo tài khoản authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Nếu là admin, tạo company trước
    if (userData.role === 'admin') {
      // Tạo reference mới cho company
      const companiesRef = collection(db, 'companies');
      const newCompanyRef = doc(companiesRef);
      
      // Lưu dữ liệu company với ID đã được tạo
      await setDoc(newCompanyRef, {
        company_name: userData.company_name,
        company_code: userData.company_code,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Lưu company_id
      userData.company_id = newCompanyRef.id;
    }

    // Lưu thông tin user vào Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username: userData.username,
      email: email,
      role: userData.role,
      company_id: userData.company_id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return userCredential.user;
  } catch (error) {
    console.error('Chi tiết lỗi:', error);
    throw new Error('Đăng ký thất bại: ' + error.message);
  }
};
