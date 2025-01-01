import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { CircularProgress, Box } from '@mui/material';

function PrivateRoute({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const { userData, loading: userLoading } = useUser();

  if (authLoading || userLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isAdminRoute = window.location.pathname.startsWith('/admin');
  if (isAdminRoute && userData?.role !== 'admin') {
    return <Navigate to="/search" replace />;
  }

  return children;
}

export default PrivateRoute; 