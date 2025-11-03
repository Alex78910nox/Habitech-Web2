// Configuración de la API - detecta automáticamente el entorno
export const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';
