// Módulo de solicitudes de mantenimiento
// Permite ver, crear y asignar personal a solicitudes de mantenimiento

import { obtenerSolicitudes, crearSolicitud, asignarPersonal, obtenerPersonal, obtenerDepartamentos } from '../utils/mantenimiento-api.js';
import { API_URL } from '../utils/api.js';

const moduloSolicitudesMantenimiento = {
  render: async function(container) {
    container.innerHTML = `
      <h1>Solicitudes de Mantenimiento</h1>
      <button id="btn-nueva-solicitud" class="btn-nueva-solicitud">Nueva Solicitud</button>
      <div id="form-nueva-solicitud-modal" style="display:none;"></div>
      <div id="lista-solicitudes"></div>
      <div id="form-asignar-modal" style="display:none;"></div>
    `;
    
    // Estilo dinámico para el botón 'Nueva Solicitud'
    if (!document.getElementById('estilo-btn-nueva-solicitud')) {
      const style = document.createElement('style');
      style.id = 'estilo-btn-nueva-solicitud';
      style.innerHTML = `
        .btn-nueva-solicitud {
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          box-shadow: 0 2px 12px #0002;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
        }
        .btn-nueva-solicitud:hover, .btn-nueva-solicitud:focus {
          background: #2563eb;
          box-shadow: 0 4px 18px #2563eb33;
          transform: translateY(-2px) scale(1.04);
        }
      `;
      document.head.appendChild(style);
    }
    
    this.cargarSolicitudes();
    document.getElementById('btn-nueva-solicitud').onclick = () => this.mostrarFormularioNuevaSolicitud();
  },

  cargarSolicitudes: async function() {
    // Agregar estilos dinámicos para el select de estado y el botón
    if (!document.getElementById('estilo-select-estado')) {
      const style = document.createElement('style');
      style.id = 'estilo-select-estado';
      style.innerHTML = `
        .select-estado {
          background: #1e293b;
          color: #f1f5f9;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 7px 28px 7px 12px;
          font-size: 1rem;
          font-weight: 500;
          box-shadow: 0 2px 8px #0002;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          cursor: pointer;
          appearance: none;
          position: relative;
        }
        .select-estado:focus, .select-estado:hover {
          border-color: #6366f1 !important;
          box-shadow: 0 2px 8px #6366f1133;
        }
        .select-estado::-ms-expand {
          display: none;
        }
        .select-estado {
          background-image: url('data:image/svg+xml;utf8,<svg fill="%23f1f5f9" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 7l3 3 3-3"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 18px 18px;
        }
        .solicitud-item button {
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 22px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px #0002;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .solicitud-item button:hover, .solicitud-item button:focus {
          background: #2563eb;
        }
        .badge-estado {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-left: 10px;
        }
        .badge-pendiente-aprobacion {
          background: #ff9800;
          color: white;
          animation: pulse-orange 2s infinite;
        }
        .badge-rechazada {
          background: #f44336;
          color: white;
        }
        .badge-en-proceso {
          background: #3b82f6;
          color: white;
        }
        .badge-resuelto {
          background: #10b981;
          color: white;
        }
        .badge-pendiente {
          background: #f59e0b;
          color: white;
        }
        .badge-cancelado {
          background: #6b7280;
          color: white;
        }
        @keyframes pulse-orange {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `;
      document.head.appendChild(style);
    }
    
    const lista = document.getElementById('lista-solicitudes');
    lista.innerHTML = '';
    
    try {
      const solicitudes = await obtenerSolicitudes();
      
      if (!solicitudes.length) {
        lista.innerHTML = '<p>No hay solicitudes registradas.</p>';
        return;
      }
      
      lista.innerHTML = solicitudes.map(s => {
        const estadoColor = {
          pendiente: '#f59e0b',
          en_proceso: '#3b82f6',
          resuelto: '#10b981',
          cancelado: '#ef4444',
          pendiente_aprobacion: '#ff9800',
          rechazada: '#f44336'
        }[s.estado] || '#6366f1';

        // Traducir estado para mostrar
        const estadoTexto = {
          pendiente: 'Pendiente',
          en_proceso: 'En Proceso',
          resuelto: 'Resuelto',
          cancelado: 'Cancelado',
          pendiente_aprobacion: '⏳ Esperando Aprobación',
          rechazada: '❌ Rechazada'
        }[s.estado] || s.estado;

        // Badge de estado visual
        const badgeEstado = `<span class="badge-estado badge-${s.estado}">${estadoTexto}</span>`;

        // Select para cambiar estado (solo si no está esperando aprobación)
        let selectEstado = '';
        if (s.estado !== 'pendiente_aprobacion') {
          selectEstado = `
            <div style="display:inline-block; margin-left:10px; vertical-align:middle;">
              <select data-id="${s.id}" class="select-estado">
                <option value="pendiente" ${s.estado==='pendiente'?'selected':''}>Pendiente</option>
                <option value="en_proceso" ${s.estado==='en_proceso'?'selected':''}>En Proceso</option>
                <option value="resuelto" ${s.estado==='resuelto'?'selected':''}>Resuelto</option>
                <option value="cancelado" ${s.estado==='cancelado'?'selected':''}>Cancelado</option>
              </select>
            </div>
          `;
        }

        // Botón de acción según el estado
        let botonAccion = '';
        if (s.estado === 'pendiente' || s.estado === 'rechazada') {
          botonAccion = `<button onclick="window.moduloSolicitudesMantenimiento.mostrarFormularioAsignar(${s.id})">Asignar Personal</button>`;
        } else if (s.estado === 'pendiente_aprobacion') {
          botonAccion = `
            <button style="background:#ff9800;" disabled title="Esperando respuesta del personal">
              ⏳ Esperando Aprobación
            </button>
            <button style="background:#f44336; margin-left:10px;" onclick="window.moduloSolicitudesMantenimiento.mostrarFormularioAsignar(${s.id})">
              Reasignar
            </button>
          `;
        } else if (s.estado === 'en_proceso') {
          botonAccion = `<button style="background:#10b981;" onclick="window.moduloSolicitudesMantenimiento.marcarResuelto(${s.id})">✓ Marcar Resuelto</button>`;
        }

        // Formatear fecha y hora programada
        let fechaProgramada = '';
        if (s.fecha_progamada) {
          if (typeof s.fecha_progamada === 'string' && s.fecha_progamada.includes('T')) {
            fechaProgramada = s.fecha_progamada.split('T')[0];
          } else {
            fechaProgramada = s.fecha_progamada;
          }
        }
        
        let horaProgramada = '';
        if (s.hora_programada && typeof s.hora_programada === 'string' && s.hora_programada.trim() !== '') {
          if (s.hora_programada.includes('T')) {
            horaProgramada = s.hora_programada.split('T')[1].substring(0,5);
          } else {
            const partes = s.hora_programada.split(':');
            if (partes.length >= 2) {
              horaProgramada = `${partes[0]}:${partes[1]}`;
            }
          }
        }

        // Mensaje especial para estados de aprobación
        let mensajeEspecial = '';
        if (s.estado === 'pendiente_aprobacion') {
          mensajeEspecial = `
            <div style="background:#fff3e0;border-left:4px solid #ff9800;padding:10px;margin-top:10px;border-radius:6px;">
              <strong>⏳ Esperando confirmación del personal</strong><br>
              <span style="font-size:0.9rem;color:#666;">Se ha enviado un email a <strong>${s.personal_nombre} ${s.personal_apellido}</strong> para que acepte o rechace esta solicitud.</span>
            </div>
          `;
        } else if (s.estado === 'rechazada') {
          mensajeEspecial = `
            <div style="background:#ffebee;border-left:4px solid #f44336;padding:10px;margin-top:10px;border-radius:6px;">
              <strong>❌ Solicitud rechazada por el personal</strong><br>
              <span style="font-size:0.9rem;color:#666;">Por favor, asigna a otro personal disponible.</span>
            </div>
          `;
        }

        return `
        <div class="solicitud-item" style="background: #23293a; border-radius: 14px; box-shadow: 0 4px 24px #0003; margin-bottom: 1.2rem; padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 0.7rem; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="font-weight: bold; font-size: 1.1rem; color: #f1f5f9; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="background: #334155; border-radius: 6px; padding: 2px 12px; color: #f1f5f9;">Depto: ${s.departamento_numero || s.departamento_id}</span>
              ${badgeEstado}
              ${selectEstado}
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              ${botonAccion}
            </div>
          </div>
          <div style="color: #cbd5e1; font-size: 1rem; margin-bottom: 2px;"><b>Descripción:</b> ${s.descripcion}</div>
          <div style="color: #94a3b8; font-size: 0.97rem;">
            <b>Residente:</b> ${s.residente_nombre ? s.residente_nombre + ' ' + (s.residente_apellido || '') : '<span style="color:#64748b">-</span>'}
            &nbsp;|&nbsp; <b>Asignado a:</b> ${s.personal_nombre ? s.personal_nombre + ' ' + (s.personal_apellido || '') : '<span style="color:#64748b">Sin asignar</span>'}
            &nbsp;|&nbsp; <b>Creado:</b> ${s.fecha_creacion ? new Date(s.fecha_creacion).toLocaleString() : '-'}
            ${s.fecha_resolucion ? `&nbsp;|&nbsp; <b>Resuelto:</b> ${new Date(s.fecha_resolucion).toLocaleString()}` : ''}
            ${(fechaProgramada || horaProgramada) ? `&nbsp;|&nbsp; <b>Programado:</b> ${fechaProgramada}${horaProgramada ? ' ' + horaProgramada : ''}` : ''}
          </div>
          ${mensajeEspecial}
        </div>
        `;
      }).join('');
      
      // Manejador para cambio de estado
      lista.querySelectorAll('.select-estado').forEach(select => {
        select.onchange = async (e) => {
          const id = select.getAttribute('data-id');
          const nuevoEstado = select.value;
          try {
            await window.moduloSolicitudesMantenimiento.cambiarEstadoSolicitud(id, nuevoEstado);
            this.cargarSolicitudes();
          } catch (err) {
            alert('Error al cambiar estado');
          }
        };
      });
    } catch (e) {
      lista.innerHTML = '<p>Error al cargar solicitudes.</p>';
    }
  },

  mostrarFormularioNuevaSolicitud: async function() {
    const modalDiv = document.getElementById('form-nueva-solicitud-modal');
    modalDiv.style.display = 'flex';
    modalDiv.style.position = 'fixed';
    modalDiv.style.top = '0';
    modalDiv.style.left = '0';
    modalDiv.style.width = '100vw';
    modalDiv.style.height = '100vh';
    modalDiv.style.background = 'rgba(30,41,59,0.7)';
    modalDiv.style.zIndex = '1000';
    modalDiv.style.alignItems = 'center';
    modalDiv.style.justifyContent = 'center';
    modalDiv.innerHTML = '<div style="min-width:400px;max-width:520px;width:100%;"><p style="color:#f1f5f9;text-align:center;">Cargando...</p></div>';
    
    try {
      // Obtener residentes activos y sus departamentos
      const res = await fetch(`${API_URL}/residentes`);
      const residentes = await res.json();
      // Obtener personal disponible
      const personal = await obtenerPersonal();
      
      modalDiv.innerHTML = `
        <div style="min-width:400px;max-width:520px;width:100%;">
          <form id="nueva-solicitud-form" style="background:#23293a; border-radius:16px; box-shadow:0 4px 24px #0003; padding:2rem 2.2rem; border:1px solid #334155; display:flex; flex-direction:column; gap:1.2rem;">
            <h3 style="color:#f1f5f9;margin:0 0 10px 0;">Nueva Solicitud de Mantenimiento</h3>
            
            <div style="background:#fff3e0;border-left:4px solid #ff9800;padding:12px;border-radius:6px;">
              <p style="margin:0;font-size:0.9rem;color:#663c00;">
                <strong>⚠️ Importante:</strong> Si asignas personal, se enviará un email solicitando su aprobación antes de crear el ticket.
              </p>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              <label style="color:#f1f5f9; font-weight:600; margin-bottom:2px;">RESIDENTE:</label>
              <select name="residente_id" required class="input-dark" style="background:#1e293b; color:#f1f5f9; border:1px solid #334155; border-radius:8px; padding:10px 16px; font-size:1rem; font-weight:500; outline:none;">
                <option value="">Seleccione</option>
                ${residentes.map(r => `<option value="${r.id}" data-depto="${r.departamento_id}">${r.nombre} ${r.apellido} (Depto ${r.departamento_numero})</option>`).join('')}
              </select>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              <label style="color:#f1f5f9; font-weight:600; margin-bottom:2px;">DESCRIPCIÓN:</label>
              <input name="descripcion" required maxlength="255" class="input-dark" style="background:#1e293b; color:#f1f5f9; border:1px solid #334155; border-radius:8px; padding:10px 16px; font-size:1rem; font-weight:500; outline:none;" />
            </div>
            
            <div style="display:flex; gap:1rem;">
              <div style="flex:1; display:flex; flex-direction:column; gap:0.5rem;">
                <label style="color:#f1f5f9; font-weight:600; margin-bottom:2px;">FECHA PROGRAMADA:</label>
                <input type="date" name="fecha_programada" class="input-dark" style="background:#1e293b; color:#f1f5f9; border:1px solid #334155; border-radius:8px; padding:10px 16px; font-size:1rem; font-weight:500; outline:none;" />
              </div>
              <div style="flex:1; display:flex; flex-direction:column; gap:0.5rem;">
                <label style="color:#f1f5f9; font-weight:600; margin-bottom:2px;">HORA PROGRAMADA:</label>
                <input type="time" name="hora_programada" class="input-dark" style="background:#1e293b; color:#f1f5f9; border:1px solid #334155; border-radius:8px; padding:10px 16px; font-size:1rem; font-weight:500; outline:none;" />
              </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              <label style="color:#f1f5f9; font-weight:600; margin-bottom:2px;">ASIGNAR A PERSONAL (Opcional):</label>
              <select name="asignado_a" class="input-dark" style="background:#1e293b; color:#f1f5f9; border:1px solid #334155; border-radius:8px; padding:10px 16px; font-size:1rem; font-weight:500; outline:none;">
                <option value="">Sin asignar (crear como pendiente)</option>
                ${personal.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido} (${p.cargo})</option>`).join('')}
              </select>
              <small style="color:#94a3b8;font-size:0.85rem;">Si asignas personal, se enviará email de aprobación</small>
            </div>
            
            <input type="hidden" name="departamento_id" id="departamento_id_hidden" />
            
            <div style="display:flex; gap:1rem; margin-top:0.5rem;">
              <button type="submit" style="background:#3b82f6; color:#fff; border:none; border-radius:8px; padding:10px 28px; font-weight:600; font-size:1rem; cursor:pointer; box-shadow:0 2px 8px #0002; transition:background 0.2s;">Crear Solicitud</button>
              <button type="button" id="cancelar-nueva-solicitud" style="background:#334155; color:#f1f5f9; border:none; border-radius:8px; padding:10px 28px; font-weight:600; font-size:1rem; cursor:pointer; box-shadow:0 2px 8px #0002; transition:background 0.2s;">Cancelar</button>
            </div>
          </form>
        </div>
      `;
      
      // Estilos dinámicos para los inputs y selects del formulario
      if (!document.getElementById('estilo-input-dark')) {
        const style = document.createElement('style');
        style.id = 'estilo-input-dark';
        style.innerHTML = `
          .input-dark:focus, .input-dark:hover {
            border-color: #6366f1 !important;
            box-shadow: 0 2px 8px #6366f133;
          }
          .input-dark {
            transition: border-color 0.2s, box-shadow 0.2s;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Al cambiar residente, actualizar hidden departamento_id
      const selectResidente = modalDiv.querySelector('select[name="residente_id"]');
      const inputDepto = modalDiv.querySelector('#departamento_id_hidden');
      selectResidente.onchange = function() {
        const selected = selectResidente.options[selectResidente.selectedIndex];
        inputDepto.value = selected.getAttribute('data-depto') || '';
      };
      selectResidente.onchange();
      
      modalDiv.querySelector('#cancelar-nueva-solicitud').onclick = () => {
        modalDiv.style.display = 'none';
      };
      
      modalDiv.querySelector('#nueva-solicitud-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.creado_por = data.residente_id;
        
        if (!data.asignado_a) delete data.asignado_a;
        if (!data.fecha_programada) delete data.fecha_programada;
        if (!data.hora_programada) delete data.hora_programada;
        
        try {
          const resultado = await crearSolicitud(data);
          modalDiv.style.display = 'none';
          
          // Mostrar mensaje según el resultado
          if (resultado.mensaje) {
            alert(resultado.mensaje);
          } else {
            alert('✅ Solicitud creada exitosamente');
          }
          
          setTimeout(() => this.cargarSolicitudes(), 100);
        } catch (err) {
          alert('Error al crear solicitud: ' + err.message);
        }
      };
    } catch (e) {
      modalDiv.innerHTML = '<div style="min-width:400px;max-width:520px;width:100%;"><p style="color:#f44336;text-align:center;">Error al cargar residentes o personal.</p></div>';
    }
  },

  mostrarFormularioAsignar: async function(idSolicitud) {
    const modalDiv = document.getElementById('form-asignar-modal');
    modalDiv.style.display = 'flex';
    modalDiv.style.position = 'fixed';
    modalDiv.style.top = '0';
    modalDiv.style.left = '0';
    modalDiv.style.width = '100vw';
    modalDiv.style.height = '100vh';
    modalDiv.style.background = 'rgba(30,41,59,0.7)';
    modalDiv.style.zIndex = '1000';
    modalDiv.style.alignItems = 'center';
    modalDiv.style.justifyContent = 'center';
    modalDiv.innerHTML = '<div style="min-width:340px;max-width:420px;width:100%;"><p style="color:#f1f5f9;text-align:center;">Cargando personal...</p></div>';
    
    try {
      const personal = await obtenerPersonal();
      
      modalDiv.innerHTML = `
        <div style="min-width:340px;max-width:420px;width:100%;">
          <form id="asignar-personal-form" style="background:#23293a; border-radius:16px; box-shadow:0 4px 24px #0003; padding:2rem 2.2rem; border:1px solid #334155; display:flex; flex-direction:column; gap:1.2rem;">
            <h3 style="color:#f1f5f9;margin:0 0 10px 0;">Asignar Personal</h3>
            
            <div style="background:#fff3e0;border-left:4px solid #ff9800;padding:12px;border-radius:6px;">
              <p style="margin:0;font-size:0.9rem;color:#663c00;">
                <strong>⚠️ Aprobación requerida:</strong> Se enviará un email al personal para que acepte o rechace.
              </p>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              <label style="color:#f1f5f9; font-weight:600; margin-bottom:2px;">PERSONAL:</label>
              <select name="idPersonal" required class="input-dark" style="background:#1e293b; color:#f1f5f9; border:1px solid #334155; border-radius:8px; padding:10px 16px; font-size:1rem; font-weight:500; outline:none;">
                <option value="">Seleccione</option>
                ${personal.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido} (${p.cargo})</option>`).join('')}
              </select>
            </div>
            
            <div style="display:flex; gap:1rem; margin-top:0.5rem;">
              <button type="submit" style="background:#3b82f6; color:#fff; border:none; border-radius:8px; padding:10px 28px; font-weight:600; font-size:1rem; cursor:pointer; box-shadow:0 2px 8px #0002; transition:background 0.2s;">Asignar y Solicitar Aprobación</button>
              <button type="button" id="cancelar-asignar-personal" style="background:#334155; color:#f1f5f9; border:none; border-radius:8px; padding:10px 28px; font-weight:600; font-size:1rem; cursor:pointer; box-shadow:0 2px 8px #0002; transition:background 0.2s;">Cancelar</button>
            </div>
          </form>
        </div>
      `;
      
      modalDiv.querySelector('#cancelar-asignar-personal').onclick = () => {
        modalDiv.style.display = 'none';
      };
      
      modalDiv.querySelector('#asignar-personal-form').onsubmit = async (e) => {
        e.preventDefault();
        const idPersonal = e.target.idPersonal.value;
        try {
          const resultado = await asignarPersonal(idSolicitud, idPersonal);
          modalDiv.style.display = 'none';
          
          if (resultado.mensaje) {
            alert(resultado.mensaje);
          } else {
            alert('✅ Personal asignado. Email de aprobación enviado.');
          }
          
          setTimeout(() => this.cargarSolicitudes(), 100);
        } catch (err) {
          alert('Error al asignar personal: ' + err.message);
        }
      };
    } catch (e) {
      modalDiv.innerHTML = '<div style="min-width:340px;max-width:420px;width:100%;"><p style="color:#f44336;text-align:center;">Error al cargar personal.</p></div>';
    }
  },

  // Marcar como resuelto
  marcarResuelto: async function(id) {
    if (!confirm('¿Marcar esta solicitud como resuelta?')) {
      return;
    }
    try {
      await this.cambiarEstadoSolicitud(id, 'resuelto');
      alert('✅ Solicitud marcada como resuelta');
      this.cargarSolicitudes();
    } catch (err) {
      alert('Error al marcar como resuelto');
    }
  },

  // Cambiar estado de solicitud
  cambiarEstadoSolicitud: async function(id, estado) {
    return await import('../utils/mantenimiento-api.js').then(api => api.cambiarEstadoSolicitud(id, estado));
  }
};

window.moduloSolicitudesMantenimiento = moduloSolicitudesMantenimiento;
export default moduloSolicitudesMantenimiento;