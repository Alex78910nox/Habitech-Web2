import { API_URL } from '../utils/api.js';
import { showMessage } from '../utils/messages.js';

export function renderNotificaciones() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Notificaciones</h1>
      <p>Envía notificaciones por correo a los residentes</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
      <!-- Notificación Individual -->
      <div class="form-card">
        <h3>Notificación Individual</h3>
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
              <option value="anuncio">📢 Anuncio</option>
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
        <h3>Notificación Masiva</h3>
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
          <div style="background: #3951eaff; border: 1px solid #a3a3a3ff; border-radius: 8px; padding: 12px; margin-bottom: 1rem;">
            <strong>Atención:</strong> Este mensaje se enviará a TODOS los residentes activos.
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
