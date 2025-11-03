import { API_URL } from '../utils/api.js';

export async function renderMetricasConsumo() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Métricas de Consumo</h1>
      <p>Consumo por departamento y servicio</p>
    </div>
    
    <!-- Tabs para alternar entre métricas y anomalías -->
    <div class="tabs-container" style="margin-bottom: 2rem;">
      <button class="tab-btn active" data-tab="metricas" style="padding: 0.75rem 1.5rem; margin-right: 0.5rem; background: var(--primary-color); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">📊 Métricas</button>
      <button class="tab-btn" data-tab="anomalias" style="padding: 0.75rem 1.5rem; background: var(--bg-light); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 0.5rem; cursor: pointer;">⚠️ Anomalías</button>
    </div>
    
    <div id="tabla-metricas-consumo">
      <p class="loading">Cargando métricas...</p>
    </div>
    
    <div id="tabla-anomalias" style="display: none;">
      <p class="loading">Cargando anomalías...</p>
    </div>
  `;

  try {
    const response = await fetch(`${API_URL}/metricas-consumo`);
    const data = await response.json();
    // Agrupar por departamento
    const grupos = {};
    data.forEach(row => {
      if (!grupos[row.departamento]) grupos[row.departamento] = [];
      grupos[row.departamento].push(row);
    });
    let table = `
      <div class="form-card" style="background: var(--card-bg); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); border: 1px solid var(--primary-color);">
        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color); letter-spacing: 0.03em; font-size: 1.4rem;">Métricas de Consumo</h3>
        <div style="width:100%;">
          ${Object.keys(grupos).map((dep, index) => `
            <div style="margin-bottom:2.5rem;">
              <div style="background: linear-gradient(90deg, var(--primary-color) 0%, var(--bg-light) 100%); color: #fff; font-weight:700; padding:1rem 1.5rem; border-radius:0.75rem 0.75rem 0 0; font-size:1.15rem; box-shadow: 0 2px 8px 0 rgba(31,38,135,0.15); border-bottom:2px solid var(--primary-color); letter-spacing:0.02em; display:flex; justify-content:space-between; align-items:center;">
                <span><span style='font-size:1.1rem; font-weight:900;'>🏢</span> Departamento <span style='font-weight:900;'>${dep}</span></span>
                <button class="btn btn-primary btn-reportar-anomalia" data-dep="${grupos[dep][0].departamento_id || (index + 1)}" style="margin-left:1rem;">Reportar anomalía</button>
              </div>
              <table class="table-metricas" style="width:100%; border-collapse:separate; border-spacing:0; background: var(--bg-dark); color: var(--text-color); box-shadow: 0 2px 8px 0 rgba(31,38,135,0.10); border-radius:0 0 0.75rem 0.75rem; overflow:hidden;">
                <thead>
                  <tr style="background: var(--bg-light);">
                      <th style="padding: 1rem; border-bottom: 2px solid var(--primary-color); text-align:center;">ID</th>
                      <th style="padding: 1rem; border-bottom: 2px solid var(--primary-color); text-align:left;">Servicio</th>
                      <th style="padding: 1rem; border-bottom: 2px solid var(--primary-color); text-align:right;">Consumo <span style='font-size:1rem;' title='Simula medidor'>🔄</span></th>
                      <th style="padding: 1rem; border-bottom: 2px solid var(--primary-color); text-align:center;">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  ${grupos[dep].map(row => `
                    <tr style="transition:background 0.2s; border-bottom: 1px solid var(--border-color);">
                      <td style="padding: 0.75rem; text-align:center; font-weight:600;">${row.id}</td>
                      <td style="padding: 0.75rem; text-transform:capitalize; text-align:left;">
                        <span style="display:inline-block; font-size:1.1rem; margin-right:0.5rem;">
                          ${row.tipo_servicio === 'agua' ? '💧' : row.tipo_servicio === 'luz' ? '💡' : row.tipo_servicio === 'gas' ? '🔥' : '🔧'}
                        </span>
                        ${row.tipo_servicio}
                      </td>
                      <td style="padding: 0.75rem; font-weight:700; color: var(--success-color); text-align:right;">${row.consumo}</td>
                      <td style="padding: 0.75rem; color: var(--text-light); text-align:center;">${new Date(row.fecha_registro).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Modal para reportar anomalía -->
      <div id="modal-anomalia" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; justify-content: center; align-items: center;">
        <div style="background: var(--bg-dark); border-radius: 1rem; padding: 2rem; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 1px solid var(--primary-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="color: var(--danger-color); margin: 0;">⚠️ Reportar Anomalía</h3>
            <button id="cerrar-modal-anomalia" style="background: none; border: none; color: var(--text-light); font-size: 1.5rem; cursor: pointer; padding: 0.5rem;">&times;</button>
          </div>
          <div id="contenido-modal-anomalia"></div>
        </div>
      </div>
    `;
    document.getElementById('tabla-metricas-consumo').innerHTML = table;
    
    // Cargar anomalías
    await loadAnomalias();
    // Evento para mostrar modal de anomalía
    document.querySelectorAll('.btn-reportar-anomalia').forEach(btn => {
      btn.addEventListener('click', () => {
        const depId = btn.getAttribute('data-dep');
        const modal = document.getElementById('modal-anomalia');
        const contenido = document.getElementById('contenido-modal-anomalia');
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        console.log('🔍 Departamento ID:', depId);
        console.log('🔍 Tipo de depId:', typeof depId);
        console.log('🔍 depId es undefined?', depId === 'undefined');
        
        // Generar formulario
        contenido.innerHTML = `
          <form id="form-anomalia-modal" class="form-card" style="background: var(--card-bg); box-shadow: 0 8px 32px rgba(31,38,135,0.18); border-radius: 1rem; padding: 2rem; border: 1px solid var(--primary-color);">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label for="tipo" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Tipo de anomalía</label>
              <select id="tipo" name="tipo" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
                <option value="">Selecciona un tipo</option>
                <option value="consumo">Consumo</option>
                <option value="acceso">Acceso</option>
                <option value="iot">IoT</option>
                <option value="seguridad">Seguridad</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label for="descripcion" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Descripción</label>
              <textarea id="descripcion" name="descripcion" rows="3" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;"></textarea>
            </div>
            <div class="form-row" style="display:flex; gap:1rem; margin-bottom:1.25rem;">
              <div class="form-group" style="flex:1;">
                <label for="valor_observado" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Valor observado</label>
                <input type="number" step="0.01" id="valor_observado" name="valor_observado" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
              </div>
              <div class="form-group" style="flex:1;">
                <label for="valor_esperado" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Valor esperado</label>
                <input type="number" step="0.01" id="valor_esperado" name="valor_esperado" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
              </div>
            </div>
            <div class="form-row" style="display:flex; gap:1rem; margin-bottom:1.25rem;">
              <div class="form-group" style="flex:1;">
                <label for="fecha" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Fecha</label>
                <input type="datetime-local" id="fecha" name="fecha" required style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
              </div>
              <div class="form-group" style="flex:1;">
                <label for="severidad" style="font-weight:600; color: var(--primary-color); margin-bottom:0.5rem; display:block;">Severidad</label>
                <select id="severidad" name="severidad" style="width:100%; padding:0.75rem; border-radius:0.5rem; border:1px solid var(--border-color); background:var(--bg-light); font-size:1rem;">
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
              <button type="button" id="cancelar-anomalia" class="btn" style="background: var(--danger-color); color: white; border-radius:0.5rem; padding:0.75rem 1.5rem; font-weight:600; border:none; box-shadow:0 2px 8px rgba(31,38,135,0.10);">Cancelar</button>
              <button type="submit" class="btn btn-primary" style="background: var(--primary-color); color: white; border-radius:0.5rem; padding:0.75rem 1.5rem; font-weight:600; border:none; box-shadow:0 2px 8px rgba(31,38,135,0.10);">Enviar anomalía</button>
            </div>
          </form>
        `;
        
        // Evento para enviar formulario
        document.getElementById('form-anomalia-modal').addEventListener('submit', async (e) => {
          e.preventDefault();
          const form = e.target;
          // Validar y convertir departamento_id
          let deptId = null;
          if (depId && depId !== 'undefined' && depId !== 'null' && depId !== '') {
            deptId = parseInt(depId);
          }
          
          const data = {
            tipo: form.tipo.value,
            descripcion: form.descripcion.value,
            valor_observado: parseFloat(form.valor_observado.value),
            valor_esperado: parseFloat(form.valor_esperado.value),
            fecha: form.fecha.value,
            severidad: form.severidad.value,
            departamento_id: deptId
          };
          
          console.log('📤 Enviando datos:', data);
          console.log('📤 Departamento ID procesado:', deptId);
          try {
            const res = await fetch(`${API_URL}/metricas-consumo/anomalia`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            if (res.ok) {
              modal.style.display = 'none';
              // Mostrar mensaje de éxito
              const successMsg = document.createElement('div');
              successMsg.innerHTML = '<p style="color: var(--success-color); text-align: center; padding: 1rem; background: var(--bg-light); border-radius: 0.5rem; margin: 1rem 0;">✅ ¡Anomalía reportada correctamente!</p>';
              document.getElementById('tabla-metricas-consumo').insertBefore(successMsg, document.getElementById('tabla-metricas-consumo').firstChild);
              setTimeout(() => successMsg.remove(), 3000);
            } else {
              const err = await res.json();
              console.error('❌ Error del servidor:', err);
              contenido.innerHTML += `<p style="color: var(--danger-color); margin-top: 1rem; padding: 1rem; background: var(--bg-light); border-radius: 0.5rem;">Error: ${err.error || err.details || 'Error desconocido'}</p>`;
            }
          } catch (err) {
            console.error('❌ Error de conexión:', err);
            contenido.innerHTML += `<p style="color: var(--danger-color); margin-top: 1rem; padding: 1rem; background: var(--bg-light); border-radius: 0.5rem;">Error de conexión: ${err.message}</p>`;
          }
        });
      });
    });
    
    // Evento para cerrar modal
    document.getElementById('cerrar-modal-anomalia').addEventListener('click', () => {
      document.getElementById('modal-anomalia').style.display = 'none';
    });
    
    // Evento para cancelar
    document.addEventListener('click', (e) => {
      if (e.target.id === 'cancelar-anomalia') {
        document.getElementById('modal-anomalia').style.display = 'none';
      }
    });
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('modal-anomalia').addEventListener('click', (e) => {
      if (e.target.id === 'modal-anomalia') {
        document.getElementById('modal-anomalia').style.display = 'none';
      }
    });
    // Eventos para tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        
        // Actualizar botones activos
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'var(--bg-light)';
          b.style.color = 'var(--text-color)';
          b.style.border = '1px solid var(--border-color)';
        });
        
        btn.classList.add('active');
        btn.style.background = 'var(--primary-color)';
        btn.style.color = 'white';
        btn.style.border = 'none';
        
        // Mostrar/ocultar contenido
        if (tab === 'metricas') {
          document.getElementById('tabla-metricas-consumo').style.display = 'block';
          document.getElementById('tabla-anomalias').style.display = 'none';
        } else if (tab === 'anomalias') {
          document.getElementById('tabla-metricas-consumo').style.display = 'none';
          document.getElementById('tabla-anomalias').style.display = 'block';
        }
      });
    });
    
  } catch (error) {
    document.getElementById('tabla-metricas-consumo').innerHTML = '<p class="error-message">Error al cargar métricas.</p>';
  }
}

// Función para cargar anomalías
async function loadAnomalias() {
  try {
    const response = await fetch(`${API_URL}/anomalias-detectadas`);
    const anomalias = await response.json();
    
    let table = `
      <div class="form-card" style="background: var(--card-bg); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); border: 1px solid var(--primary-color);">
        <h3 style="margin-bottom: 1.5rem; color: var(--danger-color); letter-spacing: 0.03em; font-size: 1.4rem;">⚠️ Anomalías Detectadas</h3>
        <div style="width:100%;">
          <table class="table-anomalias" style="width:100%; border-collapse:separate; border-spacing:0; background: var(--bg-dark); color: var(--text-color); box-shadow: 0 2px 8px 0 rgba(31,38,135,0.10); border-radius:0.75rem; overflow:hidden;">
            <thead>
              <tr style="background: var(--bg-light);">
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:center;">ID</th>
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:left;">Tipo</th>
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:left;">Descripción</th>
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:right;">Valor Obs.</th>
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:right;">Valor Esp.</th>
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:center;">Severidad</th>
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:center;">Departamento</th>
                <th style="padding: 1rem; border-bottom: 2px solid var(--danger-color); text-align:center;">Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${anomalias.map(anomalia => `
                <tr style="transition:background 0.2s; border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 0.75rem; text-align:center; font-weight:600;">${anomalia.id}</td>
                  <td style="padding: 0.75rem; text-transform:capitalize; text-align:left;">
                    <span style="display:inline-block; font-size:1.1rem; margin-right:0.5rem;">
                      ${anomalia.tipo === 'consumo' ? '💧' : anomalia.tipo === 'acceso' ? '🔐' : anomalia.tipo === 'iot' ? '📡' : anomalia.tipo === 'seguridad' ? '🛡️' : '⚠️'}
                    </span>
                    ${anomalia.tipo}
                  </td>
                  <td style="padding: 0.75rem; text-align:left; max-width: 200px; word-wrap: break-word;">${anomalia.descripcion || 'Sin descripción'}</td>
                  <td style="padding: 0.75rem; font-weight:700; color: var(--danger-color); text-align:right;">${anomalia.valor_observado || 'N/A'}</td>
                  <td style="padding: 0.75rem; font-weight:700; color: var(--success-color); text-align:right;">${anomalia.valor_esperado || 'N/A'}</td>
                  <td style="padding: 0.75rem; text-align:center;">
                    <span style="padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.8rem; font-weight: 600; 
                      ${anomalia.severidad === 'alta' ? 'background: #fee2e2; color: #dc2626;' : 
                        anomalia.severidad === 'media' ? 'background: #fef3c7; color: #d97706;' : 
                        'background: #d1fae5; color: #059669;'}">
                      ${anomalia.severidad?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td style="padding: 0.75rem; text-align:center; font-weight:600; color: var(--primary-color);">
                    ${anomalia.departamento_numero ? `Dept. ${anomalia.departamento_numero}` : 'N/A'}
                  </td>
                  <td style="padding: 0.75rem; color: var(--text-light); text-align:center;">${anomalia.fecha ? new Date(anomalia.fecha).toLocaleString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('tabla-anomalias').innerHTML = table;
  } catch (error) {
    document.getElementById('tabla-anomalias').innerHTML = '<p class="error-message">Error al cargar anomalías.</p>';
  }
}
