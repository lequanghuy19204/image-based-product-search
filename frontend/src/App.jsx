import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ImageSearch from './components/ImageSearch';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/search" element={<ImageSearch />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
