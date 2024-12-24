import { useEffect, useState } from 'react';
import { checkFirebaseConnection } from './firebase/config';
import ImageUpload from './components/ImageUpload';
import Login from './components/Login';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkFirebaseConnection();
      setIsConnected(connected);
    };
    
    checkConnection();
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="App">
      <div className="connection-status">
        Firebase Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <h1>Quản lý Hình ảnh</h1>
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <button onClick={handleLogout} className="logout-button">
            Đăng xuất
          </button>
          {isConnected ? (
            <ImageUpload />
          ) : (
            <p>Đang kết nối đến Firebase...</p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
