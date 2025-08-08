import React, { useEffect, useState } from 'react';
import { Form, Button, Table, Alert } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [ventas, setVentas] = useState([]);

  const sumarConDecimales = (a, b) => Math.round((a + b) * 100) / 100;

  useEffect(() => {
    const productosGuardados = JSON.parse(localStorage.getItem('productos')) || [];
    const clientesGuardados = JSON.parse(localStorage.getItem('clientes')) || [];
    const ventasGuardadas = JSON.parse(localStorage.getItem('ventas')) || [];

    setProductos(productosGuardados);
    setClientes(clientesGuardados);
    setVentas(ventasGuardadas);
  }, []);

  const handleAgregarAlCarrito = () => {
    const producto = productos.find(p => String(p.id) === String(productoSeleccionado));
    const cantidadNum = parseInt(cantidad);

    if (!producto || isNaN(cantidadNum) || cantidadNum <= 0 || cantidadNum > producto.stock) {
      alert('Cantidad inválida o producto no disponible');
      return;
    }

    const itemExistente = carrito.find(item => item.id === producto.id);
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidadNum;
      if (nuevaCantidad > producto.stock) {
        alert('Cantidad excede el stock disponible');
        return;
      }

      const carritoActualizado = carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: nuevaCantidad, total: parseFloat((nuevaCantidad * item.precio).toFixed(2)) }
          : item
      );
      setCarrito(carritoActualizado);
    } else {
      const itemCarrito = {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidadNum,
        total: parseFloat((producto.precio * cantidadNum).toFixed(2))
      };
      setCarrito([...carrito, itemCarrito]);
    }

    setCantidad(1);
    setProductoSeleccionado('');
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) return;
    const nuevoCarrito = carrito.map(item =>
      item.id === id
        ? { ...item, cantidad: nuevaCantidad, total: parseFloat((nuevaCantidad * item.precio).toFixed(2)) }
        : item
    );
    setCarrito(nuevoCarrito);
  };

  const handleEliminarDelCarrito = (id) => {
    const nuevoCarrito = carrito.filter(item => item.id !== id);
    setCarrito(nuevoCarrito);
  };

  const generarFacturaPDF = (venta) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Factura de Venta', 20, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${venta.fecha}`, 20, 40);
    doc.text(`Cliente: ${venta.cliente.nombre}`, 20, 50);
    doc.text(`Cédula: ${venta.cliente.cedula}`, 20, 60);

    const filas = venta.productos.map(p => [
      p.nombre,
      `$${p.precio.toFixed(2)}`,
      p.cantidad,
      `$${p.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Producto', 'Precio', 'Cantidad', 'Total']],
      body: filas,
      startY: 80,
    });

    doc.text(`Total: $${venta.total.toFixed(2)}`, 20, doc.lastAutoTable.finalY + 20);
    doc.save(`Factura_${venta.id}.pdf`);
  };

  const generarTodasLasFacturasPDF = () => {
    if (ventas.length === 0) return;

    const nuevoDoc = new jsPDF();

    ventas.forEach((venta, index) => {
      if (index > 0) nuevoDoc.addPage();

      nuevoDoc.setFontSize(16);
      nuevoDoc.text('Factura de Venta', 20, 20);
      nuevoDoc.setFontSize(12);
      nuevoDoc.text(`Fecha: ${venta.fecha}`, 20, 40);
      nuevoDoc.text(`Cliente: ${venta.cliente.nombre}`, 20, 50);
      nuevoDoc.text(`Cédula: ${venta.cliente.cedula}`, 20, 60);

      const filas = venta.productos.map(p => [
        p.nombre,
        `$${p.precio.toFixed(2)}`,
        p.cantidad,
        `$${p.total.toFixed(2)}`
      ]);

      autoTable(nuevoDoc, {
        head: [['Producto', 'Precio', 'Cantidad', 'Total']],
        body: filas,
        startY: 80,
      });

      nuevoDoc.text(`Total: $${venta.total.toFixed(2)}`, 20, nuevoDoc.lastAutoTable.finalY + 20);
    });

    nuevoDoc.save('Facturas_Todas.pdf');
  };

  const handleConfirmarVenta = () => {
    if (carrito.length === 0) return;

    const cliente = clientes.find(c => String(c.id) === String(clienteSeleccionado));
    if (!cliente) {
      alert('Debe seleccionar un cliente');
      return;
    }

    const productosActualizados = productos.map(p => {
      const itemVenta = carrito.find(c => c.id === p.id);
      return itemVenta ? { ...p, stock: p.stock - itemVenta.cantidad } : p;
    });

    const totalVenta = carrito.reduce((sum, item) => sumarConDecimales(sum, item.total), 0);

    const nuevaVenta = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        cedula: cliente.cedula
      },
      productos: carrito,
      total: totalVenta
    };

    const ventasActualizadas = [...ventas, nuevaVenta];

    localStorage.setItem('ventas', JSON.stringify(ventasActualizadas));
    localStorage.setItem('productos', JSON.stringify(productosActualizados));

    setProductos(productosActualizados);
    setVentas(ventasActualizadas);
    setCarrito([]);
    setClienteSeleccionado('');
    setMensaje('✅ Venta confirmada exitosamente');
    setTimeout(() => setMensaje(''), 4000);
  };

  const handleEliminarVenta = (idVenta) => {
    const venta = ventas.find(v => v.id === idVenta);
    if (!venta) return;

    const productosRestaurados = productos.map(p => {
      const item = venta.productos.find(vp => vp.id === p.id);
      return item ? { ...p, stock: p.stock + item.cantidad } : p;
    });

    const ventasActualizadas = ventas.filter(v => v.id !== idVenta);

    localStorage.setItem('ventas', JSON.stringify(ventasActualizadas));
    localStorage.setItem('productos', JSON.stringify(productosRestaurados));

    setVentas(ventasActualizadas);
    setProductos(productosRestaurados);
    setMensaje('❌ Venta eliminada correctamente');
    setTimeout(() => setMensaje(''), 4000);
  };

  return (
    <div className="container mt-4">
      <h2>Gestión de Ventas</h2>
      <p>Registra una venta seleccionando un cliente, producto y cantidad.</p>

      {mensaje && <Alert variant="info">{mensaje}</Alert>}

      <Form className="mb-4">
        <Form.Group className="mb-2">
          <Form.Label>Cliente</Form.Label>
          <Form.Select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} required>
            <option value="">Seleccione un cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} - CI: {c.cedula}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Producto</Form.Label>
          <Form.Select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} required>
            <option value="">Seleccione un producto</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock}) - ${p.precio}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Cantidad</Form.Label>
          <Form.Control type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
        </Form.Group>

        <Button onClick={handleAgregarAlCarrito} variant="success" className="me-2">Agregar al carrito</Button>
        <Button onClick={handleConfirmarVenta} variant="primary" disabled={carrito.length === 0}>Confirmar Venta</Button>
        <Button onClick={() => setCarrito([])} variant="secondary" className="ms-2" disabled={carrito.length === 0}>Limpiar Carrito</Button>
      </Form>

      <h4>Carrito de venta</h4>
      {carrito.length > 0 ? (
        <>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.nombre}</td>
                  <td>${item.precio.toFixed(2)}</td>
                  <td>
                    <Form.Control
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value))}
                    />
                  </td>
                  <td>${item.total.toFixed(2)}</td>
                  <td><Button variant="danger" size="sm" onClick={() => handleEliminarDelCarrito(item.id)}>Eliminar</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <h5>Total del carrito: ${carrito.reduce((acc, item) => sumarConDecimales(acc, item.total), 0).toFixed(2)}</h5>
        </>
      ) : <p>No hay productos en el carrito.</p>}

      <h4 className="mt-5">Historial de Ventas</h4>

      <Button variant="dark" className="mb-3" onClick={generarTodasLasFacturasPDF} disabled={ventas.length === 0}>
        Exportar todas las facturas (PDF)
      </Button>

      {ventas.length > 0 ? (
        <Table striped bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Detalle</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta, index) => (
              <tr key={venta.id}>
                <td>{index + 1}</td>
                <td>{venta.fecha}</td>
                <td>
                  <strong>{venta.cliente.nombre}</strong><br />
                  <small>CI: {venta.cliente.cedula}</small>
                </td>
                <td>${venta.total.toFixed(2)}</td>
                <td>
                  {venta.productos.map((p, i) => (
                    <div key={i}>{p.nombre} x{p.cantidad} (${p.total.toFixed(2)})</div>
                  ))}
                </td>
                <td>
                  <Button size="sm" variant="info" className="me-2" onClick={() => generarFacturaPDF(venta)}>
                    Imprimir
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleEliminarVenta(venta.id)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <p>No hay ventas registradas.</p>}
    </div>
  );
}

export default Ventas;
