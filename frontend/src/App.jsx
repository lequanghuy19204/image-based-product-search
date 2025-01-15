import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './components/Login';
import ImageSearch from './components/ImageSearch';
import ProductManagement from './components/admin/ProductManagement';
import UserManagement from './components/admin/UserManagement';
// import InitializeData from './components/common/InitializeData';
import './App.css';
// import './styles/responsive.css';
import { UserProvider } from './contexts/UserContext';
import ProductList from './components/user/ProductList';

function App() {
  return (
    <UserProvider>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/search" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/search" element={
                <PrivateRoute>
                  <ImageSearch />
                </PrivateRoute>
              } />
              <Route path="/products" element={
                <PrivateRoute>
                  <ProductList />
                </PrivateRoute>
              } />
              <Route path="/admin/products" element={
                <PrivateRoute>
                  <ProductManagement />
                </PrivateRoute>
              } />
              <Route path="/admin/users" element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              } />
              {/* <Route path="/initialize" element={<InitializeData />} /> */}
              <Route path="*" element={<Navigate to="/search" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </UserProvider>
  );
}

export default App;
