import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import PropTypes from 'prop-types';

function PrivateRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Chuyển hướng về trang login nếu chưa đăng nhập
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default PrivateRoute; 