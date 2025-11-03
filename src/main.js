// Configuración de la API (detección automática de entorno)
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Verificar autenticación
function checkAuthentication() {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  if (isAuthenticated !== 'true' || !usuario.id) {
    window.location.href = '/login.html';
    return null;
  }
  
  return usuario;
}

// Cerrar sesión
window.logout = function() {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('usuario');
    window.location.href = '/login.html';
  }
};

// Mostrar información del usuario logueado
function displayUserInfo(usuario) {
  const userInfoDiv = document.getElementById('userInfo');
  if (userInfoDiv) {
    userInfoDiv.innerHTML = `
      <div class="user-profile">
        <span>👤 ${usuario.nombre} ${usuario.apellido}</span>
        <button onclick="logout()" class="btn btn-secondary btn-sm">Cerrar Sesión</button>
      </div>
    `;
  }
}

// Verificar estado del servidor
async function checkServerStatus() {
  const statusDiv = document.getElementById('status');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    statusDiv.innerHTML = `
      <div class="status-ok">
        <span class="status-icon">✅</span>
        <div>
          <strong>Servidor:</strong> ${data.message}
        </div>
      </div>
    `;
    
    // Verificar conexión a la base de datos
    const dbResponse = await fetch(`${API_URL}/db-test`);
    const dbData = await dbResponse.json();
    
    statusDiv.innerHTML += `
      <div class="status-ok">
        <span class="status-icon">✅</span>
        <div>
          <strong>Base de datos:</strong> ${dbData.message}
        </div>
      </div>
    `;
  } catch (error) {
    statusDiv.innerHTML = `
      <div class="status-error">
        <span class="status-icon">❌</span>
        <div>
          <strong>Error:</strong> No se puede conectar al servidor
        </div>
      </div>
    `;
  }
}

// Cargar usuarios
async function loadUsers() {
  const usersListDiv = document.getElementById('usersList');
  
  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    if (users.length === 0) {
      usersListDiv.innerHTML = '<p class="empty-message">No hay usuarios registrados</p>';
      return;
    }
    
    usersListDiv.innerHTML = users.map(user => `
      <div class="user-card" data-id="${user.id}">
        <div class="user-info">
          <h4>${user.nombre} ${user.apellido}</h4>
          <p><strong>Email:</strong> ${user.correo}</p>
          ${user.telefono ? `<p><strong>Teléfono:</strong> ${user.telefono}</p>` : ''}
          <p><strong>Documento:</strong> ${user.numero_documento}</p>
          <small>Creado: ${new Date(user.creado_en).toLocaleDateString('es-ES')}</small>
          <span class="status-badge ${user.activo ? 'active' : 'inactive'}">
            ${user.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div class="user-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Desactivar</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    usersListDiv.innerHTML = `<p class="error-message">Error al cargar usuarios: ${error.message}</p>`;
  }
}

// Crear usuario
async function createUser(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const userData = {
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    correo: formData.get('correo'),
    telefono: formData.get('telefono'),
    numero_documento: formData.get('numero_documento'),
    hash_contrasena: formData.get('contrasena') // En producción, deberías hashear esto en el backend
  };
  
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      form.reset();
      await loadUsers();
      alert('Usuario creado exitosamente');
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert(`Error al crear usuario: ${error.message}`);
  }
}

// Eliminar usuario
window.deleteUser = async function(id) {
  if (!confirm('¿Estás seguro de desactivar este usuario?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await loadUsers();
      alert('Usuario desactivado exitosamente');
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert(`Error al desactivar usuario: ${error.message}`);
  }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación primero
  const usuario = checkAuthentication();
  if (!usuario) return; // Si no está autenticado, ya fue redirigido
  
  // Mostrar información del usuario
  displayUserInfo(usuario);
  
  checkServerStatus();
  loadUsers();
  
  document.getElementById('userForm').addEventListener('submit', createUser);
  document.getElementById('refreshUsers').addEventListener('click', loadUsers);
});
