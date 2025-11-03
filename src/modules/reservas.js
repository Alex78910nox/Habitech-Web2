import { API_URL } from '../utils/api.js';
import { showMessage } from '../utils/messages.js';

// Variables globales para el calendario
let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let areaFiltro = 'todas';
let reservasDelMes = [];

// Generar opciones de horas cada 30 minutos
function generarOpcionesHoras() {
  const opciones = [];
  for (let hora = 6; hora <= 22; hora++) {
    for (let minutos of [0, 30]) {
      const horaStr = String(hora).padStart(2, '0');
      const minStr = String(minutos).padStart(2, '0');
      const valor = `${horaStr}:${minStr}`;
      const etiqueta = `${horaStr}:${minStr}`;
      opciones.push(`<option value="${valor}">${etiqueta}</option>`);
    }
  }
  return opciones.join('');
}

export function renderReservas() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Reserva de Áreas Comunes</h1>
      <p>Gestiona las reservas con un calendario visual interactivo</p>
    </div>

    <!-- Tabs de navegación -->
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid var(--border-color);">
      <button class="tab-btn active" onclick="cambiarTab('calendario')" id="tab-calendario">
        Calendario
      </button>
      <button class="tab-btn" onclick="cambiarTab('nueva')" id="tab-nueva">
        Nueva Reserva
      </button>
      <button class="tab-btn" onclick="cambiarTab('lista')" id="tab-lista">
        Lista Completa
      </button>
    </div>

    <!-- VISTA CALENDARIO -->
    <div id="vista-calendario" class="tab-content active">
      <!-- Controles del calendario -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button onclick="cambiarMes(-1)" class="btn btn-secondary">
            ◀ Anterior
          </button>
          <h2 id="calendario-titulo" style="margin: 0; min-width: 200px; text-align: center;">
            Octubre 2025
          </h2>
          <button onclick="cambiarMes(1)" class="btn btn-secondary">
            Siguiente ▶
          </button>
          <button onclick="irHoy()" class="btn btn-primary">
            📍 Hoy
          </button>
        </div>
        
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="filtro-area" style="font-weight: 600;">Filtrar por área:</label>
          <select id="filtro-area" onchange="filtrarPorArea(this.value)" style="padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color);">
            <option value="todas">Todas las áreas</option>
          </select>
        </div>
      </div>

      <!-- Leyenda de estados -->
      <div style="display: flex; gap: 1.5rem; margin-bottom: 1rem; padding: 1rem; background: var(--card-bg); border-radius: 8px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="width: 16px; height: 16px; background: #4CAF50; border-radius: 50%; display: inline-block;"></span>
          <span>Confirmada</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="width: 16px; height: 16px; background: #FF9800; border-radius: 50%; display: inline-block;"></span>
          <span>Pendiente</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="width: 16px; height: 16px; background: #9E9E9E; border-radius: 50%; display: inline-block;"></span>
          <span>Cancelada</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="width: 16px; height: 16px; background: #2196F3; border-radius: 50%; display: inline-block;"></span>
          <span>Hoy</span>
        </div>
      </div>

      <!-- Grid del calendario -->
      <div class="calendario-grid" id="calendario-grid">
        <p class="loading">Cargando calendario...</p>
      </div>

      <!-- Panel de detalles -->
      <div id="panel-detalles" style="display: none; margin-top: 2rem; padding: 1.5rem; background: var(--card-bg); border-radius: 12px; border: 2px solid var(--primary-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 id="detalles-titulo" style="margin: 0;">📅 Reservas del día</h3>
          <button onclick="cerrarDetalles()" class="btn btn-secondary btn-sm">✕ Cerrar</button>
        </div>
        <div id="detalles-contenido"></div>
      </div>
    </div>

    <!-- VISTA NUEVA RESERVA -->
    <div id="vista-nueva" class="tab-content" style="display: none;">
      <div class="form-card">
        <h3>➕ Nueva Reserva</h3>
        <p style="color: var(--text-light); margin-bottom: 1rem;">
          Crea una nueva reserva para un área común
        </p>
        <form id="reservaForm">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div class="form-group">
              <label for="area_id">Área Común</label>
              <select id="area_id" name="area_id" required>
                <option value="">Cargando áreas...</option>
              </select>
              <small id="area_precio" style="color: var(--primary-color); display: none; margin-top: 0.5rem;">
                💰 Costo: $0/hora
              </small>
            </div>

            <div class="form-group">
              <label for="residente_id">Residente</label>
              <select id="residente_id" name="residente_id" required>
                <option value="">Cargando residentes...</option>
              </select>
            </div>

            <div class="form-group">
              <label for="fecha_reserva">Fecha de Reserva</label>
              <input type="date" id="fecha_reserva" name="fecha_reserva" required min="${new Date().toISOString().split('T')[0]}">
            </div>

            <div class="form-group">
              <label for="hora_inicio">Hora de Inicio</label>
              <select id="hora_inicio" name="hora_inicio" required>
                <option value="">Seleccione hora</option>
                ${generarOpcionesHoras()}
              </select>
            </div>

            <div class="form-group">
              <label for="hora_fin">Hora de Fin</label>
              <select id="hora_fin" name="hora_fin" required>
                <option value="">Seleccione hora</option>
                ${generarOpcionesHoras()}
              </select>
            </div>

            <div class="form-group" style="display: flex; align-items: flex-end;">
              <div style="width: 100%;">
                <div id="costo_total" style="background: var(--primary-color); color: white; padding: 0.75rem; border-radius: 8px; text-align: center; margin-bottom: 0.5rem; display: none;">
                  <strong>Costo Total: $0.00</strong>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                  Crear Reserva
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- VISTA LISTA -->
    <div id="vista-lista" class="tab-content" style="display: none;">
      <div class="data-table">
        <h3>📋 Todas las Reservas</h3>
        <div class="data-list" id="reservasList">
          <p class="loading">Cargando reservas...</p>
        </div>
      </div>
    </div>

    <style>
      .tab-btn {
        padding: 0.75rem 1.5rem;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-weight: 600;
        color: var(--text-light);
        transition: all 0.3s ease;
      }
      
      .tab-btn:hover {
        color: var(--primary-color);
      }
      
      .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .calendario-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        background: var(--card-bg);
        padding: 1rem;
        border-radius: 12px;
      }

      .calendario-dia-header {
        padding: 0.75rem;
        text-align: center;
        font-weight: 700;
        color: var(--primary-color);
        background: var(--bg-color);
        border-radius: 8px;
      }

      .calendario-dia {
        min-height: 100px;
        padding: 0.5rem;
        background: var(--bg-color);
        border: 2px solid var(--border-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
      }

      .calendario-dia:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .calendario-dia.otro-mes {
        background: var(--bg-color);
        opacity: 0.4;
      }

      .calendario-dia.hoy {
        border-color: #ffffffff;
        background: var(--bg-color);
      }

      .dia-numero {
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
      }

      .reserva-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        margin-bottom: 0.25rem;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .reserva-confirmada {
        background: #4CAF50;
        color: white;
      }

      .reserva-pendiente {
        background: #FF9800;
        color: white;
      }

      .reserva-cancelada {
        background: #9E9E9E;
        color: white;
      }

      @media (max-width: 768px) {
        .calendario-grid {
          gap: 0.25rem;
        }
        
        .calendario-dia {
          min-height: 80px;
          padding: 0.25rem;
        }
        
        .reserva-badge {
          font-size: 0.65rem;
          padding: 0.2rem 0.3rem;
        }
      }
    </style>
  `;

  // Event listeners
  document.getElementById('reservaForm').addEventListener('submit', crearReserva);
  document.getElementById('area_id').addEventListener('change', calcularCostoTotal);
  document.getElementById('hora_inicio').addEventListener('change', calcularCostoTotal);
  document.getElementById('hora_fin').addEventListener('change', calcularCostoTotal);

  // Cargar datos iniciales
  loadAreas();
  loadResidentesReserva();
  cargarCalendario();
  
  // Hacer funciones globales
  window.cambiarTab = cambiarTab;
  window.cambiarMes = cambiarMes;
  window.irHoy = irHoy;
  window.filtrarPorArea = filtrarPorArea;
  window.cerrarDetalles = cerrarDetalles;
  window.verDetallesDia = verDetallesDia;
  window.crearReservaConFecha = crearReservaConFecha;
}

// Función para crear reserva con fecha pre-seleccionada
function crearReservaConFecha(fecha) {
  // Cambiar a la pestaña de nueva reserva
  cambiarTab('nueva');
  
  // Pre-llenar la fecha en el formulario
  setTimeout(() => {
    const inputFecha = document.getElementById('fecha_reserva');
    if (inputFecha) {
      inputFecha.value = fecha;
      inputFecha.focus();
      
      // Mostrar mensaje amigable
      showMessage(`📅 Creando reserva para el ${formatearFechaLegible(fecha)}`, 'info');
    }
  }, 100);
}

// Función auxiliar para formatear fecha legible
function formatearFechaLegible(fecha) {
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  return fechaObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Cambiar entre tabs
function cambiarTab(tab) {
  // Remover active de todos
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
  
  // Activar el seleccionado
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`vista-${tab}`).style.display = 'block';
  
  // Si es lista, cargar reservas
  if (tab === 'lista') {
    loadReservas();
  }
}

// Navegación del calendario
function cambiarMes(direccion) {
  mesActual += direccion;
  
  if (mesActual > 11) {
    mesActual = 0;
    anioActual++;
  } else if (mesActual < 0) {
    mesActual = 11;
    anioActual--;
  }
  
  cargarCalendario();
}

function irHoy() {
  mesActual = new Date().getMonth();
  anioActual = new Date().getFullYear();
  cargarCalendario();
}

function filtrarPorArea(areaId) {
  areaFiltro = areaId;
  renderizarCalendario();
}

function cerrarDetalles() {
  document.getElementById('panel-detalles').style.display = 'none';
}

// Cargar calendario
async function cargarCalendario() {
  try {
    const response = await fetch(`${API_URL}/reservas/calendario?mes=${mesActual + 1}&anio=${anioActual}`);
    reservasDelMes = await response.json();
    renderizarCalendario();
  } catch (error) {
    console.error('Error al cargar calendario:', error);
    showMessage('Error al cargar el calendario', 'error');
  }
}

// Renderizar el calendario
function renderizarCalendario() {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Actualizar título
  document.getElementById('calendario-titulo').textContent = `${meses[mesActual]} ${anioActual}`;
  
  // Calcular días del mes
  const primerDia = new Date(anioActual, mesActual, 1);
  const ultimoDia = new Date(anioActual, mesActual + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const diaSemanaInicio = primerDia.getDay();
  
  // Días del mes anterior para llenar
  const mesAnterior = new Date(anioActual, mesActual, 0);
  const diasMesAnterior = mesAnterior.getDate();
  
  // Fecha de hoy
  const hoy = new Date();
  const esHoy = (dia, mes, anio) => {
    return dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
  };
  
  let html = '';
  
  // Headers de días
  dias.forEach(dia => {
    html += `<div class="calendario-dia-header">${dia}</div>`;
  });
  
  // Días del mes anterior
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const dia = diasMesAnterior - i;
    html += `<div class="calendario-dia otro-mes">
      <div class="dia-numero">${dia}</div>
    </div>`;
  }
  
  // Días del mes actual
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const reservasDia = reservasDelMes.filter(r => {
      if (areaFiltro !== 'todas' && r.area_id !== parseInt(areaFiltro)) {
        return false;
      }
      return r.fecha_reserva === fecha;
    });
    
    const claseHoy = esHoy(dia, mesActual, anioActual) ? 'hoy' : '';
    
    // Si no tiene reservas, al hacer click crea una nueva reserva con esa fecha
    const accionClick = reservasDia.length === 0 
      ? `crearReservaConFecha('${fecha}')` 
      : `verDetallesDia('${fecha}')`;
    
    html += `
      <div class="calendario-dia ${claseHoy}" onclick="${accionClick}">
        <div class="dia-numero">${dia}</div>
        ${reservasDia.length === 0 ? '<div style="text-align: center; color: var(--text-light); font-size: 0.8rem; margin-top: 1rem;">➕ Crear reserva</div>' : ''}
        ${reservasDia.slice(0, 3).map(r => {
          const claseEstado = `reserva-${r.estado}`;
          return `<div class="reserva-badge ${claseEstado}" title="${r.area_nombre} - ${r.hora_inicio}">
            ${r.area_nombre.substring(0, 12)}${r.area_nombre.length > 12 ? '...' : ''}
          </div>`;
        }).join('')}
        ${reservasDia.length > 3 ? `<div style="font-size: 0.7rem; color: var(--text-light; margin-top: 0.25rem;">+${reservasDia.length - 3} más</div>` : ''}
      </div>
    `;
  }
  
  // Días del siguiente mes
  const diasRestantes = 42 - (diaSemanaInicio + diasEnMes); // 6 semanas * 7 días
  for (let dia = 1; dia <= diasRestantes; dia++) {
    html += `<div class="calendario-dia otro-mes">
      <div class="dia-numero">${dia}</div>
    </div>`;
  }
  
  document.getElementById('calendario-grid').innerHTML = html;
}

// Ver detalles de un día específico
function verDetallesDia(fecha) {
  const reservasDia = reservasDelMes.filter(r => {
    if (areaFiltro !== 'todas' && r.area_id !== parseInt(areaFiltro)) {
      return false;
    }
    return r.fecha_reserva === fecha;
  });
  
  if (reservasDia.length === 0) {
    // Si no hay reservas, crear una nueva con esta fecha
    crearReservaConFecha(fecha);
    return;
  }
  
  // Formatear fecha bonita
  const [year, month, day] = fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  document.getElementById('detalles-titulo').innerHTML = `
    📅 Reservas del ${fechaFormateada}
    <button onclick="crearReservaConFecha('${fecha}')" class="btn btn-primary btn-sm" style="margin-left: 1rem;">
      ➕ Nueva reserva este día
    </button>
  `;
  
  const estadoColors = {
    'confirmada': 'active',
    'pendiente': 'inactive',
    'cancelada': 'inactive'
  };

  const estadoIcons = {
    'confirmada': '✅',
    'pendiente': '⏳',
    'cancelada': '❌'
  };
  
  const html = reservasDia.map(reserva => {
    const montoPago = parseFloat(reserva.monto_pago || 0).toFixed(2);
    
    return `
      <div class="data-item" style="margin-bottom: 1rem;">
        <div class="data-item-info">
          <h4>${reserva.area_nombre}</h4>
          <p><strong>Residente:</strong> ${reserva.residente_nombre} ${reserva.residente_apellido} - Depto ${reserva.departamento_numero}</p>
          <p><strong>Horario:</strong> ${reserva.hora_inicio} - ${reserva.hora_fin}</p>
          ${montoPago > 0 ? `<p><strong>💰 Costo:</strong> $${montoPago}</p>` : '<p style="color: var(--success-color);"><strong>✨ Gratis</strong></p>'}
          <span class="status-badge ${estadoColors[reserva.estado]}">
            ${estadoIcons[reserva.estado]} ${reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
          </span>
        </div>
        <div class="data-item-actions">
          ${reserva.estado === 'pendiente' ? `
            <button class="btn btn-primary btn-sm" onclick="confirmarReserva(${reserva.id})">
              ✅ Confirmar
            </button>
          ` : ''}
          ${reserva.estado === 'confirmada' ? `
            <button class="btn btn-secondary btn-sm" onclick="cancelarReserva(${reserva.id})">
              Cancelar
            </button>
          ` : ''}
          <button class="btn btn-danger btn-sm" onclick="eliminarReserva(${reserva.id})">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  document.getElementById('detalles-contenido').innerHTML = html;
  document.getElementById('panel-detalles').style.display = 'block';
  
  // Scroll suave al panel
  document.getElementById('panel-detalles').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Variable global para almacenar las áreas con sus precios
let areasConPrecios = [];

async function loadAreas() {
  try {
    const response = await fetch(`${API_URL}/reservas/areas`);
    const areas = await response.json();
    
    areasConPrecios = areas;
    
    // Para el formulario
    const select = document.getElementById('area_id');
    if (select) {
      select.innerHTML = '<option value="">Seleccione un área</option>' +
        areas.map(area => {
          const precio = area.pago_por_uso || 0;
          return `
            <option value="${area.id}" data-precio="${precio}">
              ${area.nombre} ${precio > 0 ? `($${precio}/hora)` : '(Gratis)'} - Cap: ${area.capacidad || 'N/A'}
            </option>
          `;
        }).join('');
      
      select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const precio = selectedOption.dataset.precio || 0;
        const precioDiv = document.getElementById('area_precio');
        
        if (this.value) {
          precioDiv.textContent = `💰 Costo por hora: $${precio}`;
          precioDiv.style.display = 'block';
        } else {
          precioDiv.style.display = 'none';
        }
      });
    }
    
    // Para el filtro del calendario
    const filtro = document.getElementById('filtro-area');
    if (filtro) {
      filtro.innerHTML = '<option value="todas">Todas las áreas</option>' +
        areas.map(area => `<option value="${area.id}">${area.nombre}</option>`).join('');
    }
  } catch (error) {
    console.error('Error al cargar áreas:', error);
    showMessage('Error al cargar áreas comunes', 'error');
  }
}

function calcularCostoTotal() {
  const areaSelect = document.getElementById('area_id');
  const horaInicio = document.getElementById('hora_inicio').value;
  const horaFin = document.getElementById('hora_fin').value;
  const costoDiv = document.getElementById('costo_total');
  
  if (!areaSelect || !areaSelect.value || !horaInicio || !horaFin) {
    if (costoDiv) costoDiv.style.display = 'none';
    return;
  }
  
  const selectedOption = areaSelect.options[areaSelect.selectedIndex];
  const precioPorHora = parseFloat(selectedOption.dataset.precio) || 0;
  
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
  const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
  
  const minutosInicio = horaInicioH * 60 + horaInicioM;
  const minutosFin = horaFinH * 60 + horaFinM;
  
  if (minutosFin <= minutosInicio) {
    costoDiv.style.display = 'none';
    return;
  }
  
  const minutosTotales = minutosFin - minutosInicio;
  const horas = minutosTotales / 60;
  const costoTotal = (precioPorHora * horas).toFixed(2);
  
  costoDiv.innerHTML = `<strong>⏱️ ${horas.toFixed(1)} hora${horas !== 1 ? 's' : ''} | 💵 Costo Total: $${costoTotal}</strong>`;
  costoDiv.style.display = 'block';
}

async function loadResidentesReserva() {
  try {
    const response = await fetch(`${API_URL}/reservas/residentes`);
    const residentes = await response.json();
    
    const select = document.getElementById('residente_id');
    if (select) {
      select.innerHTML = '<option value="">Seleccione un residente</option>' +
        residentes.map(res => `
          <option value="${res.id}">
            ${res.nombre} ${res.apellido} - Depto ${res.departamento_numero}
          </option>
        `).join('');
    }
  } catch (error) {
    console.error('Error al cargar residentes:', error);
    showMessage('Error al cargar residentes', 'error');
  }
}

export async function loadReservas() {
  const listDiv = document.getElementById('reservasList');
  
  try {
    const response = await fetch(`${API_URL}/reservas`);
    const reservas = await response.json();
    
    if (reservas.length === 0) {
      listDiv.innerHTML = '<p class="empty-state">No hay reservas registradas</p>';
      return;
    }

    const estadoColors = {
      'confirmada': 'active',
      'pendiente': 'inactive',
      'cancelada': 'inactive'
    };

    const estadoIcons = {
      'confirmada': '✅',
      'pendiente': '⏳',
      'cancelada': '❌'
    };

    listDiv.innerHTML = reservas.map(reserva => {
      const fechaStr = reserva.fecha_reserva.split('T')[0];
      const [year, month, day] = fechaStr.split('-').map(Number);
      const fechaObj = new Date(year, month - 1, day);
      
      const fecha = fechaObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const horaInicio = reserva.hora_inicio;
      const horaFin = reserva.hora_fin;
      
      const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
      const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
      const minutosInicio = horaInicioH * 60 + horaInicioM;
      const minutosFin = horaFinH * 60 + horaFinM;
      const horas = (minutosFin - minutosInicio) / 60;
      
      const montoPago = parseFloat(reserva.monto_pago || 0).toFixed(2);

      return `
        <div class="data-item">
          <div class="data-item-info">
            <h4>${reserva.area_nombre}</h4>
            <p><strong>Residente:</strong> ${reserva.residente_nombre} ${reserva.residente_apellido} - Depto ${reserva.departamento_numero}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Horario:</strong> ${horaInicio} - ${horaFin} (${horas.toFixed(1)}h)</p>
            ${montoPago > 0 ? `<p><strong>💰 Costo Total:</strong> ${montoPago}</p>` : '<p style="color: var(--success-color);"><strong>✨ Gratis</strong></p>'}
            <span class="status-badge ${estadoColors[reserva.estado]}">
              ${estadoIcons[reserva.estado]} ${reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
            </span>
          </div>
          <div class="data-item-actions">
            ${reserva.estado === 'pendiente' ? `
              <button class="btn btn-primary btn-sm" onclick="confirmarReserva(${reserva.id})">
                ✅ Confirmar
              </button>
            ` : ''}
            ${reserva.estado === 'confirmada' ? `
              <button class="btn btn-secondary btn-sm" onclick="cancelarReserva(${reserva.id})">
                Cancelar
              </button>
            ` : ''}
            <button class="btn btn-danger btn-sm" onclick="eliminarReserva(${reserva.id})">
              Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    listDiv.innerHTML = `<p class="error-message">Error al cargar reservas: ${error.message}</p>`;
  }
}

async function crearReserva(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    area_id: parseInt(formData.get('area_id')),
    residente_id: parseInt(formData.get('residente_id')),
    fecha_reserva: formData.get('fecha_reserva'),
    hora_inicio: formData.get('hora_inicio'),
    hora_fin: formData.get('hora_fin')
  };

  if (data.hora_inicio >= data.hora_fin) {
    showMessage('La hora de fin debe ser posterior a la hora de inicio', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reservas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      form.reset();
      await cargarCalendario();
      showMessage('✅ Reserva creada exitosamente. Factura enviada por correo.', 'success');
      // Cambiar a vista calendario
      cambiarTab('calendario');
    } else {
      showMessage(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Error al crear reserva: ${error.message}`, 'error');
  }
}

export async function cancelarReserva(id) {
  if (!confirm('¿Estás seguro de cancelar esta reserva?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reservas/${id}/cancelar`, {
      method: 'PUT'
    });
    
    if (response.ok) {
      await cargarCalendario();
      cerrarDetalles();
      showMessage('✅ Reserva cancelada exitosamente', 'success');
    } else {
      const error = await response.json();
      showMessage(`❌ Error: ${error.error}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Error al cancelar reserva: ${error.message}`, 'error');
  }
}

export async function confirmarReserva(id) {
  if (!confirm('¿Confirmar esta reserva?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reservas/${id}/confirmar`, {
      method: 'PUT'
    });
    
    if (response.ok) {
      await cargarCalendario();
      cerrarDetalles();
      showMessage('✅ Reserva confirmada exitosamente', 'success');
    } else {
      const error = await response.json();
      showMessage(`❌ Error: ${error.error}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Error al confirmar reserva: ${error.message}`, 'error');
  }
}

export async function eliminarReserva(id) {
  if (!confirm('¿Estás seguro de eliminar esta reserva permanentemente?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reservas/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await cargarCalendario();
      cerrarDetalles();
      showMessage('✅ Reserva eliminada exitosamente', 'success');
    } else {
      const error = await response.json();
      showMessage(`❌ Error: ${error.error}`, 'error');
    }
  } catch (error) {
    showMessage(`❌ Error al eliminar reserva: ${error.message}`, 'error');
  }
}

// Hacer funciones globales disponibles
window.confirmarReserva = confirmarReserva;
window.cancelarReserva = cancelarReserva;
window.eliminarReserva = eliminarReserva;