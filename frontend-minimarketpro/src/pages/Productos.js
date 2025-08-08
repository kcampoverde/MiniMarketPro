import React, { useState, useEffect } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';

function Productos() {
  const [productos, setProductos] = useState(() => {
    const guardados = localStorage.getItem("productos");
    return guardados ? JSON.parse(guardados) : [];
  });

  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    categoria: '',
    precio: '',
    stock: '',
    fechaCaducidad: ''
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditarId, setProductoEditarId] = useState(null);
  const [alerta, setAlerta] = useState('');

  // Cargar categorías desde localStorage
  useEffect(() => {
    const cat = localStorage.getItem("categorias");
    if (cat) {
      const ordenadas = JSON.parse(cat).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setCategorias(ordenadas);
    }
  }, []);

  // Guardar productos
  useEffect(() => {
    localStorage.setItem("productos", JSON.stringify(productos));
  }, [productos]);

  const validarDatos = () => {
    const { id, nombre, categoria, precio, stock } = formData;

    if (!id.trim() || !nombre.trim() || !categoria.trim())
      return "Todos los campos son obligatorios.";

    if (productos.some(p => p.id === id && !modoEdicion))
      return "❌ El ID ya existe. Ingrese uno único.";

    if (!/^[a-zA-Z\s]+$/.test(nombre))
      return "❌ El nombre solo debe contener letras.";

    if (parseFloat(precio) < 0 || isNaN(precio))
      return "❌ El precio no puede ser negativo ni estar vacío.";

    if (parseInt(stock) < 0 || isNaN(stock))
      return "❌ El stock no puede ser negativo ni estar vacío.";

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const error = validarDatos();
    if (error) {
      setAlerta(error);
      return;
    }

    if (modoEdicion) {
      const actualizados = productos.map(p =>
        p.id === productoEditarId
          ? {
              ...p,
              ...formData,
              precio: parseFloat(formData.precio),
              stock: parseInt(formData.stock)
            }
          : p
      );
      setProductos(actualizados);
      setModoEdicion(false);
      setProductoEditarId(null);
    } else {
      const nuevo = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        fechaCreacion: new Date().toLocaleDateString()
      };
      setProductos([...productos, nuevo]);
    }

    setAlerta("✅ Producto guardado correctamente.");
    setTimeout(() => setAlerta(''), 3000);

    setFormData({ id: '', nombre: '', categoria: '', precio: '', stock: '', fechaCaducidad: '' });
  };

  return (
    <div className="container mt-4">
      <h2>Registro de Nuevo Producto</h2>
      {alerta && <Alert variant={alerta.startsWith("✅") ? "success" : "danger"}>{alerta}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>ID</Form.Label>
          <Form.Control
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Categoría</Form.Label>
          <Form.Select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat, idx) => (
              <option key={idx} value={cat.nombre}>
                {cat.nombre}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label>Precio ($)</Form.Label>
          <Form.Control
            type="number"
            name="precio"
            min="0"
            step="0.01"
            value={formData.precio}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Stock</Form.Label>
          <Form.Control
            type="number"
            name="stock"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Fecha de caducidad</Form.Label>
          <Form.Control
            type="date"
            name="fechaCaducidad"
            value={formData.fechaCaducidad}
            onChange={handleChange}
          />
        </Form.Group>

        <Button
          type="submit"
          className="mt-2"
          variant={modoEdicion ? "warning" : "primary"}
        >
          {modoEdicion ? "Actualizar" : "Agregar"}
        </Button>
      </Form>
    </div>
  );
}

export default Productos;
