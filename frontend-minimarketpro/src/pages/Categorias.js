import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { categoriasAPI } from '../services/api';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [categoriaEditarId, setCategoriaEditarId] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [alerta, setAlerta] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const response = await categoriasAPI.getAll(true);
      setCategorias(response.data);
    } catch (error) {
      setAlerta(`❌ Error cargando categorías: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSubmitting(true);
    setAlerta('');

    try {
      if (modoEdicion) {
        await categoriasAPI.update(categoriaEditarId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null
        });
        setAlerta('✅ Categoría actualizada exitosamente');
        setModoEdicion(false);
        setCategoriaEditarId(null);
      } else {
        await categoriasAPI.create({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null
        });
        setAlerta('✅ Categoría creada exitosamente');
      }

      setNombre('');
      setDescripcion('');
      await cargarCategorias();
    } catch (error) {
      setAlerta(`❌ Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }

    setTimeout(() => setAlerta(''), 3000);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta categoría?")) return;

    try {
      await categoriasAPI.delete(id);
      setAlerta('✅ Categoría eliminada exitosamente');
      await cargarCategorias();
    } catch (error) {
      setAlerta(`❌ Error eliminando categoría: ${error.message}`);
    }

    setTimeout(() => setAlerta(''), 3000);
  };

  const handleEditar = (cat) => {
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || '');
    setModoEdicion(true);
    setCategoriaEditarId(cat.id);
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setCategoriaEditarId(null);
    setNombre('');
    setDescripcion('');
  };

  // Filtrado de categorías
  const categoriasFiltradas = categorias.filter((cat) =>
    cat.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <Spinner animation="border" />
        <p>Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Gestión de Categorías</h2>
      <p>Administra aquí las categorías de productos.</p>

      {alerta && (
        <Alert variant={alerta.startsWith('✅') ? 'success' : 'danger'}>
          {alerta}
        </Alert>
      )}

      {/* Formulario para agregar/editar */}
      <Form onSubmit={handleSubmit} className="mb-4">
        <Form.Group controlId="formNombreCategoria" className="mb-3">
          <Form.Label>Nombre de la categoría</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ingrese nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formDescripcionCategoria" className="mb-3">
          <Form.Label>Descripción (opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Descripción de la categoría"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button
            variant={modoEdicion ? "warning" : "primary"}
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                {modoEdicion ? "Actualizando..." : "Creando..."}
              </>
            ) : (
              modoEdicion ? "Guardar Cambios" : "Agregar Categoría"
            )}
          </Button>

          {modoEdicion && (
            <Button variant="secondary" onClick={cancelarEdicion}>
              Cancelar
            </Button>
          )}
        </div>
      </Form>

      {/* Barra de búsqueda */}
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
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categoriasFiltradas.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">
                {filtro ? 'No hay coincidencias.' : 'No hay categorías registradas.'}
              </td>
            </tr>
          ) : (
            categoriasFiltradas.map((cat, index) => (
              <tr key={cat.id}>
                <td>{index + 1}</td>
                <td>{cat.nombre}</td>
                <td>{cat.descripcion || '-'}</td>
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