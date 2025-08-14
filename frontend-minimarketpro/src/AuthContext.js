// src/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Verificar token al iniciar la app
  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          console.log('🔍 Verificando token existente...');
          const response = await authAPI.verify();
          console.log('✅ Token válido:', response.data.usuario);
          setUsuarioActual(response.data.usuario);
        } catch (error) {
          console.log('❌ Token inválido:', error.message);
          // Token inválido, limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('usuarioActual');
        }
      } else {
        console.log('ℹ️ No hay token guardado');
      }
      
      setLoading(false);
    };

    verificarToken();
  }, []);

  // ✅ Login con API y debug detallado
  const login = async (usuario, contrasena) => {
    try {
      console.log('🔐 Intentando login:', { usuario, contrasena: '***' });
      
      const response = await authAPI.login(usuario, contrasena);
      console.log('📡 Respuesta del servidor:', response);
      
      if (response.success) {
        const { token, usuario: userData } = response.data;
        
        console.log('✅ Login exitoso:', { userData, token: token.substring(0, 20) + '...' });
        
        // Guardar token y datos del usuario
        localStorage.setItem('token', token);
        localStorage.setItem('usuarioActual', JSON.stringify(userData));
        setUsuarioActual(userData);
        
        return true;
      } else {
        console.log('❌ Login fallido - respuesta no exitosa:', response);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Mostrar detalles del error para debug
      if (error.message.includes('fetch')) {
        console.error('🌐 Error de red - verificar que el backend esté ejecutándose');
      } else if (error.message.includes('401')) {
        console.error('🔑 Credenciales incorrectas');
      } else if (error.message.includes('500')) {
        console.error('💥 Error interno del servidor');
      }
      
      return false;
    }
  };

  // ✅ Logout con API
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await authAPI.logout();
    } catch (error) {
      console.error('❌ Error en logout:', error.message);
    } finally {
      // Limpiar datos locales siempre
      console.log('🧹 Limpiando datos locales');
      setUsuarioActual(null);
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioActual');
    }
  };

  const value = {
    usuarioActual,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}