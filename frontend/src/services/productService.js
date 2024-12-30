import { db, storage } from '../firebase/config';
import { 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const createProduct = async (productData, imageFile) => {
  try {
    let imageUrl = null;
    
    if (imageFile) {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      image_url: imageUrl,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    // Tạo product_image nếu có hình ảnh
    if (imageUrl) {
      await addDoc(collection(db, 'product_images'), {
        product_id: docRef.id,
        image_url: imageUrl,
        is_primary: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }

    return {
      id: docRef.id,
      ...productData,
      image_url: imageUrl
    };
  } catch (error) {
    throw new Error('Tạo sản phẩm thất bại: ' + error.message);
  }
};

export const getProducts = async (companyId = null) => {
  try {
    let productsQuery = collection(db, 'products');
    
    if (companyId) {
      productsQuery = query(productsQuery, where('company_id', '==', companyId));
    }

    const snapshot = await getDocs(productsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Lấy danh sách sản phẩm thất bại: ' + error.message);
  }
};

export const addProductImage = async (productId, imageFile, isPrimary = false) => {
  try {
    const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'product_images'), {
      product_id: productId,
      image_url: imageUrl,
      is_primary: isPrimary,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return imageUrl;
  } catch (error) {
    throw new Error('Thêm ảnh sản phẩm thất bại: ' + error.message);
  }
};
