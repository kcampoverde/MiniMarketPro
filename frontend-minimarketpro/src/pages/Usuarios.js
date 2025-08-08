// src/pages/Usuarios.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal } from 'react-bootstrap';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem('usuarios')) || [];
    setUsuarios(guardados);
  }, []);

  useEffect(() => {
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  const handleAgregar = (e) => {
    e.preventDefault();
    if (!nuevoUsuario || !nuevaContrasena || !nuevoRol) return;

    const yaExiste = usuarios.some(u => u.usuario === nuevoUsuario);
    if (yaExiste) {
      alert('❌ El nombre de usuario ya está en uso');
      return;
    }

    const nuevo = {
      usuario: nuevoUsuario,
      contrasena: nuevaContrasena,
      rol: nuevoRol,
    };

    setUsuarios([...usuarios, nuevo]);
    setNuevoUsuario('');
    setNuevaContrasena('');
    setNuevoRol('empleado');
  };

  const handleEliminar = (nombre) => {
    if (window.confirm(`¿Eliminar el usuario "${nombre}"?`)) {
      const nuevos = usuarios.filter(u => u.usuario !== nombre);
      setUsuarios(nuevos);
    }
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setModoEditar(true);
  };

  const guardarCambios = () => {
    const actualizados = usuarios.map(u =>
      u.usuario === usuarioEditando.usuario ? usuarioEditando : u
    );
    setUsuarios(actualizados);
    setModoEditar(false);
  };

  if (!usuarioActual || usuarioActual.rol !== 'admin') {
    navigate('/');
    return null;
  }

  const filtrados = usuarios.filter((u) =>
    `${u.usuario} ${u.rol}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container mt-4">
      <h2>Gestión de Usuarios</h2>
      <p>Solo el administrador puede crear, editar o eliminar usuarios.</p>

      {/* Formulario para agregar nuevo usuario */}
      <Form onSubmit={handleAgregar} className="mb-4">
        <Form.Group className="mb-2">
          <Form.Label>Nombre de usuario</Form.Label>
          <Form.Control value={nuevoUsuario} onChange={(e) => setNuevoUsuario(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control type="password" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Rol</Form.Label>
          <Form.Select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} required>
            <option value="admin">Admin</option>
            <option value="empleado">Empleado</option>
            <option value="visitante">Visitante</option>
          </Form.Select>
        </Form.Group>
        <Button type="submit" variant="primary">Agregar Usuario</Button>
      </Form>

      {/* Buscador */}
      <Form.Control
        placeholder="🔍 Buscar usuario por nombre o rol"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-3"
      />

      {/* Tabla de usuarios */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((u, idx) => (
            <tr key={u.usuario}>
              <td>{idx + 1}</td>
              <td>{u.usuario}</td>
              <td>{u.rol}</td>
              <td>
                <Button variant="warning" size="sm" className="me-2" onClick={() => abrirModalEditar(u)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => handleEliminar(u.usuario)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

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
            <Form.Label>Nueva Contraseña</Form.Label>
            <Form.Control
              type="password"
              value={usuarioEditando?.contrasena || ''}
              onChange={(e) => setUsuarioEditando({ ...usuarioEditando, contrasena: e.target.value })}
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
          <Button variant="secondary" onClick={() => setModoEditar(false)}>Cancelar</Button>
          <Button variant="primary" onClick={guardarCambios}>Guardar Cambios</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Usuarios;
