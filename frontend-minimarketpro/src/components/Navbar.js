// src/components/Navbar.js
import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function CustomNavbar() {
  const { usuarioActual, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">MiniMarketPro</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            {usuarioActual && (
              <>
                <Nav.Link as={Link} to="/">Inicio</Nav.Link>
                <Nav.Link as={Link} to="/ventas">Ventas</Nav.Link>

                {/* Funciones comunes para admin y empleado */}
                <Nav.Link as={Link} to="/inventario">Inventario</Nav.Link>
                <Nav.Link as={Link} to="/clientes">Clientes</Nav.Link>
                <Nav.Link as={Link} to="/categorias">Categorías</Nav.Link>

                {/* Solo el admin puede ver estas secciones */}
                {usuarioActual.rol === 'admin' && (
                  <>
                    <Nav.Link as={Link} to="/productos">Productos</Nav.Link>
                    <Nav.Link as={Link} to="/usuarios">Usuarios</Nav.Link> {/* futuro módulo */}
                  </>
                )}
              </>
            )}
          </Nav>

          <Nav>
            {usuarioActual ? (
              <NavDropdown title={`👤 ${usuarioActual.usuario} (${usuarioActual.rol})`} id="user-dropdown">
                <NavDropdown.Item onClick={handleLogout}>
                  🔒 Cerrar sesión
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button variant="outline-light" onClick={() => navigate('/login')}>
                Iniciar sesión
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default CustomNavbar;
