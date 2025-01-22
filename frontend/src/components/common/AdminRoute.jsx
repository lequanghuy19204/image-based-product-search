import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

function AdminRoute({ children }) {
  const user = authService.getCurrentUser();
  const isAdmin = user && user.role === 'Admin';
  
  if (!isAdmin) {
    // Chuyển hướng về trang chính nếu không phải admin
    return <Navigate to="/search" replace />;
  }
  
  return children;
}

export default AdminRoute; 