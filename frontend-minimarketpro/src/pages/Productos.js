import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Table, Alert, Card, Spinner } from "react-bootstrap";
import { productosAPI, categoriasAPI } from '../services/api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alerta, setAlerta] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditarId, setProductoEditarId] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    categoria_id: "",
    precio: "",
    stock: "",
    stock_minimo: "",
    fechaCaducidad: "",
    codigo_barras: "",
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productosRes, categoriasRes] = await Promise.all([
        productosAPI.getAll(),
        categoriasAPI.getAll(true)
      ]);
      
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data);
    } catch (error) {
      setAlerta(`❌ Error cargando datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const limpiarFormulario = () => {
    setFormData({
      id: "",
      nombre: "",
      categoria_id: "",
      precio: "",
      stock: "",
      stock_minimo: "",
      fechaCaducidad: "",
      codigo_barras: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    const { nombre, categoria_id, precio, stock } = formData;
    if (!nombre?.trim() || !categoria_id || !precio || !stock) {
      setAlerta("❌ Todos los campos obligatorios deben completarse.");
      return;
    }

    if (isNaN(precio) || Number(precio) < 0) {
      setAlerta("❌ El precio debe ser un número ≥ 0.");
      return;
    }

    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
      setAlerta("❌ El stock debe ser un entero ≥ 0.");
      return;
    }

    setSubmitting(true);
    setAlerta("");

    try {
      const productoData = {
        ...(formData.id && { id: formData.id.trim() }),
        nombre: formData.nombre.trim(),
        categoria_id: parseInt(formData.categoria_id),
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        stock_minimo: parseInt(formData.stock_minimo) || 5,
        fecha_caducidad: formData.fechaCaducidad || null,
        codigo_barras: formData.codigo_barras.trim() || null,
      };

      if (modoEdicion) {
        await productosAPI.update(productoEditarId, productoData);
        setAlerta("✅ Producto actualizado exitosamente.");
        setModoEdicion(false);
        setProductoEditarId(null);
      } else {
        await productosAPI.create(productoData);
        setAlerta("✅ Producto creado exitosamente.");
      }

      limpiarFormulario();
      await cargarDatos(); // Recargar lista
    } catch (error) {
      setAlerta(`❌ Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }

    setTimeout(() => setAlerta(""), 3000);
  };

  const handleEditar = (p) => {
    setModoEdicion(true);
    setProductoEditarId(p.id);
    setFormData({
      id: p.id,
      nombre: p.nombre,
      categoria_id: String(p.categoria_id),
      precio: String(p.precio),
      stock: String(p.stock),
      stock_minimo: String(p.stock_minimo || 5),
      fechaCaducidad: p.fecha_caducidad || "",
      codigo_barras: p.codigo_barras || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;

    try {
      await productosAPI.delete(id);
      setAlerta("✅ Producto eliminado exitosamente.");
      await cargarDatos();
    } catch (error) {
      setAlerta(`❌ Error eliminando producto: ${error.message}`);
    }

    setTimeout(() => setAlerta(""), 3000);
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setProductoEditarId(null);
    limpiarFormulario();
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
        <p>Cargando productos...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col md={5}>
          <Card className="mb-3">
            <Card.Body>
              <h3 className="mb-3">{modoEdicion ? "Editar producto" : "Nuevo producto"}</h3>
              
              {alerta && (
                <Alert variant={alerta.startsWith("✅") ? "success" : "danger"}>
                  {alerta}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label>ID (opcional, se autogenera si está vacío)</Form.Label>
                  <Form.Control 
                    name="id" 
                    value={formData.id} 
                    onChange={handleChange} 
                    placeholder="Ej: P-001 (opcional)" 
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Categoría *</Form.Label>
                  <Form.Select 
                    name="categoria_id" 
                    value={formData.categoria_id} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">-- Selecciona --</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col>
                    <Form.Group className="mb-2">
                      <Form.Label>Precio *</Form.Label>
                      <Form.Control 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        name="precio" 
                        value={formData.precio} 
                        onChange={handleChange} 
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-2">
                      <Form.Label>Stock *</Form.Label>
                      <Form.Control 
                        type="number" 
                        min="0" 
                        name="stock" 
                        value={formData.stock} 
                        onChange={handleChange} 
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label>Stock Mínimo</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    name="stock_minimo" 
                    value={formData.stock_minimo} 
                    onChange={handleChange} 
                    placeholder="5"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Código de Barras</Form.Label>
                  <Form.Control 
                    name="codigo_barras" 
                    value={formData.codigo_barras} 
                    onChange={handleChange} 
                    placeholder="Opcional"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Fecha de caducidad (opcional)</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="fechaCaducidad" 
                    value={formData.fechaCaducidad} 
                    onChange={handleChange} 
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {modoEdicion ? "Actualizando..." : "Creando..."}
                      </>
                    ) : (
                      modoEdicion ? "Guardar cambios" : "Agregar"
                    )}
                  </Button>
                  <Button type="button" variant="secondary" onClick={limpiarFormulario}>
                    Limpiar
                  </Button>
                  {modoEdicion && (
                    <Button type="button" variant="outline-danger" onClick={cancelarEdicion}>
                      Cancelar edición
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          {categorias.length === 0 && (
            <Alert variant="warning">
              No hay categorías disponibles. <strong>Crea categorías primero</strong> en la sección Categorías.
            </Alert>
          )}
        </Col>

        <Col md={7}>
          <h3 className="mb-3">Lista de productos</h3>
          <Table striped bordered hover size="sm" responsive>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Stock Mín.</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan={7} className="text-center">No hay productos registrados.</td></tr>
              ) : productos.map((p) => (
                <tr key={String(p.id)}>
                  <td>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoria_nombre || 'Sin categoría'}</td>
                  <td>${Number(p.precio).toFixed(2)}</td>
                  <td className={p.stock <= (p.stock_minimo || 5) ? 'text-danger fw-bold' : ''}>
                    {p.stock}
                  </td>
                  <td>{p.stock_minimo || 5}</td>
                  <td className="d-flex gap-1">
                    <Button size="sm" variant="outline-primary" onClick={() => handleEditar(p)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleEliminar(p.id)}>
                      Eliminar
                    </Button>
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