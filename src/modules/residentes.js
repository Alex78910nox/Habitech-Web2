import { API_URL } from '../utils/api.js';
import { showMessage } from '../utils/messages.js';

export function renderResidentes() {
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
                <input type="tel" id="res_telefono" name="telefono" placeholder="70123456 (sin +591)" required style="flex: 1;">
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

export async function loadResidentes() {
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
  
  const codigo_correo = formData.get('codigo_correo');
  const codigo_telefono = formData.get('codigo_telefono');
  
  if (!codigo_correo || !codigo_telefono) {
    showMessage('Debes verificar el correo y teléfono del residente antes de crear la cuenta', 'error');
    return;
  }
  
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
      headers: { 'Content-Type': 'application/json' },
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

export async function deleteResidente(usuario_id) {
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
}
