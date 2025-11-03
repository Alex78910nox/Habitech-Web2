// Configuración de la API - detecta automáticamente el entorno
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

// Mostrar información del usuario en el perfil sidebar
function displayUserProfile(usuario) {
  const profileDiv = document.getElementById('userProfileSidebar');
  if (profileDiv) {
    profileDiv.innerHTML = `
      <div class="perfil-info">
        <p><strong>${usuario.nombre} ${usuario.apellido}</strong></p>
        <p style="font-size: 0.8rem;">${usuario.correo}</p>
      </div>
    `;
  }
}

// ===== SECCIONES DEL DASHBOARD =====

function renderDashboard() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Bienvenido al panel de administración de Habitech</p>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h3>Total Usuarios</h3>
        <div class="card-content" id="totalUsers">...</div>
      </div>
      <div class="dashboard-card">
        <h3>Total Residentes</h3>
        <div class="card-content" id="totalResidentes">...</div>
      </div>
      <div class="dashboard-card">
        <h3>Departamentos</h3>
        <div class="card-content" id="totalDepartamentos">...</div>
      </div>
    </div>

    <div class="data-table">
      <h3>Actividad Reciente</h3>
      <div class="data-list" id="recentActivity">
        <p class="loading">Cargando actividad...</p>
      </div>
    </div>
  `;

  loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    document.getElementById('totalUsers').textContent = users.length;
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

function renderUsuarios() {
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

async function loadUsers() {
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

window.deleteUser = async function(id) {
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
};

function renderNotificaciones() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Notificaciones</h1>
      <p>Envía notificaciones por correo a los residentes</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
      <!-- Notificación Individual -->
      <div class="form-card">
        <h3>📧 Notificación Individual</h3>
        <p style="color: var(--text-light); margin-bottom: 1rem;">
          Envía una notificación a un residente específico
        </p>
        <form id="notificationIndividualForm">
          <div class="form-group">
            <label for="residente_id">Residente</label>
            <select id="residente_id" name="residente_id" required>
              <option value="">Cargando residentes...</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ind_titulo">Título</label>
            <input type="text" id="ind_titulo" name="titulo" placeholder="Título de la notificación" required>
          </div>
          <div class="form-group">
            <label for="ind_tipo">Tipo de Notificación</label>
            <select id="ind_tipo" name="tipo" required>
              <option value="">Seleccione tipo</option>
              <option value="pago">💰 Pago</option>
              <option value="anuncio">�� Anuncio</option>
              <option value="sistema">⚙️ Sistema</option>
              <option value="chat">💬 Chat</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ind_mensaje">Mensaje</label>
            <textarea id="ind_mensaje" name="mensaje" rows="4" placeholder="Escribe el mensaje de la notificación" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Enviar a Residente</button>
        </form>
      </div>

      <!-- Notificación Masiva -->
      <div class="form-card">
        <h3>📢 Notificación Masiva</h3>
        <p style="color: var(--text-light); margin-bottom: 1rem;">
          Envía una notificación a TODOS los residentes activos
        </p>
        <form id="notificationMasivaForm">
          <div class="form-group">
            <label for="mas_titulo">Título</label>
            <input type="text" id="mas_titulo" name="titulo" placeholder="Título de la notificación" required>
          </div>
          <div class="form-group">
            <label for="mas_tipo">Tipo de Notificación</label>
            <select id="mas_tipo" name="tipo" required>
              <option value="">Seleccione tipo</option>
              <option value="pago">💰 Pago</option>
              <option value="anuncio">📢 Anuncio</option>
              <option value="sistema">⚙️ Sistema</option>
              <option value="chat">💬 Chat</option>
            </select>
          </div>
          <div class="form-group">
            <label for="mas_mensaje">Mensaje</label>
            <textarea id="mas_mensaje" name="mensaje" rows="4" placeholder="Escribe el mensaje de la notificación" required></textarea>
          </div>
          <div style="background: #0d2cf0ff; border: 1px solid #ffffffff; border-radius: 8px; padding: 12px; margin-bottom: 1rem;">
            <strong>⚠️ Atención:</strong> Este mensaje se enviará a TODOS los residentes activos.
          </div>
          <button type="submit" class="btn btn-primary" style="background: #f59e0b;">Enviar a Todos</button>
        </form>
      </div>
    </div>

    <div class="data-table">
      <h3>Historial de Notificaciones Enviadas</h3>
      <div class="data-list" id="notificacionesList">
        <p class="loading">Cargando notificaciones...</p>
      </div>
    </div>
  `;

  document.getElementById('notificationIndividualForm').addEventListener('submit', enviarNotificacionIndividual);
  document.getElementById('notificationMasivaForm').addEventListener('submit', enviarNotificacionMasiva);
  loadResidentesSelector();
  loadNotificaciones();
}

function renderResidentes() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Gestión de Residentes</h1>
      <p>Administra los residentes del edificio y sus departamentos</p>
    </div>

    <div class="form-card">
      <h3>Registrar Nuevo Residente</h3>
      <p style="color: var(--text-light); margin-bottom: 1.5rem;">
        Crea una cuenta de usuario y asigna un departamento al residente
      </p>
      <form id="residenteForm">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <h4 style="color: var(--primary-color); margin-bottom: 1rem;">Datos del Usuario</h4>
            
            <div class="form-group">
              <label for="res_nombre">Nombre</label>
              <input type="text" id="res_nombre" name="nombre" placeholder="Nombre del residente" required>
            </div>
            <div class="form-group">
              <label for="res_apellido">Apellido</label>
              <input type="text" id="res_apellido" name="apellido" placeholder="Apellido del residente" required>
            </div>
            <div class="form-group">
              <label for="res_correo">Correo Electrónico</label>
              <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
                <input type="email" id="res_correo" name="correo" placeholder="usuario@ejemplo.com" required style="flex: 1;">
                <button type="button" class="btn btn-secondary" onclick="sendEmailVerification('residenteForm')" style="white-space: nowrap;">
                  Enviar Código
                </button>
              </div>
            </div>
            <div class="form-group" id="res_correoCodeGroup" style="display: none;">
              <label for="res_codigo_correo">Código de Verificación (Email)</label>
              <input type="text" id="res_codigo_correo" name="codigo_correo" placeholder="123456" maxlength="6">
              <small style="color: var(--text-light);">Ingresa el código recibido por email</small>
            </div>
            <div class="form-group">
              <label for="res_telefono">Teléfono</label>
              <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
                <input type="tel" id="res_telefono" name="telefono" placeholder="1234567" required style="flex: 1;">
                <button type="button" class="btn btn-secondary" onclick="sendSmsVerificationResidente('residenteForm')" style="white-space: nowrap;">
                  Enviar Código
                </button>
              </div>
              <small style="color: var(--text-light);">El código +591 se agregará automáticamente</small>
            </div>
            <div class="form-group" id="res_telefonoCodeGroup" style="display: none;">
              <label for="res_codigo_telefono">Código de Verificación (SMS)</label>
              <input type="text" id="res_codigo_telefono" name="codigo_telefono" placeholder="123456" maxlength="6">
              <small style="color: var(--text-light);">Ingresa el código recibido por SMS</small>
            </div>
            <div class="form-group">
              <label for="res_numero_documento">Número de Documento</label>
              <input type="text" id="res_numero_documento" name="numero_documento" placeholder="DNI o Pasaporte" required>
            </div>
            <div class="form-group">
              <label for="res_contrasena">Contraseña</label>
              <input type="password" id="res_contrasena" name="contrasena" placeholder="Contraseña segura" required>
            </div>
          </div>
          
          <div>
            <h4 style="color: var(--primary-color); margin-bottom: 1rem;">Datos de Residencia</h4>
            
            <div class="form-group">
              <label for="res_departamento_id">Departamento</label>
              <select id="res_departamento_id" name="departamento_id" required>
                <option value="">Cargando departamentos...</option>
              </select>
            </div>
            <div class="form-group">
              <label for="res_tipo_relacion">Tipo de Relación</label>
              <select id="res_tipo_relacion" name="tipo_relacion" required>
                <option value="">Seleccione tipo</option>
                <option value="propietario">Propietario</option>
                <option value="inquilino">Inquilino</option>
                <option value="familiar">Familiar</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="res_fecha_ingreso">Fecha de Ingreso</label>
              <input type="date" id="res_fecha_ingreso" name="fecha_ingreso" required>
            </div>
            <div class="form-group">
              <label for="res_nombre_contacto">Contacto de Emergencia</label>
              <input type="text" id="res_nombre_contacto" name="nombre_contacto_emergencia" placeholder="Nombre del contacto">
            </div>
            <div class="form-group">
              <label for="res_telefono_contacto">Teléfono de Emergencia</label>
              <input type="tel" id="res_telefono_contacto" name="telefono_contacto_emergencia" placeholder="+51 999 999 999">
            </div>
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="res_es_principal" name="es_principal" style="width: auto;">
                <span>Es residente principal del departamento</span>
              </label>
            </div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Registrar Residente</button>
      </form>
    </div>

    <div class="data-table">
      <h3>Lista de Residentes</h3>
      <div class="data-list" id="residentesList">
        <p class="loading">Cargando residentes...</p>
      </div>
    </div>
  `;

  document.getElementById('residenteForm').addEventListener('submit', createResidente);
  loadDepartamentos();
  loadResidentes();
}

async function loadDepartamentos() {
  try {
    const response = await fetch(`${API_URL}/residentes/departamentos`);
    const departamentos = await response.json();
    
    const select = document.getElementById('res_departamento_id');
    select.innerHTML = '<option value="">Seleccione un departamento</option>' +
      departamentos.map(dept => `
        <option value="${dept.id}">
          Depto ${dept.numero} - Piso ${dept.piso} (${dept.estado})
        </option>
      `).join('');
  } catch (error) {
    console.error('Error al cargar departamentos:', error);
  }
}

async function loadResidentes() {
  const listDiv = document.getElementById('residentesList');
  
  try {
    const response = await fetch(`${API_URL}/residentes`);
    const residentes = await response.json();
    
    if (residentes.length === 0) {
      listDiv.innerHTML = '<p class="empty-state">No hay residentes registrados</p>';
      return;
    }
    
    listDiv.innerHTML = residentes.map(res => `
      <div class="data-item">
        <div class="data-item-info">
          <h4>${res.nombre} ${res.apellido}</h4>
          <p><strong>Email:</strong> ${res.correo} | <strong>Teléfono:</strong> ${res.telefono}</p>
          <p><strong>Departamento:</strong> ${res.departamento_numero} - Piso ${res.piso}</p>
          <p><strong>Tipo:</strong> ${res.tipo_relacion} ${res.es_principal ? '(Principal)' : ''}</p>
          <p><strong>Fecha de ingreso:</strong> ${new Date(res.fecha_ingreso).toLocaleDateString('es-ES')}</p>
          ${res.nombre_contacto_emergencia ? 
            `<p><strong>Contacto emergencia:</strong> ${res.nombre_contacto_emergencia} - ${res.telefono_contacto_emergencia}</p>` 
            : ''}
          <span class="status-badge ${res.activo ? 'active' : 'inactive'}">
            ${res.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div class="data-item-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteResidente(${res.usuario_id})">Desactivar</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    listDiv.innerHTML = `<p class="error-message">Error al cargar residentes: ${error.message}</p>`;
  }
}

async function createResidente(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Validar códigos de verificación
  const codigo_correo = formData.get('codigo_correo');
  const codigo_telefono = formData.get('codigo_telefono');
  
  if (!codigo_correo || !codigo_telefono) {
    showMessage('Debes verificar el correo y teléfono del residente antes de crear la cuenta', 'error');
    return;
  }
  
  // Formatear teléfono con +591
  let telefono = formData.get('telefono');
  if (!telefono.startsWith('+')) {
    telefono = '+591' + telefono.replace(/\s+/g, '');
  }
  
  const residenteData = {
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    correo: formData.get('correo'),
    telefono: telefono,
    numero_documento: formData.get('numero_documento'),
    contrasena: formData.get('contrasena'),
    codigo_verif_correo: codigo_correo,
    codigo_verif_telefono: codigo_telefono,
    departamento_id: formData.get('departamento_id'),
    tipo_relacion: formData.get('tipo_relacion'),
    fecha_ingreso: formData.get('fecha_ingreso'),
    nombre_contacto_emergencia: formData.get('nombre_contacto_emergencia'),
    telefono_contacto_emergencia: formData.get('telefono_contacto_emergencia'),
    es_principal: formData.get('es_principal') === 'on'
  };
  
  try {
    const response = await fetch(`${API_URL}/residentes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(residenteData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      form.reset();
      document.getElementById('res_correoCodeGroup').style.display = 'none';
      document.getElementById('res_telefonoCodeGroup').style.display = 'none';
      await loadResidentes();
      showMessage('Residente registrado exitosamente', 'success');
    } else {
      showMessage(`Error: ${data.error}`, 'error');
    }
  } catch (error) {
    showMessage(`Error al registrar residente: ${error.message}`, 'error');
  }
}

window.deleteResidente = async function(usuario_id) {
  if (!confirm('¿Estás seguro de desactivar este residente?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/residentes/${usuario_id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await loadResidentes();
      showMessage('Residente desactivado exitosamente', 'success');
    } else {
      const error = await response.json();
      showMessage(`Error: ${error.error}`, 'error');
    }
  } catch (error) {
    showMessage(`Error al desactivar residente: ${error.message}`, 'error');
  }
};

function renderConfiguracion() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Configuración</h1>
      <p>Configuración del sistema</p>
    </div>

    <div class="empty-state">
      <h3>Módulo en desarrollo</h3>
      <p>Próximamente podrás configurar el sistema</p>
    </div>
  `;
}

// Mostrar mensajes
function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
  messageDiv.textContent = message;
  
  const content = document.getElementById('dashboard-content');
  content.insertBefore(messageDiv, content.firstChild);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// ===== FUNCIONES DE VERIFICACIÓN =====

window.sendEmailVerification = async function(formId) {
  const form = document.getElementById(formId);
  const correo = form.querySelector('[name="correo"]').value;
  const nombre = form.querySelector('[name="nombre"]').value;
  
  if (!correo) {
    showMessage('Ingresa un correo electrónico', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/verification/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, nombre })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Mostrar campo de código (funciona para userForm y residenteForm)
      const codeGroup = document.getElementById('correoCodeGroup') || document.getElementById('res_correoCodeGroup');
      if (codeGroup) codeGroup.style.display = 'block';
      
      // Mostrar mensaje con el código (solo en desarrollo)
      if (data.codigo) {
        showMessage(`Código enviado (DEV): ${data.codigo}. ${data.warning || 'Revisa tu email'}`, 'success');
      } else {
        showMessage('Código enviado a tu correo. Revisa tu bandeja de entrada', 'success');
      }
    } else {
      showMessage(data.error || 'Error al enviar código', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
};

window.sendSmsVerification = async function(formId) {
  const form = document.getElementById(formId);
  const telefono = form.querySelector('[name="telefono"]').value;
  
  if (!telefono) {
    showMessage('Ingresa un número de teléfono', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/verification/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Mostrar campo de código
      const codeGroup = document.getElementById('telefonoCodeGroup');
      if (codeGroup) codeGroup.style.display = 'block';
      
      // Mostrar mensaje con el código (solo en desarrollo)
      if (data.codigo) {
        showMessage(`Código enviado (DEV): ${data.codigo}. ${data.warning || 'Revisa tu SMS'}`, 'success');
      } else {
        showMessage('Código enviado por SMS. Revisa tus mensajes', 'success');
      }
    } else {
      showMessage(data.error || 'Error al enviar código', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
};

window.sendSmsVerificationResidente = async function(formId) {
  const form = document.getElementById(formId);
  const telefono = form.querySelector('[name="telefono"]').value;
  
  if (!telefono) {
    showMessage('Ingresa un número de teléfono', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/verification/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Mostrar campo de código (ID específico para residentes)
      const codeGroup = document.getElementById('res_telefonoCodeGroup');
      if (codeGroup) codeGroup.style.display = 'block';
      
      // Mostrar mensaje con el código (solo en desarrollo)
      if (data.codigo) {
        showMessage(`Código enviado (DEV): ${data.codigo}. ${data.warning || 'Revisa tu SMS'}`, 'success');
      } else {
        showMessage('Código enviado por SMS. Revisa tus mensajes', 'success');
      }
    } else {
      showMessage(data.error || 'Error al enviar código', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
};

// ===== FUNCIONES DE NOTIFICACIONES =====

async function loadResidentesSelector() {
  try {
    const response = await fetch(`${API_URL}/notificaciones/residentes`);
    const residentes = await response.json();
    
    const select = document.getElementById('residente_id');
    select.innerHTML = '<option value="">Seleccione un residente</option>' +
      residentes.map(res => `
        <option value="${res.id}">
          ${res.nombre} ${res.apellido} - ${res.correo}
        </option>
      `).join('');
  } catch (error) {
    console.error('Error al cargar residentes:', error);
  }
}

async function loadNotificaciones() {
  const listDiv = document.getElementById('notificacionesList');
  
  try {
    const response = await fetch(`${API_URL}/notificaciones`);
    const notificaciones = await response.json();
    
    if (notificaciones.length === 0) {
      listDiv.innerHTML = '<p class="empty-state">No hay notificaciones enviadas</p>';
      return;
    }
    
    const iconos = {
      pago: String.fromCodePoint(0x1F4B0),        // 💰
      anuncio: String.fromCodePoint(0x1F4E2),     // 📢
      sistema: String.fromCodePoint(0x2699),      // ⚙️
      chat: String.fromCodePoint(0x1F4AC)         // 💬
    };
    
    listDiv.innerHTML = notificaciones.slice(0, 20).map(notif => `
      <div class="data-item">
        <div class="data-item-info">
          <h4>${iconos[notif.tipo] || String.fromCodePoint(0x1F4EC)} ${notif.titulo}</h4>
          <p><strong>Para:</strong> ${notif.nombre} ${notif.apellido} (${notif.correo})</p>
          <p><strong>Mensaje:</strong> ${notif.mensaje}</p>
          <p><strong>Fecha:</strong> ${new Date(notif.creado_en).toLocaleString('es-ES')}</p>
          <span class="status-badge ${notif.leido ? 'active' : 'inactive'}">
            ${notif.leido ? 'Leído' : 'No leído'}
          </span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    listDiv.innerHTML = `<p class="error-message">Error al cargar notificaciones: ${error.message}</p>`;
  }
}

async function enviarNotificacionIndividual(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    usuario_id: parseInt(formData.get('residente_id')),
    titulo: formData.get('titulo'),
    mensaje: formData.get('mensaje'),
    tipo: formData.get('tipo')
  };
  
  if (!data.usuario_id) {
    showMessage('Selecciona un residente', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/notificaciones/enviar-individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      form.reset();
      await loadNotificaciones();
      showMessage(`Notificación enviada a ${result.usuario.nombre}`, 'success');
    } else {
      showMessage(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showMessage(`Error al enviar notificación: ${error.message}`, 'error');
  }
}

async function enviarNotificacionMasiva(event) {
  event.preventDefault();
  
  if (!confirm('⚠️ ¿Estás seguro de enviar esta notificación a TODOS los residentes?')) {
    return;
  }
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    titulo: formData.get('titulo'),
    mensaje: formData.get('mensaje'),
    tipo: formData.get('tipo')
  };
  
  try {
    showMessage('Enviando notificaciones... Esto puede tardar unos momentos', 'success');
    
    const response = await fetch(`${API_URL}/notificaciones/enviar-masiva`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      form.reset();
      await loadNotificaciones();
      showMessage(
        `✅ Notificación masiva enviada: ${result.estadisticas.emailsEnviados} de ${result.estadisticas.totalResidentes} emails enviados`, 
        'success'
      );
    } else {
      showMessage(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showMessage(`Error al enviar notificación masiva: ${error.message}`, 'error');
  }
}

// Navegación
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-section]');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Actualizar item activo
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Renderizar sección
      const section = item.dataset.section;
      switch(section) {
        case 'dashboard':
          renderDashboard();
          break;
        case 'usuarios':
          renderUsuarios();
          break;
        case 'notificaciones':
          renderNotificaciones();
          break;
        case 'residentes':
          renderResidentes();
          break;
        case 'configuracion':
          renderConfiguracion();
          break;
      }
    });
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  const usuario = checkAuthentication();
  if (!usuario) return;
  
  // Mostrar información del usuario
  displayUserProfile(usuario);
  
  // Configurar navegación
  setupNavigation();
  
  // Renderizar dashboard inicial
  renderDashboard();
});
