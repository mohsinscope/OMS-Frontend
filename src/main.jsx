import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import axiosInstance from './intercepters/axiosInstance.js';  // Direct import

// Make axiosInstance available globally if needed
window.axios = axiosInstance;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
