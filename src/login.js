// Configuración de la API - detecta automáticamente el entorno
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Toggle password visibility
window.togglePassword = function() {
  const passwordInput = document.getElementById('contrasena');
  const eyeIcon = document.getElementById('eyeIcon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    `;
  } else {
    passwordInput.type = 'password';
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    `;
  }
};

// Mostrar mensaje de error
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  
  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, 5000);
}

// Ocultar mensaje de error
function hideError() {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.classList.remove('show');
}

// Manejar el login
async function handleLogin(event) {
  event.preventDefault();
  hideError();
  
  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  
  // Deshabilitar botón y mostrar loader
  loginBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'block';
  
  const formData = new FormData(event.target);
  const credentials = {
    correo: formData.get('correo'),
    contrasena: formData.get('contrasena')
  };
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Guardar información del usuario en localStorage
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Redireccionar al dashboard
      window.location.href = '/';
    } else {
      showError(data.error || 'Error al iniciar sesión');
      loginBtn.disabled = false;
      btnText.style.display = 'block';
      btnLoader.style.display = 'none';
    }
  } catch (error) {
    showError('Error de conexión. Verifica que el servidor esté corriendo.');
    loginBtn.disabled = false;
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
  }
}

// Event listener
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si ya está autenticado
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  if (isAuthenticated === 'true') {
    window.location.href = '/';
    return;
  }
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Focus en el primer input
  document.getElementById('correo').focus();
});
