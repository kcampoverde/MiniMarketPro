
import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { usuariosAPI } from '../services/api';

function Usuarios() {
  const { usuarioActual } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [nuevoRol, setNuevoRol] = useState('empleado');
  const [busqueda, setBusqueda] = useState('');
  const [modoEditar, setModoEditar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  
  // Estados para manejo de UI
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // ✅ CARGAR USUARIOS DEL BACKEND
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError(null);
      console.log('📋 Cargando usuarios desde backend...');
      
      const response = await usuariosAPI.getAll();
      setUsuarios(response.data || []);
      console.log('✅ Usuarios cargados:', response.data);
      
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setError(`Error cargando usuarios: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ✅ CREAR USUARIO EN BACKEND
  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario || !nuevaContrasena || !nuevoRol) return;

    try {
      setProcesando(true);
      setError(null);
      
      console.log('➕ Creando usuario:', { 
        usuario: nuevoUsuario, 
        rol: nuevoRol 
      });

      const nuevoUsuarioData = {
        usuario: nuevoUsuario,
        contrasena: nuevaContrasena,
        rol: nuevoRol
      };

      await usuariosAPI.create(nuevoUsuarioData);
      
      // Recargar lista de usuarios
      await cargarUsuarios();
      
      // Limpiar formulario
      setNuevoUsuario('');
      setNuevaContrasena('');
      setNuevoRol('empleado');
      
      console.log('✅ Usuario creado exitosamente');

    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      setError(`Error creando usuario: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  // ✅ ELIMINAR USUARIO EN BACKEND
  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar el usuario "${usuario.usuario}"?`)) {
      return;
    }

    try {
      setProcesando(true);
      setError(null);
      
      console.log('🗑️ Eliminando usuario:', usuario.id);
      
      await usuariosAPI.delete(usuario.id);
      
      // Recargar lista de usuarios
      await cargarUsuarios();
      
      console.log('✅ Usuario eliminado exitosamente');

    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      setError(`Error eliminando usuario: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando({
      ...usuario,
      contrasena: '' // No mostrar contraseña actual
    });
    setModoEditar(true);
  };

  // ✅ ACTUALIZAR USUARIO EN BACKEND
  const guardarCambios = async () => {
    if (!usuarioEditando) return;

    try {
      setProcesando(true);
      setError(null);
      
      console.log('✏️ Actualizando usuario:', usuarioEditando.id);

      const datosActualizacion = {
        rol: usuarioEditando.rol
      };

      // Solo incluir contraseña si se especificó una nueva
      if (usuarioEditando.contrasena && usuarioEditando.contrasena.trim()) {
        datosActualizacion.contrasena = usuarioEditando.contrasena;
      }

      await usuariosAPI.update(usuarioEditando.id, datosActualizacion);
      
      // Recargar lista de usuarios
      await cargarUsuarios();
      
      setModoEditar(false);
      setUsuarioEditando(null);
      
      console.log('✅ Usuario actualizado exitosamente');

    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      setError(`Error actualizando usuario: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  // Verificar permisos
  if (!usuarioActual || usuarioActual.rol !== 'admin') {
    navigate('/');
    return null;
  }

  // Filtrar usuarios
  const filtrados = usuarios.filter((u) =>
    `${u.usuario} ${u.rol}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container mt-4">
      <h2>Gestión de Usuarios</h2>
      <p>Solo el administrador puede crear, editar o eliminar usuarios.</p>

      {/* Mostrar errores */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Formulario para agregar nuevo usuario */}
      <Form onSubmit={handleAgregar} className="mb-4">
        <Form.Group className="mb-2">
          <Form.Label>Nombre de usuario</Form.Label>
          <Form.Control 
            value={nuevoUsuario} 
            onChange={(e) => setNuevoUsuario(e.target.value)} 
            disabled={procesando}
            required 
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control 
            type="password" 
            value={nuevaContrasena} 
            onChange={(e) => setNuevaContrasena(e.target.value)} 
            disabled={procesando}
            required 
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Rol</Form.Label>
          <Form.Select 
            value={nuevoRol} 
            onChange={(e) => setNuevoRol(e.target.value)} 
            disabled={procesando}
            required
          >
            <option value="admin">Admin</option>
            <option value="empleado">Empleado</option>
            <option value="visitante">Visitante</option>
          </Form.Select>
        </Form.Group>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={procesando || !nuevoUsuario || !nuevaContrasena}
        >
          {procesando ? <Spinner size="sm" /> : 'Agregar Usuario'}
        </Button>
      </Form>

      {/* Buscador */}
      <Form.Control
        placeholder="🔍 Buscar usuario por nombre o rol"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-3"
        disabled={cargando}
      />

      {/* Mostrar spinner mientras carga */}
      {cargando ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando usuarios...</span>
          </Spinner>
        </div>
      ) : (
        /* Tabla de usuarios */
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  {busqueda ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </td>
              </tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.usuario}</td>
                  <td>
                    <span className={`badge ${u.rol === 'admin' ? 'bg-danger' : u.rol === 'empleado' ? 'bg-primary' : 'bg-secondary'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'bg-success' : 'bg-secondary'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{new Date(u.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <Button 
                      variant="warning" 
                      size="sm" 
                      className="me-2" 
                      onClick={() => abrirModalEditar(u)}
                      disabled={procesando}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleEliminar(u)}
                      disabled={procesando || u.id === usuarioActual.id}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {/* Modal de edición */}
      <Modal show={modoEditar} onHide={() => setModoEditar(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Nombre de usuario</Form.Label>
            <Form.Control value={usuarioEditando?.usuario || ''} readOnly />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Nueva Contraseña (dejar vacío para no cambiar)</Form.Label>
            <Form.Control
              type="password"
              value={usuarioEditando?.contrasena || ''}
              onChange={(e) => setUsuarioEditando({ ...usuarioEditando, contrasena: e.target.value })}
              placeholder="Dejar vacío para mantener contraseña actual"
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              value={usuarioEditando?.rol || ''}
              onChange={(e) => setUsuarioEditando({ ...usuarioEditando, rol: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="empleado">Empleado</option>
              <option value="visitante">Visitante</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModoEditar(false)} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardarCambios} disabled={procesando}>
            {procesando ? <Spinner size="sm" /> : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Usuarios;