import { API_URL } from '../utils/api.js';
import { showMessage } from '../utils/messages.js';

export function renderRegistrosAcceso() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>🚪 Registros de Acceso</h1>
      <p>Control de entradas y salidas del edificio</p>
    </div>
    <!-- Filtros -->
    <div class="form-card" style="margin-top: 2rem;">
      <h3>🔍 Filtros</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div class="form-group">
          <label for="filtro-tipo">Tipo de Acceso</label>
          <select id="filtro-tipo" onchange="aplicarFiltros()">
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
          </select>
        </div>

        <div class="form-group">
          <label for="filtro-desde">Fecha Desde</label>
          <input type="date" id="filtro-desde" onchange="aplicarFiltros()">
        </div>

        <div class="form-group">
          <label for="filtro-hasta">Fecha Hasta</label>
          <input type="date" id="filtro-hasta" onchange="aplicarFiltros()">
        </div>

        <div class="form-group" style="display: flex; align-items: flex-end;">
          <button class="btn btn-secondary" onclick="limpiarFiltros()" style="width: 100%;">
            🔄 Limpiar Filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Lista de Registros -->
    <div class="data-table" style="margin-top: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>📋 Registros de Acceso</h3>
        <button class="btn btn-primary" onclick="exportarRegistros()">
          📥 Exportar
        </button>
      </div>
      
      <div class="table-container">
        <table class="styled-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Tipo</th>
              <th>Dispositivo</th>
              <th>Ubicación</th>
              <th>Fecha y Hora</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="registrosTableBody">
            <tr>
              <td colspan="7" class="loading">Cargando registros...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <style>
      .table-container {
        overflow-x: auto;
        background: var(--card-bg);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .styled-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }

      .styled-table thead tr {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        text-align: left;
        font-weight: 600;
      }

      .styled-table th,
      .styled-table td {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .styled-table tbody tr {
        transition: background 0.3s ease;
      }

      .styled-table tbody tr:hover {
        background: var(--hover-bg);
      }

      .badge-entrada {
        background: #10b981;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .badge-salida {
        background: #f59e0b;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }
    </style>
  `;

  // Cargar datos
  loadEstadisticas();
  loadRegistros();

  // Hacer funciones globales
  window.aplicarFiltros = aplicarFiltros;
  window.limpiarFiltros = limpiarFiltros;
  window.eliminarRegistro = eliminarRegistro;
  window.exportarRegistros = exportarRegistros;
}

// Cargar estadísticas
async function loadEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/registros-acceso/estadisticas`);
    const stats = await response.json();

    document.getElementById('stat-total').textContent = stats.total_registros || 0;
    document.getElementById('stat-entradas').textContent = stats.total_entradas || 0;
    document.getElementById('stat-salidas').textContent = stats.total_salidas || 0;
    document.getElementById('stat-usuarios').textContent = stats.usuarios_unicos || 0;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar registros
async function loadRegistros() {
  const tbody = document.getElementById('registrosTableBody');
  
  try {
    const tipo = document.getElementById('filtro-tipo')?.value || '';
    const desde = document.getElementById('filtro-desde')?.value || '';
    const hasta = document.getElementById('filtro-hasta')?.value || '';

    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (desde) params.append('fecha_desde', desde);
    if (hasta) params.append('fecha_hasta', hasta);

    const response = await fetch(`${API_URL}/registros-acceso?${params}`);
    const registros = await response.json();

    if (registros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay registros</td></tr>';
      return;
    }

    tbody.innerHTML = registros.map(reg => {
      const fecha = new Date(reg.fecha_hora);
      const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const horaFormateada = fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const badgeClass = reg.tipo === 'entrada' ? 'badge-entrada' : 'badge-salida';
      const iconoTipo = reg.tipo === 'entrada' ? '➡️' : '⬅️';

      return `
        <tr>
          <td>${reg.id}</td>
          <td>
            <strong>${reg.usuario_nombre || 'N/A'}</strong><br>
            <small style="color: var(--text-light);">${reg.usuario_correo || ''}</small>
          </td>
          <td>
            <span class="${badgeClass}">
              ${iconoTipo} ${reg.tipo.charAt(0).toUpperCase() + reg.tipo.slice(1)}
            </span>
          </td>
          <td>${reg.dispositivo_tipo || 'N/A'}</td>
          <td>${reg.dispositivo_ubicacion || 'N/A'}</td>
          <td>
            <strong>${fechaFormateada}</strong><br>
            <small style="color: var(--text-light);">${horaFormateada}</small>
          </td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="eliminarRegistro(${reg.id})">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Error al cargar registros:', error);
    tbody.innerHTML = `<tr><td colspan="7" class="error-message">Error al cargar registros: ${error.message}</td></tr>`;
  }
}

// Aplicar filtros
function aplicarFiltros() {
  loadRegistros();
  loadEstadisticas();
}

// Limpiar filtros
function limpiarFiltros() {
  document.getElementById('filtro-tipo').value = '';
  document.getElementById('filtro-desde').value = '';
  document.getElementById('filtro-hasta').value = '';
  loadRegistros();
  loadEstadisticas();
}

// Eliminar registro
async function eliminarRegistro(id) {
  if (!confirm('¿Estás seguro de eliminar este registro?')) return;

  try {
    const response = await fetch(`${API_URL}/registros-acceso/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showMessage('✅ Registro eliminado exitosamente', 'success');
      loadRegistros();
      loadEstadisticas();
    } else {
      const error = await response.json();
      showMessage(`❌ Error: ${error.error}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Error al eliminar registro: ${error.message}`, 'error');
  }
}

// Exportar registros a CSV
function exportarRegistros() {
  showMessage('📥 Función de exportación en desarrollo', 'info');
}
