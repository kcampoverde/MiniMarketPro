import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Table, Form, Button, Card } from "react-bootstrap";
import jsPDF from "jspdf";              // Import correcto (default)
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Helpers storage
const load = (key, def) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; } catch { return def; }
};
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export default function Inventario() {
  const [productos, setProductos] = useState(() => load("productos", []));
  const [categorias, setCategorias] = useState(() => load("categorias", []));
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  // Sincronización y recarga defensiva
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

  const categoriasOptions = useMemo(() => {
    return categorias.map((c) => (typeof c === "string" ? c : c?.nombre || "")).filter(Boolean);
  }, [categorias]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const matchQ =
        !q ||
        String(p.id).toLowerCase().includes(q) ||
        String(p.nombre).toLowerCase().includes(q);
      const matchCat = !categoriaFiltro || String(p.categoria) === String(categoriaFiltro);
      return matchQ && matchCat;
    });
  }, [productos, busqueda, categoriaFiltro]);

  // Exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Inventario", 14, 16);

    const body = filtrados.map((p) => [
      p.id, p.nombre, p.categoria, Number(p.precio).toFixed(2), p.stock, p.fechaCaducidad || "-"
    ]);

    autoTable(doc, {
      startY: 24,
      head: [["ID", "Nombre", "Categoría", "Precio", "Stock", "Caducidad"]],
      body,
    });

    doc.save(`inventario_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Exportar Excel
  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtrados.map((p) => ({
        ID: p.id,
        Nombre: p.nombre,
        Categoría: p.categoria,
        Precio: Number(p.precio),
        Stock: Number(p.stock),
        Caducidad: p.fechaCaducidad || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "inventario.xlsx");
  };

  // (Opcional) Eliminar producto desde inventario
  const eliminar = (id) => {
    if (!window.confirm("¿Eliminar este producto del inventario?")) return;
    const restantes = productos.filter((p) => String(p.id) !== String(id));
    setProductos(restantes);
    save("productos", restantes);
  };

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col md={8}><h3>Inventario</h3></Col>
        <Col md={4} className="text-md-end d-flex gap-2 justify-content-md-end">
          <Button variant="outline-secondary" onClick={exportarExcel}>Exportar Excel</Button>
          <Button variant="primary" onClick={exportarPDF}>Exportar PDF</Button>
        </Col>
      </Row>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={6}>
              <Form.Control
                placeholder="Buscar por ID o Nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categoriasOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-dark" className="w-100" onClick={() => { setBusqueda(""); setCategoriaFiltro(""); }}>
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Table striped bordered hover responsive size="sm">
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Caducidad</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 ? (
            <tr><td colSpan={7} className="text-center">Sin resultados.</td></tr>
          ) : filtrados.map((p) => (
            <tr key={String(p.id)}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.categoria}</td>
              <td>${Number(p.precio).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>{p.fechaCaducidad || "-"}</td>
              <td>
                <Button size="sm" variant="outline-danger" onClick={() => eliminar(p.id)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
