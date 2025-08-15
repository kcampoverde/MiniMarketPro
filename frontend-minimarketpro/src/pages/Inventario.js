import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Table, Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { productosAPI, categoriasAPI } from '../services/api';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [alerta, setAlerta] = useState("");

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productosRes, categoriasRes] = await Promise.all([
        productosAPI.getAll({ 
          busqueda: busqueda || undefined,
          categoria: categoriaFiltro || undefined
        }),
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

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado local adicional (el backend ya filtra, pero esto es para UX inmediata)
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const matchQ = !q || 
        String(p.id).toLowerCase().includes(q) ||
        String(p.nombre).toLowerCase().includes(q);
      const matchCat = !categoriaFiltro || String(p.categoria_id) === String(categoriaFiltro);
      return matchQ && matchCat;
    });
  }, [productos, busqueda, categoriaFiltro]);

  // Buscar con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        cargarDatos();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [busqueda, categoriaFiltro]);

  // Exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Inventario de Productos", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 24);

    const body = filtrados.map((p) => [
      p.id, 
      p.nombre, 
      p.categoria_nombre || 'Sin categoría', 
      `$${Number(p.precio).toFixed(2)}`, 
      p.stock,
      p.fecha_caducidad || "-"
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["ID", "Nombre", "Categoría", "Precio", "Stock", "Caducidad"]],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`inventario_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Exportar Excel
  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtrados.map((p) => ({
        ID: p.id,
        Nombre: p.nombre,
        Categoría: p.categoria_nombre || 'Sin categoría',
        Precio: Number(p.precio),
        Stock: Number(p.stock),
        'Stock Mínimo': Number(p.stock_minimo) || 5,
        'Código de Barras': p.codigo_barras || '',
        Caducidad: p.fecha_caducidad || "",
        'Fecha Creación': p.fecha_creacion || '',
      }))
    );
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }), 
      `inventario_${new Date().toISOString().slice(0,10)}.xlsx`
    );
  };

  // Eliminar producto desde inventario
  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este producto del inventario?")) return;
    
    try {
      await productosAPI.delete(id);
      setAlerta("✅ Producto eliminado exitosamente");
      await cargarDatos();
    } catch (error) {
      setAlerta(`❌ Error eliminando producto: ${error.message}`);
    }

    setTimeout(() => setAlerta(""), 3000);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaFiltro("");
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
        <p>Cargando inventario...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col md={8}>
          <h3>Inventario</h3>
          <p className="text-muted">
            {filtrados.length} productos encontrados
            {busqueda || categoriaFiltro ? ` (filtrados de ${productos.length} total)` : ''}
          </p>
        </Col>
        <Col md={4} className="text-md-end d-flex gap-2 justify-content-md-end">
          <Button variant="outline-secondary" onClick={exportarExcel}>
            📊 Excel
          </Button>
          <Button variant="primary" onClick={exportarPDF}>
            📄 PDF
          </Button>
        </Col>
      </Row>

      {alerta && (
        <Alert variant={alerta.startsWith('✅') ? 'success' : 'danger'}>
          {alerta}
        </Alert>
      )}

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={5}>
              <Form.Control
                placeholder="🔍 Buscar por ID o Nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Select 
                value={categoriaFiltro} 
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button 
                variant="outline-dark" 
                className="w-100" 
                onClick={limpiarFiltros}
              >
                🗑️ Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Table striped bordered hover responsive size="sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Stock Mín.</th>
            <th>Caducidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-4">
                {busqueda || categoriaFiltro ? (
                  <>
                    <p className="mb-2">Sin resultados para los filtros aplicados.</p>
                    <Button variant="outline-primary" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  </>
                ) : (
                  <p className="mb-0">No hay productos en el inventario.</p>
                )}
              </td>
            </tr>
          ) : (
            filtrados.map((p) => (
              <tr key={String(p.id)}>
                <td>{p.id}</td>
                <td>{p.nombre}</td>
                <td>
                  <span className={!p.categoria_nombre ? 'text-muted fst-italic' : ''}>
                    {p.categoria_nombre || 'Sin categoría'}
                  </span>
                </td>
                <td>${Number(p.precio).toFixed(2)}</td>
                <td className={
                  p.stock <= (p.stock_minimo || 5) ? 'text-danger fw-bold' : 
                  p.stock <= (p.stock_minimo || 5) * 2 ? 'text-warning fw-bold' : ''
                }>
                  {p.stock}
                </td>
                <td>{p.stock_minimo || 5}</td>
                <td>
                  {p.fecha_caducidad ? (
                    <span className={
                      new Date(p.fecha_caducidad) < new Date() ? 'text-danger fw-bold' :
                      new Date(p.fecha_caducidad) < new Date(Date.now() + 30*24*60*60*1000) ? 'text-warning fw-bold' : ''
                    }>
                      {p.fecha_caducidad}
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <Button 
                    size="sm" 
                    variant="outline-danger" 
                    onClick={() => eliminar(p.id)}
                  >
                    🗑️
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Leyenda */}
      <Card className="mt-3">
        <Card.Body>
          <h6>Leyenda:</h6>
          <Row>
            <Col>
              <small>
                <span className="text-danger fw-bold">● Stock crítico</span> (≤ stock mínimo)
              </small>
            </Col>
            <Col>
              <small>
                <span className="text-warning fw-bold">● Stock bajo</span> (≤ 2x stock mínimo)
              </small>
            </Col>
            <Col>
              <small>
                <span className="text-danger fw-bold">● Vencido</span> | 
                <span className="text-warning fw-bold"> ● Vence pronto</span> (30 días)
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}