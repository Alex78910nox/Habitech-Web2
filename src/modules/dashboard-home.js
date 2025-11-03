import { API_URL } from '../utils/api.js';
import Chart from 'chart.js/auto';

export function renderDashboard() {
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
      <div class="dashboard-card">
        <h3>Pagos Pagados</h3>
        <div class="card-content" id="totalPagosPagados">...</div>
      </div>
    </div>

    <div class="dashboard-chart">
      <h3>Solicitudes de Mantenimiento</h3>
      <canvas id="maintenanceChart"></canvas>
    </div>
    <div style="display: flex; flex-direction: row; gap: 2rem; justify-content: center; margin-top: 2rem; width: 100%; max-width: 1200px; margin-left: auto; margin-right: auto;">
  <div style="background: transparent; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); padding: 1.5rem; display: flex; flex-direction: column; align-items: center; min-width: 320px; min-height: 350px;">
        <h3 style="margin-bottom: 1rem; color: #3b82f6; font-size: 1.1rem; text-align: center;">Pagos Pagados vs Pendientes</h3>
        <canvas id="pagosChart" width="320" height="320"></canvas>
      </div>
  <div style="background: transparent; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); padding: 1.5rem; display: flex; flex-direction: column; align-items: center; min-width: 320px; min-height: 350px;">
        <h3 style="margin-bottom: 1rem; color: #3b82f6; font-size: 1.1rem; text-align: center;">Pagos por Tipo</h3>
        <canvas id="pagosTipoChart" width="320" height="320"></canvas>
      </div>
  <div style="background: transparent; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); padding: 1.5rem; display: flex; flex-direction: column; align-items: center; min-width: 320px; min-height: 350px;">
        <h3 style="margin-bottom: 1rem; color: #3b82f6; font-size: 1.1rem; text-align: center;">Departamentos por Estado</h3>
        <canvas id="departamentosEstadoChart" width="320" height="320"></canvas>
      </div>
    </div>
  `;

  loadDashboardStats();
  renderMaintenanceChart();
  renderPagosChart();
  renderPagosTipoChart();
  renderDepartamentosEstadoChart();
// Gráfica de pagos por tipo
async function renderPagosTipoChart() {
  try {
    const response = await fetch(`${API_URL}/estadisticas/pagos-por-tipo`);
    if (!response.ok) {
      throw new Error(`Error en la respuesta del servidor: ${response.statusText}`);
    }
    const data = await response.json();
    const labels = data.map(item => item.tipo_pago);
    const values = data.map(item => parseInt(item.total));
    const colors = ['#2196f3', '#ff9800', '#9c27b0', '#009688'];
    const ctx = document.getElementById('pagosTipoChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
        }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'top' },
        },
      },
    });
  } catch (error) {
    console.error('Error al cargar gráfica de pagos por tipo:', error);
  }
}

// Gráfica de departamentos por estado
async function renderDepartamentosEstadoChart() {
  try {
    const response = await fetch(`${API_URL}/estadisticas/departamentos-por-estado`);
    if (!response.ok) {
      throw new Error(`Error en la respuesta del servidor: ${response.statusText}`);
    }
    const data = await response.json();
    const labels = data.map(item => item.estado);
    const values = data.map(item => parseInt(item.total));
    const ctx = document.getElementById('departamentosEstadoChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Departamentos',
          data: values,
          backgroundColor: 'rgba(255, 193, 7, 0.6)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  } catch (error) {
    console.error('Error al cargar gráfica de departamentos por estado:', error);
  }
}
}

async function loadDashboardStats() {
  try {
    // Solicitar estadísticas generales al backend
    const response = await fetch(`${API_URL}/estadisticas/generales`);
    if (!response.ok) {
      throw new Error(`Error en la respuesta del servidor: ${response.statusText}`);
    }

    const data = await response.json();

    // Validar que los datos existen antes de actualizar el DOM
    document.getElementById('totalUsers').textContent = data.totalUsuarios ?? 'N/A';
    document.getElementById('totalResidentes').textContent = data.totalResidentes ?? 'N/A';
    document.getElementById('totalDepartamentos').textContent = data.totalDepartamentos ?? 'N/A';
    document.getElementById('totalPagosPagados').textContent = data.totalPagosPagados ?? 'N/A';
  } catch (error) {
    console.error('Error al cargar estadísticas generales:', error);

    // Mostrar mensaje de error en el dashboard
    document.getElementById('totalUsers').textContent = 'Error';
    document.getElementById('totalResidentes').textContent = 'Error';
    document.getElementById('totalDepartamentos').textContent = 'Error';
    document.getElementById('totalPagosPagados').textContent = 'Error';
  }
}

function renderMaintenanceChart() {
  const ctx = document.getElementById('maintenanceChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: [
        {
          label: 'Solicitudes de Mantenimiento',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
      },
    },
  });
}

// ...

async function renderPagosChart() {
  try {
    const response = await fetch(`${API_URL}/estadisticas/generales`);
    if (!response.ok) {
      throw new Error(`Error en la respuesta del servidor: ${response.statusText}`);
    }
    const data = await response.json();

    // Obtener pagos pagados y pendientes
    const pagados = data.totalPagosPagados ?? 0;
    // Si quieres mostrar pendientes, deberás agregar ese dato en el backend, aquí lo dejamos en 0 por defecto
    const pendientes = (data.totalPagosPendientes ?? 0);

    const canvas = document.getElementById('pagosChart');
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pagados', 'Pendientes'],
        datasets: [
          {
            data: [pagados, pendientes],
            backgroundColor: ['#00bcd4', '#ffeb3b'], // azul y amarillo
            borderColor: ['#008ba3', '#c8b900'],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error al cargar gráfica de pagos:', error);
  }
}
