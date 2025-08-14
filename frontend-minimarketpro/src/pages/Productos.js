import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Table, Alert, Card } from "react-bootstrap";

// Helpers de storage seguros
const load = (key, def) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export default function Productos() {
  const [productos, setProductos] = useState(() => load("productos", []));
  const [categorias, setCategorias] = useState(() => load("categorias", []));
  const [alerta, setAlerta] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditarId, setProductoEditarId] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    categoria: "",
    precio: "",
    stock: "",
    fechaCaducidad: "",
  });

  // Sincronización defensiva al volver a la pestaña o cambios desde otra pestaña
  useEffect(() => {
    const reload = () => {
      setProductos(load("productos", []));
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

  // Persistencia por efecto (no estorba aunque ya persistimos en el set)
  useEffect(() => { save("productos", productos); }, [productos]);

  const categoriasOptions = useMemo(() => {
    return categorias.map((c) => (typeof c === "string" ? c : c?.nombre || "")).filter(Boolean);
  }, [categorias]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const limpiarFormulario = () => {
    setFormData({ id: "", nombre: "", categoria: "", precio: "", stock: "", fechaCaducidad: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextId = (formData.id || "").trim() || crypto.randomUUID();

    // Validación básica
    const { nombre, categoria, precio, stock } = formData;
    if (!nombre?.trim() || !categoria?.trim()) {
      setAlerta("❌ Todos los campos son obligatorios (nombre/categoría).");
      return;
    }
    if (!/^[ a-zA-Z0-9áéíóúÁÉÍÓÚñÑ().,:-]+$/.test(nombre)) {
      setAlerta("❌ El nombre contiene caracteres no válidos.");
      return;
    }
    if (isNaN(precio) || Number(precio) < 0) {
      setAlerta("❌ El precio debe ser un número ≥ 0.");
      return;
    }
    if (!Number.isFinite(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock))) {
      setAlerta("❌ El stock debe ser un entero ≥ 0.");
      return;
    }

    if (modoEdicion) {
      setProductos((prev) => {
        const actualizados = prev.map((p) =>
          String(p.id) === String(productoEditarId)
            ? {
                ...p,
                ...formData,
                id: nextId,
                precio: parseFloat(formData.precio),
                stock: parseInt(formData.stock, 10),
              }
            : p
        );
        // Persistir inmediatamente
        save("productos", actualizados);
        return actualizados;
      });
      setModoEdicion(false);
      setProductoEditarId(null);
      setAlerta("✅ Producto actualizado.");
    } else {
      // Evitar duplicados de ID si el usuario lo ingresó manualmente
      if (productos.some((p) => String(p.id) === String(nextId))) {
        setAlerta("❌ El ID ya existe. Deja el campo vacío o ingresa otro.");
        return;
      }
      const nuevo = {
        ...formData,
        id: nextId,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock, 10),
        fechaCreacion: new Date().toLocaleDateString(),
      };
      setProductos((prev) => {
        const nuevos = [...prev, nuevo];
        save("productos", nuevos); // Persistir inmediatamente
        return nuevos;
      });
      setAlerta("✅ Producto guardado.");
    }

    setTimeout(() => setAlerta(""), 2500);
    limpiarFormulario();
  };

  const handleEditar = (p) => {
    setModoEdicion(true);
    setProductoEditarId(p.id);
    setFormData({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      precio: String(p.precio),
      stock: String(p.stock),
      fechaCaducidad: p.fechaCaducidad || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    setProductos((prev) => {
      const restantes = prev.filter((p) => String(p.id) !== String(id));
      save("productos", restantes);
      return restantes;
    });
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={5}>
          <Card className="mb-3">
            <Card.Body>
              <h3 className="mb-3">{modoEdicion ? "Editar producto" : "Nuevo producto"}</h3>
              {alerta && <Alert variant={alerta.startsWith("✅") ? "success" : "danger"}>{alerta}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label>ID (opcional, se autogenera si lo dejas vacío)</Form.Label>
                  <Form.Control name="id" value={formData.id} onChange={handleChange} placeholder="Ej: P-001 (opcional)" />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control name="nombre" value={formData.nombre} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Categoría</Form.Label>
                  <Form.Select name="categoria" value={formData.categoria} onChange={handleChange} required>
                    <option value="">-- Selecciona --</option>
                    {categoriasOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col>
                    <Form.Group className="mb-2">
                      <Form.Label>Precio</Form.Label>
                      <Form.Control type="number" step="0.01" min="0" name="precio" value={formData.precio} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-2">
                      <Form.Label>Stock</Form.Label>
                      <Form.Control type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Fecha de caducidad (opcional)</Form.Label>
                  <Form.Control type="date" name="fechaCaducidad" value={formData.fechaCaducidad} onChange={handleChange} />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary">{modoEdicion ? "Guardar cambios" : "Agregar"}</Button>
                  <Button type="button" variant="secondary" onClick={limpiarFormulario}>Limpiar</Button>
                  {modoEdicion && (
                    <Button type="button" variant="outline-danger" onClick={() => { setModoEdicion(false); setProductoEditarId(null); limpiarFormulario(); }}>
                      Cancelar edición
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
          <Alert variant="info">
            Recuerda crear categorías en <strong>Categorías</strong> para verlas en el selector.
          </Alert>
        </Col>

        <Col md={7}>
          <h3 className="mb-3">Lista de productos</h3>
          <Table striped bordered hover size="sm" responsive>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Caducidad</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan={7} className="text-center">No hay productos.</td></tr>
              ) : productos.map((p) => (
                <tr key={String(p.id)}>
                  <td>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>${Number(p.precio).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.fechaCaducidad || "-"}</td>
                  <td className="d-flex gap-1">
                    <Button size="sm" variant="outline-primary" onClick={() => handleEditar(p)}>Editar</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleEliminar(p.id)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}
