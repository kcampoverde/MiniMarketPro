import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Modal,
  OverlayTrigger,
  Tooltip,
  ButtonGroup
} from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import moment from 'moment';
import { useAuth } from '../AuthContext';

function Inventario() {
  const { usuarioActual } = useAuth();
  const esAdmin = usuarioActual?.rol === 'admin';

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalEditar, setModalEditar] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem('productos')) || [];
    const cats = JSON.parse(localStorage.getItem('categorias')) || [];
    setProductos(guardados);
    setCategorias(cats);
  }, []);

  const guardarEnLocalStorage = (nuevos) => {
    setProductos(nuevos);
    localStorage.setItem('productos', JSON.stringify(nuevos));
  };

  const handleEliminar = (id) => {
    if (!esAdmin) return;
    if (window.confirm('¿Eliminar este producto?')) {
      const nuevos = productos.filter(p => `${p.id}` !== `${id}`);
      guardarEnLocalStorage(nuevos);
    }
  };

  const handleEditar = (producto) => {
    if (!esAdmin) return;
    setProductoEditar(producto);
    setModalEditar(true);
  };

  const handleGuardarCambios = () => {
    if (!esAdmin) return;
    const actualizados = productos.map(p =>
      `${p.id}` === `${productoEditar.id}` ? productoEditar : p
    );
    guardarEnLocalStorage(actualizados);
    setModalEditar(false);
  };

  const filtrados = productos.filter((p) =>
    (p.id + '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const exportarAExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(productos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Inventario.xlsx');
  };

  const exportarAPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Reporte de Inventario', 40, 40);

    const filas = productos.map(p => [
      p.id, p.nombre, p.categoria, p.precio, p.stock, p.fechaCreacion, p.fechaCaducidad
    ]);

    autoTable(doc, {
      head: [['ID', 'Nombre', 'Categoría', 'Precio', 'Stock', 'F. Creación', 'F. Caducidad']],
      body: filas,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], halign: 'center', fontStyle: 'bold' },
      bodyStyles: { halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save('Inventario.pdf');
  };

  const getEstadoProducto = (prod) => {
    const hoy = moment();
    const caducidad = moment(prod.fechaCaducidad);
    const stockBajo = prod.stock <= 10;
    const estaCaducado = caducidad.isValid() && caducidad.isBefore(hoy, 'day');

    if (stockBajo && estaCaducado)
      return { clase: 'table-danger', tooltip: '⚠ Producto caducado y con stock bajo' };
    if (estaCaducado)
      return { clase: 'table-danger', tooltip: '⚠ Producto caducado' };
    if (stockBajo)
      return { clase: 'table-warning', tooltip: '⚠ Stock bajo' };
    return { clase: '', tooltip: '' };
  };

  return (
    <div className="container mt-4">
      <h2>Inventario</h2>
      <p>Gestiona el inventario de productos registrados.</p>

      <Form.Control
        type="text"
        placeholder="🔍 Buscar por ID, nombre o categoría"
        className="mb-3"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <ButtonGroup className="mb-3">
        <Button variant="outline-success" onClick={exportarAExcel}>📊 Excel</Button>
        <Button variant="outline-danger" onClick={exportarAPDF}>📄 PDF</Button>
      </ButtonGroup>

      {filtrados.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio ($)</th>
              <th>Stock</th>
              <th>F. Creación</th>
              <th>F. Caducidad</th>
              {esAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((prod, idx) => {
              const { clase, tooltip } = getEstadoProducto(prod);

              const fila = (
                <tr key={prod.id} className={clase}>
                  <td>{idx + 1}</td>
                  <td>{prod.id}</td>
                  <td>{prod.nombre}</td>
                  <td>{prod.categoria}</td>
                  <td>{parseFloat(prod.precio).toFixed(2)}</td>
                  <td>{prod.stock}</td>
                  <td>{prod.fechaCreacion}</td>
                  <td>{prod.fechaCaducidad}</td>
                  {esAdmin && (
                    <td>
                      <Button size="sm" variant="warning" className="me-2" onClick={() => handleEditar(prod)}>Editar</Button>
                      <Button size="sm" variant="danger" onClick={() => handleEliminar(prod.id)}>Eliminar</Button>
                    </td>
                  )}
                </tr>
              );

              return tooltip ? (
                <OverlayTrigger key={prod.id} placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
                  {fila}
                </OverlayTrigger>
              ) : fila;
            })}
          </tbody>
        </Table>
      ) : (
        <p>No hay productos que coincidan con la búsqueda.</p>
      )}

      {/* Modal de edición */}
      <Modal show={modalEditar} onHide={() => setModalEditar(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>ID</Form.Label>
            <Form.Control type="text" value={productoEditar?.id || ''} readOnly />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={productoEditar?.nombre || ''}
              onChange={(e) => setProductoEditar({ ...productoEditar, nombre: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Categoría</Form.Label>
            <Form.Select
              value={productoEditar?.categoria || ''}
              onChange={(e) => setProductoEditar({ ...productoEditar, categoria: e.target.value })}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Precio</Form.Label>
            <Form.Control
              type="number"
              value={productoEditar?.precio || ''}
              onChange={(e) => setProductoEditar({ ...productoEditar, precio: parseFloat(e.target.value) || 0 })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Stock</Form.Label>
            <Form.Control
              type="number"
              value={productoEditar?.stock || ''}
              onChange={(e) => setProductoEditar({ ...productoEditar, stock: parseInt(e.target.value) || 0 })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Fecha de Creación</Form.Label>
            <Form.Control
              type="text"
              value={productoEditar?.fechaCreacion || ''}
              onChange={(e) => setProductoEditar({ ...productoEditar, fechaCreacion: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Fecha de Caducidad</Form.Label>
            <Form.Control
              type="date"
              value={productoEditar?.fechaCaducidad || ''}
              onChange={(e) => setProductoEditar({ ...productoEditar, fechaCaducidad: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalEditar(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleGuardarCambios}>Guardar Cambios</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Inventario;
