import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import PropTypes from 'prop-types';

function AdminRoute({ children }) {
  const user = authService.getCurrentUser();
  const isAdmin = user && user.role === 'Admin';
  
  if (!isAdmin) {
    // Chuyển hướng về trang chính nếu không phải admin
    return <Navigate to="/search" replace />;
  }
  
  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default AdminRoute; 