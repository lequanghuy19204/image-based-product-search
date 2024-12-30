import { storage, db } from '../firebase/config';
import { 
  ref, 
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getDoc
} from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

export const uploadImage = async (file, metadata = {}) => {
  try {
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Lưu thông tin ảnh vào Firestore
    const imageDoc = await addDoc(collection(db, 'images'), {
      url: downloadURL,
      name: file.name,
      path: snapshot.ref.fullPath,
      metadata,
      createdAt: new Date(),
      ...metadata
    });

    return {
      id: imageDoc.id,
      url: downloadURL,
      name: file.name
    };
  } catch (error) {
    throw new Error('Tải ảnh lên thất bại: ' + error.message);
  }
};

export const getImages = async (filters = {}) => {
  try {
    let imagesQuery = collection(db, 'images');
    
    // Thêm các điều kiện lọc nếu có
    if (filters.category) {
      imagesQuery = query(imagesQuery, where('category', '==', filters.category));
    }

    const snapshot = await getDocs(imagesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Lấy danh sách ảnh thất bại: ' + error.message);
  }
};

export const deleteImage = async (imageId) => {
  try {
    // Lấy thông tin ảnh từ Firestore
    const imageDoc = await getDoc(doc(db, 'images', imageId));
    const imageData = imageDoc.data();

    // Xóa file từ Storage
    if (imageData.path) {
      const storageRef = ref(storage, imageData.path);
      await deleteObject(storageRef);
    }

    // Xóa document từ Firestore
    await deleteDoc(doc(db, 'images', imageId));
  } catch (error) {
    throw new Error('Xóa ảnh thất bại: ' + error.message);
  }
};
