import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Table, Card, Alert, Spinner, Modal, Badge, InputGroup } from "react-bootstrap";
import { productosAPI, clientesAPI, ventasAPI } from '../services/api';
import { useAuth } from '../AuthContext';

// Money helpers (centavos para precisión)
const toCents = (v) => Math.round(Number(v) * 100);
const fromCents = (c) => (c / 100);

export default function Ventas() {
  const { usuarioActual } = useAuth();
  
  // Estados principales
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alerta, setAlerta] = useState("");

  // Estados del formulario de venta
  const [cliente, setCliente] = useState({ nombre: "", cedula: "" });
  const [seleccionProd, setSeleccionProd] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);

  // Estados de control
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // Permisos
  const puedeVender = usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'empleado';

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productosRes, clientesRes, ventasRes] = await Promise.all([
        productosAPI.getAll({ activos_solo: 'true' }),
        clientesAPI.getAll({ activos_solo: 'true' }),
        ventasAPI.getAll({ limit: 20, offset: 0 })
      ]);
      
      setProductos(productosRes.data || []);
      setClientes(clientesRes.data || []);
      setVentas(ventasRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setAlerta(`❌ Error cargando datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mapa de productos para búsqueda rápida
  const productosMap = useMemo(() => {
    const m = new Map();
    for (const p of productos) m.set(String(p.id), p);
    return m;
  }, [productos]);

  // Productos filtrados para el selector
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return productos;
    
    const search = busquedaProducto.toLowerCase();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(search) ||
      p.id.toString().toLowerCase().includes(search) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search))
    );
  }, [productos, busquedaProducto]);

  // Funciones del carrito
  const agregarAlCarrito = () => {
    if (!seleccionProd) {
      setAlerta("❌ Selecciona un producto.");
      return;
    }
    
    const p = productosMap.get(String(seleccionProd));
    if (!p) {
      setAlerta("❌ Producto no encontrado.");
      return;
    }
    
    const qty = parseInt(cantidad, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      setAlerta("❌ Cantidad inválida.");
      return;
    }
    
    // Verificar stock disponible
    const yaEnCarrito = carrito.find((x) => String(x.id) === String(p.id))?.cantidad || 0;
    if (qty + yaEnCarrito > Number(p.stock)) {
      setAlerta(`❌ Stock insuficiente. Disponible: ${p.stock}, en carrito: ${yaEnCarrito}`);
      return;
    }

    setCarrito((prev) => {
      const idx = prev.findIndex((x) => String(x.id) === String(p.id));
      if (idx >= 0) {
        const nuevo = [...prev];
        nuevo[idx] = { ...nuevo[idx], cantidad: nuevo[idx].cantidad + qty };
        return nuevo;
      }
      return [...prev, { 
        id: p.id, 
        nombre: p.nombre, 
        precio: Number(p.precio), 
        cantidad: qty,
        stock_disponible: Number(p.stock)
      }];
    });
    
    setAlerta("");
    setCantidad(1);
    setSeleccionProd("");
    setBusquedaProducto("");
  };

  const cambiarCantidad = (id, nueva) => {
    const qty = parseInt(nueva, 10);
    if (!Number.isInteger(qty) || qty <= 0) return;
    
    const p = productosMap.get(String(id));
    if (!p) return;
    
    if (qty > Number(p.stock)) {
      setAlerta(`❌ Stock insuficiente. Máximo disponible: ${p.stock}`);
      return;
    }
    
    setCarrito((prev) => prev.map((x) => String(x.id) === String(id) ? { ...x, cantidad: qty } : x));
    setAlerta("");
  };

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((x) => String(x.id) !== String(id)));
  };

  const vaciarCarrito = () => {
    if (carrito.length === 0) return;
    
    if (window.confirm("¿Estás seguro de vaciar el carrito?")) {
      setCarrito([]);
      setAlerta("🗑️ Carrito vaciado");
      setTimeout(() => setAlerta(""), 2000);
    }
  };

  // Cálculos del carrito
  const totalCents = useMemo(() => {
    return carrito.reduce((acc, it) => acc + toCents(it.precio) * it.cantidad, 0);
  }, [carrito]);

  const totalItems = useMemo(() => {
    return carrito.reduce((acc, it) => acc + it.cantidad, 0);
  }, [carrito]);

  // Funciones de cliente
  const seleccionarCliente = (clienteId) => {
    const c = clientes.find((x) => String(x.id) === String(clienteId));
    if (c) {
      setCliente({ nombre: c.nombre, cedula: c.cedula });
    }
  };

  const limpiarCliente = () => {
    setCliente({ nombre: "", cedula: "" });
  };

  // Confirmar venta
  const confirmarVenta = async () => {
    // Validaciones
    if (!cliente.nombre?.trim() || !cliente.cedula?.trim()) {
      setAlerta("❌ Ingresa nombre y cédula del cliente.");
      return;
    }
    
    if (carrito.length === 0) {
      setAlerta("❌ El carrito está vacío.");
      return;
    }

    // Verificar stock final antes de enviar
    for (const item of carrito) {
      const p = productosMap.get(String(item.id));
      if (!p || Number(p.stock) < item.cantidad) {
        setAlerta(`❌ Stock insuficiente para ${item?.nombre || item.id}.`);
        return;
      }
    }

    if (!window.confirm(`¿Confirmar venta por $${fromCents(totalCents).toFixed(2)}?`)) {
      return;
    }

    setSubmitting(true);
    setAlerta("");

    try {
      // Preparar datos para la API
      const ventaData = {
        cliente_nombre: cliente.nombre.trim(),
        cliente_cedula: cliente.cedula.trim(),
        items: carrito.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        }))
      };

      console.log('📦 Enviando venta:', ventaData);

      const response = await ventasAPI.create(ventaData);
      
      console.log('✅ Venta creada:', response);

      // Limpiar formulario
      setCarrito([]);
      setCliente({ nombre: "", cedula: "" });
      setSeleccionProd("");
      setCantidad(1);
      setBusquedaProducto("");
      
      // Recargar datos para actualizar stock y ventas
      await cargarDatos();
      
      setAlerta(`✅ Venta registrada exitosamente. ID: ${response.data.id || 'N/A'} - Total: $${response.data.total?.toFixed(2) || fromCents(totalCents).toFixed(2)}`);
    } catch (error) {
      console.error('❌ Error en venta:', error);
      setAlerta(`❌ Error registrando venta: ${error.message}`);
    } finally {
      setSubmitting(false);
    }

    setTimeout(() => setAlerta(""), 5000);
  };

  // Ver detalle de venta
  const verDetalleVenta = async (venta) => {
    try {
      const response = await ventasAPI.getById(venta.id);
      setVentaDetalle(response.data);
      setMostrarModalDetalle(true);
    } catch (error) {
      setAlerta(`❌ Error cargando detalle: ${error.message}`);
    }
  };

  const cerrarModalDetalle = () => {
    setMostrarModalDetalle(false);
    setVentaDetalle(null);
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando datos de ventas...</p>
      </Container>
    );
  }

  if (!puedeVender) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          <h5>⚠️ Acceso Restringido</h5>
          <p>No tienes permisos para realizar ventas. Contacta con un administrador.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col md={8}>
          <h2>
            🛒 Sistema de Ventas
            <Badge bg="secondary" className="ms-2">{ventas.length}</Badge>
          </h2>
          <p className="text-muted">Registra nuevas ventas y consulta el historial</p>
        </Col>
        <Col md={4} className="text-end">
          <Button 
            variant={mostrarHistorial ? "primary" : "outline-primary"}
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
          >
            {mostrarHistorial ? "🛒 Nueva Venta" : "📋 Ver Historial"}
          </Button>
        </Col>
      </Row>

      {alerta && (
        <Alert 
          variant={alerta.startsWith("✅") ? "success" : "danger"}
          dismissible
          onClose={() => setAlerta("")}
        >
          {alerta}
        </Alert>
      )}

      {!mostrarHistorial ? (
        <>
          {/* Información del Cliente */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">👤 Información del Cliente</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Nombre Completo *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre completo del cliente"
                      value={cliente.nombre}
                      onChange={(e) => setCliente((c) => ({ ...c, nombre: e.target.value }))}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Cédula/RUC *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Número de cédula"
                      value={cliente.cedula}
                      onChange={(e) => setCliente((c) => ({ ...c, cedula: e.target.value }))}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Seleccionar Cliente Existente</Form.Label>
                    <Form.Select
                      onChange={(e) => {
                        if (e.target.value) {
                          seleccionarCliente(e.target.value);
                        }
                      }}
                      defaultValue=""
                      disabled={submitting}
                    >
                      <option value="">-- Seleccionar cliente --</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} — {c.cedula}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={1} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={limpiarCliente}
                    disabled={submitting}
                    title="Limpiar cliente"
                  >
                    🗑️
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Selección de Productos */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">📦 Agregar Productos</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Buscar Producto</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Buscar por nombre, ID o código..."
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                        disabled={submitting}
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setBusquedaProducto("")}
                        disabled={!busquedaProducto || submitting}
                      >
                        ❌
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Producto</Form.Label>
                    <Form.Select 
                      value={seleccionProd} 
                      onChange={(e) => setSeleccionProd(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="">-- Seleccionar producto --</option>
                      {productosFiltrados.map((p) => (
                        <option key={String(p.id)} value={String(p.id)}>
                          {p.nombre} — ${Number(p.precio).toFixed(2)} — Stock: {p.stock}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Cantidad</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="1" 
                      value={cantidad} 
                      onChange={(e) => setCantidad(e.target.value)}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Button 
                    variant="primary"
                    onClick={agregarAlCarrito}
                    disabled={submitting || !seleccionProd}
                    title="Agregar al carrito"
                  >
                    ➕
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Carrito de Compras */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                🛒 Carrito de Compras
                {totalItems > 0 && (
                  <Badge bg="primary" className="ms-2">{totalItems} items</Badge>
                )}
              </h5>
              {carrito.length > 0 && (
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={vaciarCarrito}
                  disabled={submitting}
                >
                  🗑️ Vaciar
                </Button>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              <Table striped hover responsive className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unit.</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <div className="text-muted">
                          <i className="bi bi-cart-x fs-1"></i>
                          <p className="mt-2">El carrito está vacío</p>
                          <small>Agrega productos usando el formulario de arriba</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    carrito.map((item) => (
                      <tr key={String(item.id)}>
                        <td>
                          <strong>{item.nombre}</strong>
                          <br />
                          <small className="text-muted">ID: {item.id}</small>
                        </td>
                        <td>${Number(item.precio).toFixed(2)}</td>
                        <td style={{width: 120}}>
                          <Form.Control
                            type="number"
                            min="1"
                            max={item.stock_disponible}
                            value={item.cantidad}
                            onChange={(e) => cambiarCantidad(item.id, e.target.value)}
                            disabled={submitting}
                            size="sm"
                          />
                        </td>
                        <td>
                          <strong>${fromCents(toCents(item.precio) * item.cantidad).toFixed(2)}</strong>
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-danger" 
                            onClick={() => quitarDelCarrito(item.id)}
                            disabled={submitting}
                            title="Quitar del carrito"
                          >
                            🗑️
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              {carrito.length > 0 && (
                <div className="p-3 bg-light border-top">
                  <Row>
                    <Col md={8}>
                      <p className="mb-0">
                        <strong>Total de items:</strong> {totalItems} productos
                      </p>
                    </Col>
                    <Col md={4} className="text-end">
                      <h4 className="mb-3">
                        <strong>Total: ${fromCents(totalCents).toFixed(2)}</strong>
                      </h4>
                      <div className="d-flex gap-2 justify-content-end">
                        <Button 
                          variant="outline-secondary"
                          onClick={vaciarCarrito}
                          disabled={submitting}
                        >
                          🗑️ Vaciar
                        </Button>
                        <Button 
                          variant="success" 
                          size="lg"
                          onClick={confirmarVenta} 
                          disabled={submitting || carrito.length === 0}
                        >
                          {submitting ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Procesando...
                            </>
                          ) : (
                            '💰 Confirmar Venta'
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      ) : (
        /* Historial de Ventas */
        <Card>
          <Card.Header>
            <h5 className="mb-0">📋 Historial de Ventas Recientes</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped hover responsive className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Cédula</th>
                  <th>Total</th>
                  <th>Items</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <div className="text-muted">
                        <i className="bi bi-receipt fs-1"></i>
                        <p className="mt-2">No hay ventas registradas</p>
                        <small>Las ventas aparecerán aquí una vez que se registren</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ventas.map((venta) => (
                    <tr key={venta.id}>
                      <td>
                        <code>{venta.id}</code>
                      </td>
                      <td>
                        {new Date(venta.fecha_venta).toLocaleString()}
                      </td>
                      <td>
                        <strong>{venta.cliente_nombre}</strong>
                      </td>
                      <td>
                        <code>{venta.cliente_cedula}</code>
                      </td>
                      <td>
                        <strong>${Number(venta.total).toFixed(2)}</strong>
                      </td>
                      <td>
                        <Badge bg="info">{venta.total_items || 'N/A'}</Badge>
                      </td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => verDetalleVenta(venta)}
                          title="Ver detalles"
                        >
                          👁️
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
            
            {ventas.length > 0 && (
              <div className="p-3 bg-light border-top text-center">
                <small className="text-muted">
                  Mostrando las {ventas.length} ventas más recientes
                </small>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal de Detalle de Venta */}
      <Modal show={mostrarModalDetalle} onHide={cerrarModalDetalle} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🧾 Detalle de Venta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ventaDetalle && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Información de la Venta</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>ID:</strong></td>
                        <td><code>{ventaDetalle.id}</code></td>
                      </tr>
                      <tr>
                        <td><strong>Fecha:</strong></td>
                        <td>{new Date(ventaDetalle.fecha_venta).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td><strong>Vendedor:</strong></td>
                        <td>{ventaDetalle.vendedor_nombre || 'No disponible'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <h6>Información del Cliente</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Nombre:</strong></td>
                        <td>{ventaDetalle.cliente_nombre}</td>
                      </tr>
                      <tr>
                        <td><strong>Cédula:</strong></td>
                        <td><code>{ventaDetalle.cliente_cedula}</code></td>
                      </tr>
                      <tr>
                        <td><strong>Total:</strong></td>
                        <td><h5>${Number(ventaDetalle.total).toFixed(2)}</h5></td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>

              <h6>Productos Vendidos</h6>
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unit.</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaDetalle.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.producto_nombre}</strong>
                        <br />
                        <small className="text-muted">ID: {item.producto_id}</small>
                      </td>
                      <td>${Number(item.precio_unitario).toFixed(2)}</td>
                      <td>{item.cantidad}</td>
                      <td><strong>${Number(item.subtotal).toFixed(2)}</strong></td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="text-center">No hay detalles disponibles</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="table-dark">
                    <th colSpan={3}>TOTAL</th>
                    <th>${Number(ventaDetalle.total).toFixed(2)}</th>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModalDetalle}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Información de ayuda */}
      <Card className="mt-4 bg-light">
        <Card.Body>
          <h6>💡 Guía para realizar ventas:</h6>
          <Row>
            <Col md={3}>
              <small>
                <strong>1. Cliente:</strong> Ingresa nombre y cédula, o selecciona uno existente
              </small>
            </Col>
            <Col md={3}>
              <small>
                <strong>2. Productos:</strong> Busca y agrega productos al carrito
              </small>
            </Col>
            <Col md={3}>
              <small>
                <strong>3. Carrito:</strong> Revisa cantidades y total antes de confirmar
              </small>
            </Col>
            <Col md={3}>
              <small>
                <strong>4. Confirmar:</strong> Procesa la venta y actualiza automáticamente el stock
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}