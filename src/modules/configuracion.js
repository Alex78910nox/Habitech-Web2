export function renderConfiguracion() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>Métricas de Consumo</h1>
      <p>Visualiza y analiza las métricas de consumo del sistema</p>
    </div>

    <div class="empty-state">
      <h3>Módulo en desarrollo</h3>
      <p>Próximamente podrás ver y analizar las métricas de consumo</p>
    </div>
  `;
}
