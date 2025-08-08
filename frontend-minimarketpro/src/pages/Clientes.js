import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useAuth } from '../AuthContext';

function Clientes() {
  const { usuarioActual } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem('clientes')) || [];
    setClientes(guardados);
  }, []);

  useEffect(() => {
    if (clientes.length > 0) {
      localStorage.setItem('clientes', JSON.stringify(clientes));
    }
  }, [clientes]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre || !correo || !telefono || !cedula || !direccion) return;

    if (modoEdicion) {
      const actualizados = clientes.map((cli) =>
        cli.id === idEditar
          ? { ...cli, nombre, correo, telefono, cedula, direccion }
          : cli
      );
      setClientes(actualizados);
      setModoEdicion(false);
      setIdEditar(null);
    } else {
      const nuevoCliente = {
        id: Date.now(),
        nombre,
        correo,
        telefono,
        cedula,
        direccion,
      };
      setClientes([...clientes, nuevoCliente]);
    }

    setNombre('');
    setCorreo('');
    setTelefono('');
    setCedula('');
    setDireccion('');
  };

  const handleEditar = (cli) => {
    setNombre(cli.nombre);
    setCorreo(cli.correo);
    setTelefono(cli.telefono);
    setCedula(cli.cedula);
    setDireccion(cli.direccion);
    setModoEdicion(true);
    setIdEditar(cli.id);
  };

  const handleEliminar = (id) => {
    if (window.confirm('¿Eliminar este cliente?')) {
      const nuevos = clientes.filter((cli) => cli.id !== id);
      setClientes(nuevos);
      localStorage.setItem('clientes', JSON.stringify(nuevos));
    }
  };

  const filtrados = clientes.filter((c) =>
    [c.nombre, c.correo, c.telefono, c.cedula, c.direccion]
      .join(' ')
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const puedeEditar = usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'empleado';

  return (
    <div className="container mt-4">
      <h2>Gestión de Clientes</h2>
      <p>Agrega, edita o elimina clientes.</p>

      {puedeEditar && (
        <Form onSubmit={handleSubmit} className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>Nombre</Form.Label>
            <Form.Control value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Correo</Form.Label>
            <Form.Control type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Cédula</Form.Label>
            <Form.Control value={cedula} onChange={(e) => setCedula(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Dirección</Form.Label>
            <Form.Control value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
          </Form.Group>

          <Button type="submit" variant={modoEdicion ? "warning" : "primary"}>
            {modoEdicion ? "Guardar Cambios" : "Agregar Cliente"}
          </Button>
        </Form>
      )}

      <Form.Control
        placeholder="🔍 Buscar por nombre, correo, teléfono, cédula o dirección"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-3"
      />

      {filtrados.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Cédula</th>
              <th>Dirección</th>
              {puedeEditar && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((cli, idx) => (
              <tr key={cli.id}>
                <td>{idx + 1}</td>
                <td>{cli.nombre}</td>
                <td>{cli.correo}</td>
                <td>{cli.telefono}</td>
                <td>{cli.cedula}</td>
                <td>{cli.direccion}</td>
                {puedeEditar && (
                  <td>
                    <Button variant="warning" size="sm" onClick={() => handleEditar(cli)} className="me-2">Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleEliminar(cli.id)}>Eliminar</Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>No hay clientes que coincidan con la búsqueda.</p>
      )}
    </div>
  );
}

export default Clientes;
