// Mostrar mensajes
export function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
  messageDiv.textContent = message;
  
  const content = document.getElementById('dashboard-content');
  content.insertBefore(messageDiv, content.firstChild);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}
