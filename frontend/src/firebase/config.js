import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDqXjeHVRijpR1qQLcWfn-EewgjpLtELEY",
  authDomain: "search-images-v1.firebaseapp.com",
  databaseURL: "https://search-images-v1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "search-images-v1",
  storageBucket: "search-images-v1.firebasestorage.app",
  messagingSenderId: "1059477552626",
  appId: "1:1059477552626:web:ef81ee972916bd8b697f6b",
  measurementId: "G-PM1MZ27C98"
};

let app;
let auth;
let db;
let storage;

export const initFirebase = async () => {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    return { app, auth, db, storage };
  } catch (error) {
    console.error('Lỗi khởi tạo Firebase:', error);
    throw error;
  }
};

// Thêm hàm kiểm tra kết nối
export const checkFirebaseConnection = async () => {
  try {
    if (!app) {
      await initFirebase();
    }
    // Thử kết nối đến Firestore để kiểm tra
    const db = getFirestore(app);
    await db.terminate(); // Đóng kết nối sau khi kiểm tra
    return true;
  } catch (error) {
    console.error('Lỗi kết nối Firebase:', error);
    return false;
  }
};

export { auth, db, storage };
