import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Alert, Spinner, Modal, Row, Col, Card, Badge } from 'react-bootstrap';
import { useAuth } from '../AuthContext';
import { clientesAPI } from '../services/api';

function Clientes() {
  const { usuarioActual } = useAuth();

  // Estados principales
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alerta, setAlerta] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    cedula: '',
    direccion: ''
  });

  // Estados de control
  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteEditarId, setClienteEditarId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);

  // Permisos del usuario
  const puedeEditar = usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'empleado';
  const puedeEliminar = usuarioActual?.rol === 'admin';

  // Cargar clientes
  const cargarClientes = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (busqueda.trim()) {
        params.busqueda = busqueda.trim();
      }
      
      params.activos_solo = 'true';
      
      const response = await clientesAPI.getAll(params);
      setClientes(response.data || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setAlerta(`❌ Error cargando clientes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    cargarClientes();
  }, []);

  // Busqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        cargarClientes();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Funciones del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      correo: '',
      telefono: '',
      cedula: '',
      direccion: ''
    });
    setModoEdicion(false);
    setClienteEditarId(null);
  };

  const validarFormulario = () => {
    const errores = [];
    
    if (!formData.nombre.trim()) {
      errores.push('El nombre es obligatorio');
    }
    
    if (!formData.cedula.trim()) {
      errores.push('La cédula es obligatoria');
    }
    
    if (formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      errores.push('El correo electrónico no es válido');
    }
    
    if (formData.telefono && !/^[\d\s\-\+\(\)]+$/.test(formData.telefono)) {
      errores.push('El teléfono solo puede contener números, espacios y símbolos básicos');
    }
    
    return errores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errores = validarFormulario();
    if (errores.length > 0) {
      setAlerta(`❌ ${errores.join(', ')}`);
      return;
    }

    setSubmitting(true);
    setAlerta('');

    try {
      const clienteData = {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim() || null,
        telefono: formData.telefono.trim() || null,
        cedula: formData.cedula.trim(),
        direccion: formData.direccion.trim() || null,
      };

      if (modoEdicion) {
        await clientesAPI.update(clienteEditarId, clienteData);
        setAlerta('✅ Cliente actualizado exitosamente');
      } else {
        await clientesAPI.create(clienteData);
        setAlerta('✅ Cliente creado exitosamente');
      }

      limpiarFormulario();
      await cargarClientes();
    } catch (error) {
      console.error('Error en formulario:', error);
      setAlerta(`❌ Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }

    setTimeout(() => setAlerta(''), 4000);
  };

  const handleEditar = (cliente) => {
    setFormData({
      nombre: cliente.nombre || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      cedula: cliente.cedula || '',
      direccion: cliente.direccion || ''
    });
    setModoEdicion(true);
    setClienteEditarId(cliente.id);
    
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (cliente) => {
    if (!window.confirm(`¿Estás seguro de eliminar al cliente "${cliente.nombre}"?`)) {
      return;
    }

    try {
      await clientesAPI.delete(cliente.id);
      setAlerta('✅ Cliente eliminado exitosamente');
      await cargarClientes();
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      setAlerta(`❌ Error eliminando cliente: ${error.message}`);
    }

    setTimeout(() => setAlerta(''), 3000);
  };

  const handleVerDetalle = async (cliente) => {
    setClienteDetalle(cliente);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setClienteDetalle(null);
  };

  const cancelarEdicion = () => {
    limpiarFormulario();
    setAlerta('');
  };

  // Filtrado local adicional para mejor UX
  const clientesFiltrados = clientes.filter(cliente => {
    if (!busqueda.trim()) return true;
    
    const searchTerm = busqueda.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(searchTerm) ||
      cliente.correo?.toLowerCase().includes(searchTerm) ||
      cliente.telefono?.toLowerCase().includes(searchTerm) ||
      cliente.cedula?.toLowerCase().includes(searchTerm) ||
      cliente.direccion?.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <Row className="mb-4">
        <Col>
          <h2>
            Gestión de Clientes 
            <Badge bg="secondary" className="ms-2">{clientes.length}</Badge>
          </h2>
          <p className="text-muted">
            {puedeEditar ? 'Agrega, edita o consulta' : 'Consulta'} la información de los clientes.
          </p>
        </Col>
      </Row>

      {alerta && (
        <Alert 
          variant={alerta.startsWith('✅') ? 'success' : 'danger'}
          dismissible
          onClose={() => setAlerta('')}
        >
          {alerta}
        </Alert>
      )}

      {/* Formulario para agregar/editar clientes */}
      {puedeEditar && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              {modoEdicion ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre Completo *</Form.Label>
                    <Form.Control 
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required 
                      disabled={submitting}
                      placeholder="Ej: Juan Pérez González"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cédula/RUC *</Form.Label>
                    <Form.Control 
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleChange}
                      required 
                      disabled={submitting}
                      placeholder="Ej: 1234567890"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Correo Electrónico</Form.Label>
                    <Form.Control 
                      type="email" 
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      disabled={submitting}
                      placeholder="Ej: juan.perez@email.com"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control 
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      disabled={submitting}
                      placeholder="Ej: 0999123456"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <Form.Control 
                  as="textarea"
                  rows={2}
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Ej: Av. Principal 123, entre Calles A y B"
                />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button 
                  type="submit" 
                  variant={modoEdicion ? "warning" : "primary"}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {modoEdicion ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    modoEdicion ? "💾 Guardar Cambios" : "➕ Agregar Cliente"
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="secondary" 
                  onClick={limpiarFormulario}
                  disabled={submitting}
                >
                  🗑️ Limpiar
                </Button>

                {modoEdicion && (
                  <Button 
                    type="button"
                    variant="outline-danger" 
                    onClick={cancelarEdicion}
                    disabled={submitting}
                  >
                    ❌ Cancelar
                  </Button>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Barra de búsqueda */}
      <Card className="mb-3">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <Form.Control
                type="text"
                placeholder="🔍 Buscar por nombre, cédula, correo, teléfono o dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={loading}
              />
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => setBusqueda('')}
                disabled={!busqueda || loading}
              >
                🗑️ Limpiar búsqueda
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <Card.Header>
          <h6 className="mb-0">
            📋 Lista de Clientes 
            {busqueda && (
              <small className="text-muted ms-2">
                ({clientesFiltrados.length} de {clientes.length} clientes)
              </small>
            )}
          </h6>
        </Card.Header>
        <Card.Body className="p-0">
          {clientesFiltrados.length > 0 ? (
            <Table striped hover responsive className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente, idx) => (
                  <tr key={cliente.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{cliente.nombre}</strong>
                    </td>
                    <td>
                      <code>{cliente.cedula}</code>
                    </td>
                    <td>
                      {cliente.correo ? (
                        <a href={`mailto:${cliente.correo}`} className="text-decoration-none">
                          {cliente.correo}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {cliente.telefono ? (
                        <a href={`tel:${cliente.telefono}`} className="text-decoration-none">
                          {cliente.telefono}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {cliente.direccion ? (
                        <span className="text-truncate d-inline-block" style={{maxWidth: '200px'}}>
                          {cliente.direccion}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleVerDetalle(cliente)}
                          title="Ver detalles"
                        >
                          👁️
                        </Button>
                        
                        {puedeEditar && (
                          <Button 
                            variant="warning" 
                            size="sm" 
                            onClick={() => handleEditar(cliente)}
                            disabled={submitting}
                            title="Editar cliente"
                          >
                            ✏️
                          </Button>
                        )}
                        
                        {puedeEliminar && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleEliminar(cliente)}
                            disabled={submitting}
                            title="Eliminar cliente"
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                {busqueda ? (
                  <>
                    <i className="bi bi-search fs-1 text-muted"></i>
                    <h5 className="mt-2">No se encontraron clientes</h5>
                    <p className="text-muted">
                      No hay clientes que coincidan con "{busqueda}"
                    </p>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setBusqueda('')}
                    >
                      🗑️ Limpiar búsqueda
                    </Button>
                  </>
                ) : (
                  <>
                    <i className="bi bi-people fs-1 text-muted"></i>
                    <h5 className="mt-2">No hay clientes registrados</h5>
                    <p className="text-muted">
                      {puedeEditar ? 'Comienza agregando tu primer cliente usando el formulario de arriba.' : 'Aún no se han registrado clientes en el sistema.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de detalles del cliente */}
      <Modal show={mostrarModal} onHide={cerrarModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            👤 Detalles del Cliente
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {clienteDetalle && (
            <Row>
              <Col md={6}>
                <h6>Información Personal</h6>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Nombre:</strong></td>
                      <td>{clienteDetalle.nombre}</td>
                    </tr>
                    <tr>
                      <td><strong>Cédula:</strong></td>
                      <td><code>{clienteDetalle.cedula}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Correo:</strong></td>
                      <td>
                        {clienteDetalle.correo ? (
                          <a href={`mailto:${clienteDetalle.correo}`}>
                            {clienteDetalle.correo}
                          </a>
                        ) : (
                          <span className="text-muted">No registrado</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Teléfono:</strong></td>
                      <td>
                        {clienteDetalle.telefono ? (
                          <a href={`tel:${clienteDetalle.telefono}`}>
                            {clienteDetalle.telefono}
                          </a>
                        ) : (
                          <span className="text-muted">No registrado</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6>Información Adicional</h6>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Dirección:</strong></td>
                      <td>
                        {clienteDetalle.direccion || (
                          <span className="text-muted">No registrada</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Fecha de registro:</strong></td>
                      <td>
                        {clienteDetalle.fecha_creacion ? 
                          new Date(clienteDetalle.fecha_creacion).toLocaleDateString() : 
                          <span className="text-muted">No disponible</span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Estado:</strong></td>
                      <td>
                        <Badge bg={clienteDetalle.activo ? 'success' : 'danger'}>
                          {clienteDetalle.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {puedeEditar && clienteDetalle && (
            <Button 
              variant="warning" 
              onClick={() => {
                cerrarModal();
                handleEditar(clienteDetalle);
              }}
            >
              ✏️ Editar Cliente
            </Button>
          )}
          <Button variant="secondary" onClick={cerrarModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Información de ayuda */}
      <Card className="mt-4 bg-light">
        <Card.Body>
          <h6>💡 Información sobre la gestión de clientes:</h6>
          <Row>
            <Col md={4}>
              <small>
                <strong>🔍 Búsqueda:</strong> Puedes buscar por cualquier campo del cliente (nombre, cédula, correo, etc.)
              </small>
            </Col>
            <Col md={4}>
              <small>
                <strong>📝 Campos obligatorios:</strong> Solo el nombre y la cédula son requeridos
              </small>
            </Col>
            <Col md={4}>
              <small>
                <strong>👁️ Detalles:</strong> Haz clic en el ícono de ojo para ver toda la información del cliente
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Clientes;