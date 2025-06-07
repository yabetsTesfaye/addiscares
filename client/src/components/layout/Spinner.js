import React from 'react';
import { Spinner as BootstrapSpinner, Container } from 'react-bootstrap';

const Spinner = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <BootstrapSpinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </BootstrapSpinner>
    </Container>
  );
};

export default Spinner;
