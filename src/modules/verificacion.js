import { API_URL } from '../utils/api.js';
import { showMessage } from '../utils/messages.js';

// Enviar código de verificación por email
export async function sendEmailVerification(formId) {
  const form = document.getElementById(formId);
  const correo = form.querySelector('[name="correo"]').value;
  const nombre = form.querySelector('[name="nombre"]').value;
  
  if (!correo) {
    showMessage('Ingresa un correo electrónico', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/verification/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, nombre })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Mostrar campo de código (funciona para userForm y residenteForm)
      const codeGroup = document.getElementById('correoCodeGroup') || document.getElementById('res_correoCodeGroup');
      if (codeGroup) codeGroup.style.display = 'block';
      
      // Mostrar mensaje con el código (solo en desarrollo)
      if (data.codigo) {
        showMessage(`Código enviado (DEV): ${data.codigo}. ${data.warning || 'Revisa tu email'}`, 'success');
      } else {
        showMessage('Código enviado a tu correo. Revisa tu bandeja de entrada', 'success');
      }
    } else {
      showMessage(data.error || 'Error al enviar código', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
}

// Enviar código de verificación por SMS
export async function sendSmsVerification(formId) {
  const form = document.getElementById(formId);
  const telefono = form.querySelector('[name="telefono"]').value;
  
  if (!telefono) {
    showMessage('Ingresa un número de teléfono', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/verification/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Mostrar campo de código
      const codeGroup = document.getElementById('telefonoCodeGroup');
      if (codeGroup) codeGroup.style.display = 'block';
      
      // Mostrar mensaje con el código (solo en desarrollo)
      if (data.codigo) {
        showMessage(`Código enviado (DEV): ${data.codigo}. ${data.warning || 'Revisa tu SMS'}`, 'success');
      } else {
        showMessage('Código enviado por SMS. Revisa tus mensajes', 'success');
      }
    } else {
      showMessage(data.error || 'Error al enviar código', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
}

// Enviar código de verificación por SMS (específico para residentes)
export async function sendSmsVerificationResidente(formId) {
  const form = document.getElementById(formId);
  const telefono = form.querySelector('[name="telefono"]').value;
  
  if (!telefono) {
    showMessage('Ingresa un número de teléfono', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/verification/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Mostrar campo de código (ID específico para residentes)
      const codeGroup = document.getElementById('res_telefonoCodeGroup');
      if (codeGroup) codeGroup.style.display = 'block';
      
      // Mostrar mensaje con el código (solo en desarrollo)
      if (data.codigo) {
        showMessage(`Código enviado (DEV): ${data.codigo}. ${data.warning || 'Revisa tu SMS'}`, 'success');
      } else {
        showMessage('Código enviado por SMS. Revisa tus mensajes', 'success');
      }
    } else {
      showMessage(data.error || 'Error al enviar código', 'error');
    }
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
}
