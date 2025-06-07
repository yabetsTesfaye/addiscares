import React from 'react';
import { Alert as BootstrapAlert } from 'react-bootstrap';

/**
 * Reusable Alert component for displaying messages to users
 * @param {string} variant - The alert variant (primary, secondary, success, danger, warning, info)
 * @param {string} message - The message to display
 * @param {boolean} dismissible - Whether the alert can be dismissed
 * @param {function} onClose - Function to call when alert is closed
 * @returns {JSX.Element}
 */
const Alert = ({ variant = 'info', message, dismissible = false, onClose }) => {
  if (!message) return null;

  return (
    <BootstrapAlert 
      variant={variant} 
      dismissible={dismissible}
      onClose={onClose}
      className="my-3"
    >
      {message}
    </BootstrapAlert>
  );
};

export default Alert;
