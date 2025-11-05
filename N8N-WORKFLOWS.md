# 🤖 Guía de Integración n8n con Habitech

## 📋 Tabla de Contenidos
1. [Instalación de n8n](#instalación)
2. [Workflows Recomendados](#workflows)
3. [Ejemplos de Uso](#ejemplos)
4. [Configuración en Render](#deploy)

---

## 🚀 Instalación de n8n

### Opción 1: Docker (Recomendado)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Opción 2: npm global
```bash
npm install -g n8n
n8n start
```

### Opción 3: n8n Cloud (Gratis)
Crea una cuenta en: https://n8n.io/cloud

---

## 🎯 Workflows Recomendados

### 1. **Análisis Inteligente de Anomalías** ⚠️

**Flujo:**
```
Webhook (Habitech) 
  → Obtener datos de anomalía
  → Gemini AI: Analizar severidad
  → IF severidad > alta
    → Enviar email urgente a admin
    → Crear notificación en sistema
  → ELSE
    → Registrar en log
```

**Configuración en n8n:**
1. **Webhook Node**: URL: `/webhook/analyze-anomalies`
2. **Function Node**: Extraer datos
3. **HTTP Request**: Llamar a Gemini API
4. **IF Node**: Evaluar severidad
5. **Email Node**: Enviar alerta
6. **HTTP Request**: POST a `/api/notificaciones`

**Llamada desde Habitech:**
```javascript
fetch('http://localhost:3000/api/n8n/trigger/analyze-anomalies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    departmentId: 301,
    anomalyType: 'consumo',
    value: 150,
    expected: 80,
    severity: 'alta'
  })
});
```

---

### 2. **Bienvenida Automatizada con IA** 👋

**Flujo:**
```
Webhook (nuevo residente)
  → Obtener perfil del residente
  → Gemini AI: Generar mensaje personalizado
  → Enviar email de bienvenida
  → Enviar SMS de bienvenida
  → Crear tareas de onboarding
```

**Prompt para Gemini:**
```
Genera un mensaje de bienvenida personalizado para {{nombre}} 
que se muda al departamento {{numero}} en nuestro edificio Habitech.
Incluye:
- Saludo cálido
- Información importante del edificio
- Contactos de emergencia
- Próximos pasos (pago, acceso, etc.)
Tono: Profesional pero amigable
```

---

### 3. **Clasificación Inteligente de Solicitudes de Mantenimiento** 🔧

**Flujo:**
```
Webhook (nueva solicitud)
  → Gemini AI: Analizar descripción
  → Clasificar (urgencia, categoría, técnico)
  → Asignar automáticamente
  → Enviar notificación al técnico
  → Responder al residente con tiempo estimado
```

**Prompt para Gemini:**
```json
{
  "descripcion": "{{descripcion_solicitud}}",
  "prompt": "Analiza esta solicitud de mantenimiento y devuelve JSON con:
  {
    'urgencia': 'baja|media|alta|critica',
    'categoria': 'plomeria|electricidad|pintura|limpieza|otro',
    'tecnico_recomendado': 'nombre',
    'tiempo_estimado': 'horas',
    'requiere_materiales': boolean
  }"
}
```

---

### 4. **Recordatorios Inteligentes de Pago** 💰

**Flujo:**
```
Cron (diario a las 9am)
  → Consultar pagos vencidos
  → FOR EACH pago vencido:
    → Gemini AI: Generar mensaje personalizado
    → Evaluar historial de pagos
    → IF primera vez:
      → Mensaje amable
    → ELSE IF reincidente:
      → Mensaje más formal
    → Enviar email/SMS
    → Registrar en sistema
```

---

### 5. **Generación Automática de Reportes** 📊

**Flujo:**
```
Webhook mensual
  → Obtener datos del mes
  → Gemini AI: Analizar tendencias
  → Generar insights y recomendaciones
  → Crear PDF con gráficas
  → Enviar a administradores
```

---

### 6. **Chatbot Avanzado con Memoria** 🤖

**Flujo:**
```
Webhook (mensaje usuario)
  → Buscar contexto en BD
  → Recuperar conversación anterior
  → Gemini AI: Responder con contexto
  → Guardar en historial
  → Enviar respuesta
```

---

## 💡 Ejemplos Prácticos de Código

### Disparar workflow desde backend:

```javascript
// En cualquier ruta de Habitech
import fetch from 'node-fetch';

// Ejemplo 1: Analizar anomalía
app.post('/api/anomalias-detectadas', async (req, res) => {
  const anomalia = await crearAnomalia(req.body);
  
  // Disparar análisis con n8n
  await fetch('http://localhost:3000/api/n8n/trigger/analyze-anomalies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(anomalia)
  });
  
  res.json(anomalia);
});

// Ejemplo 2: Bienvenida automatizada
app.post('/api/residentes', async (req, res) => {
  const residente = await crearResidente(req.body);
  
  // Disparar bienvenida con n8n
  await fetch('http://localhost:3000/api/n8n/trigger/welcome-resident', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: residente.nombre,
      email: residente.correo,
      departamento: residente.departamento_id
    })
  });
  
  res.json(residente);
});
```

### Disparar workflow desde frontend:

```javascript
// En src/modules/solicitudes-mantenimiento.js
async function crearSolicitud(data) {
  // Crear solicitud en BD
  const response = await fetch(`${API_URL}/solicitudes-mantenimiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const solicitud = await response.json();
  
  // Disparar clasificación inteligente con n8n
  await fetch(`${API_URL}/n8n/trigger/classify-maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      solicitudId: solicitud.id,
      descripcion: solicitud.descripcion,
      departamento: solicitud.departamento_id
    })
  });
  
  return solicitud;
}
```

---

## 🔧 Configuración de Webhooks en n8n

### Crear un webhook en n8n:

1. **Abre n8n**: http://localhost:5678
2. **Crear nuevo workflow**
3. **Agregar nodo "Webhook"**
4. **Configurar:**
   - Path: `/analyze-anomalies`
   - Method: POST
   - Response: Return Last Node

5. **Agregar lógica:**
   - HTTP Request (Gemini)
   - Function (procesar)
   - Email/SMS
   - HTTP Request (responder a Habitech)

---

## 🌐 Deploy en Render (Producción)

### n8n en Render:

1. **Crear nuevo Web Service**
2. **Docker image**: `n8nio/n8n`
3. **Variables de entorno:**
   ```
   N8N_BASIC_AUTH_ACTIVE=true
   N8N_BASIC_AUTH_USER=admin
   N8N_BASIC_AUTH_PASSWORD=tu_password_seguro
   WEBHOOK_URL=https://tu-n8n.onrender.com/
   ```

4. **En Habitech agregar:**
   ```
   N8N_WEBHOOK_URL=https://tu-n8n.onrender.com/webhook
   ```

---

## 📚 Recursos Adicionales

- [Documentación n8n](https://docs.n8n.io/)
- [n8n Templates](https://n8n.io/workflows)
- [Comunidad n8n](https://community.n8n.io/)

---

## ✅ Checklist de Implementación

- [ ] Instalar n8n localmente
- [ ] Crear primer workflow de prueba
- [ ] Configurar webhooks en Habitech
- [ ] Probar integración con Gemini
- [ ] Crear workflows de producción
- [ ] Configurar n8n en Render
- [ ] Actualizar variables de entorno
- [ ] Documentar workflows personalizados

---

## 🎯 Próximos Pasos

1. **Instala n8n** (opción Docker o npm)
2. **Prueba el endpoint**: `POST /api/n8n/trigger/test`
3. **Crea tu primer workflow** en n8n
4. **Integra con tus módulos** existentes

¿Necesitas ayuda con algún workflow específico? 🚀
