import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import PropTypes from 'prop-types';

function AdminRoute({ children }) {
  const user = authService.getCurrentUser();
  // Kiểm tra cả user và role
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/search" replace />;
  }
  
  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default AdminRoute; 