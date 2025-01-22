import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';
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
          
          {/* Routes được bảo vệ */}
          <Route 
            path="/search" 
            element={
              <PrivateRoute>
                <ImageSearch />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/products" 
            element={
              <PrivateRoute>
                <ProductManagement />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <PrivateRoute>
                <UserManagement />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
