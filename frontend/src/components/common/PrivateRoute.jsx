import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

function PrivateRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Chuyển hướng về trang login nếu chưa đăng nhập
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default PrivateRoute; 