// Importar utilidades
import { checkAuthentication, displayUserProfile, logout } from './utils/auth.js';
import { showMessage } from './utils/messages.js';

// Importar módulos
import { renderDashboard } from './modules/dashboard-home.js';
import moduloSolicitudesMantenimiento from './modules/solicitudes-mantenimiento.js';
import { renderUsuarios, deleteUser } from './modules/usuarios.js';
import { renderResidentes, deleteResidente } from './modules/residentes.js';
import { renderNotificaciones } from './modules/notificaciones.js';
import { renderReservas, cancelarReserva, confirmarReserva, eliminarReserva } from './modules/reservas.js';
import { renderGestionFinanciera, generarReporte } from './modules/gestion-financiera.js';
import { renderConfiguracion } from './modules/configuracion.js';
import { renderMetricasConsumo } from './modules/metricas-consumo.js';
import { renderRegistrosAcceso } from './modules/registros-acceso.js';
import { renderChatbot } from './modules/chatbot.js';
import { sendEmailVerification, sendSmsVerification, sendSmsVerificationResidente } from './modules/verificacion.js';

// Exponer funciones globales necesarias para onclick en HTML
window.logout = logout;
window.deleteUser = deleteUser;
window.deleteResidente = deleteResidente;
window.cancelarReserva = cancelarReserva;
window.confirmarReserva = confirmarReserva;
window.eliminarReserva = eliminarReserva;
window.generarReporte = generarReporte;
window.sendEmailVerification = sendEmailVerification;
window.sendSmsVerification = sendSmsVerification;
window.sendSmsVerificationResidente = sendSmsVerificationResidente;

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
        case 'reservas':
          renderReservas();
          break;
        case 'finanzas':
          renderGestionFinanciera();
          break;
        case 'configuracion':
          renderMetricasConsumo();
          break;
        case 'registros-acceso':
          renderRegistrosAcceso();
          break;
        case 'chatbot':
          renderChatbot();
          break;
         case 'solicitudes-mantenimiento':
           moduloSolicitudesMantenimiento.render(document.getElementById('dashboard-content'));
           break;
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
