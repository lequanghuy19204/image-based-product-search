import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore, collection, getDocs } from 'firebase/firestore'; // Thêm collection và getDocs
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDqXjeHVRijpR1qQLcWfn-EewgjpLtELEY",
    authDomain: "search-images-v1.firebaseapp.com",
    projectId: "search-images-v1",
    storageBucket: "search-images-v1.firebasestorage.app",
    messagingSenderId: "1059477552626",
    appId: "1:1059477552626:web:ef81ee972916bd8b697f6b",
    measurementId: "G-PM1MZ27C98"
  };
// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Kiểm tra kết nối
const checkFirebaseConnection = async () => {
  try {
    console.log('Đang kiểm tra kết nối Firebase...');
    
    const db = getFirestore(app);
    // Sử dụng collection() và getDocs() thay vì db.collection
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    
    console.log('✅ Kết nối Firebase thành công!');
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối Firebase:', error);
    return false;
  }
};

// Thêm tài khoản test
export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123'
  },
  user: {
    email: 'user@test.com', 
    password: 'user123'
  }
};

// Hàm đăng nhập
export const loginWithEmail = async (email, password) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    throw error;
  }
};

// Khởi tạo các services
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { checkFirebaseConnection };
