import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import Login from './components/Login';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="App">
      <h1>Quản lý Hình ảnh</h1>
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <button onClick={handleLogout} className="logout-button">
            Đăng xuất
          </button>
          <ImageUpload token={token} />
        </>
      )}
    </div>
  );
}

export default App;
