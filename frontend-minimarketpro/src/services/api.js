const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

console.log('🔗 API Base URL:', API_BASE_URL);

// Helper para manejar respuestas
const handleResponse = async (response) => {
  console.log('📡 Response status:', response.status);
  console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
  
  let data;
  try {
    data = await response.json();
    console.log('📄 Response data:', data);
  } catch (error) {
    console.error('❌ Error parsing JSON:', error);
    throw new Error('Respuesta inválida del servidor');
  }
  
  if (!response.ok) {
    console.error(`❌ HTTP Error ${response.status}:`, data.message);
    throw new Error(data.message || `Error HTTP ${response.status}`);
  }
  
  return data;
};

// Helper para obtener headers con token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
  
  console.log('📋 Request headers:', { 
    ...headers, 
    Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'No token'
  });
  
  return headers;
};

// AUTENTICACIÓN
export const authAPI = {
  login: async (usuario, contrasena) => {
    const url = `${API_BASE_URL}/auth/login`;
    const body = { usuario, contrasena };
    
    console.log('🔐 Sending login request to:', url);
    console.log('🔐 Request body:', { usuario, contrasena: '***' });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Login request failed:', error);
      throw error;
    }
  },

  verify: async () => {
    const url = `${API_BASE_URL}/auth/verify`;
    console.log('🔍 Verifying token at:', url);
    
    try {
      const response = await fetch(url, {
        headers: getHeaders()
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      throw error;
    }
  },

  logout: async () => {
    const url = `${API_BASE_URL}/auth/logout`;
    console.log('🚪 Logout request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders()
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Logout request failed:', error);
      throw error;
    }
  }
};

// PRODUCTOS
export const productosAPI = {
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    const url = `${API_BASE_URL}/productos${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    console.log('📦 Getting productos from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const url = `${API_BASE_URL}/productos/${id}`;
    console.log('📦 Getting producto by ID:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  create: async (producto) => {
    const url = `${API_BASE_URL}/productos`;
    console.log('➕ Creating producto:', producto);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(producto)
    });
    return handleResponse(response);
  },

  update: async (id, producto) => {
    const url = `${API_BASE_URL}/productos/${id}`;
    console.log('✏️ Updating producto:', id, producto);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(producto)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const url = `${API_BASE_URL}/productos/${id}`;
    console.log('🗑️ Deleting producto:', id);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getStockBajo: async () => {
    const url = `${API_BASE_URL}/productos/alertas/stock-bajo`;
    console.log('⚠️ Getting productos with low stock:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  ajustarStock: async (id, nuevoStock, motivo) => {
    const url = `${API_BASE_URL}/productos/${id}/ajustar-stock`;
    console.log('📊 Adjusting stock for producto:', id, { nuevoStock, motivo });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ nuevo_stock: nuevoStock, motivo })
    });
    return handleResponse(response);
  }
};

// CATEGORÍAS
export const categoriasAPI = {
  getAll: async (activasSolo = true) => {
    const url = `${API_BASE_URL}/categorias?activas_solo=${activasSolo}`;
    console.log('🏷️ Getting categorias from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  create: async (categoria) => {
    const url = `${API_BASE_URL}/categorias`;
    console.log('➕ Creating categoria:', categoria);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(categoria)
    });
    return handleResponse(response);
  },

  update: async (id, categoria) => {
    const url = `${API_BASE_URL}/categorias/${id}`;
    console.log('✏️ Updating categoria:', id, categoria);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(categoria)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const url = `${API_BASE_URL}/categorias/${id}`;
    console.log('🗑️ Deleting categoria:', id);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// CLIENTES
export const clientesAPI = {
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    const url = `${API_BASE_URL}/clientes${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    console.log('👥 Getting clientes from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const url = `${API_BASE_URL}/clientes/${id}`;
    console.log('👤 Getting cliente by ID:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  create: async (cliente) => {
    const url = `${API_BASE_URL}/clientes`;
    console.log('➕ Creating cliente:', cliente);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cliente)
    });
    return handleResponse(response);
  },

  update: async (id, cliente) => {
    const url = `${API_BASE_URL}/clientes/${id}`;
    console.log('✏️ Updating cliente:', id, cliente);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(cliente)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const url = `${API_BASE_URL}/clientes/${id}`;
    console.log('🗑️ Deleting cliente:', id);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// VENTAS
export const ventasAPI = {
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    const url = `${API_BASE_URL}/ventas${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    console.log('🛒 Getting ventas from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const url = `${API_BASE_URL}/ventas/${id}`;
    console.log('🛒 Getting venta by ID:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  create: async (venta) => {
    const url = `${API_BASE_URL}/ventas`;
    console.log('➕ Creating venta:', venta);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(venta)
    });
    return handleResponse(response);
  },

  getEstadisticas: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    const url = `${API_BASE_URL}/ventas/estadisticas/resumen${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    console.log('📊 Getting estadisticas from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// USUARIOS
export const usuariosAPI = {
  getAll: async () => {
    const url = `${API_BASE_URL}/usuarios`;
    console.log('👥 Getting usuarios from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const url = `${API_BASE_URL}/usuarios/${id}`;
    console.log('👤 Getting usuario by ID:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  create: async (usuario) => {
    const url = `${API_BASE_URL}/usuarios`;
    console.log('➕ Creating usuario:', { ...usuario, contrasena: '***' });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(usuario)
    });
    return handleResponse(response);
  },

  update: async (id, usuario) => {
    const url = `${API_BASE_URL}/usuarios/${id}`;
    console.log('✏️ Updating usuario:', id, { ...usuario, contrasena: usuario.contrasena ? '***' : undefined });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(usuario)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const url = `${API_BASE_URL}/usuarios/${id}`;
    console.log('🗑️ Deleting usuario:', id);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// INVENTARIO (endpoints adicionales)
export const inventarioAPI = {
  getMovimientos: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    const url = `${API_BASE_URL}/inventario/movimientos${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    console.log('📊 Getting movimientos from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getAlertas: async () => {
    const url = `${API_BASE_URL}/inventario/alertas`;
    console.log('⚠️ Getting alertas from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getValorTotal: async () => {
    const url = `${API_BASE_URL}/inventario/valor-total`;
    console.log('💰 Getting valor total from:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// REPORTES (endpoints adicionales)
export const reportesAPI = {
  getVentasPorFecha: async (fechaInicio, fechaFin) => {
    const url = `${API_BASE_URL}/reportes/ventas-por-fecha?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    console.log('📈 Getting reporte ventas:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getProductosMasVendidos: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE_URL}/reportes/productos-mas-vendidos?${searchParams}`;
    console.log('🏆 Getting productos más vendidos:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getClientesFrecuentes: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE_URL}/reportes/clientes-frecuentes?${searchParams}`;
    console.log('👑 Getting clientes frecuentes:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// UTILIDADES
export const utilidadesAPI = {
  // Health check
  health: async () => {
    const url = `${API_BASE_URL}/health`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Backup de datos
  backup: async () => {
    const url = `${API_BASE_URL}/backup`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Restaurar datos
  restore: async (backupData) => {
    const url = `${API_BASE_URL}/restore`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(backupData)
    });
    return handleResponse(response);
  }
};

// Exportar todas las APIs
export default {
  auth: authAPI,
  productos: productosAPI,
  categorias: categoriasAPI,
  clientes: clientesAPI,
  ventas: ventasAPI,
  usuarios: usuariosAPI,
  inventario: inventarioAPI,
  reportes: reportesAPI,
  utilidades: utilidadesAPI
};