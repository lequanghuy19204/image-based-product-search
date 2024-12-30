import { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { checkFirebaseConnection } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

function InitializeData() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleCheckConnection = async () => {
    setLoading(true);
    try {
      const isConnected = await checkFirebaseConnection();
      setStatus({
        success: isConnected,
        message: isConnected 
          ? 'Kết nối Firebase thành công!' 
          : 'Không thể kết nối đến Firebase.'
      });
    } catch (error) {
      setStatus({
        success: false,
        message: `Lỗi kiểm tra kết nối: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (email, password) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setStatus({
        success: true,
        message: 'User created successfully!'
      });
    } catch (error) {
      setStatus({
        success: false,
        message: `Error creating user: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 3
    }}>
      <Typography variant="h4" gutterBottom>
        Kiểm tra Kết nối Firebase
      </Typography>

      <Button
        variant="contained"
        onClick={handleCheckConnection}
        disabled={loading}
        sx={{ my: 2 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Kiểm tra Kết nối'
        )}
      </Button>

      <Button
        variant="contained"
        onClick={() => handleCreateUser('newuser@example.com', 'userpassword')}
        disabled={loading}
        sx={{ my: 2 }}
      >
        Tạo Người Dùng
      </Button>

      {status && (
        <Alert severity={status.success ? 'success' : 'error'} sx={{ mt: 2 }}>
          {status.message}
        </Alert>
      )}
    </Box>
  );
}

export default InitializeData;