// src/App.js
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

import Navbar from './components/Navbar';
import Loading from './components/Loading';
import Home from './pages/Home';
import Inventario from './pages/Inventario';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Ventas from './pages/Ventas';
import Clientes from './pages/Clientes';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { usuarioActual, loading } = useAuth();

  if (loading) {
    return <Loading message="Verificando sesión..." />;
  }

  if (!usuarioActual) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para rutas públicas (solo login)
function PublicRoute({ children }) {
  const { usuarioActual, loading } = useAuth();

  if (loading) {
    return <Loading message="Verificando sesión..." />;
  }

  if (usuarioActual) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading message="Iniciando aplicación..." />;
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <Routes>
          {/* Rutas públicas */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Rutas protegidas */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventario" 
            element={
              <ProtectedRoute>
                <Inventario />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/productos" 
            element={
              <ProtectedRoute>
                <Productos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categorias" 
            element={
              <ProtectedRoute>
                <Categorias />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ventas" 
            element={
              <ProtectedRoute>
                <Ventas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clientes" 
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute>
                <Usuarios />
              </ProtectedRoute>
            } 
          />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;