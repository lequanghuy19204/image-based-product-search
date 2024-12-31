import { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      const userDataFromDB = userDoc.data();
      
      if (userDataFromDB.status === 'blocked') {
        await auth.signOut();
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }

      // Đảm bảo company_id tồn tại trước khi truy vấn
      let companyData = null;
      if (userDataFromDB.company_id) {
        const companyDoc = await getDoc(doc(db, 'companies', userDataFromDB.company_id));
        companyData = companyDoc.exists() ? companyDoc.data() : null;
      }

      return {
        ...userDataFromDB,
        userId: user.uid,
        username: userDataFromDB.username || 'Không có tên',
        email: userDataFromDB.email || 'Không có email',
        role: userDataFromDB.role || 'user',
        status: userDataFromDB.status || 'active',
        company_id: userDataFromDB.company_id,
        companyName: companyData?.company_name || 'Không có tên công ty',
        companyCode: companyData?.company_code || 'Không có mã công ty',
        avatar: userDataFromDB.avatar || null,
        created_at: userDataFromDB.created_at,
        updated_at: userDataFromDB.updated_at
      };
    } catch (error) {
      console.error('Lỗi khi tải thông tin user:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          const userData = await loadUserData(user);
          setUserData(userData);
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Lỗi xác thực:', error);
        setUserData(null);
        alert(error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userData, loading, setUserData, loadUserData }}>
      {children}
    </UserContext.Provider>
  );
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useUser = () => useContext(UserContext); 