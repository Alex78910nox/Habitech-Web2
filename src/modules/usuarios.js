import { API_URL } from '../utils/api.js';
import { showMessage } from '../utils/messages.js';

export function renderUsuarios() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Gestión de Administradores</h1>
      <p>Administra los usuarios administradores del sistema</p>
    </div>

    <div class="form-card">
      <h3>Crear Nuevo Administrador</h3>
      <p style="color: var(--text-light); margin-bottom: 1rem;">
        Los usuarios creados aquí tendrán acceso de administrador al sistema
      </p>
      <form id="userForm">
        <div class="form-group">
          <label for="nombre">Nombre</label>
          <input type="text" id="nombre" name="nombre" placeholder="Ingrese el nombre" required>
        </div>
        <div class="form-group">
          <label for="apellido">Apellido</label>
          <input type="text" id="apellido" name="apellido" placeholder="Ingrese el apellido" required>
        </div>
        <div class="form-group">
          <label for="correo">Correo Electrónico</label>
          <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
            <input type="email" id="correo" name="correo" placeholder="usuario@ejemplo.com" required style="flex: 1;">
            <button type="button" class="btn btn-secondary" onclick="sendEmailVerification('userForm')" style="white-space: nowrap;">
              Enviar Código
            </button>
          </div>
        </div>
        <div class="form-group" id="correoCodeGroup" style="display: none;">
          <label for="codigo_correo">Código de Verificación (Email)</label>
          <input type="text" id="codigo_correo" name="codigo_correo" placeholder="123456" maxlength="6">
          <small style="color: var(--text-light);">Ingresa el código recibido por email</small>
        </div>
        <div class="form-group">
          <label for="telefono">Teléfono</label>
          <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
            <input type="tel" id="telefono" name="telefono" placeholder="70123456 (sin +591)" required style="flex: 1;">
            <button type="button" class="btn btn-secondary" onclick="sendSmsVerification('userForm')" style="white-space: nowrap;">
              Enviar Código
            </button>
          </div>
          <small style="color: var(--text-light);">El código +591 se agregará automáticamente</small>
        </div>
        <div class="form-group" id="telefonoCodeGroup" style="display: none;">
          <label for="codigo_telefono">Código de Verificación (SMS)</label>
          <input type="text" id="codigo_telefono" name="codigo_telefono" placeholder="123456" maxlength="6">
          <small style="color: var(--text-light);">Ingresa el código recibido por SMS</small>
        </div>
        <div class="form-group">
          <label for="numero_documento">Número de Documento</label>
          <input type="text" id="numero_documento" name="numero_documento" placeholder="DNI o Pasaporte" required>
        </div>
        <div class="form-group">
          <label for="contrasena">Contraseña</label>
          <input type="password" id="contrasena" name="contrasena" placeholder="Contraseña segura" required>
        </div>
        <button type="submit" class="btn btn-primary">Crear Administrador</button>
      </form>
    </div>

    <div class="data-table">
      <h3>Lista de Administradores</h3>
      <div class="data-list" id="usersList">
        <p class="loading">Cargando usuarios...</p>
      </div>
    </div>
  `;

  document.getElementById('userForm').addEventListener('submit', createUser);
  loadUsers();
}

export async function loadUsers() {
  const usersListDiv = document.getElementById('usersList');
  
  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    if (users.length === 0) {
      usersListDiv.innerHTML = '<p class="empty-state">No hay usuarios registrados</p>';
      return;
    }
    
    usersListDiv.innerHTML = users.map(user => `
      <div class="data-item">
        <div class="data-item-info">
          <h4>${user.nombre} ${user.apellido}</h4>
          <p><strong>Email:</strong> ${user.correo}</p>
          ${user.telefono ? `<p><strong>Teléfono:</strong> ${user.telefono}</p>` : ''}
          <p><strong>Documento:</strong> ${user.numero_documento}</p>
          <span class="status-badge ${user.activo ? 'active' : 'inactive'}">
            ${user.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div class="data-item-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Desactivar</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    usersListDiv.innerHTML = `<p class="error-message">Error al cargar usuarios: ${error.message}</p>`;
  }
}

async function createUser(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Validar códigos de verificación
  const codigo_correo = formData.get('codigo_correo');
  const codigo_telefono = formData.get('codigo_telefono');
  
  if (!codigo_correo || !codigo_telefono) {
    showMessage('Debes verificar tu correo y teléfono antes de crear la cuenta', 'error');
    return;
  }
  
  // Formatear teléfono con +591
  let telefono = formData.get('telefono');
  if (!telefono.startsWith('+')) {
    telefono = '+591' + telefono.replace(/\s+/g, '');
  }
  
  const userData = {
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    correo: formData.get('correo'),
    telefono: telefono,
    numero_documento: formData.get('numero_documento'),
    hash_contrasena: formData.get('contrasena'),
    rol_id: 1,  // Siempre crear como administrador
    codigo_verif_correo: codigo_correo,
    codigo_verif_telefono: codigo_telefono
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
      document.getElementById('correoCodeGroup').style.display = 'none';
      document.getElementById('telefonoCodeGroup').style.display = 'none';
      await loadUsers();
      showMessage('Administrador creado exitosamente', 'success');
    } else {
      const error = await response.json();
      showMessage(`Error: ${error.error}`, 'error');
    }
  } catch (error) {
    showMessage(`Error al crear usuario: ${error.message}`, 'error');
  }
}

export async function deleteUser(id) {
  if (!confirm('¿Estás seguro de desactivar este administrador?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await loadUsers();
      showMessage('Administrador desactivado exitosamente', 'success');
    } else {
      const error = await response.json();
      showMessage(`Error: ${error.error}`, 'error');
    }
  } catch (error) {
    showMessage(`Error al desactivar usuario: ${error.message}`, 'error');
  }
}
