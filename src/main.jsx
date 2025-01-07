import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import axiosInstance from './intercepters/axiosInstance.js';  // Direct import

// Make axiosInstance available globally if needed
window.axios = axiosInstance;
console.log( "hello",window.axios); // Check if axiosInstance is available globally

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
