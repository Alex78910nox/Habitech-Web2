import { API_URL } from '../utils/api.js';
import { showMessage } from '../utils/messages.js';

export function renderGestionFinanciera() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Gestión Financiera</h1>
      <p>Administra pagos, ingresos y reportes financieros del edificio</p>
    </div>

    <!-- Tabs de Secciones -->
    <div class="tabs-container" style="margin-bottom: 2rem;">
      <button class="tab-btn active" data-tab="pagos">Pagos</button>
      <button class="tab-btn" data-tab="morosos">Morosos</button>
      <button class="tab-btn" data-tab="reservas">Reservas</button>
      <button class="tab-btn" data-tab="nominas">Nómina</button>
      <button class="tab-btn" data-tab="reportes">Reportes</button>
    </div>

    <!-- Sección de Pagos -->
    <div id="seccion-pagos" class="tab-content active">
      <div class="form-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3>Registrar Pago</h3>
          <button type="button" class="btn btn-success" onclick="crearPagosParaTodos()" style="background: #8b5cf6;">
             Crear Pagos para Todos los Residentes
          </button>
        </div>
        <form id="pagoForm">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div class="form-group">
              <label for="residente_pago_id"> Residente / Departamento</label>
              <select id="residente_pago_id" name="residente_id" required>
                <option value="">Cargando residentes...</option>
              </select>
            </div>

            <div class="form-group">
              <label for="mes_pago">Mes de Mantenimiento</label>
              <select id="mes_pago" name="mes_pago" required>
                <option value="">Seleccione el mes</option>
                <option value="1">Enero 2025</option>
                <option value="2">Febrero 2025</option>
                <option value="3">Marzo 2025</option>
                <option value="4">Abril 2025</option>
                <option value="5">Mayo 2025</option>
                <option value="6">Junio 2025</option>
                <option value="7">Julio 2025</option>
                <option value="8">Agosto 2025</option>
                <option value="9">Septiembre 2025</option>
                <option value="10">Octubre 2025</option>
                <option value="11">Noviembre 2025</option>
                <option value="12">Diciembre 2025</option>
              </select>
            </div>

            <!-- Mostrar monto de mantenimiento mensual -->
            <div class="form-group" id="info_mantenimiento" style="grid-column: 1 / -1; display: none;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 3rem;">💰</div>
                <div style="flex: 1;">
                  <div style="font-size: 0.9rem; opacity: 0.9;">Monto de Mantenimiento Mensual</div>
                  <div style="font-size: 2rem; font-weight: bold; margin-top: 0.25rem;" id="monto_mantenimiento_display">$0.00</div>
                  <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem;" id="descripcion_auto">
                    Descripción: --
                  </div>
                  <div style="font-size: 0.85rem; opacity: 0.8;" id="vencimiento_auto">
                    Vence: --
                  </div>
                </div>
              </div>
            </div>

            <!-- Mostrar reservas pendientes -->
            <div class="form-group" id="reservas_pendientes_container" style="grid-column: 1 / -1; display: none;">
              <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.5rem; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                  <div style="font-size: 2.5rem;">🏊</div>
                  <div style="flex: 1;">
                    <div style="font-size: 1.1rem; font-weight: bold;">Reservas de Áreas Pendientes de Pago</div>
                    <div style="font-size: 0.85rem; opacity: 0.9;">El residente tiene reservas sin pagar</div>
                  </div>
                </div>
                <div id="lista_reservas_pendientes" style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                  <!-- Aquí se llenarán las reservas -->
                </div>
                <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-size: 1rem;">
                  <input type="checkbox" id="incluir_reservas" style="width: 20px; height: 20px; cursor: pointer;">
                  <span style="font-weight: bold;">✅ Incluir estas reservas en el pago de mantenimiento</span>
                </label>
                <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem; margin-left: 2rem;">
                  Al marcar esta opción, el monto total incluirá el mantenimiento + las reservas
                </div>
              </div>
            </div>

            <!-- Total a pagar -->
            <div class="form-group" id="total_pagar_container" style="grid-column: 1 / -1; display: none;">
              <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.9rem; opacity: 0.9;">TOTAL A PAGAR</div>
                <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.25rem;" id="total_pagar_display">$0.00</div>
                <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem;" id="desglose_total">
                  --
                </div>
              </div>
            </div>

            <div class="form-group" style="grid-column: 1 / -1;">
              <button type="submit" class="btn btn-primary" style="font-size: 1.1rem; padding: 0.75rem 2rem;">
                💳 Registrar Pago
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Pagos en dos columnas -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Pagos Pendientes -->
        <div class="data-table">
          <h3 style="color: #f59e0b;">Pagos Pendientes</h3>
          <div class="data-list" id="pagosPendientesList">
            <p class="loading">Cargando pagos pendientes...</p>
          </div>
        </div>

        <!-- Pagos Completados -->
        <div class="data-table">
          <h3 style="color: #10b981;">Pagos Completados</h3>
          <div class="data-list" id="pagosPagadosList">
            <p class="loading">Cargando pagos completados...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección de Morosos -->
    <div id="seccion-morosos" class="tab-content" style="display: none;">
      <div class="data-table">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h3 style="color: #ef4444; font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️ Residentes con Pagos Pendientes</h3>
            <p style="color: #9ca3af; font-size: 0.95rem;">Lista completa de residentes que tienen pagos pendientes o atrasados</p>
          </div>
          <span id="contadorMorosos" style="background: #7f1d1d; color: #fca5a5; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 1.1rem;">
            Cargando...
          </span>
        </div>
        <div class="data-list" id="residentesMorososList">
          <p class="loading">Cargando residentes con pagos pendientes...</p>
        </div>
      </div>
    </div>

    <!-- Sección de Reservas -->
    <div id="seccion-reservas" class="tab-content" style="display: none;">
      <div class="form-card">
        <h3>Cobrar Reservas de Áreas</h3>
        <form id="reservasForm">
          <div style="display: grid; gap: 1rem;">
            <div class="form-group">
              <label for="residente_reservas_id"> Residente / Departamento</label>
              <select id="residente_reservas_id" name="residente_id" required>
                <option value="">Cargando residentes...</option>
              </select>
            </div>

            <!-- Mostrar reservas pendientes para cobrar -->
            <div id="reservas_para_cobrar_container" style="display: none;">
              <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                  <div style="font-size: 2.5rem;"></div>
                  <div style="flex: 1;">
                    <div style="font-size: 1.1rem; font-weight: bold;">Reservas Pendientes de Cobro</div>
                    <div style="font-size: 0.85rem; opacity: 0.9;">Selecciona las reservas que deseas cobrar</div>
                  </div>
                </div>
                <div id="lista_reservas_cobrar" style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 6px;">
                  <!-- Aquí se llenarán las reservas con checkboxes -->
                </div>
              </div>

              <!-- Total a cobrar -->
              <div id="total_reservas_container" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 1.5rem; border-radius: 8px; text-align: center; margin-bottom: 1rem;">
                <div style="font-size: 0.9rem; opacity: 0.9;">TOTAL A COBRAR</div>
                <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.25rem;" id="total_reservas_display">$0.00</div>
                <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem;" id="cantidad_reservas_display">
                  0 reservas seleccionadas
                </div>
              </div>

              <button type="submit" class="btn btn-primary" style="font-size: 1.1rem; padding: 0.75rem 2rem; width: 100%;">
                � Cobrar Reservas Seleccionadas
              </button>
            </div>

            <div id="sin_reservas_mensaje" style="display: none;">
              <div style="background: #f3f4f6; padding: 2rem; border-radius: 8px; text-align: center; color: #6b7280;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                <div style="font-size: 1.1rem; font-weight: 600; color: #374151;">No hay reservas pendientes de cobro</div>
                <div style="font-size: 0.9rem; margin-top: 0.5rem;">Este residente no tiene reservas pendientes de pago</div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="data-table">
        <h3>💰 Historial de Cobros de Reservas</h3>
        <div class="data-list" id="reservasFinanzasList">
          <p class="loading">Cargando reservas...</p>
        </div>
      </div>
    </div>

    <!-- Sección de Nóminas -->
    <div id="seccion-nominas" class="tab-content" style="display: none;">
      <div class="form-card">
        <h3 style="color: #ffffff; margin-bottom: 1.5rem;">💼 Crear Nómina Individual</h3>
        <form id="formCrearNomina" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          <div class="form-group">
            <label for="nominaPersonal" style="color: #e0e0e0; font-weight: 600;">Personal *</label>
            <select id="nominaPersonal" required style="padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #2d3748; color: #ffffff;">
              <option value="">Seleccionar personal...</option>
            </select>
          </div>
          <div class="form-group">
            <label for="nominaMes" style="color: #e0e0e0; font-weight: 600;">Mes *</label>
            <select id="nominaMes" required style="padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #2d3748; color: #ffffff;">
              <option value="">Seleccionar mes...</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>
          <div class="form-group">
            <label for="nominaAño" style="color: #e0e0e0; font-weight: 600;">Año *</label>
            <input type="number" id="nominaAño" min="2020" max="2030" required 
                   style="padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #2d3748; color: #ffffff;">
          </div>
          <div class="form-group">
            <label for="nominaSalarioBase" style="color: #e0e0e0; font-weight: 600;">Salario Base (Bs) *</label>
            <input type="number" id="nominaSalarioBase" step="0.01" min="0" readonly 
                   style="background: #1a365d; padding: 0.75rem; border: 1px solid #4299e1; border-radius: 8px; font-size: 1rem; color: #90cdf4; font-weight: 600;">
          </div>
          <div class="form-group">
            <label for="nominaBonos" style="color: #e0e0e0; font-weight: 600;">Bonos (Bs)</label>
            <input type="number" id="nominaBonos" step="0.01" min="0" value="0"
                   style="padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #2d3748; color: #ffffff;">
          </div>
          <div class="form-group">
            <label for="nominaDeducciones" style="color: #e0e0e0; font-weight: 600;">Deducciones (Bs)</label>
            <input type="number" id="nominaDeducciones" step="0.01" min="0" value="0"
                   style="padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #2d3748; color: #ffffff;">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label for="nominaObservaciones" style="color: #e0e0e0; font-weight: 600;">Observaciones</label>
            <textarea id="nominaObservaciones" rows="2" placeholder="Detalles adicionales..."
                      style="padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #2d3748; color: #ffffff; width: 100%; resize: vertical;"></textarea>
          </div>
          <div class="form-group" style="grid-column: 1 / -1; display: flex; align-items: center; gap: 1rem; padding: 1.2rem; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 10px; border: 1px solid #3b82f6;">
            <div style="flex: 1;">
              <strong style="font-size: 1rem; color: #bfdbfe;">Total a Pagar:</strong>
              <span id="nominaTotalDisplay" style="font-size: 1.5rem; color: #93c5fd; font-weight: bold; margin-left: 1rem;">Bs 0.00</span>
            </div>
            <button type="submit" class="btn btn-primary" style="min-width: 180px; font-size: 1rem; padding: 0.8rem 1.2rem;">
              Crear Nómina
            </button>
          </div>
        </form>
      </div>

      <div class="form-card" style="background: #2d3748; border: 1px solid #4a5568; padding: 1rem;">
        <button class="btn btn-success" onclick="crearNominasParaTodos()" 
                style="width: 100%; font-size: 1rem; padding: 0.9rem; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border: none; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);">
          � Crear Nóminas para Todo el Personal
        </button>
      </div>

      <div class="data-table">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: #2d3748; border-radius: 8px; border: 1px solid #4a5568;">
          <h3 style="color: #ffffff; margin: 0;">Lista de Nóminas</h3>
          <div style="display: flex; gap: 1rem;">
            <select id="filtroEstadoNomina" onchange="loadNominas()"
                    style="padding: 0.5rem 1rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 0.95rem; background: #1a202c; color: #e0e0e0; cursor: pointer;">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagado">Pagados</option>
            </select>
            <select id="filtroMesNomina" onchange="loadNominas()"
                    style="padding: 0.5rem 1rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 0.95rem; background: #1a202c; color: #e0e0e0; cursor: pointer;">
              <option value="">Todos los meses</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>
        </div>
        <div class="data-list" id="nominasList">
          <p class="loading">Cargando nóminas...</p>
        </div>
      </div>
    </div>

    <!-- Sección de Reportes -->
    <div id="seccion-reportes" class="tab-content" style="display: none;">
      <div class="dashboard-header" style="margin-bottom: 2rem;">
        <h2>Generación de Reportes Financieros</h2>
        <p>Genera reportes en PDF de pagos, ingresos, nóminas y estado financiero del edificio</p>
      </div>

      <!-- Opciones de Reportes -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
        
        <!-- Reporte de Pagos -->
        <div class="form-card" style="background: linear-gradient(135deg, #10b981, #059669);">
          <div style="color: white;">
            <div style="font-size: 3rem; margin-bottom: 1rem;"></div>
            <h3 style="color: white; margin-bottom: 0.5rem;">Reporte de Pagos</h3>
            <p style="opacity: 0.9; font-size: 0.9rem; margin-bottom: 1.5rem;">
              Estado de pagos (pendientes, atrasados y completados) por período
            </p>
            <div style="display: grid; gap: 0.75rem; margin-bottom: 1rem;">
              <select id="periodo_pagos" onchange="toggleFechasPagos()" style="padding: 0.5rem; border-radius: 4px; border: none;">
                <option value="todos">Todos los Períodos</option>
                <option value="mes">Por Mes Específico</option>
                <option value="rango">Por Rango de Fechas</option>
              </select>
              <div id="selector_mes_pagos" style="display: none;">
                <select id="mes_pagos" style="padding: 0.5rem; border-radius: 4px; border: none; width: 100%;">
                  <option value="1">Enero 2025</option>
                  <option value="2">Febrero 2025</option>
                  <option value="3">Marzo 2025</option>
                  <option value="4">Abril 2025</option>
                  <option value="5">Mayo 2025</option>
                  <option value="6">Junio 2025</option>
                  <option value="7">Julio 2025</option>
                  <option value="8">Agosto 2025</option>
                  <option value="9">Septiembre 2025</option>
                  <option value="10" selected>Octubre 2025</option>
                  <option value="11">Noviembre 2025</option>
                  <option value="12">Diciembre 2025</option>
                </select>
              </div>
              <div id="fechas_pagos" style="display: none; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <input type="date" id="fecha_inicio_pagos" placeholder="Inicio" style="padding: 0.5rem; border-radius: 4px; border: none;">
                <input type="date" id="fecha_fin_pagos" placeholder="Fin" style="padding: 0.5rem; border-radius: 4px; border: none;">
              </div>
            </div>
            <button class="btn" onclick="generarReportePagosPDF()" 
                    style="background: white; color: #059669; width: 100%; font-weight: 600;">
              Generar PDF de Pagos
            </button>
          </div>
        </div>

        <!-- Reporte de Residentes Morosos -->
        <div class="form-card" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
          <div style="color: white;">
            <div style="font-size: 3rem; margin-bottom: 1rem;"></div>
            <h3 style="color: white; margin-bottom: 0.5rem;">Reporte de Morosos</h3>
            <p style="opacity: 0.9; font-size: 0.9rem; margin-bottom: 1.5rem;">
              Lista de residentes con pagos pendientes y deudas acumuladas
            </p>
            <div style="height: 84px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 4px; margin-bottom: 1rem;">
              <div style="text-align: center;">
                <div style="font-size: 0.85rem; opacity: 0.9;">Reporte actualizado al:</div>
                <div style="font-size: 1.1rem; font-weight: 600;">${new Date().toLocaleDateString('es-ES')}</div>
              </div>
            </div>
            <button class="btn" onclick="generarReporteMorososPDF()" 
                    style="background: white; color: #dc2626; width: 100%; font-weight: 600;">
              Generar PDF de Morosos
            </button>
          </div>
        </div>

        <!-- Reporte de Reservas -->
        <div class="form-card" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
          <div style="color: white;">
            <div style="font-size: 3rem; margin-bottom: 1rem;"></div>
            <h3 style="color: white; margin-bottom: 0.5rem;">Reporte de Reservas</h3>
            <p style="opacity: 0.9; font-size: 0.9rem; margin-bottom: 1.5rem;">
              Ingresos por reservas de áreas comunes en el período seleccionado
            </p>
            <div style="display: grid; gap: 0.75rem; margin-bottom: 1rem;">
              <select id="periodo_reservas" onchange="toggleFechasReservas()" style="padding: 0.5rem; border-radius: 4px; border: none;">
                <option value="todos">Todas las Reservas</option>
                <option value="mes">Por Mes Específico</option>
                <option value="rango">Por Rango de Fechas</option>
              </select>
              <div id="selector_mes_reservas" style="display: none;">
                <select id="mes_reservas" style="padding: 0.5rem; border-radius: 4px; border: none; width: 100%;">
                  <option value="1">Enero 2025</option>
                  <option value="2">Febrero 2025</option>
                  <option value="3">Marzo 2025</option>
                  <option value="4">Abril 2025</option>
                  <option value="5">Mayo 2025</option>
                  <option value="6">Junio 2025</option>
                  <option value="7">Julio 2025</option>
                  <option value="8">Agosto 2025</option>
                  <option value="9">Septiembre 2025</option>
                  <option value="10" selected>Octubre 2025</option>
                  <option value="11">Noviembre 2025</option>
                  <option value="12">Diciembre 2025</option>
                </select>
              </div>
              <div id="fechas_reservas" style="display: none; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <input type="date" id="fecha_inicio_reservas" placeholder="Inicio" style="padding: 0.5rem; border-radius: 4px; border: none;">
                <input type="date" id="fecha_fin_reservas" placeholder="Fin" style="padding: 0.5rem; border-radius: 4px; border: none;">
              </div>
            </div>
            <button class="btn" onclick="generarReporteReservasPDF()" 
                    style="background: white; color: #d97706; width: 100%; font-weight: 600;">
              Generar PDF de Reservas
            </button>
          </div>
        </div>

        <!-- Reporte de Nóminas -->
        <div class="form-card" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
          <div style="color: white;">
            <div style="font-size: 3rem; margin-bottom: 1rem;"></div>
            <h3 style="color: white; margin-bottom: 0.5rem;">Reporte de Nóminas</h3>
            <p style="opacity: 0.9; font-size: 0.9rem; margin-bottom: 1.5rem;">
              Gastos de nómina del personal del edificio por período
            </p>
            <div style="display: grid; gap: 0.75rem; margin-bottom: 1rem;">
              <select id="periodo_nominas" onchange="toggleFechasNominas()" style="padding: 0.5rem; border-radius: 4px; border: none;">
                <option value="todos">Todas las Nóminas</option>
                <option value="mes">Por Mes Específico</option>
                <option value="rango">Por Rango de Fechas</option>
              </select>
              <div id="selector_mes_nominas" style="display: none;">
                <select id="mes_nominas" style="padding: 0.5rem; border-radius: 4px; border: none; width: 100%;">
                  <option value="1">Enero 2025</option>
                  <option value="2">Febrero 2025</option>
                  <option value="3">Marzo 2025</option>
                  <option value="4">Abril 2025</option>
                  <option value="5">Mayo 2025</option>
                  <option value="6">Junio 2025</option>
                  <option value="7">Julio 2025</option>
                  <option value="8">Agosto 2025</option>
                  <option value="9">Septiembre 2025</option>
                  <option value="10" selected>Octubre 2025</option>
                  <option value="11">Noviembre 2025</option>
                  <option value="12">Diciembre 2025</option>
                </select>
              </div>
              <div id="fechas_nominas" style="display: none; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <input type="date" id="fecha_inicio_nominas" placeholder="Inicio" style="padding: 0.5rem; border-radius: 4px; border: none;">
                <input type="date" id="fecha_fin_nominas" placeholder="Fin" style="padding: 0.5rem; border-radius: 4px; border: none;">
              </div>
            </div>
            <button class="btn" onclick="generarReporteNominasPDF()" 
                    style="background: white; color: #7c3aed; width: 100%; font-weight: 600;">
              Generar PDF de Nóminas
            </button>
          </div>
        </div>

      </div>

      <!-- Reporte Consolidado -->
      <div class="form-card" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
        <div style="color: white;">
          <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div style="font-size: 4rem;"></div>
            <div style="flex: 1;">
              <h3 style="color: white; margin-bottom: 0.5rem; font-size: 1.5rem;">Reporte Financiero Consolidado</h3>
              <p style="opacity: 0.9; font-size: 1rem;">
                Reporte completo con todos los ingresos, gastos y estado financiero general del edificio
              </p>
            </div>
          </div>
          <div style="display: grid; gap: 1rem;">
            <select id="periodo_consolidado" onchange="toggleFechasConsolidado()" style="padding: 0.75rem; border-radius: 4px; border: none; width: 100%;">
              <option value="todos">Todo el Historial Completo</option>
              <option value="mes">Por Mes Específico</option>
              <option value="rango">Por Rango de Fechas</option>
            </select>
            <div id="selector_mes_consolidado" style="display: none;">
              <select id="mes_consolidado" style="padding: 0.75rem; border-radius: 4px; border: none; width: 100%;">
                <option value="1">Enero 2025</option>
                <option value="2">Febrero 2025</option>
                <option value="3">Marzo 2025</option>
                <option value="4">Abril 2025</option>
                <option value="5">Mayo 2025</option>
                <option value="6">Junio 2025</option>
                <option value="7">Julio 2025</option>
                <option value="8">Agosto 2025</option>
                <option value="9">Septiembre 2025</option>
                <option value="10" selected>Octubre 2025</option>
                <option value="11">Noviembre 2025</option>
                <option value="12">Diciembre 2025</option>
              </select>
            </div>
            <div id="fechas_consolidado" style="display: none; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; opacity: 0.9;">Fecha Inicio</label>
                <input type="date" id="fecha_inicio_consolidado" style="padding: 0.75rem; border-radius: 4px; border: none; width: 100%;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; opacity: 0.9;">Fecha Fin</label>
                <input type="date" id="fecha_fin_consolidado" style="padding: 0.75rem; border-radius: 4px; border: none; width: 100%;">
              </div>
            </div>
            <button class="btn" onclick="generarReporteConsolidadoPDF()" 
                    style="background: white; color: #2563eb; padding: 0.75rem 2rem; font-weight: 600; font-size: 1.1rem; width: 100%;">
              Generar Reporte Consolidado
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Area -->
      <div class="data-table" id="reportePreview" style="display: none; margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3>�️ Vista Previa del Reporte</h3>
          <button class="btn btn-secondary" onclick="cerrarPreview()">Cerrar</button>
        </div>
        <div id="reportePreviewContent" style="background: white; padding: 2rem; border-radius: 8px; color: #1f2937;">
          <!-- Aquí se mostrará la vista previa -->
        </div>
      </div>
    </div>
  `;

  // Setup tabs
  setupTabs();

  // Load data
  loadResidentesPago();
  loadPagos();

  // Event listeners - PAGOS
  document.getElementById('pagoForm').addEventListener('submit', registrarPago);
  document.getElementById('reservasForm').addEventListener('submit', cobrarReservas);
  
  // Auto-llenar información cuando se selecciona residente o mes
  document.getElementById('residente_pago_id').addEventListener('change', actualizarInfoPago);
  document.getElementById('mes_pago').addEventListener('change', actualizarInfoPago);
  
  // Cargar reservas cuando se selecciona residente en tab de reservas
  document.getElementById('residente_reservas_id').addEventListener('change', cargarReservasParaCobrar);
  
  // Recalcular total cuando se marca/desmarca incluir reservas
  document.getElementById('incluir_reservas').addEventListener('change', calcularTotalPago);

  // Event listeners - NÓMINAS
  setupNominasEventListeners();

  // Verificar si viene de un pago exitoso con Stripe
  const urlParams = new URLSearchParams(window.location.search);
  const pagoExitoso = urlParams.get('pago_exitoso');
  const pagoCancelado = urlParams.get('pago_cancelado');

  if (pagoExitoso) {
    // Marcar el pago como pagado automáticamente y descargar el PDF si corresponde
    (async () => {
      try {
        const response = await fetch(`${API_URL}/pagos/${pagoExitoso}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'pagado',
            fecha_pago: new Date().toISOString().split('T')[0],
            metodo_pago: 'online'
          })
        });

        const contentType = response.headers.get('Content-Type');
        if (response.ok && contentType && contentType.includes('application/pdf')) {
          // Descargar el PDF
          const blob = await response.blob();
          const fileName = response.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"','') || 'factura.pdf';
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            a.remove();
          }, 100);
          showMessage(`✅ ¡Pago procesado exitosamente con Stripe! Factura descargada.`, 'success');
          loadPagos();
        } else if (response.ok) {
          showMessage(`✅ ¡Pago procesado exitosamente con Stripe! Pago #${pagoExitoso}`, 'success');
          loadPagos();
        }
      } catch (error) {
        console.error('Error al actualizar pago:', error);
        showMessage('✅ Pago exitoso. Recargando...', 'success');
        loadPagos();
      }
    })();
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  }

  if (pagoCancelado) {
    showMessage('⚠️ Pago cancelado. Puedes intentarlo de nuevo cuando desees.', 'warning');
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  }
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Show corresponding content
      const tabName = btn.dataset.tab;
      const content = document.getElementById(`seccion-${tabName}`);
      if (content) {
        content.style.display = 'block';
        
        // Load data for specific tab
        if (tabName === 'reservas') {
          loadReservasFinanzas();
          loadResidentesReservas(); // Cargar residentes en el selector de reservas
        } else if (tabName === 'nominas') {
          loadPersonalNominas();
          loadNominas();
        }
      }
    });
  });
}

async function loadResumenFinanciero() {
  try {
    const response = await fetch(`${API_URL}/pagos/resumen`);
    const resumen = await response.json();
    
    document.getElementById('ingresos_mes').textContent = `$${parseFloat(resumen.ingresos_mes || 0).toFixed(2)}`;
    document.getElementById('pendientes_mes').textContent = `$${parseFloat(resumen.pendientes_mes || 0).toFixed(2)}`;
    document.getElementById('atrasados_mes').textContent = `$${parseFloat(resumen.atrasados_mes || 0).toFixed(2)}`;
    
    // Cargar total de reservas
    const reservasResponse = await fetch(`${API_URL}/reservas`);
    const reservas = await reservasResponse.json();
    const totalReservas = reservas
      .filter(r => r.estado === 'confirmada')
      .reduce((sum, r) => sum + parseFloat(r.monto_pago || 0), 0);
    
    document.getElementById('total_reservas').textContent = `$${totalReservas.toFixed(2)}`;
  } catch (error) {
    console.error('Error al cargar resumen financiero:', error);
  }
}

// Variable global para almacenar datos de residentes con costos
let residentesConCostos = [];
let reservasPendientesResidente = [];

async function loadResidentesPago() {
  try {
    const response = await fetch(`${API_URL}/reservas/residentes`);
    const residentes = await response.json();
    
    console.log('📋 Residentes cargados:', residentes);
    
    // Obtener información de departamentos con costos de mantenimiento
    const deptosResponse = await fetch(`${API_URL}/departamentos`);
    const departamentos = await deptosResponse.json();
    
    console.log('🏢 Departamentos cargados:', departamentos);
    
    // Crear mapa de departamentos por id
    const deptosMap = {};
    departamentos.forEach(dept => {
      deptosMap[dept.id] = dept;
      console.log(`Depto ${dept.numero} (ID: ${dept.id}): Mantenimiento = $${dept.mantenimiento_mensual}`);
    });
    
    // Combinar información
    residentesConCostos = residentes.map(res => {
      const mantenimiento = deptosMap[res.departamento_id]?.mantenimiento_mensual || 0;
      console.log(`Residente ${res.nombre} - Depto ID: ${res.departamento_id} - Mantenimiento: $${mantenimiento}`);
      return {
        ...res,
        mantenimiento_mensual: mantenimiento
      };
    });
    
    console.log('👥 Residentes con costos:', residentesConCostos);
    
    const select = document.getElementById('residente_pago_id');
    select.innerHTML = '<option value="">Seleccione un residente</option>' +
      residentesConCostos.map(res => `
        <option value="${res.id}" data-mantenimiento="${res.mantenimiento_mensual}">
          ${res.nombre} ${res.apellido} - Depto ${res.departamento_numero} (Mant: $${parseFloat(res.mantenimiento_mensual).toFixed(2)})
        </option>
      `).join('');
  } catch (error) {
    console.error('Error al cargar residentes:', error);
    showMessage('Error al cargar residentes', 'error');
  }
}

// Función para actualizar la información del pago automáticamente
async function actualizarInfoPago() {
  const residenteSelect = document.getElementById('residente_pago_id');
  const mesPago = document.getElementById('mes_pago').value;
  const infoMantenimiento = document.getElementById('info_mantenimiento');
  const montoMantenimientoDisplay = document.getElementById('monto_mantenimiento_display');
  const descripcionAuto = document.getElementById('descripcion_auto');
  const vencimientoAuto = document.getElementById('vencimiento_auto');
  const reservasPendientesContainer = document.getElementById('reservas_pendientes_container');
  
  const selectedOption = residenteSelect.options[residenteSelect.selectedIndex];
  const mantenimientoMensual = selectedOption?.getAttribute('data-mantenimiento');
  const residenteId = residenteSelect.value;
  
  console.log('🔧 Actualizando información del pago...');
  console.log('Residente ID:', residenteId);
  console.log('Mes seleccionado:', mesPago);
  console.log('Mantenimiento mensual:', mantenimientoMensual);
  
  // Buscar reservas pendientes del residente
  if (residenteId) {
    await buscarReservasPendientes(residenteId);
  }
  
  if (residenteSelect.value && mesPago && mantenimientoMensual) {
    // Nombres de los meses
    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombreMes = meses[parseInt(mesPago)];
    
    // Calcular fecha de vencimiento (último día del mes seleccionado)
    const año = 2025;
    const ultimoDia = new Date(año, parseInt(mesPago), 0).getDate();
    const fechaVencimiento = `${año}-${mesPago.padStart(2, '0')}-${ultimoDia}`;
    
    // Formatear fecha para mostrar
    const fechaVencimientoFormato = new Date(año, parseInt(mesPago) - 1, ultimoDia).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Mostrar el banner con toda la información
    infoMantenimiento.style.display = 'block';
    montoMantenimientoDisplay.textContent = `$${parseFloat(mantenimientoMensual).toFixed(2)}`;
    descripcionAuto.textContent = `Descripción: Mantenimiento de ${nombreMes} 2025`;
    vencimientoAuto.textContent = `Vence: ${fechaVencimientoFormato}`;
    
    // Calcular total
    calcularTotalPago();
    
    console.log('✅ Información actualizada');
    console.log('Descripción:', `Mantenimiento de ${nombreMes} 2025`);
    console.log('Fecha vencimiento:', fechaVencimiento);
  } else {
    infoMantenimiento.style.display = 'none';
    reservasPendientesContainer.style.display = 'none';
    document.getElementById('total_pagar_container').style.display = 'none';
    console.log('⚠️ Falta seleccionar residente o mes');
  }
}

// Función para buscar reservas pendientes del residente
async function buscarReservasPendientes(residenteId) {
  const reservasPendientesContainer = document.getElementById('reservas_pendientes_container');
  const listaReservasPendientes = document.getElementById('lista_reservas_pendientes');
  
  try {
    const response = await fetch(`${API_URL}/reservas`);
    const todasReservas = await response.json();
    
    // Filtrar reservas pendientes del residente
    reservasPendientesResidente = todasReservas.filter(r => 
      r.residente_id === parseInt(residenteId) && 
      r.estado === 'pendiente' &&
      parseFloat(r.monto_pago || 0) > 0
    );
    
    console.log('🏊 Reservas pendientes encontradas:', reservasPendientesResidente.length);
    
    if (reservasPendientesResidente.length > 0) {
      // Mostrar las reservas pendientes
      reservasPendientesContainer.style.display = 'block';
      
      listaReservasPendientes.innerHTML = reservasPendientesResidente.map(reserva => {
        const fecha = new Date(reserva.fecha_reserva).toLocaleDateString('es-ES');
        const monto = parseFloat(reserva.monto_pago).toFixed(2);
        
        return `
          <div style="background: rgba(255,255,255,0.15); padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold;">🏊 ${reserva.area_nombre}</div>
              <div style="font-size: 0.85rem; opacity: 0.9;">
                ${fecha} | ${reserva.hora_inicio} - ${reserva.hora_fin}
              </div>
            </div>
            <div style="font-size: 1.2rem; font-weight: bold;">$${monto}</div>
          </div>
        `;
      }).join('');
      
      // Calcular total de reservas
      const totalReservas = reservasPendientesResidente.reduce((sum, r) => sum + parseFloat(r.monto_pago || 0), 0);
      
      listaReservasPendientes.innerHTML += `
        <div style="text-align: right; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 2px solid rgba(255,255,255,0.3);">
          <div style="font-weight: bold; font-size: 1.1rem;">Total Reservas: $${totalReservas.toFixed(2)}</div>
        </div>
      `;
      
      // Desmarcar el checkbox por defecto
      document.getElementById('incluir_reservas').checked = false;
    } else {
      reservasPendientesContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error al buscar reservas pendientes:', error);
    reservasPendientesContainer.style.display = 'none';
  }
}

// Función para calcular el total a pagar
function calcularTotalPago() {
  const residenteSelect = document.getElementById('residente_pago_id');
  const mesPago = document.getElementById('mes_pago').value;
  const incluirReservas = document.getElementById('incluir_reservas').checked;
  const totalPagarContainer = document.getElementById('total_pagar_container');
  const totalPagarDisplay = document.getElementById('total_pagar_display');
  const desgloseTotal = document.getElementById('desglose_total');
  
  const selectedOption = residenteSelect.options[residenteSelect.selectedIndex];
  const mantenimientoMensual = parseFloat(selectedOption?.getAttribute('data-mantenimiento') || 0);
  
  if (!residenteSelect.value || !mesPago) {
    totalPagarContainer.style.display = 'none';
    return;
  }
  
  let total = mantenimientoMensual;
  let desglose = `Mantenimiento: $${mantenimientoMensual.toFixed(2)}`;
  
  if (incluirReservas && reservasPendientesResidente.length > 0) {
    const totalReservas = reservasPendientesResidente.reduce((sum, r) => sum + parseFloat(r.monto_pago || 0), 0);
    total += totalReservas;
    desglose += ` + Reservas: $${totalReservas.toFixed(2)}`;
  }
  
  totalPagarContainer.style.display = 'block';
  totalPagarDisplay.textContent = `$${total.toFixed(2)}`;
  desgloseTotal.textContent = desglose;
  
  console.log('💵 Total calculado:', total, '- Desglose:', desglose);
}

async function loadPagos() {
  const listDivPendientes = document.getElementById('pagosPendientesList');
  const listDivPagados = document.getElementById('pagosPagadosList');
  const listDivMorosos = document.getElementById('residentesMorososList');
  const contadorMorosos = document.getElementById('contadorMorosos');
  
  try {
    const response = await fetch(`${API_URL}/pagos`);
    const pagos = await response.json();
    
    if (!pagos || pagos.length === 0) {
      listDivPendientes.innerHTML = '<p class="empty-state">No hay pagos pendientes</p>';
      listDivPagados.innerHTML = '<p class="empty-state">No hay pagos completados</p>';
      listDivMorosos.innerHTML = '<p class="empty-state">✅ Todos los residentes están al día</p>';
      contadorMorosos.textContent = '0 residentes';
      return;
    }

    // Separar pagos por estado
    const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado');
    const pagosPagados = pagos.filter(p => p.estado === 'pagado');

    // Agrupar pagos pendientes por residente
    const residentesMorosos = {};
    pagosPendientes.forEach(pago => {
      const key = `${pago.residente_id}`;
      if (!residentesMorosos[key]) {
        residentesMorosos[key] = {
          residente_id: pago.residente_id,
          nombre: `${pago.residente_nombre} ${pago.residente_apellido}`,
          departamento: pago.departamento_numero,
          pagos: [],
          total: 0
        };
      }
      residentesMorosos[key].pagos.push(pago);
      residentesMorosos[key].total += parseFloat(pago.monto);
    });

    const morososArray = Object.values(residentesMorosos);
    
    // Renderizar lista de residentes morosos
    if (morososArray.length === 0) {
      listDivMorosos.innerHTML = '<p class="empty-state" style="color: #10b981;">✅ Todos los residentes están al día con sus pagos</p>';
      contadorMorosos.textContent = '0 residentes';
      contadorMorosos.style.background = '#065f46';
      contadorMorosos.style.color = '#86efac';
    } else {
      contadorMorosos.textContent = `${morososArray.length} residente(s)`;
      contadorMorosos.style.background = '#7f1d1d';
      contadorMorosos.style.color = '#fca5a5';
      
      listDivMorosos.innerHTML = morososArray.map(residente => `
        <div style="background: #7f1d1d; border: 1px solid #991b1b; border-radius: 8px; padding: 1.2rem; margin-bottom: 1rem;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 1rem; align-items: center;">
            <div>
              <strong style="font-size: 1.1rem; color: #ffffff;">👤 ${residente.nombre}</strong>
              <div style="color: #fca5a5; font-size: 0.9rem; margin-top: 0.25rem;">🏢 Departamento ${residente.departamento}</div>
            </div>
            <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 6px;">
              <div style="color: #fca5a5; font-size: 0.75rem;">Pagos Pendientes</div>
              <strong style="color: #fee2e2; font-size: 1.3rem;">${residente.pagos.length}</strong>
            </div>
            <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 6px;">
              <div style="color: #fca5a5; font-size: 0.75rem;">Deuda Total</div>
              <strong style="color: #fee2e2; font-size: 1.3rem;">Bs ${residente.total.toFixed(2)}</strong>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm" onclick="verDetallesMoroso(${residente.residente_id})" 
                      style="background: #dc2626; color: white; padding: 0.5rem 1rem; white-space: nowrap;">
                📋 Ver Detalles
              </button>
            </div>
          </div>
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #991b1b;">
            <div style="color: #fca5a5; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">Detalle de pagos pendientes:</div>
            ${residente.pagos.map(pago => {
              const vencimiento = new Date(pago.fecha_vencimiento);
              const hoy = new Date();
              const diasAtraso = Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24));
              const estaAtrasado = diasAtraso > 0;
              
              return `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 4px; margin-bottom: 0.5rem;">
                  <span style="color: #fee2e2; font-size: 0.9rem;">${pago.descripcion}</span>
                  <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="color: #fef3c7; font-weight: 600;">Bs ${parseFloat(pago.monto).toFixed(2)}</span>
                    ${estaAtrasado ? 
                      `<span style="background: #450a0a; color: #fecaca; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem;">
                        ⚠️ ${diasAtraso} día(s) atrasado
                      </span>` : 
                      `<span style="background: #78350f; color: #fef3c7; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem;">
                        ⏳ Vence: ${vencimiento.toLocaleDateString('es-ES')}
                      </span>`
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('');
    }

    // Renderizar pagos pendientes
    if (pagosPendientes.length === 0) {
  listDivPendientes.innerHTML = '<p class="empty-state">No hay pagos pendientes</p>';
    } else {
      const totalPendiente = pagosPendientes.reduce((sum, p) => sum + parseFloat(p.monto), 0);
      listDivPendientes.innerHTML = `
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.9rem; opacity: 0.9;">Total Pendiente de Cobro</div>
              <div style="font-size: 2rem; font-weight: bold; margin-top: 0.25rem;">Bs ${totalPendiente.toFixed(2)}</div>
            </div>
            <div style="font-size: 3rem;"></div>
          </div>
          <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.5rem;">${pagosPendientes.length} pago(s) pendiente(s)</div>
        </div>
        ${pagosPendientes.map(pago => renderPagoItem(pago, true)).join('')}
      `;
    }

    // Renderizar pagos completados
    if (pagosPagados.length === 0) {
  listDivPagados.innerHTML = '<p class="empty-state">No hay pagos completados aún</p>';
    } else {
      const totalPagado = pagosPagados.reduce((sum, p) => sum + parseFloat(p.monto), 0);
      listDivPagados.innerHTML = `
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.9rem; opacity: 0.9;">Total Cobrado</div>
              <div style="font-size: 2rem; font-weight: bold; margin-top: 0.25rem;">Bs ${totalPagado.toFixed(2)}</div>
            </div>
            <div style="font-size: 3rem;"></div>
          </div>
          <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.5rem;">${pagosPagados.length} pago(s) completado(s)</div>
        </div>
        ${pagosPagados.map(pago => renderPagoItem(pago, false)).join('')}
      `;
    }
  } catch (error) {
    console.error('Error al cargar pagos:', error);
    listDivPendientes.innerHTML = `<p class="error-message">Error al cargar pagos: ${error.message}</p>`;
    listDivPagados.innerHTML = `<p class="error-message">Error al cargar pagos: ${error.message}</p>`;
  }
}

// Función auxiliar para renderizar cada item de pago
function renderPagoItem(pago, isPendiente) {
  const fechaVencimiento = new Date(pago.fecha_vencimiento).toLocaleDateString('es-ES');
  const fechaPago = pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-ES') : 'No pagado';
  
  // Badge de estado
  let estadoBadge = '';
  if (pago.estado === 'pagado') {
    estadoBadge = '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">Pagado</span>';
  } else if (pago.estado === 'atrasado') {
    estadoBadge = '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">Atrasado</span>';
  } else {
    estadoBadge = '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">Pendiente</span>';
  }

  return `
    <div class="data-item" style="background: #2d3748; border: 1px solid #4a5568; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
      <div class="data-item-info">
        <h4 style="color: #ffffff; margin-bottom: 0.5rem;">${pago.descripcion} ${estadoBadge}</h4>
        <p style="color: #cbd5e0;"><strong>Residente:</strong> ${pago.residente_nombre} ${pago.residente_apellido} - Depto ${pago.departamento_numero}</p>
        <p style="color: #cbd5e0;"><strong>Tipo:</strong> ${pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1)}</p>
        <p style="color: #cbd5e0;"><strong>Monto:</strong> Bs ${parseFloat(pago.monto).toFixed(2)}</p>
        <p style="color: #cbd5e0;"><strong>Vencimiento:</strong> ${fechaVencimiento}</p>
        ${pago.fecha_pago ? `<p style="color: #cbd5e0;"><strong>Fecha de Pago:</strong> ${fechaPago}</p>` : ''}
      </div>
      <div class="data-item-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${isPendiente ? `
          <button class="btn btn-success" onclick="marcarComoPagado(${pago.id})" style="background: #10b981;">
            💳 Marcar como Pagado
          </button>
          <button class="btn btn-primary" onclick="pagarConStripe(${pago.id}, ${parseFloat(pago.monto)})" style="background: #635bff;">
            💎 Pagar con Stripe
          </button>
        ` : ''}
        <button class="btn btn-danger" onclick="eliminarPago(${pago.id})" style="background: #ef4444;">
          🗑️ Eliminar
        </button>
      </div>
    </div>
  `;
}

async function loadReservasFinanzas() {
  const listDiv = document.getElementById('reservasFinanzasList');
  
  try {
    const response = await fetch(`${API_URL}/reservas`);
    const reservas = await response.json();
    
    // Filtrar solo reservas confirmadas con pago
    const reservasConPago = reservas.filter(r => 
      r.estado === 'confirmada' && parseFloat(r.monto_pago || 0) > 0
    );
    
    if (reservasConPago.length === 0) {
      listDiv.innerHTML = '<p class="empty-state">No hay reservas con pagos confirmados</p>';
      return;
    }

    const totalIngresos = reservasConPago.reduce((sum, r) => sum + parseFloat(r.monto_pago || 0), 0);

    listDiv.innerHTML = `
      <div style="background: var(--success-color); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h4 style="margin: 0;">💵 Total de Ingresos por Reservas: $${totalIngresos.toFixed(2)}</h4>
      </div>
      ${reservasConPago.map(reserva => {
        const fecha = new Date(reserva.fecha_reserva).toLocaleDateString('es-ES');
        const monto = parseFloat(reserva.monto_pago).toFixed(2);
        
        return `
          <div class="data-item">
            <div class="data-item-info">
              <h4>🏊 ${reserva.area_nombre}</h4>
              <p><strong>Residente:</strong> ${reserva.residente_nombre} ${reserva.residente_apellido} - Depto ${reserva.departamento_numero}</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
              <p><strong>Horario:</strong> ${reserva.hora_inicio} - ${reserva.hora_fin}</p>
              <p style="color: var(--success-color); font-size: 1.2rem;"><strong>💰 Monto: $${monto}</strong></p>
            </div>
          </div>
        `;
      }).join('')}
    `;
  } catch (error) {
    console.error('Error al cargar reservas:', error);
    listDiv.innerHTML = `<p class="error-message">Error al cargar reservas: ${error.message}</p>`;
  }
}

async function registrarPago(event) {
  event.preventDefault();
  
  const residenteSelect = document.getElementById('residente_pago_id');
  const mesPago = document.getElementById('mes_pago').value;
  const incluirReservas = document.getElementById('incluir_reservas').checked;
  
  const selectedOption = residenteSelect.options[residenteSelect.selectedIndex];
  const mantenimientoMensual = selectedOption?.getAttribute('data-mantenimiento');
  
  // Validar que se haya seleccionado residente y mes
  if (!residenteSelect.value || !mesPago) {
    showMessage('⚠️ Por favor selecciona un residente y un mes', 'warning');
    return;
  }
  
  // Nombres de los meses
  const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const nombreMes = meses[parseInt(mesPago)];
  
  // Calcular fecha de vencimiento (último día del mes seleccionado)
  const año = 2025;
  const ultimoDia = new Date(año, parseInt(mesPago), 0).getDate();
  const fechaVencimiento = `${año}-${mesPago.padStart(2, '0')}-${ultimoDia}`;
  
  // Calcular monto total
  let montoTotal = parseFloat(mantenimientoMensual);
  let descripcion = `Mantenimiento de ${nombreMes} 2025`;
  
  // Preparar datos de reservas para enviar
  let reservasParaEmail = [];
  
  if (incluirReservas && reservasPendientesResidente.length > 0) {
    const totalReservas = reservasPendientesResidente.reduce((sum, r) => sum + parseFloat(r.monto_pago || 0), 0);
    montoTotal += totalReservas;
    descripcion += ` + Reservas de áreas (${reservasPendientesResidente.length})`;
    
    // Formatear reservas para el email (INCLUYENDO EL ID)
    reservasParaEmail = reservasPendientesResidente.map(r => ({
      id: r.id,  // ⭐ Agregado: ID de la reserva
      area_nombre: r.area_nombre,
      fecha: r.fecha_reserva,
      hora_inicio: r.hora_inicio,
      hora_fin: r.hora_fin,
      monto: r.monto_pago
    }));
  }
  
  const data = {
    residente_id: parseInt(residenteSelect.value),
    tipo_pago: 'mantenimiento',
    monto: montoTotal,
    descripcion: descripcion,
    fecha_vencimiento: fechaVencimiento,
    reservas: reservasParaEmail
  };

  console.log('📤 Enviando pago:', data);

  try {
    // Crear el pago de mantenimiento
    const response = await fetch(`${API_URL}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar pago');
    }

    showMessage('✅ Pago de mantenimiento registrado exitosamente', 'success');
    
    // Limpiar formulario
    document.getElementById('pagoForm').reset();
    document.getElementById('info_mantenimiento').style.display = 'none';
    document.getElementById('reservas_pendientes_container').style.display = 'none';
    document.getElementById('total_pagar_container').style.display = 'none';
    reservasPendientesResidente = [];
    
    // Recargar datos
    loadPagos();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

// Marcar nómina como pagada - VERSIÓN CON LOGS
window.marcarNominaPagada = async function(nominaId) {
  console.log('🎯 Iniciando marcarNominaPagada para ID:', nominaId);
  
  if (!confirm('¿Confirmar pago de esta nómina?')) {
    console.log('❌ Usuario canceló la confirmación');
    return;
  }
  
  const hoy = new Date().toISOString().split('T')[0];
  console.log('📅 Fecha de hoy:', hoy);
  
  try {
    showMessage('⏳ Procesando pago y generando boleta...', 'info');
    
    console.log('📡 Enviando request a:', `${API_URL}/nominas/${nominaId}`);
    
    const response = await fetch(`${API_URL}/nominas/${nominaId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estado: 'pagado',
        fecha_pago: hoy,
        metodo_pago: 'efectivo'
      })
    });

    console.log('📨 Response status:', response.status);
    console.log('📨 Response OK:', response.ok);

    if (!response.ok) {
      throw new Error('Error al procesar el pago');
    }

    // Obtener el tipo de contenido
    const contentType = response.headers.get('Content-Type');
    console.log('🔍 Content-Type recibido:', contentType);
    
    if (contentType && contentType.includes('application/pdf')) {
      console.log('📥 ¡ES UN PDF! - Iniciando descarga...');
      
      // Convertir a blob
      const blob = await response.blob();
      console.log('📦 Blob creado - Tamaño:', blob.size, 'bytes');
      console.log('📦 Blob type:', blob.type);
      
      // Obtener nombre del archivo
      const contentDisposition = response.headers.get('Content-Disposition');
      console.log('📋 Content-Disposition:', contentDisposition);
      
      let fileName = `Boleta_Pago_${nominaId}_${Date.now()}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
          console.log('📄 Nombre extraído del header:', fileName);
        }
      }
      
      console.log('📄 Nombre final del archivo:', fileName);
      
      // Crear URL y descargar
      const blobUrl = window.URL.createObjectURL(blob);
      console.log('🔗 Blob URL creada:', blobUrl);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      console.log('➕ Link agregado al DOM');
      console.log('🖱️ Ejecutando click...');
      
      link.click();
      
      console.log('✅ Click ejecutado');
      
      // Limpiar después de un momento
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        console.log('🧹 Recursos limpiados');
      }, 100);
      
      showMessage('✅ Pago registrado. Boleta descargada y enviada por email.', 'success');
      
      // Esperar antes de recargar
      setTimeout(() => {
        console.log('🔄 Recargando lista de nóminas...');
        loadNominas();
      }, 500);
      
    } else {
      console.log('⚠️ NO es PDF - Es JSON u otro tipo');
      const data = await response.json();
      console.log('📊 Datos JSON recibidos:', data);
      
      if (data.warning) {
        showMessage(`⚠️ ${data.warning}`, 'warning');
      } else {
        showMessage('✅ Nómina actualizada correctamente', 'success');
      }
      
      loadNominas();
    }
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO:', error);
    console.error('❌ Error stack:', error.stack);
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
};

// Crear pagos de mantenimiento para todos los residentes
window.crearPagosParaTodos = async function() {
  // Crear un modal para seleccionar el mes
  const modalHTML = `
    <div id="modal-mes" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      ">
        <h3 style="margin: 0 0 1rem 0; color: #1f2937;">🏢 Crear Pagos Masivos</h3>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          Selecciona el mes para crear los pagos de mantenimiento para todos los residentes
        </p>
        
        <div class="form-group">
          <label for="mes-masivo" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            📅 Mes de Mantenimiento
          </label>
          <select id="mes-masivo" style="
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
          ">
            <option value="">Seleccione el mes</option>
            <option value="1">Enero 2025</option>
            <option value="2">Febrero 2025</option>
            <option value="3">Marzo 2025</option>
            <option value="4">Abril 2025</option>
            <option value="5">Mayo 2025</option>
            <option value="6">Junio 2025</option>
            <option value="7">Julio 2025</option>
            <option value="8">Agosto 2025</option>
            <option value="9">Septiembre 2025</option>
            <option value="10">Octubre 2025</option>
            <option value="11">Noviembre 2025</option>
            <option value="12">Diciembre 2025</option>
          </select>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button onclick="cerrarModalMes()" style="
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            color: #6b7280;
          ">
            Cancelar
          </button>
          <button onclick="confirmarPagosMasivos()" style="
            flex: 1;
            padding: 0.75rem;
            border: none;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
          ">
            ✓ Crear Pagos
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Seleccionar el mes actual por defecto
  const mesActual = new Date().getMonth() + 1;
  document.getElementById('mes-masivo').value = mesActual;
};

window.cerrarModalMes = function() {
  const modal = document.getElementById('modal-mes');
  if (modal) modal.remove();
};

window.confirmarPagosMasivos = async function() {
  const mes = parseInt(document.getElementById('mes-masivo').value);
  
  if (!mes || mes < 1 || mes > 12) {
    showMessage('⚠️ Por favor selecciona un mes', 'warning');
    return;
  }

  const nombreMes = obtenerNombreMes(mes);
  
  if (!confirm(`¿Crear pagos de mantenimiento para TODOS los residentes del mes de ${nombreMes}?`)) {
    return;
  }

  // Cerrar modal
  cerrarModalMes();

  try {
    showMessage('⏳ Creando pagos para todos los residentes...', 'info');

    const response = await fetch(`${API_URL}/pagos/crear-todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes: mes })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear pagos masivos');
    }

    const result = await response.json();
    showMessage(`✅ ${result.creados} pagos creados exitosamente para ${nombreMes}. Facturas enviadas por email.`, 'success');
    loadPagos();

  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
};

function obtenerNombreMes(mes) {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return meses[parseInt(mes) - 1] || 'Mes desconocido';
}

// Pagar con Stripe
window.pagarConStripe = async function(pagoId, monto) {
  try {
    showMessage('⏳ Creando sesión de pago con Stripe...', 'info');
    
    const response = await fetch(`${API_URL}/pagos/${pagoId}/stripe-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear sesión de pago');
    }

    const { url } = await response.json();
    
    // Redirigir a Stripe Checkout
    window.location.href = url;
    
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
};

// Eliminar pago
window.eliminarPago = async function(pagoId) {
  if (!confirm('¿Está seguro de eliminar este pago?')) return;

  try {
    const response = await fetch(`${API_URL}/pagos/${pagoId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error al eliminar pago');

    showMessage('✅ Pago eliminado', 'success');
    loadPagos();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
};

// ==================== FUNCIONES PARA COBRO DE RESERVAS ====================

// Cargar residentes en el selector de reservas
async function loadResidentesReservas() {
  try {
    const response = await fetch(`${API_URL}/reservas/residentes`);
    const residentes = await response.json();
    
    const select = document.getElementById('residente_reservas_id');
    select.innerHTML = '<option value="">Seleccione un residente</option>' +
      residentes.map(res => `
        <option value="${res.id}" data-departamento-id="${res.departamento_id}">
          ${res.nombre} ${res.apellido} - Depto ${res.departamento_numero}
        </option>
      `).join('');
  } catch (error) {
    console.error('Error al cargar residentes:', error);
    showMessage('Error al cargar residentes', 'error');
  }
}

// Variable global para almacenar reservas seleccionables
let reservasDisponiblesCobro = [];

// Cargar reservas pendientes del residente para cobrar
async function cargarReservasParaCobrar() {
  const residenteSelect = document.getElementById('residente_reservas_id');
  const residenteId = residenteSelect.value;
  const reservasContainer = document.getElementById('reservas_para_cobrar_container');
  const sinReservasMensaje = document.getElementById('sin_reservas_mensaje');
  const listaReservasCobrar = document.getElementById('lista_reservas_cobrar');
  
  if (!residenteId) {
    reservasContainer.style.display = 'none';
    sinReservasMensaje.style.display = 'none';
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/reservas`);
    const todasReservas = await response.json();
    
    // Filtrar reservas pendientes del residente con monto > 0
    reservasDisponiblesCobro = todasReservas.filter(r => 
      r.residente_id === parseInt(residenteId) && 
      r.estado === 'pendiente' &&
      parseFloat(r.monto_pago || 0) > 0
    );
    
    console.log('🏊 Reservas disponibles para cobro:', reservasDisponiblesCobro.length);
    
    if (reservasDisponiblesCobro.length > 0) {
      reservasContainer.style.display = 'block';
      sinReservasMensaje.style.display = 'none';
      
      listaReservasCobrar.innerHTML = reservasDisponiblesCobro.map((reserva, index) => {
        const fecha = new Date(reserva.fecha_reserva).toLocaleDateString('es-ES');
        const monto = parseFloat(reserva.monto_pago).toFixed(2);
        
        return `
          <label style="display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s;">
            <input type="checkbox" 
                   class="reserva-checkbox" 
                   data-index="${index}"
                   data-id="${reserva.id}"
                   data-monto="${reserva.monto_pago}"
                   style="width: 20px; height: 20px; cursor: pointer;"
                   onchange="recalcularTotalReservas()">
            <div style="flex: 1;">
              <div style="font-weight: bold; margin-bottom: 4px;">🏊 ${reserva.area_nombre}</div>
              <div style="font-size: 0.85rem; opacity: 0.9;">
                📅 ${fecha} | 🕐 ${reserva.hora_inicio} - ${reserva.hora_fin}
              </div>
            </div>
            <div style="font-size: 1.3rem; font-weight: bold;">$${monto}</div>
          </label>
        `;
      }).join('');
      
      // Inicializar total en 0
      recalcularTotalReservas();
    } else {
      reservasContainer.style.display = 'none';
      sinReservasMensaje.style.display = 'block';
    }
  } catch (error) {
    console.error('Error al cargar reservas:', error);
    showMessage('Error al cargar reservas', 'error');
  }
}

// Función global para recalcular total de reservas
window.recalcularTotalReservas = function() {
  const checkboxes = document.querySelectorAll('.reserva-checkbox:checked');
  let total = 0;
  
  checkboxes.forEach(checkbox => {
    total += parseFloat(checkbox.dataset.monto || 0);
  });
  
  document.getElementById('total_reservas_display').textContent = `$${total.toFixed(2)}`;
  document.getElementById('cantidad_reservas_display').textContent = 
    `${checkboxes.length} reserva${checkboxes.length !== 1 ? 's' : ''} seleccionada${checkboxes.length !== 1 ? 's' : ''}`;
};

// Cobrar reservas seleccionadas
async function cobrarReservas(event) {
  event.preventDefault();
  
  const residenteSelect = document.getElementById('residente_reservas_id');
  const checkboxes = document.querySelectorAll('.reserva-checkbox:checked');
  
  if (checkboxes.length === 0) {
    showMessage('⚠️ Por favor selecciona al menos una reserva para cobrar', 'warning');
    return;
  }
  
  // Obtener datos de las reservas seleccionadas
  const reservasSeleccionadas = Array.from(checkboxes).map(cb => {
    const index = parseInt(cb.dataset.index);
    const reserva = reservasDisponiblesCobro[index];
    return {
      id: reserva.id,
      area_nombre: reserva.area_nombre,
      fecha: reserva.fecha_reserva,
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      monto: reserva.monto_pago
    };
  });
  
  const totalCobro = reservasSeleccionadas.reduce((sum, r) => sum + parseFloat(r.monto), 0);
  const residenteId = parseInt(residenteSelect.value);
  
  // Crear descripción
  const descripcion = `Pago de Reservas de Áreas Comunes (${reservasSeleccionadas.length})`;
  
  // Fecha de vencimiento: hoy
  const hoy = new Date();
  const fechaVencimiento = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  
  const data = {
    residente_id: residenteId,
    tipo_pago: 'reservas',
    monto: totalCobro,
    descripcion: descripcion,
    fecha_vencimiento: fechaVencimiento,
    reservas: reservasSeleccionadas
  };
  
  console.log('📤 Cobrando reservas:', data);
  
  try {
    const response = await fetch(`${API_URL}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear cobro de reservas');
    }

    showMessage(`✅ Cobro de ${reservasSeleccionadas.length} reserva(s) registrado exitosamente`, 'success');
    
    // Limpiar formulario
    document.getElementById('reservasForm').reset();
    document.getElementById('reservas_para_cobrar_container').style.display = 'none';
    document.getElementById('sin_reservas_mensaje').style.display = 'none';
    
    // Recargar datos
    loadReservasFinanzas();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

// ============================================
// 💼 FUNCIONES DE NÓMINAS
// ============================================

// Cargar personal activo para el selector
async function loadPersonalNominas() {
  const selectPersonal = document.getElementById('nominaPersonal');
  
  try {
    const response = await fetch(`${API_URL}/nominas/personal`);
    const personal = await response.json();
    
    selectPersonal.innerHTML = '<option value="">Seleccionar personal...</option>';
    
    personal.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.nombre} ${p.apellido} - ${p.cargo}`;
      option.setAttribute('data-salario', p.salario);
      selectPersonal.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar personal:', error);
    showMessage('❌ Error al cargar personal', 'error');
  }
}

// Cargar lista de nóminas
window.loadNominas = async function() {
  const listDiv = document.getElementById('nominasList');
  const filtroEstado = document.getElementById('filtroEstadoNomina').value;
  const filtroMes = document.getElementById('filtroMesNomina').value;
  
  try {
    let url = `${API_URL}/nominas`;
    const params = new URLSearchParams();
    
    if (filtroEstado) params.append('estado', filtroEstado);
    if (filtroMes) params.append('mes', filtroMes);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    console.log('🔍 Filtros aplicados:', { estado: filtroEstado, mes: filtroMes });
    console.log('🌐 URL completa:', url);
    
    const response = await fetch(url);
    const nominas = await response.json();
    
    console.log('📊 Nóminas recibidas:', nominas.length);
    
    if (nominas.length === 0) {
      listDiv.innerHTML = '<p class="empty-state">No hay nóminas registradas</p>';
      return;
    }

  const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    listDiv.innerHTML = nominas.map(nomina => `
      <div class="data-item" style="background: #2d3748; border: 1px solid #4a5568; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <div style="display: grid; grid-template-columns: minmax(200px, 2fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(130px, 1fr) minmax(150px, auto); gap: 1rem; align-items: center;">
          <div>
            <strong style="font-size: 1.2rem; color: #ffffff;">${nomina.nombre} ${nomina.apellido}</strong>
            <br>
            <span style="color: #cbd5e0; font-size: 0.95rem; font-weight: 500;">${nomina.cargo}</span>
          </div>
          <div style="background: #1a202c; padding: 0.75rem; border-radius: 8px; text-align: center; border: 1px solid #4a5568;">
            <span style="font-size: 0.85rem; color: #a0aec0; display: block; margin-bottom: 0.25rem;">Período</span>
            <strong style="color: #e2e8f0; font-size: 1.05rem;">${meses[parseInt(nomina.mes)] || 'Mes desconocido'} ${nomina.anio || nomina.año || ''}</strong>
          </div>
          <div style="background: #1e3a8a; padding: 0.75rem; border-radius: 8px; text-align: center; border: 1px solid #3b82f6;">
            <span style="font-size: 0.85rem; color: #93c5fd; display: block; margin-bottom: 0.25rem;">Salario</span>
            <strong style="color: #dbeafe; font-size: 1.05rem;">Bs ${parseFloat(nomina.salario_base).toFixed(2)}</strong>
          </div>
          <div style="background: #14532d; padding: 0.75rem; border-radius: 8px; text-align: center; border: 1px solid #22c55e;">
            <span style="font-size: 0.85rem; color: #86efac; display: block; margin-bottom: 0.25rem;">Bonos</span>
            <strong style="color: #dcfce7; font-size: 1.05rem;">+Bs ${parseFloat(nomina.bonos || 0).toFixed(2)}</strong>
          </div>
          <div style="background: #7f1d1d; padding: 0.75rem; border-radius: 8px; text-align: center; border: 1px solid #ef4444;">
            <span style="font-size: 0.85rem; color: #fca5a5; display: block; margin-bottom: 0.25rem;">Deducciones</span>
            <strong style="color: #fee2e2; font-size: 1.05rem;">-Bs ${parseFloat(nomina.deducciones || 0).toFixed(2)}</strong>
          </div>
          <div style="background: linear-gradient(135deg, #78350f 0%, #92400e 100%); padding: 0.75rem; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
            <span style="font-size: 0.85rem; color: #fde68a; display: block; margin-bottom: 0.25rem; font-weight: 600;">Total</span>
            <strong style="color: #fef3c7; font-size: 1.3rem;">Bs ${parseFloat(nomina.total_pagar).toFixed(2)}</strong>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-direction: column;">
            ${nomina.estado === 'pendiente' ? `
              <button class="btn btn-success btn-sm" onclick="marcarNominaPagada(${nomina.id})" title="Marcar como Pagado"
                      style="padding: 0.6rem 1rem; font-size: 0.95rem; white-space: nowrap; background: #16a34a; color: white; border: none;">
                ✅ Pagado
              </button>
            ` : `
              <span style="padding: 0.6rem 1rem; background: #166534; color: #86efac; border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.9rem; border: 1px solid #22c55e;">
                ✅ Pagado<br>
                <small style="font-size: 0.75rem; opacity: 0.9;">${nomina.fecha_pago ? new Date(nomina.fecha_pago).toLocaleDateString('es-ES') : ''}</small>
              </span>
            `}
            <button class="btn btn-danger btn-sm" onclick="eliminarNomina(${nomina.id})" title="Eliminar"
                    style="padding: 0.6rem 1rem; font-size: 0.95rem; background: #dc2626; color: white; border: none;">
              🗑️ Eliminar
            </button>
          </div>
        </div>
        ${nomina.observaciones ? `
          <div style="margin-top: 1rem; padding: 0.75rem; background: #713f12; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <strong style="color: #fbbf24; font-size: 0.9rem;">📝 Observaciones:</strong>
            <span style="color: #fde68a; margin-left: 0.5rem;">${nomina.observaciones}</span>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error al cargar nóminas:', error);
    listDiv.innerHTML = `<p class="error-message">Error al cargar nóminas: ${error.message}</p>`;
  }
}

// Setup event listeners para nóminas
function setupNominasEventListeners() {
  const selectPersonal = document.getElementById('nominaPersonal');
  const inputSalario = document.getElementById('nominaSalarioBase');
  const inputBonos = document.getElementById('nominaBonos');
  const inputDeducciones = document.getElementById('nominaDeducciones');
  const inputAño = document.getElementById('nominaAño');
  const formNomina = document.getElementById('formCrearNomina');
  
  // Auto-llenar salario cuando se selecciona personal
  selectPersonal.addEventListener('change', () => {
    const selectedOption = selectPersonal.options[selectPersonal.selectedIndex];
    const salario = selectedOption?.getAttribute('data-salario') || 0;
    inputSalario.value = parseFloat(salario).toFixed(2);
    calcularTotalNomina();
  });
  
  // Calcular total cuando cambian bonos o deducciones
  inputBonos.addEventListener('input', calcularTotalNomina);
  inputDeducciones.addEventListener('input', calcularTotalNomina);
  
  // Auto-llenar año actual
  if (!inputAño.value) {
    inputAño.value = new Date().getFullYear();
  }
  
  // Form submit
  formNomina.addEventListener('submit', crearNomina);
}

// Calcular total a pagar
function calcularTotalNomina() {
  const salarioBase = parseFloat(document.getElementById('nominaSalarioBase').value) || 0;
  const bonos = parseFloat(document.getElementById('nominaBonos').value) || 0;
  const deducciones = parseFloat(document.getElementById('nominaDeducciones').value) || 0;
  
  const total = salarioBase + bonos - deducciones;
  
  document.getElementById('nominaTotalDisplay').textContent = `Bs ${total.toFixed(2)}`;
}

// Crear nómina individual
async function crearNomina(event) {
  event.preventDefault();
  
  const personalId = parseInt(document.getElementById('nominaPersonal').value);
  const mes = parseInt(document.getElementById('nominaMes').value);
  const anio = parseInt(document.getElementById('nominaAño').value);
  const salarioBase = parseFloat(document.getElementById('nominaSalarioBase').value);
  const bonos = parseFloat(document.getElementById('nominaBonos').value) || 0;
  const deducciones = parseFloat(document.getElementById('nominaDeducciones').value) || 0;
  const observaciones = document.getElementById('nominaObservaciones').value.trim();
  
  const data = {
    personal_id: personalId,
    mes,
    anio,
    salario_base: salarioBase,
    bonos,
    deducciones,
    observaciones: observaciones || null
  };
  
  try {
    const response = await fetch(`${API_URL}/nominas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear nómina');
    }

    showMessage('✅ Nómina creada exitosamente', 'success');
    
    // Limpiar formulario
    document.getElementById('formCrearNomina').reset();
    document.getElementById('nominaSalarioBase').value = '';
    document.getElementById('nominaTotalDisplay').textContent = 'Bs 0.00';
    
    // Recargar lista
    loadNominas();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

// Crear nóminas para todo el personal
window.crearNominasParaTodos = async function() {
  // Crear modal para seleccionar mes y año
  const modalHTML = `
    <div class="modal-overlay" id="modalNominasTodos" style="display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); z-index: 9999; align-items: center; justify-content: center;">
      <div class="modal-content" style="max-width: 450px; width: 90%; background: #2d3748; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); border: 1px solid #4a5568; padding: 2rem;">
        <h3 style="color: #ffffff; margin-bottom: 1rem; font-size: 1.4rem;">💼 Crear Nóminas para Todo el Personal</h3>
        <p style="color: #cbd5e0; margin-bottom: 1.5rem;">Selecciona el mes y año para crear las nóminas:</p>
        
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label style="color: #e0e0e0; font-weight: 600; margin-bottom: 0.5rem; display: block;">Mes:</label>
          <select id="mesNominasTodos" style="width: 100%; padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #1a202c; color: #ffffff; cursor: pointer;">
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>
        
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label style="color: #e0e0e0; font-weight: 600; margin-bottom: 0.5rem; display: block;">Año:</label>
          <input type="number" id="añoNominasTodos" value="${new Date().getFullYear()}" 
                 min="2020" max="2030" style="width: 100%; padding: 0.75rem; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem; background: #1a202c; color: #ffffff;">
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button class="btn btn-secondary" onclick="cerrarModalNominasTodos()" 
                  style="flex: 1; padding: 0.9rem; font-size: 1rem; background: #4a5568; color: #e0e0e0; border: none; border-radius: 8px; cursor: pointer;">Cancelar</button>
          <button class="btn btn-primary" onclick="confirmarCrearNominasTodos()"
                  style="flex: 1; padding: 0.9rem; font-size: 1rem; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border: none; color: white; border-radius: 8px; cursor: pointer;">
            ✅ Crear Nóminas
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Auto-seleccionar mes actual
  const mesActual = new Date().getMonth() + 1;
  document.getElementById('mesNominasTodos').value = mesActual;
};

window.cerrarModalNominasTodos = function() {
  const modal = document.getElementById('modalNominasTodos');
  if (modal) modal.remove();
};

window.confirmarCrearNominasTodos = async function() {
  const mes = parseInt(document.getElementById('mesNominasTodos').value);
  const anio = parseInt(document.getElementById('añoNominasTodos').value);
  
  try {
    const response = await fetch(`${API_URL}/nominas/crear-todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes, anio })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear nóminas');
    }

    const result = await response.json();
    
    showMessage(`✅ ${result.creadas} nómina(s) creada(s) exitosamente`, 'success');
    
    cerrarModalNominasTodos();
    loadNominas();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
};


// Eliminar nómina
window.eliminarNomina = async function(nominaId) {
  if (!confirm('¿Estás seguro de eliminar esta nómina?')) return;
  
  try {
    const response = await fetch(`${API_URL}/nominas/${nominaId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar nómina');
    }

    showMessage('✅ Nómina eliminada', 'success');
    loadNominas();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
};

export async function generarReporte() {
  const fechaInicio = document.getElementById('fecha_inicio_reporte').value;
  const fechaFin = document.getElementById('fecha_fin_reporte').value;
  
  if (!fechaInicio || !fechaFin) {
    showMessage('Por favor seleccione ambas fechas', 'error');
    return;
  }

  try {
    // TODO: Implementar endpoint de reportes
    const reporteContainer = document.getElementById('reporteContainer');
    const reporteContent = document.getElementById('reporteContent');
    
    reporteContent.innerHTML = `
      <div style="padding: 2rem; background: var(--card-bg); border-radius: 8px;">
        <h4>📊 Reporte del ${new Date(fechaInicio).toLocaleDateString('es-ES')} al ${new Date(fechaFin).toLocaleDateString('es-ES')}</h4>
        <p style="color: var(--text-light); margin-top: 1rem;">
          Funcionalidad de reportes en desarrollo. Aquí se mostrarán estadísticas detalladas de ingresos, gastos y balance del periodo seleccionado.
        </p>
      </div>
    `;
    
    reporteContainer.style.display = 'block';
    showMessage('Funcionalidad de reportes en desarrollo', 'warning');
  } catch (error) {
    showMessage(`Error al generar reporte: ${error.message}`, 'error');
  }
}

// ==================== FUNCIONES DE GENERACIÓN DE REPORTES PDF ====================

// Funciones para mostrar/ocultar selectores de fecha
window.toggleFechasPagos = function() {
  const periodo = document.getElementById('periodo_pagos').value;
  document.getElementById('selector_mes_pagos').style.display = periodo === 'mes' ? 'block' : 'none';
  document.getElementById('fechas_pagos').style.display = periodo === 'rango' ? 'grid' : 'none';
};

window.toggleFechasReservas = function() {
  const periodo = document.getElementById('periodo_reservas').value;
  document.getElementById('selector_mes_reservas').style.display = periodo === 'mes' ? 'block' : 'none';
  document.getElementById('fechas_reservas').style.display = periodo === 'rango' ? 'grid' : 'none';
};

window.toggleFechasNominas = function() {
  const periodo = document.getElementById('periodo_nominas').value;
  document.getElementById('selector_mes_nominas').style.display = periodo === 'mes' ? 'block' : 'none';
  document.getElementById('fechas_nominas').style.display = periodo === 'rango' ? 'grid' : 'none';
};

window.toggleFechasConsolidado = function() {
  const periodo = document.getElementById('periodo_consolidado').value;
  document.getElementById('selector_mes_consolidado').style.display = periodo === 'mes' ? 'block' : 'none';
  document.getElementById('fechas_consolidado').style.display = periodo === 'rango' ? 'grid' : 'none';
};

// Función auxiliar para obtener rango de fechas de un mes
function obtenerRangoMes(mes, año = 2025) {
  const mesNum = parseInt(mes);
  const fechaInicio = `${año}-${mesNum.toString().padStart(2, '0')}-01`;
  const ultimoDia = new Date(año, mesNum, 0).getDate();
  const fechaFin = `${año}-${mesNum.toString().padStart(2, '0')}-${ultimoDia}`;
  return { fechaInicio, fechaFin };
}

// Generar PDF de Pagos
window.generarReportePagosPDF = async function() {
  const periodo = document.getElementById('periodo_pagos').value;
  let fechaInicio, fechaFin, tituloPeriodo;

  if (periodo === 'todos') {
    fechaInicio = '2000-01-01';
    fechaFin = '2099-12-31';
    tituloPeriodo = 'Todos los Períodos';
  } else if (periodo === 'mes') {
    const mes = document.getElementById('mes_pagos').value;
    const rango = obtenerRangoMes(mes);
    fechaInicio = rango.fechaInicio;
    fechaFin = rango.fechaFin;
    tituloPeriodo = `${obtenerNombreMes(mes)} 2025`;
  } else {
    fechaInicio = document.getElementById('fecha_inicio_pagos').value;
    fechaFin = document.getElementById('fecha_fin_pagos').value;
    if (!fechaInicio || !fechaFin) {
      showMessage('Por favor selecciona las fechas de inicio y fin', 'warning');
      return;
    }
    tituloPeriodo = `${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}`;
  }

  try {
    showMessage('⏳ Generando reporte de pagos...', 'info');
    
    const response = await fetch(`${API_URL}/pagos`);
    const todosPagos = await response.json();

    // Filtrar por fecha
    const pagos = todosPagos.filter(p => {
      const fecha = p.fecha_pago || p.fecha_vencimiento;
      return fecha >= fechaInicio && fecha <= fechaFin;
    });

    if (pagos.length === 0) {
      showMessage('No hay pagos en el período seleccionado', 'warning');
      return;
    }

    // Importar jsPDF dinámicamente
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    // Encabezado
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('HABITECH', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Reporte de Pagos', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${tituloPeriodo}`, pageWidth / 2, 33, { align: 'center' });

    y = 50;
    doc.setTextColor(0, 0, 0);

    // Estadísticas
    const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado');
    const pagosPagados = pagos.filter(p => p.estado === 'pagado');
    const totalPendiente = pagosPendientes.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const totalPagado = pagosPagados.reduce((sum, p) => sum + parseFloat(p.monto), 0);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen General', 14, y);
    y += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total de Pagos: ${pagos.length}`, 14, y);
    y += 6;
    doc.text(`Pagos Completados: ${pagosPagados.length} (Bs ${totalPagado.toFixed(2)})`, 14, y);
    y += 6;
    doc.setTextColor(239, 68, 68);
    doc.text(`Pagos Pendientes: ${pagosPendientes.length} (Bs ${totalPendiente.toFixed(2)})`, 14, y);
    y += 10;
    doc.setTextColor(0, 0, 0);

    // Tabla de pagos
    doc.autoTable({
      startY: y,
      head: [['Residente', 'Descripción', 'Monto', 'Estado', 'Fecha']],
      body: pagos.map(p => [
        `${p.residente_nombre} ${p.residente_apellido}\nDpto. ${p.departamento_numero}`,
        p.descripcion,
        `Bs ${parseFloat(p.monto).toFixed(2)}`,
        p.estado === 'pagado' ? '✓ Pagado' : '⚠ Pendiente',
        new Date(p.fecha_pago || p.fecha_vencimiento).toLocaleDateString('es-ES')
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      }
    });

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 40, doc.internal.pageSize.height - 10);
    }

    // Descargar
    const nombreArchivo = periodo === 'mes' 
      ? `Reporte_Pagos_${obtenerNombreMes(document.getElementById('mes_pagos').value)}_2025.pdf`
      : periodo === 'todos'
      ? `Reporte_Pagos_Completo.pdf`
      : `Reporte_Pagos_${fechaInicio}_${fechaFin}.pdf`;
    doc.save(nombreArchivo);
    showMessage('✅ Reporte de pagos generado exitosamente', 'success');

  } catch (error) {
    console.error('Error al generar reporte:', error);
    showMessage('❌ Error al generar el reporte: ' + error.message, 'error');
  }
};

// Generar PDF de Morosos
window.generarReporteMorososPDF = async function() {
  try {
    showMessage('⏳ Generando reporte de residentes morosos...', 'info');
    
    const response = await fetch(`${API_URL}/pagos`);
    const todosPagos = await response.json();

    // Filtrar solo pendientes
    const pagosPendientes = todosPagos.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado');

    if (pagosPendientes.length === 0) {
      showMessage('✅ ¡Excelente! No hay residentes con pagos pendientes', 'success');
      return;
    }

    // Agrupar por residente
    const residentesMorosos = {};
    pagosPendientes.forEach(pago => {
      const key = pago.residente_id;
      if (!residentesMorosos[key]) {
        residentesMorosos[key] = {
          nombre: `${pago.residente_nombre} ${pago.residente_apellido}`,
          departamento: pago.departamento_numero,
          pagos: [],
          total: 0
        };
      }
      residentesMorosos[key].pagos.push(pago);
      residentesMorosos[key].total += parseFloat(pago.monto);
    });

    const morososArray = Object.values(residentesMorosos).sort((a, b) => b.total - a.total);

    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    // Encabezado
    doc.setFillColor(239, 68, 68);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('HABITECH', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('⚠️ Reporte de Residentes Morosos', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 33, { align: 'center' });

    y = 50;
    doc.setTextColor(0, 0, 0);

    // Resumen
    const totalDeuda = morososArray.reduce((sum, r) => sum + r.total, 0);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen', 14, y);
    y += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total de Residentes con Deudas: ${morososArray.length}`, 14, y);
    y += 6;
    doc.text(`Total de Pagos Pendientes: ${pagosPendientes.length}`, 14, y);
    y += 6;
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Deuda Total: Bs ${totalDeuda.toFixed(2)}`, 14, y);
    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    // Tabla de morosos
    doc.autoTable({
      startY: y,
      head: [['Residente', 'Departamento', 'Pagos Pendientes', 'Deuda Total']],
      body: morososArray.map(r => [
        r.nombre,
        r.departamento,
        r.pagos.length.toString(),
        `Bs ${r.total.toFixed(2)}`
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 }
      }
    });

    y = doc.lastAutoTable.finalY + 15;

    // Detalle de pagos por residente
    doc.addPage();
    y = 20;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Detalle de Pagos por Residente', 14, y);
    y += 10;

    morososArray.forEach(residente => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text(`${residente.nombre} - Dpto. ${residente.departamento}`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text(`Total adeudado: Bs ${residente.total.toFixed(2)}`, 14, y);
      y += 8;

      residente.pagos.forEach(pago => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        const vencimiento = new Date(pago.fecha_vencimiento);
        const diasAtraso = Math.floor((new Date() - vencimiento) / (1000 * 60 * 60 * 24));
        
        doc.setFontSize(8);
        doc.text(`• ${pago.descripcion}`, 18, y);
        doc.text(`Bs ${parseFloat(pago.monto).toFixed(2)}`, 140, y);
        if (diasAtraso > 0) {
          doc.setTextColor(239, 68, 68);
          doc.text(`${diasAtraso} días atrasado`, 165, y);
          doc.setTextColor(0, 0, 0);
        }
        y += 5;
      });
      
      y += 5;
    });

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 40, doc.internal.pageSize.height - 10);
    }

    doc.save(`Reporte_Morosos_${new Date().toISOString().split('T')[0]}.pdf`);
    showMessage('✅ Reporte de morosos generado exitosamente', 'success');

  } catch (error) {
    console.error('Error al generar reporte:', error);
    showMessage('❌ Error al generar el reporte: ' + error.message, 'error');
  }
};

// Generar PDF de Reservas
window.generarReporteReservasPDF = async function() {
  const periodo = document.getElementById('periodo_reservas').value;
  let fechaInicio, fechaFin, tituloPeriodo;

  if (periodo === 'todos') {
    fechaInicio = '2000-01-01';
    fechaFin = '2099-12-31';
    tituloPeriodo = 'Todas las Reservas';
  } else if (periodo === 'mes') {
    const mes = document.getElementById('mes_reservas').value;
    const rango = obtenerRangoMes(mes);
    fechaInicio = rango.fechaInicio;
    fechaFin = rango.fechaFin;
    tituloPeriodo = `${obtenerNombreMes(mes)} 2025`;
  } else {
    fechaInicio = document.getElementById('fecha_inicio_reservas').value;
    fechaFin = document.getElementById('fecha_fin_reservas').value;
    if (!fechaInicio || !fechaFin) {
      showMessage('Por favor selecciona las fechas de inicio y fin', 'warning');
      return;
    }
    tituloPeriodo = `${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}`;
  }

  try {
    showMessage('⏳ Generando reporte de reservas...', 'info');
    
    const response = await fetch(`${API_URL}/reservas`);
    const todasReservas = await response.json();

    // Filtrar por fecha y solo confirmadas (pagadas)
    const reservas = todasReservas.filter(r => {
      return r.fecha_reserva >= fechaInicio && r.fecha_reserva <= fechaFin && r.estado === 'confirmada';
    });

    if (reservas.length === 0) {
      showMessage('No hay reservas confirmadas en el período seleccionado', 'warning');
      return;
    }

    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    // Encabezado
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('HABITECH', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Reporte de Ingresos por Reservas', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${tituloPeriodo}`, pageWidth / 2, 33, { align: 'center' });

    y = 50;
    doc.setTextColor(0, 0, 0);

    // Estadísticas
    const totalIngresos = reservas.reduce((sum, r) => sum + parseFloat(r.monto_pago), 0);
    const areasMasUsadas = {};
    reservas.forEach(r => {
      areasMasUsadas[r.area_nombre] = (areasMasUsadas[r.area_nombre] || 0) + 1;
    });

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen de Ingresos', 14, y);
    y += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total de Reservas: ${reservas.length}`, 14, y);
    y += 6;
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Ingresos Totales: Bs ${totalIngresos.toFixed(2)}`, 14, y);
    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    // Tabla de reservas
    doc.autoTable({
      startY: y,
      head: [['Fecha', 'Área', 'Residente', 'Precio']],
      body: reservas.map(r => [
        new Date(r.fecha_reserva).toLocaleDateString('es-ES'),
        r.area_nombre,
        `${r.residente_nombre} ${r.residente_apellido}\nDpto. ${r.departamento_numero}`,
        `Bs ${parseFloat(r.monto_pago).toFixed(2)}`
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      alternateRowStyles: { fillColor: [254, 243, 199] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 70 },
        3: { cellWidth: 35 }
      }
    });

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 40, doc.internal.pageSize.height - 10);
    }

    const nombreArchivo = periodo === 'mes' 
      ? `Reporte_Reservas_${obtenerNombreMes(document.getElementById('mes_reservas').value)}_2025.pdf`
      : periodo === 'todos'
      ? `Reporte_Reservas_Completo.pdf`
      : `Reporte_Reservas_${fechaInicio}_${fechaFin}.pdf`;
    doc.save(nombreArchivo);
    showMessage('✅ Reporte de reservas generado exitosamente', 'success');

  } catch (error) {
    console.error('Error al generar reporte:', error);
    showMessage('❌ Error al generar el reporte: ' + error.message, 'error');
  }
};

// Generar PDF de Nóminas
window.generarReporteNominasPDF = async function() {
  const periodo = document.getElementById('periodo_nominas').value;
  let fechaInicio, fechaFin, tituloPeriodo;

  if (periodo === 'todos') {
    fechaInicio = '2000-01-01';
    fechaFin = '2099-12-31';
    tituloPeriodo = 'Todas las Nóminas';
  } else if (periodo === 'mes') {
    const mes = document.getElementById('mes_nominas').value;
    const rango = obtenerRangoMes(mes);
    fechaInicio = rango.fechaInicio;
    fechaFin = rango.fechaFin;
    tituloPeriodo = `${obtenerNombreMes(mes)} 2025`;
  } else {
    fechaInicio = document.getElementById('fecha_inicio_nominas').value;
    fechaFin = document.getElementById('fecha_fin_nominas').value;
    if (!fechaInicio || !fechaFin) {
      showMessage('Por favor selecciona las fechas de inicio y fin', 'warning');
      return;
    }
    tituloPeriodo = `${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}`;
  }

  try {
    showMessage('⏳ Generando reporte de nóminas...', 'info');
    
    const response = await fetch(`${API_URL}/nominas`);
    const todasNominas = await response.json();

    // Filtrar por fecha
    const nominas = todasNominas.filter(n => {
      const fechaPago = n.fecha_pago || n.mes + '-01';
      return fechaPago >= fechaInicio && fechaPago <= fechaFin;
    });

    if (nominas.length === 0) {
      showMessage('No hay nóminas en el período seleccionado', 'warning');
      return;
    }

    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    // Encabezado
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('HABITECH', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Reporte de Nóminas', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${tituloPeriodo}`, pageWidth / 2, 33, { align: 'center' });

    y = 50;
    doc.setTextColor(0, 0, 0);

    // Estadísticas
    const nominasPagadas = nominas.filter(n => n.estado === 'pagado');
    const nominasPendientes = nominas.filter(n => n.estado === 'pendiente');
    const totalPagado = nominasPagadas.reduce((sum, n) => sum + parseFloat(n.total_pagar || 0), 0);
    const totalPendiente = nominasPendientes.reduce((sum, n) => sum + parseFloat(n.total_pagar || 0), 0);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen de Nóminas', 14, y);
    y += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total de Nóminas: ${nominas.length}`, 14, y);
    y += 6;
    doc.text(`Nóminas Pagadas: ${nominasPagadas.length} (Bs ${totalPagado.toFixed(2)})`, 14, y);
    y += 6;
    doc.setTextColor(239, 68, 68);
    doc.text(`Nóminas Pendientes: ${nominasPendientes.length} (Bs ${totalPendiente.toFixed(2)})`, 14, y);
    y += 10;
    doc.setTextColor(0, 0, 0);

    // Tabla de nóminas
    doc.autoTable({
      startY: y,
      head: [['Personal', 'Cargo', 'Mes', 'Monto', 'Estado']],
      body: nominas.map(n => [
        `${n.nombre || ''} ${n.apellido || ''}`.trim(),
        n.cargo || 'N/A',
        `${obtenerNombreMes(n.mes)} ${n.año || ''}`,
        `Bs ${parseFloat(n.total_pagar || 0).toFixed(2)}`,
        n.estado === 'pagado' ? '✓ Pagado' : '⚠ Pendiente'
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30 }
      }
    });

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 40, doc.internal.pageSize.height - 10);
    }

    const nombreArchivo = periodo === 'mes' 
      ? `Reporte_Nominas_${obtenerNombreMes(document.getElementById('mes_nominas').value)}_2025.pdf`
      : periodo === 'todos'
      ? `Reporte_Nominas_Completo.pdf`
      : `Reporte_Nominas_${fechaInicio}_${fechaFin}.pdf`;
    doc.save(nombreArchivo);
    showMessage('✅ Reporte de nóminas generado exitosamente', 'success');

  } catch (error) {
    console.error('Error al generar reporte:', error);
    showMessage('❌ Error al generar el reporte: ' + error.message, 'error');
  }
};

// Generar PDF Consolidado
window.generarReporteConsolidadoPDF = async function() {
  const periodo = document.getElementById('periodo_consolidado').value;
  let fechaInicio, fechaFin, tituloPeriodo;

  if (periodo === 'todos') {
    fechaInicio = '2000-01-01';
    fechaFin = '2099-12-31';
    tituloPeriodo = 'Todo el Historial Completo';
  } else if (periodo === 'mes') {
    const mes = document.getElementById('mes_consolidado').value;
    const rango = obtenerRangoMes(mes);
    fechaInicio = rango.fechaInicio;
    fechaFin = rango.fechaFin;
    tituloPeriodo = `${obtenerNombreMes(mes)} 2025`;
  } else {
    fechaInicio = document.getElementById('fecha_inicio_consolidado').value;
    fechaFin = document.getElementById('fecha_fin_consolidado').value;
    if (!fechaInicio || !fechaFin) {
      showMessage('Por favor selecciona las fechas de inicio y fin', 'warning');
      return;
    }
    tituloPeriodo = `${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}`;
  }

  try {
    showMessage('⏳ Generando reporte consolidado...', 'info');
    
    // Obtener todos los datos
    const [pagosRes, reservasRes, nominasRes] = await Promise.all([
      fetch(`${API_URL}/pagos`),
      fetch(`${API_URL}/reservas`),
      fetch(`${API_URL}/nominas`)
    ]);

    const todosPagos = await pagosRes.json();
    const todasReservas = await reservasRes.json();
    const todasNominas = await nominasRes.json();

    // Filtrar por fecha
    const pagos = todosPagos.filter(p => {
      const fecha = p.fecha_pago || p.fecha_vencimiento;
      return fecha >= fechaInicio && fecha <= fechaFin && p.estado === 'pagado';
    });

    const reservas = todasReservas.filter(r => {
      return r.fecha_reserva >= fechaInicio && r.fecha_reserva <= fechaFin && r.estado === 'confirmada';
    });

    const nominas = todasNominas.filter(n => {
      const fechaPago = n.fecha_pago || n.mes + '-01';
      return fechaPago >= fechaInicio && fechaPago <= fechaFin && n.estado === 'pagado';
    });

    // Calcular totales
    const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const totalReservas = reservas.reduce((sum, r) => sum + parseFloat(r.monto_pago), 0);
    const totalNominas = nominas.reduce((sum, n) => sum + parseFloat(n.total_pagar || 0), 0);
    const totalIngresos = totalPagos + totalReservas;
    const totalEgresos = totalNominas;
    const balance = totalIngresos - totalEgresos;

    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    // Encabezado
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('HABITECH', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Reporte Financiero Consolidado', pageWidth / 2, 26, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periodo: ${tituloPeriodo}`, pageWidth / 2, 35, { align: 'center' });

    y = 55;
    doc.setTextColor(0, 0, 0);

    // Resumen Ejecutivo
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen Ejecutivo', 14, y);
    y += 10;

    // Cuadros de resumen
    const boxWidth = 60;
    const boxHeight = 25;
    const spacing = 5;

    // Ingresos
    doc.setFillColor(16, 185, 129);
    doc.rect(14, y, boxWidth, boxHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('TOTAL INGRESOS', 14 + boxWidth/2, y + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Bs ${totalIngresos.toFixed(2)}`, 14 + boxWidth/2, y + 18, { align: 'center' });

    // Egresos
    doc.setFillColor(239, 68, 68);
    doc.rect(14 + boxWidth + spacing, y, boxWidth, boxHeight, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('TOTAL EGRESOS', 14 + boxWidth + spacing + boxWidth/2, y + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Bs ${totalEgresos.toFixed(2)}`, 14 + boxWidth + spacing + boxWidth/2, y + 18, { align: 'center' });

    // Balance
    const balanceColor = balance >= 0 ? [16, 185, 129] : [239, 68, 68];
    doc.setFillColor(...balanceColor);
    doc.rect(14 + (boxWidth + spacing) * 2, y, boxWidth, boxHeight, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('BALANCE', 14 + (boxWidth + spacing) * 2 + boxWidth/2, y + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Bs ${balance.toFixed(2)}`, 14 + (boxWidth + spacing) * 2 + boxWidth/2, y + 18, { align: 'center' });

    y += boxHeight + 15;
    doc.setTextColor(0, 0, 0);

    // Desglose de Ingresos
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Desglose de Ingresos', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`- Pagos de Mantenimiento: ${pagos.length} pagos - Bs ${totalPagos.toFixed(2)}`, 20, y);
    y += 6;
    doc.text(`- Reservas de Areas Comunes: ${reservas.length} reservas - Bs ${totalReservas.toFixed(2)}`, 20, y);
    y += 10;

    // Desglose de Egresos
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Desglose de Egresos', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`- Nominas del Personal: ${nominas.length} nominas - Bs ${totalNominas.toFixed(2)}`, 20, y);
    y += 15;

    // Tabla resumen
    doc.autoTable({
      startY: y,
      head: [['Concepto', 'Cantidad', 'Monto']],
      body: [
        ['Pagos de Mantenimiento', pagos.length.toString(), `Bs ${totalPagos.toFixed(2)}`],
        ['Reservas de Áreas', reservas.length.toString(), `Bs ${totalReservas.toFixed(2)}`],
        ['', '', ''],
        ['Nóminas del Personal', nominas.length.toString(), `Bs -${totalNominas.toFixed(2)}`],
        ['', '', ''],
        ['BALANCE FINAL', '', `Bs ${balance.toFixed(2)}`]
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40 },
        2: { cellWidth: 45, halign: 'right' }
      },
      didParseCell: function(data) {
        // Estilo para filas vacías (separadores)
        if (data.row.index === 2 || data.row.index === 4) {
          data.cell.styles.fillColor = [229, 231, 235];
          data.cell.styles.minCellHeight = 2;
        }
        // Estilo para balance final
        if (data.row.index === 5) {
          data.cell.styles.fillColor = balance >= 0 ? [209, 250, 229] : [254, 226, 226];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 11;
        }
      }
    });

    // DETALLE COMPLETO DE PAGOS DE MANTENIMIENTO
    if (pagos.length > 0) {
      doc.addPage();
      y = 20;
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DETALLE: Pagos de Mantenimiento', 14, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total de ${pagos.length} pagos registrados en el periodo`, 14, y);
      y += 10;

      // Tabla de pagos detallada
      doc.autoTable({
        startY: y,
        head: [['#', 'Residente', 'Depto', 'Descripcion', 'Fecha', 'Monto']],
        body: pagos.map((p, index) => [
          (index + 1).toString(),
          `${p.residente_nombre} ${p.residente_apellido}`,
          p.departamento_numero,
          p.descripcion,
          new Date(p.fecha_pago || p.fecha_vencimiento).toLocaleDateString('es-ES'),
          `Bs ${parseFloat(p.monto).toFixed(2)}`
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 45 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 55 },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' }
        },
        foot: [[
          '', '', '', '', 'TOTAL:', `Bs ${totalPagos.toFixed(2)}`
        ]],
        footStyles: { 
          fillColor: [16, 185, 129], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 9
        }
      });
    }

    // DETALLE COMPLETO DE RESERVAS
    if (reservas.length > 0) {
      doc.addPage();
      y = 20;
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DETALLE: Reservas de Areas Comunes', 14, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total de ${reservas.length} reservas confirmadas en el periodo`, 14, y);
      y += 10;

      // Tabla de reservas detallada
      doc.autoTable({
        startY: y,
        head: [['#', 'Area', 'Fecha', 'Residente', 'Depto', 'Monto']],
        body: reservas.map((r, index) => [
          (index + 1).toString(),
          r.area_nombre,
          new Date(r.fecha_reserva).toLocaleDateString('es-ES'),
          `${r.residente_nombre} ${r.residente_apellido}`,
          r.departamento_numero,
          `Bs ${parseFloat(r.monto_pago).toFixed(2)}`
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [254, 243, 199] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 45 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' }
        },
        foot: [[
          '', '', '', '', 'TOTAL:', `Bs ${totalReservas.toFixed(2)}`
        ]],
        footStyles: { 
          fillColor: [245, 158, 11], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 9
        }
      });
      
      // Resumen por área
      y = doc.lastAutoTable.finalY + 15;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen por Area:', 14, y);
      y += 8;

      const reservasPorArea = {};
      reservas.forEach(r => {
        if (!reservasPorArea[r.area_nombre]) {
          reservasPorArea[r.area_nombre] = { cantidad: 0, total: 0 };
        }
        reservasPorArea[r.area_nombre].cantidad++;
        reservasPorArea[r.area_nombre].total += parseFloat(r.monto_pago);
      });

      doc.autoTable({
        startY: y,
        head: [['Area Comun', 'Cantidad', 'Total Recaudado']],
        body: Object.entries(reservasPorArea).map(([area, data]) => [
          area,
          data.cantidad.toString(),
          `Bs ${data.total.toFixed(2)}`
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 45, halign: 'right' }
        }
      });
    }

    // DETALLE COMPLETO DE NÓMINAS
    if (nominas.length > 0) {
      doc.addPage();
      y = 20;
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DETALLE: Nominas del Personal', 14, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total de ${nominas.length} nominas pagadas en el periodo`, 14, y);
      y += 10;

      // Tabla de nóminas detallada
      doc.autoTable({
        startY: y,
        head: [['#', 'Personal', 'Cargo', 'Mes/Año', 'Monto']],
        body: nominas.map((n, index) => [
          (index + 1).toString(),
          `${n.nombre || ''} ${n.apellido || ''}`.trim(),
          n.cargo || 'N/A',
          `${obtenerNombreMes(n.mes)} ${n.año || ''}`,
          `Bs ${parseFloat(n.total_pagar || 0).toFixed(2)}`
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [254, 226, 226] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 40 },
          3: { cellWidth: 35, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' }
        },
        foot: [[
          '', '', '', 'TOTAL:', `Bs ${totalNominas.toFixed(2)}`
        ]],
        footStyles: { 
          fillColor: [239, 68, 68], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 9
        }
      });
    }

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 40, doc.internal.pageSize.height - 10);
    }

    const nombreArchivo = periodo === 'mes' 
      ? `Reporte_Consolidado_${obtenerNombreMes(document.getElementById('mes_consolidado').value)}_2025.pdf`
      : periodo === 'todos'
      ? `Reporte_Consolidado_Completo.pdf`
      : `Reporte_Consolidado_${fechaInicio}_${fechaFin}.pdf`;
    doc.save(nombreArchivo);
    showMessage('✅ Reporte consolidado generado exitosamente', 'success');

  } catch (error) {
    console.error('Error al generar reporte:', error);
    showMessage('❌ Error al generar el reporte: ' + error.message, 'error');
  }
};

window.cerrarPreview = function() {
  document.getElementById('reportePreview').style.display = 'none';
};
