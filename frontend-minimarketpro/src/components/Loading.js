// src/components/Loading.js
import React from 'react';
import { Spinner } from 'react-bootstrap';

function Loading({ message = "Cargando..." }) {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <div className="text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="text-muted">{message}</p>
      </div>
    </div>
  );
}

export default Loading;