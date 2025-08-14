// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { useAuth } from '../AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const exito = await login(usuario, contrasena);
      if (exito) {
        navigate('/');
      } else {
        setError('❌ Usuario o contraseña incorrectos');
      }
    } catch (error) {
      setError('❌ Error de conexión. Verifica que el servidor esté ejecutándose.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '85vh' }}>
      <Card style={{ width: '400px' }} className="p-4 shadow">
        <h3 className="text-center mb-4">Iniciar Sesión</h3>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        {/* Credenciales de prueba */}
        <Alert variant="info" className="small">
          <strong>Credenciales de prueba:</strong><br />
          • admin / admin123 (Administrador)<br />
          • kenny / kenny123 (Empleado)<br />
          • ricardo / ricardo123 (Empleado)
        </Alert>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese su usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              placeholder="Ingrese su contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default Login;