// src/App.js
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Inventario from './pages/Inventario';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Ventas from './pages/Ventas';
import Clientes from './pages/Clientes';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <div className="container mt-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
