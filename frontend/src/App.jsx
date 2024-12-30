import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ImageSearch from './components/ImageSearch';
import ProductManagement from './components/admin/ProductManagement';
import UserManagement from './components/admin/UserManagement';
// import InitializeData from './components/common/InitializeData';
import './App.css';
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/search" element={<ImageSearch />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            {/* <Route path="/initialize" element={<InitializeData />} /> */}
          </Routes>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
