import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Helpers de storage
const load = (key, def) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
};

export default function Home() {
  const { usuarioActual } = useAuth();
  const [productos, setProductos] = useState(() => load("productos", []));
  const [ventas, setVentas] = useState(() => load("ventas", []));
  const [clientes, setClientes] = useState(() => load("clientes", []));
  const [categorias, setCategorias] = useState(() => load("categorias", []));

  // Actualizar datos cuando se vuelva a la página
  useEffect(() => {
    const reload = () => {
      setProductos(load("productos", []));
      setVentas(load("ventas", []));
      setClientes(load("clientes", []));
      setCategorias(load("categorias", []));
    };
    
    const onVis = () => document.visibilityState === "visible" && reload();
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", reload);
    
    return () => {
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // Estadísticas calculadas
  const estadisticas = useMemo(() => {
    // Productos con stock bajo (menos de 10)
    const stockBajo = productos.filter(p => Number(p.stock) < 10);
    
    // Productos próximos a vencer (en los próximos 30 días)
    const hoy = new Date();
    const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    const proximosVencer = productos.filter(p => {
      if (!p.fechaCaducidad) return false;
      const fechaCad = new Date(p.fechaCaducidad);
      return fechaCad >= hoy && fechaCad <= en30Dias;
    });

    // Ventas del día actual
    const ventasHoy = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta.toDateString() === hoy.toDateString();
    });

    // Total de ventas del día
    const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + Number(v.total), 0);

    // Ventas de la semana
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    const ventasSemana = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta >= inicioSemana;
    });

    const totalVentasSemana = ventasSemana.reduce((sum, v) => sum + Number(v.total), 0);

    // Valor total del inventario
    const valorInventario = productos.reduce((sum, p) => sum + (Number(p.precio) * Number(p.stock)), 0);

    return {
      stockBajo,
      proximosVencer,
      ventasHoy: ventasHoy.length,
      totalVentasHoy,
      ventasSemana: ventasSemana.length,
      totalVentasSemana,
      valorInventario
    };
  }, [productos, ventas]);

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? "Buenos días" : horaActual < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <Container className="py-4">
      {/* Saludo personalizado */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-primary text-white">
            <Card.Body>
              <h2>{saludo}, {usuarioActual?.usuario || 'Usuario'}! 👋</h2>
              <p className="mb-0">
                Bienvenido a MiniMarketPro - Tu sistema de gestión de minimarket
                {usuarioActual?.rol && ` | Rol: ${usuarioActual.rol}`}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estadísticas principales */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="text-primary">{productos.length}</h1>
              <p className="mb-0">Productos</p>
              <small className="text-muted">Registrados</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="text-success">{clientes.length}</h1>
              <p className="mb-0">Clientes</p>
              <small className="text-muted">Registrados</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="text-info">{estadisticas.ventasHoy}</h1>
              <p className="mb-0">Ventas Hoy</p>
              <small className="text-muted">${estadisticas.totalVentasHoy.toFixed(2)}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="text-warning">{categorias.length}</h1>
              <p className="mb-0">Categorías</p>
              <small className="text-muted">Activas</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estadísticas de ventas */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📊 Resumen de Ventas</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <p><strong>Hoy:</strong> {estadisticas.ventasHoy} ventas</p>
                  <p><strong>Total hoy:</strong> ${estadisticas.totalVentasHoy.toFixed(2)}</p>
                </Col>
                <Col>
                  <p><strong>Esta semana:</strong> {estadisticas.ventasSemana} ventas</p>
                  <p><strong>Total semana:</strong> ${estadisticas.totalVentasSemana.toFixed(2)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">💰 Valor del Inventario</h5>
            </Card.Header>
            <Card.Body>
              <h3 className="text-success">${estadisticas.valorInventario.toFixed(2)}</h3>
              <p className="text-muted mb-0">Valor total de productos en stock</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alertas importantes */}
      {(estadisticas.stockBajo.length > 0 || estadisticas.proximosVencer.length > 0) && (
        <Row className="mb-4">
          <Col>
            <h4>🚨 Alertas Importantes</h4>
          </Col>
        </Row>
      )}

      {estadisticas.stockBajo.length > 0 && (
        <Row className="mb-3">
          <Col>
            <Alert variant="warning">
              <Alert.Heading>⚠️ Productos con Stock Bajo</Alert.Heading>
              <p>Los siguientes productos tienen menos de 10 unidades en stock:</p>
              <Table striped size="sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticas.stockBajo.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td className="text-danger">{p.stock}</td>
                      <td>{p.categoria}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {estadisticas.stockBajo.length > 5 && (
                <p className="mb-0">...y {estadisticas.stockBajo.length - 5} productos más.</p>
              )}
            </Alert>
          </Col>
        </Row>
      )}

      {estadisticas.proximosVencer.length > 0 && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger">
              <Alert.Heading>⏰ Productos Próximos a Vencer</Alert.Heading>
              <p>Los siguientes productos vencen en los próximos 30 días:</p>
              <Table striped size="sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticas.proximosVencer.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td className="text-danger">{p.fechaCaducidad}</td>
                      <td>{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {estadisticas.proximosVencer.length > 5 && (
                <p className="mb-0">...y {estadisticas.proximosVencer.length - 5} productos más.</p>
              )}
            </Alert>
          </Col>
        </Row>
      )}



      {/* Footer informativo */}
      <Row className="mt-5">
        <Col>
          <Card className="bg-light">
            <Card.Body className="text-center">
              <p className="mb-0">
                <small className="text-muted">
                  MiniMarketPro v1.0 | Sistema de gestión para minimarkets | 
                  Fecha: {new Date().toLocaleDateString()} | 
                  Hora: {new Date().toLocaleTimeString()}
                </small>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}