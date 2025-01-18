import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ImageSearch from './components/ImageSearch';
import ProductManagement from './components/admin/ProductManagement';
import UserManagement from './components/admin/UserManagement';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search" element={<ImageSearch />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}


export default App;
