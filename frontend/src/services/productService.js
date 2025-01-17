import { db } from '../firebase/config';
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

// Lấy danh sách sản phẩm theo company_id
export const getProducts = async (companyId) => {
  try {
    // 1. Lấy tất cả sản phẩm
    const productsQuery = query(
      collection(db, 'products'),
      where('company_id', '==', companyId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    
    // 2. Lấy tất cả ảnh chính một lần
    const imagesQuery = query(
      collection(db, 'product_images'),
      where('is_primary', '==', true)
    );
    const imagesSnapshot = await getDocs(imagesQuery);
    
    // Tạo map để lưu trữ ảnh theo product_id
    const imageMap = new Map();
    imagesSnapshot.docs.forEach(doc => {
      const imageData = doc.data();
      imageMap.set(imageData.product_id, imageData.image_url);
    });
    
    // 3. Map data sản phẩm với ảnh tương ứng
    const products = productsSnapshot.docs.map(doc => {
      const productData = doc.data();
      return {
        id: doc.id,
        ...productData,
        image_path: imageMap.get(doc.id) || productData.image_url
      };
    });
    
    // 4. Sắp xếp theo thời gian
    return products.sort((a, b) => {
      const dateA = a.created_at?.toDate?.() || new Date(0);
      const dateB = b.created_at?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Firebase error:', error);
    throw new Error('Lấy danh sách sản phẩm thất bại: ' + error.message);
  }
};

// Thêm sản phẩm mới và ảnh
export const addProduct = async (productData, companyId) => {
  try {
    // 1. Thêm sản phẩm
    const newProduct = {
      product_name: productData.product_name,
      description: productData.description,
      price: productData.price,
      company_id: companyId,
      image_url: productData.image_path,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    const productRef = await addDoc(collection(db, 'products'), newProduct);

    // 2. Nếu có ảnh, thêm vào product_images
    if (productData.image_path) {
      await addDoc(collection(db, 'product_images'), {
        product_id: productRef.id,
        image_url: productData.image_path,
        is_primary: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
    
    return productRef.id;
  } catch (error) {
    throw new Error('Thêm sản phẩm thất bại: ' + error.message);
  }
};

// Cập nhật sản phẩm và ảnh
export const updateProduct = async (productId, updateData) => {
  try {
    // 1. Cập nhật thông tin sản phẩm
    const productRef = doc(db, 'products', productId);
    const productUpdate = {
      ...updateData,
      image_url: updateData.image_path,
      updated_at: serverTimestamp()
    };
    delete productUpdate.image_path;
    await updateDoc(productRef, productUpdate);

    // 2. Nếu có cập nhật ảnh mới
    if (updateData.image_path) {
      // Tìm ảnh chính cũ
      const imagesQuery = query(
        collection(db, 'product_images'),
        where('product_id', '==', productId),
        where('is_primary', '==', true)
      );
      
      const imagesSnapshot = await getDocs(imagesQuery);
      
      if (imagesSnapshot.empty) {
        // Thêm ảnh mới nếu chưa có
        await addDoc(collection(db, 'product_images'), {
          product_id: productId,
          image_url: updateData.image_path,
          is_primary: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } else {
        // Cập nhật ảnh cũ
        const imageDoc = imagesSnapshot.docs[0];
        await updateDoc(doc(db, 'product_images', imageDoc.id), {
          image_url: updateData.image_path,
          updated_at: serverTimestamp()
        });
      }
    }
  } catch (error) {
    throw new Error('Cập nhật sản phẩm thất bại: ' + error.message);
  }
};

// Xóa sản phẩm và ảnh liên quan
export const deleteProduct = async (productId) => {
  try {
    // 1. Xóa các ảnh liên quan
    const imagesQuery = query(
      collection(db, 'product_images'),
      where('product_id', '==', productId)
    );
    
    const imagesSnapshot = await getDocs(imagesQuery);
    
    const deletePromises = imagesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);

    // 2. Xóa sản phẩm
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    throw new Error('Xóa sản phẩm thất bại: ' + error.message);
  }
};

// Lấy danh sách sản phẩm có phân trang
export const getProductsPaginated = async (companyId, page = 1, pageSize = 10) => {
  try {
    // 1. Lấy sản phẩm có giới hạn
    const productsQuery = query(
      collection(db, 'products'),
      where('company_id', '==', companyId),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );
    
    // Lấy tổng số sản phẩm và sản phẩm trong trang hiện tại
    const [productsSnapshot, totalCount] = await Promise.all([
      getDocs(productsQuery),
      getCollectionCount('products', where('company_id', '==', companyId))
    ]);

    const productIds = productsSnapshot.docs.map(doc => doc.id);
    
    // 2. Lấy ảnh cho các sản phẩm trong trang hiện tại
    const imagesQuery = query(
      collection(db, 'product_images'),
      where('product_id', 'in', productIds),
      where('is_primary', '==', true)
    );
    
    const imagesSnapshot = await getDocs(imagesQuery);
    
    // Tạo map ảnh
    const imageMap = new Map();
    imagesSnapshot.docs.forEach(doc => {
      const imageData = doc.data();
      imageMap.set(imageData.product_id, imageData.image_url);
      
    });
    
    // Map data
    const products = productsSnapshot.docs.map(doc => {
      const productData = doc.data();
      return {
        id: doc.id,
        ...productData,
        image_path: imageMap.get(doc.id) || productData.image_url
      };
    });
    
    return {
      products,
      total: totalCount,
      hasMore: products.length === pageSize,
      currentPage: page
    };
  } catch (error) {
    console.error('Firebase error:', error);
    throw new Error('Lấy danh sách sản phẩm thất bại: ' + error.message);
  }
};

// Helper function để đếm tổng số sản phẩm
const getCollectionCount = async (collectionName, ...conditions) => {
  try {
    const q = query(collection(db, collectionName), ...conditions);
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error counting documents:', error);
    return 0;
  }
};
