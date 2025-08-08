// src/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);

  // ✅ Cargar usuario desde localStorage al iniciar la app
  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioActual'));
    if (usuarioGuardado) {
      setUsuarioActual(usuarioGuardado);
    }
  }, []);

  // ✅ Crear usuarios por defecto si no existen
  useEffect(() => {
    const usuariosExistentes = JSON.parse(localStorage.getItem('usuarios')) || [];

    if (usuariosExistentes.length === 0) {
      const usuariosIniciales = [
        {
          usuario: 'admin',
          contrasena: 'admin123',
          rol: 'admin',
        },
        {
          usuario: 'kenny',
          contrasena: 'kenny123',
          rol: 'empleado',
        },
        {
          usuario: 'ricardo',
          contrasena: 'ricardo123',
          rol: 'empleado',
        },
      ];

      localStorage.setItem('usuarios', JSON.stringify(usuariosIniciales));
      console.log('✅ Usuarios iniciales creados en localStorage');
    }
  }, []);

  // ✅ Login: buscar usuario y guardar sesión
  const login = (usuario, contrasena) => {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    const encontrado = usuarios.find(
      (u) => u.usuario === usuario && u.contrasena === contrasena
    );

    if (encontrado) {
      setUsuarioActual(encontrado);
      localStorage.setItem('usuarioActual', JSON.stringify(encontrado));
      return true;
    } else {
      return false;
    }
  };

  // ✅ Logout: eliminar sesión
  const logout = () => {
    setUsuarioActual(null);
    localStorage.removeItem('usuarioActual');
  };

  return (
    <AuthContext.Provider value={{ usuarioActual, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
