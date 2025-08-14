import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Table, Card, Alert } from "react-bootstrap";

// Helpers storage
const load = (key, def) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; } catch { return def; }
};
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

// Money helpers (centavos para precisión)
const toCents = (v) => Math.round(Number(v) * 100);
const fromCents = (c) => (c / 100);

export default function Ventas() {
  const [productos, setProductos] = useState(() => load("productos", []));
  const [clientes, setClientes] = useState(() => load("clientes", []));
  const [ventas, setVentas] = useState(() => load("ventas", []));
  const [alerta, setAlerta] = useState("");

  const [cliente, setCliente] = useState({ nombre: "", cedula: "" });
  const [seleccionProd, setSeleccionProd] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);

  // Sincronización
  useEffect(() => {
    const reload = () => {
      setProductos(load("productos", []));
      setClientes(load("clientes", []));
      setVentas(load("ventas", []));
    };
    const onVis = () => document.visibilityState === "visible" && reload();
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // Persistir ventas
  useEffect(() => { save("ventas", ventas); }, [ventas]);

  const productosMap = useMemo(() => {
    const m = new Map();
    for (const p of productos) m.set(String(p.id), p);
    return m;
  }, [productos]);

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
    // No exceder stock
    const ya = carrito.find((x) => String(x.id) === String(p.id))?.cantidad || 0;
    if (qty + ya > Number(p.stock)) {
      setAlerta(`❌ Stock insuficiente. Disponible: ${p.stock}`);
      return;
    }

    setCarrito((prev) => {
      const idx = prev.findIndex((x) => String(x.id) === String(p.id));
      if (idx >= 0) {
        const nuevo = [...prev];
        nuevo[idx] = { ...nuevo[idx], cantidad: nuevo[idx].cantidad + qty };
        return nuevo;
      }
      return [...prev, { id: p.id, nombre: p.nombre, precio: Number(p.precio), cantidad: qty }];
    });
    setAlerta("");
  };

  const cambiarCantidad = (id, nueva) => {
    const qty = parseInt(nueva, 10);
    if (!Number.isInteger(qty) || qty <= 0) return;
    const p = productosMap.get(String(id));
    if (!p) return;
    if (qty > Number(p.stock)) return; // evitar pasar stock
    setCarrito((prev) => prev.map((x) => String(x.id) === String(id) ? { ...x, cantidad: qty } : x));
  };

  const quitar = (id) => setCarrito((prev) => prev.filter((x) => String(x.id) !== String(id)));

  const totalCents = useMemo(() => {
    return carrito.reduce((acc, it) => acc + toCents(it.precio) * it.cantidad, 0);
  }, [carrito]);

  const confirmarVenta = () => {
    if (!cliente.nombre?.trim() || !cliente.cedula?.trim()) {
      setAlerta("❌ Ingresa nombre y cédula del cliente.");
      return;
    }
    if (carrito.length === 0) {
      setAlerta("❌ El carrito está vacío.");
      return;
    }

    // Verificar stock final
    for (const it of carrito) {
      const p = productosMap.get(String(it.id));
      if (!p || Number(p.stock) < it.cantidad) {
        setAlerta(`❌ Stock insuficiente para ${it?.nombre || it.id}.`);
        return;
      }
    }

    // Descontar stock y persistir productos
    const nuevosProductos = productos.map((p) => {
      const item = carrito.find((x) => String(x.id) === String(p.id));
      if (!item) return p;
      return { ...p, stock: Number(p.stock) - item.cantidad };
    });
    setProductos(nuevosProductos);
    save("productos", nuevosProductos); // persistir YA

    // Registrar venta
    const venta = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      cliente: { ...cliente },
      items: carrito.map((x) => ({
        id: x.id,
        nombre: x.nombre,
        precio: Number(x.precio),
        cantidad: x.cantidad,
        total: fromCents(toCents(x.precio) * x.cantidad),
      })),
      total: fromCents(totalCents),
    };
    setVentas((prev) => [...prev, venta]);

    // Limpiar
    setCarrito([]);
    setSeleccionProd("");
    setCantidad(1);
    setAlerta("✅ Venta registrada.");
    setTimeout(() => setAlerta(""), 2500);
  };

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col><h3>Ventas</h3></Col>
      </Row>

      {alerta && <Alert variant={alerta.startsWith("✅") ? "success" : "danger"}>{alerta}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Cliente</Form.Label>
                <Form.Control
                  placeholder="Nombre completo"
                  value={cliente.nombre}
                  onChange={(e) => setCliente((c) => ({ ...c, nombre: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Cédula</Form.Label>
                <Form.Control
                  placeholder="xxxxxxxxxx"
                  value={cliente.cedula}
                  onChange={(e) => setCliente((c) => ({ ...c, cedula: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={5} className="d-flex align-items-end">
              {/* (Opcional) Cargar rápidamente un cliente ya existente */}
              <Form.Select
                onChange={(e) => {
                  const cid = e.target.value;
                  if (!cid) return;
                  const c = clientes.find((x) => String(x.cedula) === String(cid));
                  if (c) setCliente({ nombre: c.nombre, cedula: c.cedula });
                }}
                defaultValue=""
              >
                <option value="">Seleccionar cliente (opcional)</option>
                {clientes.map((c) => (
                  <option key={c.cedula} value={c.cedula}>{c.nombre} — {c.cedula}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Producto</Form.Label>
                <Form.Select value={seleccionProd} onChange={(e) => setSeleccionProd(e.target.value)}>
                  <option value="">-- Selecciona --</option>
                  {productos.map((p) => (
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
                <Form.Control type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button className="w-100" variant="primary" onClick={agregarAlCarrito}>Agregar al carrito</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h5>Carrito</h5>
          <Table striped bordered hover size="sm" responsive>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carrito.length === 0 ? (
                <tr><td colSpan={6} className="text-center">Sin items.</td></tr>
              ) : carrito.map((it) => (
                <tr key={String(it.id)}>
                  <td>{it.id}</td>
                  <td>{it.nombre}</td>
                  <td>${Number(it.precio).toFixed(2)}</td>
                  <td style={{maxWidth: 100}}>
                    <Form.Control
                      type="number"
                      min="1"
                      value={it.cantidad}
                      onChange={(e) => cambiarCantidad(it.id, e.target.value)}
                    />
                  </td>
                  <td>${fromCents(toCents(it.precio) * it.cantidad).toFixed(2)}</td>
                  <td>
                    <Button size="sm" variant="outline-danger" onClick={() => quitar(it.id)}>Quitar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Row className="mt-3">
            <Col md={6}></Col>
            <Col md={6} className="text-end">
              <h5>Total: ${fromCents(totalCents).toFixed(2)}</h5>
              <div className="d-flex gap-2 justify-content-end">
                <Button variant="secondary" onClick={() => setCarrito([])} disabled={carrito.length === 0}>
                  Vaciar carrito
                </Button>
                <Button variant="success" onClick={confirmarVenta} disabled={carrito.length === 0}>
                  Confirmar venta
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mt-3">
        <Card.Body>
          <h5>Historial de ventas</h5>
          <Table striped bordered hover size="sm" responsive>
            <thead>
              <tr>
                <th>Fecha</th><th>Cliente</th><th>Items</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr><td colSpan={4} className="text-center">Aún no hay ventas.</td></tr>
              ) : ventas.map((v) => (
                <tr key={v.id}>
                  <td>{new Date(v.fecha).toLocaleString()}</td>
                  <td>{v.cliente?.nombre} — {v.cliente?.cedula}</td>
                  <td>
                    {v.items.map((i) => `${i.nombre} x${i.cantidad}`).join(", ")}
                  </td>
                  <td>${Number(v.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}
