import { showMessage } from '../utils/messages.js';
import { API_URL } from '../utils/api.js';

export function renderChatbot() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="dashboard-header">
      <h1>🤖 Asistente Virtual</h1>
      <p>Chatea con nuestro asistente inteligente powered by Gemini AI</p>
    </div>

    <div class="chat-container">
      <div class="chat-messages" id="chatMessages">
        <div class="bot-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <p>¡Hola! Soy tu asistente virtual de Habitech. ¿En qué puedo ayudarte hoy?</p>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <textarea 
          id="chatInput" 
          placeholder="Escribe tu mensaje aquí..."
          rows="2"
        ></textarea>
        <button class="btn btn-primary" onclick="enviarMensaje()" id="sendBtn">
          Enviar 📤
        </button>
      </div>
    </div>

    <style>
      .chat-container {
        max-width: 900px;
        margin: 2rem auto;
        background: var(--card-bg);
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: calc(100vh - 300px);
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .user-message,
      .bot-message {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        animation: fadeIn 0.3s ease;
      }

      .user-message {
        flex-direction: row-reverse;
      }

      .message-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .bot-message .message-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .user-message .message-avatar {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      .message-content {
        background: #2a2d3a;
        padding: 1rem 1.5rem;
        border-radius: 16px;
        max-width: 70%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: #e4e4e7;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .user-message .message-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
      }

      .message-content p {
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .message-content ul,
      .message-content ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }

      .message-content li {
        margin: 0.25rem 0;
      }

      .chat-input-container {
        padding: 1.5rem;
        background: var(--bg-color);
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 1rem;
        align-items: flex-end;
      }

      #chatInput {
        flex: 1;
        padding: 1rem;
        border: 2px solid var(--border-color);
        border-radius: 12px;
        font-family: inherit;
        font-size: 1rem;
        resize: none;
        transition: border-color 0.3s ease;
      }

      #chatInput:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .chat-input-container .btn {
        padding: 1rem 2rem;
        white-space: nowrap;
      }

      .typing-indicator {
        display: flex;
        gap: 0.5rem;
        padding: 1rem;
      }

      .typing-indicator span {
        width: 8px;
        height: 8px;
        background: var(--primary-color);
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }

      .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-10px); }
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;

  // Event listener para Enter
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  });

  // Hacer función global
  window.enviarMensaje = enviarMensaje;
}

async function enviarMensaje() {
  const input = document.getElementById('chatInput');
  const mensaje = input.value.trim();
  
  if (!mensaje) return;

  const messagesContainer = document.getElementById('chatMessages');
  const sendBtn = document.getElementById('sendBtn');

  // Deshabilitar input mientras se procesa
  input.disabled = true;
  sendBtn.disabled = true;
  sendBtn.textContent = 'Enviando...';

  // Agregar mensaje del usuario
  agregarMensaje(mensaje, 'user');
  input.value = '';

  // Mostrar indicador de escritura
  mostrarIndicadorEscritura();

  try {
    // Llamar a nuestro backend
    const response = await fetch(`${API_URL}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: mensaje })
    });

    if (!response.ok) {
      throw new Error('Error al comunicarse con el asistente');
    }

    const data = await response.json();
    
    // Quitar indicador de escritura
    quitarIndicadorEscritura();

    // Agregar respuesta del bot
    agregarMensaje(data.response || data.text || 'Lo siento, no pude procesar tu mensaje.', 'bot');

  } catch (error) {
    console.error('Error:', error);
    quitarIndicadorEscritura();
    agregarMensaje('Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.', 'bot');
  } finally {
    // Rehabilitar input
    input.disabled = false;
    sendBtn.disabled = false;
    sendBtn.textContent = 'Enviar 📤';
    input.focus();
  }
}

function agregarMensaje(texto, tipo) {
  const messagesContainer = document.getElementById('chatMessages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = tipo === 'user' ? 'user-message' : 'bot-message';
  
  // Procesar el texto para convertir markdown básico
  let textoFormateado = texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Negritas
    .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Cursivas
    .replace(/\n/g, '<br>');                           // Saltos de línea
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${tipo === 'user' ? '👤' : '🤖'}</div>
    <div class="message-content">
      <p>${textoFormateado}</p>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  
  // Scroll al final con animación suave
  messagesContainer.scrollTo({
    top: messagesContainer.scrollHeight,
    behavior: 'smooth'
  });
}

function mostrarIndicadorEscritura() {
  const messagesContainer = document.getElementById('chatMessages');
  
  const indicator = document.createElement('div');
  indicator.className = 'bot-message';
  indicator.id = 'typing-indicator';
  indicator.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(indicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function quitarIndicadorEscritura() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}
