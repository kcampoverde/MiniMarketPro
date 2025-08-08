import React, { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const CATEGORIAS_KEY = 'categorias';

function Categorias() {
  const [categorias, setCategorias] = useState(() => {
    try {
      const guardadas = JSON.parse(localStorage.getItem(CATEGORIAS_KEY));
      return Array.isArray(guardadas) ? guardadas : [];
    } catch (err) {
      console.error("Error al cargar categorías desde localStorage:", err);
      return [];
    }
  });

  const [nombre, setNombre] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [categoriaEditarId, setCategoriaEditarId] = useState(null);
  const [filtro, setFiltro] = useState(''); // 🔍 Nuevo: filtro de búsqueda

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(categorias));
    } catch (err) {
      console.error("Error al guardar categorías:", err);
    }
  }, [categorias]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (modoEdicion) {
      const actualizadas = categorias.map((cat) =>
        cat.id === categoriaEditarId ? { ...cat, nombre: nombre.trim() } : cat
      );
      setCategorias(actualizadas);
      setModoEdicion(false);
      setCategoriaEditarId(null);
    } else {
      const nuevaCategoria = {
        id: crypto.randomUUID(),
        nombre: nombre.trim()
      };
      setCategorias((prev) => [...prev, nuevaCategoria]);
    }

    setNombre('');
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Eliminar esta categoría?")) {
      setCategorias((prev) => prev.filter((cat) => cat.id !== id));
      if (modoEdicion && categoriaEditarId === id) {
        setModoEdicion(false);
        setCategoriaEditarId(null);
        setNombre('');
      }
    }
  };

  const handleEditar = (cat) => {
    setNombre(cat.nombre);
    setModoEdicion(true);
    setCategoriaEditarId(cat.id);
  };

  // 🔍 Filtrado de categorías
  const categoriasFiltradas = categorias.filter((cat) =>
    cat.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="container mt-4">
      <h2>Gestión de Categorías</h2>
      <p>Administra aquí las categorías de productos.</p>

      {/* Formulario para agregar/editar */}
      <Form onSubmit={handleSubmit} className="mb-4">
        <Form.Group controlId="formNombreCategoria">
          <Form.Label>Nombre de la categoría</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ingrese nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </Form.Group>
        <Button
          variant={modoEdicion ? "warning" : "primary"}
          type="submit"
          className="mt-3"
        >
          {modoEdicion ? "Guardar Cambios" : "Agregar Categoría"}
        </Button>
      </Form>

      {/* 🔍 Barra de búsqueda */}
      <Form.Group controlId="busquedaCategoria" className="mb-3">
        <Form.Control
          type="text"
          placeholder="🔍 Buscar categoría..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </Form.Group>

      {/* Tabla de resultados */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categoriasFiltradas.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center">
                No hay coincidencias.
              </td>
            </tr>
          ) : (
            categoriasFiltradas.map((cat, index) => (
              <tr key={cat.id}>
                <td>{index + 1}</td>
                <td>{cat.nombre}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEditar(cat)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleEliminar(cat.id)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default Categorias;
