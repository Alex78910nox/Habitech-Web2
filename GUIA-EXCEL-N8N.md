# 📊 Agente IA: Generador Automático de Excel de Pagos de Mantenimiento

## 🎯 Objetivo
Crear un agente IA con n8n Cloud que genere automáticamente un archivo Excel con los pagos de mantenimiento mensuales, con análisis inteligente y envío automático por email.

**✨ Todo funciona 24/7 en la nube sin necesidad de tu computadora encendida.**

---

## 📋 Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Crear Workflow en n8n Cloud](#crear-workflow-en-n8n-cloud)
3. [Configuración de Nodos](#configuración-de-nodos)
4. [Pruebas](#pruebas)
5. [Automatización](#automatización)
6. [Integración con Render](#integración-con-render)

---

## 🚀 Configuración Inicial

### ⚠️ Importante: Usaremos n8n Cloud (NO local)

**¿Por qué n8n Cloud?**
- ✅ No necesitas instalar nada
- ✅ Funciona 24/7 automáticamente
- ✅ Se integra directamente con tu servidor en Render
- ✅ Gratis hasta 2,500 ejecuciones/mes
- ✅ Respaldos automáticos

---

### Paso 1: Crear cuenta en n8n Cloud

1. Ve a: **https://app.n8n.cloud/register**
2. Crea tu cuenta (puedes usar Google/GitHub)
3. Verifica tu email
4. Inicia sesión en: **https://app.n8n.cloud**

Tu instancia tendrá una URL como:
```
https://tu-nombre.app.n8n.cloud
```

---

### Paso 2: Obtener tu URL de Render

Tu servidor Habitech ya está desplegado en Render. La URL es algo como:
```
https://habitech-web2.onrender.com
```

**Verifica que funcione:**
Abre en tu navegador:
```
https://TU-URL-RENDER.onrender.com/api/reportes/pagos-mantenimiento?mes=11&anio=2025
```

Deberías ver un JSON con los datos de pagos.

---

## 🎨 Crear Workflow en n8n Cloud

### Paso 1: Crear nuevo workflow

1. En n8n Cloud, clic en **"+ New Workflow"**
2. Nombre: **"Generador Excel Pagos Mantenimiento"**
3. Descripción: **"Genera reporte Excel mensual con análisis IA"**

---

### Paso 2: Configurar Variables de Entorno en n8n Cloud

Antes de agregar nodos, configura tus credenciales:

1. En n8n Cloud, ve a: **Settings → Environments** (icono de tuerca arriba a la derecha)
2. Agrega estas variables:

```env
GEMINI_API_KEY=AIzaSyCmILG6-iLUklPyNKEvJni1CmDkMMC67lU
RENDER_URL=https://TU-URL-RENDER.onrender.com
```

*(Reemplaza `TU-URL-RENDER` con tu URL real de Render)*

---

### Paso 3: Agregar nodos (arrastra y configura)

#### **Nodo 1: Webhook** (Disparador)

- **Node:** `Webhook`
- **Authentication:** `None`
- **HTTP Method:** `POST`
- **Path:** `generar-excel-pagos`
- **Response Mode:** `When Last Node Finishes`
- **Respond With:** `Using 'Respond to Webhook' Node`

Una vez guardes, n8n te dará una URL como:
```
https://tu-nombre.app.n8n.cloud/webhook/generar-excel-pagos
```

**📝 Copia esta URL - la usarás para disparar el workflow**

**Body esperado:**
```json
{
  "mes": 11,
  "anio": 2025,
  "emailDestino": "admin@habitech.com"
}
```

---

#### **Nodo 2: HTTP Request** (Obtener datos de Habitech en Render)

- **Node:** `HTTP Request`
- **Method:** `GET`
- **URL:** `{{ $env.RENDER_URL }}/api/reportes/pagos-mantenimiento`
- **Authentication:** `None`
- **Send Query Parameters:** ✅ Enabled
- **Query Parameters:**
  - **Name:** `mes` | **Value:** `{{ $json.mes }}`
  - **Name:** `anio` | **Value:** `{{ $json.anio }}`

**Conecta:** Webhook → HTTP Request

**💡 Nota:** Si tu servidor Render tarda en despertar (free tier), este nodo puede tardar 30-60 segundos la primera vez.

---

#### **Nodo 3: Function** (Preparar datos para IA)

- **Node:** `Function`
- **Name:** `Preparar Prompt IA`

**Código JavaScript:**
```javascript
// Obtener datos del nodo anterior
const data = $input.all()[0].json;
const metadata = data.metadata;
const pagos = data.datos;

// Crear resumen para la IA
const resumen = `
Analiza este reporte de pagos de mantenimiento:

Mes: ${metadata.mesNombre} ${metadata.anio}
Total departamentos: ${metadata.totalDepartamentos}
Pagados: ${metadata.totalPagados} (${metadata.porcentajePagado}%)
Pendientes: ${metadata.totalPendientes}
Atrasados: ${metadata.totalAtrasados}

Monto total: $${metadata.montoTotal}
Monto pagado: $${metadata.montoPagado}
Monto pendiente: $${metadata.montoPendiente}

Genera un análisis ejecutivo con:
1. Estado general de la cobranza
2. Identificación de departamentos con retrasos frecuentes
3. Recomendaciones de acción
4. Predicción de flujo de efectivo

Formato: 3-4 párrafos, tono profesional.
`;

return {
  json: {
    prompt: resumen,
    metadata: metadata,
    datos: pagos,
    emailDestino: $json.emailDestino
  }
};
```

**Conecta:** HTTP Request → Function

---

#### **Nodo 4: HTTP Request** (Gemini AI - Análisis)

- **Node:** `HTTP Request`
- **Method:** `POST`
- **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Query Parameters:**
  - `key`: `{{ $env.GEMINI_API_KEY }}`
- **Body:**
```json
{
  "contents": [{
    "parts": [{
      "text": "{{ $json.prompt }}"
    }]
  }]
}
```

**Conecta:** Function → HTTP Request (Gemini)

---

#### **Nodo 5: Function** (Extraer respuesta IA)

- **Node:** `Function`
- **Name:** `Extraer Análisis`

**Código:**
```javascript
const input = $input.all();
const geminiResponse = input[0].json;
const datosOriginales = input[1].json; // Del nodo 3

// Extraer análisis de Gemini
const analisisIA = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 
                   'Análisis no disponible';

return {
  json: {
    metadata: datosOriginales.metadata,
    datos: datosOriginales.datos,
    analisisIA: analisisIA,
    emailDestino: datosOriginales.emailDestino
  }
};
```

**Conecta:** 
- HTTP Request (Gemini) → Function (Extraer)
- Function (Preparar) → Function (Extraer) *(segunda conexión)*

---

#### **Nodo 6: Spreadsheet File** (Crear Excel)

- **Node:** `Spreadsheet File`
- **Operation:** `Create`
- **File Format:** `xlsx`
- **Input Data Field Name:** `datos`
- **Options:**
  - **Header Row:** ✅ Enabled
  - **Sheet Name:** `Pagos {{ $json.metadata.mesNombre }}`

**Conecta:** Function (Extraer) → Spreadsheet File

---

#### **Nodo 7: Function** (Preparar Email)

- **Node:** `Function`
- **Name:** `Preparar Email`

**Código:**
```javascript
const input = $input.all()[0].json;
const metadata = input.metadata;
const analisisIA = input.analisisIA;

const asunto = `📊 Reporte Pagos Mantenimiento - ${metadata.mesNombre} ${metadata.anio}`;

const cuerpoEmail = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f7fafc; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
    .stat-label { color: #718096; font-size: 0.9em; }
    .analysis { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { color: #718096; font-size: 0.9em; text-align: center; padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏢 Habitech</h1>
    <h2>Reporte de Pagos de Mantenimiento</h2>
    <p>${metadata.mesNombre} ${metadata.anio}</p>
  </div>
  
  <div class="content">
    <h3>📊 Resumen Ejecutivo</h3>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">${metadata.totalPagados}</div>
        <div class="stat-label">Pagados</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${metadata.totalPendientes}</div>
        <div class="stat-label">Pendientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${metadata.totalAtrasados}</div>
        <div class="stat-label">Atrasados</div>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">$${metadata.montoPagado}</div>
        <div class="stat-label">Monto Pagado</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">$${metadata.montoPendiente}</div>
        <div class="stat-label">Monto Pendiente</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${metadata.porcentajePagado}%</div>
        <div class="stat-label">% Cobranza</div>
      </div>
    </div>
    
    <div class="analysis">
      <h3>🤖 Análisis Inteligente (Gemini AI)</h3>
      <p>${analisisIA.replace(/\n/g, '<br>')}</p>
    </div>
    
    <p><strong>📎 Archivo adjunto:</strong> Excel con el detalle completo de ${metadata.totalDepartamentos} departamentos.</p>
  </div>
  
  <div class="footer">
    <p>Reporte generado automáticamente por Habitech AI</p>
    <p>Fecha: ${metadata.fechaGeneracion}</p>
  </div>
</body>
</html>
`;

return {
  json: {
    asunto: asunto,
    cuerpo: cuerpoEmail,
    emailDestino: input.emailDestino
  }
};
```

**Conecta:** Spreadsheet File → Function (Preparar Email)

---

#### **Nodo 8: Gmail** (Enviar Email)

- **Node:** `Gmail`
- **Operation:** `Send`
- **To:** `{{ $json.emailDestino }}`
- **Subject:** `{{ $json.asunto }}`
- **Message Type:** `HTML`
- **Message:** `{{ $json.cuerpo }}`
- **Attachments:** `data` *(del nodo Spreadsheet)*

**Conecta:** Function (Preparar Email) → Gmail

**Nota:** Necesitas conectar tu cuenta de Gmail en n8n

---

#### **Nodo 9: Respond to Webhook** (Responder)

- **Node:** `Respond to Webhook`
- **Response Body:**
```json
{
  "success": true,
  "message": "Excel generado y enviado exitosamente",
  "metadata": "{{ $json.metadata }}",
  "emailEnviado": "{{ $json.emailDestino }}"
}
```

**Conecta:** Gmail → Respond to Webhook

---

## ✅ Guardar y Activar

1. **Guarda el workflow** (Ctrl+S o botón Save)
2. **Activa el workflow** (toggle en la esquina superior derecha)
3. Copia la URL del webhook que aparece en el nodo Webhook

---

## 🧪 Pruebas

### Opción 1: Probar desde n8n Cloud

1. En n8n Cloud, haz clic en **"Test Workflow"** (botón de play)
2. Haz clic en **"Listen For Test Event"** en el nodo Webhook
3. Desde tu navegador o Postman, envía:

```bash
curl -X POST https://TU-INSTANCIA.app.n8n.cloud/webhook/generar-excel-pagos \
  -H "Content-Type: application/json" \
  -d '{
    "mes": 11,
    "anio": 2025,
    "emailDestino": "tu@email.com"
  }'
```

*(Reemplaza `TU-INSTANCIA` con tu URL real de n8n Cloud)*

---

### Opción 2: Integrar en tu dashboard de Habitech

Puedes agregar un botón en tu frontend para generar el reporte:

**En `src/modules/gestion-financiera.js`** (o donde quieras):

```javascript
async function generarReporteExcel() {
  const mes = document.getElementById('mes').value;
  const anio = document.getElementById('anio').value;
  const email = document.getElementById('email').value;

  try {
    showMessage('Generando reporte...', 'info');

    const response = await fetch('https://TU-INSTANCIA.app.n8n.cloud/webhook/generar-excel-pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes, anio, emailDestino: email })
    });

    const result = await response.json();

    if (result.success) {
      showMessage('✅ Reporte enviado a tu email exitosamente', 'success');
    } else {
      showMessage('❌ Error al generar reporte', 'error');
    }
  } catch (error) {
    showMessage('❌ Error: ' + error.message, 'error');
  }
}
```

**HTML del botón:**
```html
<div class="report-generator">
  <h3>📊 Generar Reporte Excel de Pagos</h3>
  
  <label>Mes:</label>
  <select id="mes">
    <option value="1">Enero</option>
    <option value="2">Febrero</option>
    <!-- ... resto de meses -->
    <option value="11" selected>Noviembre</option>
    <option value="12">Diciembre</option>
  </select>
  
  <label>Año:</label>
  <input type="number" id="anio" value="2025">
  
  <label>Email destino:</label>
  <input type="email" id="email" value="admin@habitech.com">
  
  <button onclick="generarReporteExcel()" class="btn btn-primary">
    📧 Generar y Enviar Reporte
  </button>
</div>
```

---

### Opción 3: Desde el backend de Render

Agrega esta ruta en `server/routes/reportes-excel.js`:

```javascript
router.post('/generar-y-enviar-excel', async (req, res) => {
  try {
    const { mes, anio, emailDestino } = req.body;
    
    // URL de tu workflow en n8n Cloud
    const N8N_WEBHOOK_URL = 'https://TU-INSTANCIA.app.n8n.cloud/webhook/generar-excel-pagos';
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mes: mes || new Date().getMonth() + 1,
        anio: anio || new Date().getFullYear(),
        emailDestino: emailDestino
      })
    });
    
    const result = await response.json();
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Luego desde cualquier parte de tu app:
```javascript
fetch('/api/reportes/generar-y-enviar-excel', {
  method: 'POST',
  body: JSON.stringify({ 
    mes: 11, 
    anio: 2025, 
    emailDestino: 'admin@habitech.com' 
  })
});
```

---

## ⏰ Automatización Mensual

### Generar reporte automáticamente cada mes

Para que el reporte se envíe solo cada mes sin que hagas nada:

#### **Opción 1: Usar Schedule Node en n8n Cloud** ⭐

1. **Crea un nuevo workflow** (o modifica el existente)
2. **Elimina el nodo Webhook** del inicio
3. **Agrega Schedule Node:**
   - **Node:** `Schedule Trigger`
   - **Trigger Times → Mode:** `Cron Expression`
   - **Cron Expression:** `0 9 5 * *` 
     - Significa: Cada día 5 del mes a las 9:00 AM
   - **Timezone:** `America/La_Paz` (o tu zona horaria)

4. **Agrega Function Node después del Schedule:**
```javascript
const fecha = new Date();
const mesAnterior = fecha.getMonth(); // Mes anterior (0-11)
const anio = mesAnterior === 0 ? fecha.getFullYear() - 1 : fecha.getFullYear();
const mes = mesAnterior === 0 ? 12 : mesAnterior;

return {
  json: {
    mes: mes,
    anio: anio,
    emailDestino: 'admin@habitech.com' // Cambia por tu email
  }
};
```

5. **Conecta:** Schedule → Function → HTTP Request (resto del workflow)

6. **Activa el workflow** (toggle en la esquina superior derecha)

**¡Listo!** Cada día 5 del mes recibirás automáticamente el reporte del mes anterior.

---

#### **Opción 2: Usar Cron Job desde Render** (Alternativa)

Si prefieres controlarlo desde tu servidor:

**En Render:**
1. Ve a tu servicio → **Settings**
2. Busca **"Cron Jobs"** (si está disponible en tu plan)
3. Agrega un cron job:
```bash
curl -X POST https://TU-INSTANCIA.app.n8n.cloud/webhook/generar-excel-pagos \
  -H "Content-Type: application/json" \
  -d '{"mes": "$(date -d 'last month' +%m)", "anio": "$(date +%Y)", "emailDestino": "admin@habitech.com"}'
```

---

## 🌐 Integración Completa con Render

### Arquitectura del sistema:

```
┌─────────────────────────────────────────────────────────┐
│                    HABITECH EN RENDER                    │
│  (https://habitech-web2.onrender.com)                   │
│                                                           │
│  • Frontend (dashboard)                                  │
│  • Backend API                                           │
│  • PostgreSQL (Neon)                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP Request
                 │ (consulta datos)
                 ↓
┌─────────────────────────────────────────────────────────┐
│               N8N CLOUD (Automatización)                 │
│  (https://tu-nombre.app.n8n.cloud)                      │
│                                                           │
│  1. Recibe trigger (webhook o schedule)                 │
│  2. Consulta API de Render (pagos del mes)              │
│  3. Procesa con Gemini AI (análisis)                    │
│  4. Genera archivo Excel                                 │
│  5. Envía email con Gmail                                │
└─────────────────────────────────────────────────────────┘
                 │
                 │ Email con Excel
                 ↓
┌─────────────────────────────────────────────────────────┐
│                    GMAIL / Tu Buzón                      │
└─────────────────────────────────────────────────────────┘
```

**✅ Todo funciona 24/7 automáticamente en la nube**

---

## 🔐 Seguridad y Variables de Entorno

### En n8n Cloud:

Ya configuraste estas variables:
```env
GEMINI_API_KEY=AIzaSyCmILG6-iLUklPyNKEvJni1CmDkMMC67lU
RENDER_URL=https://tu-url.onrender.com
```

### En Render (opcional):

Si quieres agregar la URL de n8n a tu servidor:
1. Ve a tu servicio en Render
2. **Environment** → **Add Environment Variable**
```env
N8N_WEBHOOK_URL=https://tu-instancia.app.n8n.cloud/webhook/generar-excel-pagos
```

Ahora puedes usarla en tu backend:
```javascript
const N8N_URL = process.env.N8N_WEBHOOK_URL;
```

---

## 📊 Resultado Final

Recibirás un email con:
- ✅ Estadísticas visuales del mes
- ✅ Análisis inteligente generado por IA
- ✅ Archivo Excel adjunto con todos los pagos
- ✅ Recomendaciones de acción

---

## 🚀 Siguiente Nivel: Mejoras Opcionales

1. **Notificaciones WhatsApp:** Agrega nodo Twilio
2. **Guardar en Google Drive:** Agrega nodo Google Drive
3. **Slack/Teams:** Notificar en canales internos
4. **Base de datos:** Guardar histórico de reportes
5. **Gráficas:** Usar QuickChart.io para generar imágenes de gráficas

---

## ❓ Troubleshooting

### Error: Cannot connect to Render URL
**Solución:**
- Verifica que tu URL de Render esté correcta en las variables de entorno de n8n
- Comprueba que tu servidor en Render esté activo (el plan gratuito se duerme después de 15 min de inactividad)
- El primer request puede tardar 30-60 segundos en despertar el servidor

### No recibo el email
**Solución:**
- Verifica que conectaste correctamente tu cuenta de Gmail en n8n Cloud
- Ve a **Credentials** en n8n y reconecta Gmail si es necesario
- Revisa la carpeta de Spam
- Ve a **Executions** en n8n para ver el log detallado

### Gemini no responde o da error
**Solución:**
- Verifica que la API Key esté correcta en las variables de entorno
- Revisa los límites de la API gratuita (15 RPM)
- Espera 1 minuto entre pruebas si alcanzaste el límite

### Workflow no se ejecuta automáticamente
**Solución:**
- Asegúrate de que el workflow esté **ACTIVADO** (toggle verde)
- Verifica el cron expression del Schedule Node
- Revisa la zona horaria configurada

### El servidor Render tarda mucho en responder
**Explicación:**
- Plan gratuito de Render se duerme después de 15 min sin actividad
- Primer request tarda 30-60 segundos en despertar
- **Solución:** Considera upgrade a plan Starter ($7/mes) para mantenerlo siempre activo

---

## 💰 Costos Estimados

### Escenario: 1 reporte automático mensual + 5 manuales

| Servicio | Plan | Costo | Uso Mensual |
|----------|------|-------|-------------|
| **Render** | Free | $0 | Servidor web |
| **n8n Cloud** | Free | $0 | 6 ejecuciones/mes |
| **Gemini API** | Free | $0 | 6 requests/mes |
| **Gmail** | Free | $0 | Envío emails |
| **Neon DB** | Free | $0 | Base de datos |

**Total:** $0/mes ✅

---

### Si necesitas más:

| Servicio | Plan Pagado | Costo | Beneficios |
|----------|-------------|-------|------------|
| **Render** | Starter | $7/mes | Sin sleep, siempre activo |
| **n8n Cloud** | Starter | $20/mes | 10,000 ejecuciones |
| **Gemini API** | Pay-as-go | ~$0.001/request | Más límites |

---

## 🎯 Checklist de Implementación

- [ ] Cuenta creada en n8n Cloud
- [ ] Variables de entorno configuradas en n8n
- [ ] Workflow creado con todos los nodos
- [ ] Gmail conectado en n8n Credentials
- [ ] Prueba manual exitosa
- [ ] Schedule/Cron configurado
- [ ] Workflow activado
- [ ] Primer reporte automático recibido
- [ ] (Opcional) Botón agregado en dashboard de Habitech

---

## 🚀 Próximos Pasos y Mejoras

### Mejoras Opcionales:

1. **Múltiples destinatarios:**
```javascript
emailDestino: ['admin@habitech.com', 'contabilidad@habitech.com']
```

2. **Notificación WhatsApp:** Agregar nodo Twilio

3. **Guardar en Google Drive:**
   - Agregar nodo Google Drive
   - Guardar copia del Excel automáticamente

4. **Dashboard de métricas:**
   - Visualizar tendencias de cobranza
   - Gráficas de morosidad

5. **Slack/Teams:** Notificar en canales de equipo

6. **Comparativa mensual:** Comparar con mes anterior

---

## 📚 Recursos Adicionales

- **n8n Cloud:** https://app.n8n.cloud
- **Documentación n8n:** https://docs.n8n.io
- **Templates n8n:** https://n8n.io/workflows
- **Gemini API Docs:** https://ai.google.dev/docs
- **Render Docs:** https://render.com/docs

---

## ✅ Resumen Final

**Lo que lograste:**
✅ API en Render que provee datos de pagos  
✅ Workflow automatizado en n8n Cloud  
✅ Análisis inteligente con Gemini AI  
✅ Generación automática de Excel  
✅ Envío por email programado  
✅ Todo funciona 24/7 en la nube  

**Sin necesidad de:**
❌ Servidor local corriendo  
❌ Tu computadora encendida  
❌ Intervención manual  

---

¿Necesitas ayuda con algún paso específico? 🤖✨
