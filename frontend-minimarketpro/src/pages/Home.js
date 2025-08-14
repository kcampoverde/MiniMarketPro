import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';

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

  // Actualizar datos cuando se vuelva a la página
  useEffect(() => {
    const reload = () => {
      setProductos(load("productos", []));
      setVentas(load("ventas", []));
      setClientes(load("clientes", []));
    };
    
    const onVis = () => document.visibilityState === "visible" && reload();
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", reload);
    
    return () => {
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // Estadísticas básicas
  const estadisticas = useMemo(() => {
    const hoy = new Date();
    const ventasHoy = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      return fechaVenta.toDateString() === hoy.toDateString();
    });
    const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + Number(v.total), 0);
    const stockBajo = productos.filter(p => Number(p.stock) < 10).length;

    return { ventasHoy: ventasHoy.length, totalVentasHoy, stockBajo };
  }, [productos, ventas]);

  // Datos para gráfico de ventas de los últimos 7 días
  const datosVentas = useMemo(() => {
    const hoy = new Date();
    const datos = [];
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      
      const ventasDelDia = ventas.filter(v => {
        const fechaVenta = new Date(v.fecha);
        return fechaVenta.toDateString() === fecha.toDateString();
      });
      
      const totalDia = ventasDelDia.reduce((sum, v) => sum + Number(v.total), 0);
      
      datos.push({
        dia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
        ventas: totalDia,
        cantidad: ventasDelDia.length
      });
    }
    
    return datos;
  }, [ventas]);

  // Top 3 productos más vendidos
  const topProductos = useMemo(() => {
    const conteoProductos = {};
    
    ventas.forEach(venta => {
      venta.items?.forEach(item => {
        const id = item.id;
        if (!conteoProductos[id]) {
          conteoProductos[id] = {
            nombre: item.nombre,
            cantidad: 0
          };
        }
        conteoProductos[id].cantidad += item.cantidad;
      });
    });
    
    return Object.values(conteoProductos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3)
      .map(p => ({
        nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
        cantidad: p.cantidad
      }));
  }, [ventas]);

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? "Buenos días" : horaActual < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <Container className="py-5">
      {/* Saludo */}
      <Row className="mb-5 text-center">
        <Col>
          <h1 className="display-4 text-muted">{saludo}</h1>
          <p className="lead">{usuarioActual?.usuario || 'Usuario'}</p>
        </Col>
      </Row>

      {/* Estadísticas simples */}
      <Row className="mb-5 text-center">
        <Col md={4}>
          <h2 className="text-primary">{productos.length}</h2>
          <p className="text-muted">Productos</p>
        </Col>
        <Col md={4}>
          <h2 className="text-success">{estadisticas.ventasHoy}</h2>
          <p className="text-muted">Ventas hoy</p>
        </Col>
        <Col md={4}>
          <h2 className="text-info">{clientes.length}</h2>
          <p className="text-muted">Clientes</p>
        </Col>
      </Row>

      {/* Gráficos minimalistas */}
      <Row className="mb-5">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted mb-3">Ventas últimos 7 días</h6>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={datosVentas}>
                  <XAxis 
                    dataKey="dia" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6c757d' }}
                  />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#0d6efd" 
                    strokeWidth={2}
                    dot={{ fill: '#0d6efd', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#0d6efd' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted mb-3">Top productos</h6>
              {topProductos.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topProductos} layout="horizontal">
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="nombre" 
                      type="category" 
                      width={80}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#6c757d' }}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      fill="#20c997" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <p className="text-muted mb-0">Sin datos suficientes</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alerta simple */}
      {estadisticas.stockBajo > 0 && (
        <Row className="mb-4">
          <Col className="text-center">
            <div className="alert alert-warning">
              {estadisticas.stockBajo} productos con stock bajo
            </div>
          </Col>
        </Row>
      )}

      {/* Acciones principales */}
      <Row className="text-center">
        <Col md={4} className="mb-3">
          <Button as={Link} to="/ventas" variant="primary" size="lg" className="w-100">
            Nueva Venta
          </Button>
        </Col>
        <Col md={4} className="mb-3">
          <Button as={Link} to="/inventario" variant="outline-secondary" size="lg" className="w-100">
            Ver Inventario
          </Button>
        </Col>
        <Col md={4} className="mb-3">
          <Button as={Link} to="/clientes" variant="outline-secondary" size="lg" className="w-100">
            Clientes
          </Button>
        </Col>
      </Row>

      {/* Solo admin ve gestión de productos */}
      {usuarioActual?.rol === 'admin' && (
        <Row className="mt-4 text-center">
          <Col md={6} className="mx-auto">
            <Button as={Link} to="/productos" variant="outline-warning" size="lg" className="w-100">
              Gestionar Productos
            </Button>
          </Col>
        </Row>
      )}
    </Container>
  );
}