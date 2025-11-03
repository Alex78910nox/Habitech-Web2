# 📧 Sistema de Facturación de Reservas por Email

## ✅ Implementación Completa

### Archivos Creados/Modificados:

1. **`/server/utils/emailReserva.js`** (NUEVO)
   - Función `enviarFacturaReserva()` para enviar facturas por email
   - Template HTML profesional con diseño responsive
   - Integración con Brevo API

2. **`/server/routes/reservas.js`** (MODIFICADO)
   - Import de `enviarFacturaReserva`
   - Envío automático de email al crear reserva
   - Manejo de errores sin afectar la creación

## 📋 Funcionalidad

### Cuándo se Envía el Email:
✅ **Automáticamente** al crear una nueva reserva de área común

### Qué Incluye la Factura:

#### Encabezado:
- Logo de Habitech
- Título "Factura de Reserva de Área Común"
- Número de factura (#000001, #000002, etc.)
- Estado: **PENDIENTE DE PAGO** (amarillo) o **CONFIRMADA** (verde)

#### Información del Cliente:
- 👤 Nombre completo del residente
- 🏠 Número de departamento
- 🏊 Área común reservada
- 📅 Fecha completa (formato largo: "lunes, 21 de octubre de 2025")
- ⏰ Horario (14:00 - 16:00)
- ⏱️ Duración calculada (2.0 horas)

#### Total a Pagar:
- Monto destacado en grande
- Color degradado llamativo

#### Notas Importantes:
- Si **monto > 0**: Aviso de pago pendiente (fondo amarillo)
- Si **monto = 0**: Confirmación de área gratuita (fondo verde)

## 🎨 Vista Previa del Email

```
┌─────────────────────────────────────────────┐
│                                             │
│        🏢 HABITECH                          │
│   Factura de Reserva de Área Común         │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Estimado/a Juan Pérez,                     │
│                                             │
│  Se ha registrado exitosamente su reserva  │
│  del área común Piscina.                    │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Factura #000123  [⏳ PENDIENTE PAGO]  │ │
│  ├───────────────────────────────────────┤ │
│  │ 👤 Cliente: Juan Pérez                │ │
│  │ 🏠 Departamento: B202                  │ │
│  │ 🏊 Área Común: Piscina                │ │
│  │ 📅 Fecha: lunes, 21 de octubre 2025   │ │
│  │ ⏰ Horario: 14:00 - 16:00             │ │
│  │ ⏱️ Duración: 2.0 hora(s)              │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │        TOTAL A PAGAR                   │ │
│  │           $30.00                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ⚠️ Importante: Su reserva está en estado  │
│  PENDIENTE DE PAGO. Realice el pago para   │
│  confirmar su reserva.                     │
│                                             │
│  Atentamente,                              │
│  Equipo de Administración - Habitech      │
│                                             │
├─────────────────────────────────────────────┤
│  © 2025 Habitech                           │
│  Este es un correo automático              │
└─────────────────────────────────────────────┘
```

## 🔧 Configuración Requerida

### Variables de Entorno (.env):
```env
BREVO_API_KEY=tu_api_key_de_brevo
```

### Dependencia:
- ✅ `node-fetch` (ya instalado)

## 📊 Flujo Completo

1. **Usuario crea reserva** desde el dashboard
2. **Backend valida** y guarda en BD
3. **Backend calcula** el monto basado en horas y precio
4. **Backend obtiene** datos completos de la reserva
5. **Backend envía** email automáticamente
6. **Residente recibe** factura en su correo
7. **Dashboard muestra** mensaje de éxito

## 🎯 Casos de Uso

### Caso 1: Área con Costo
```
Área: Piscina ($15/hora)
Horario: 14:00 - 16:00 (2h)
Total: $30.00
Estado: PENDIENTE DE PAGO
Email: ⚠️ Aviso de pago pendiente
```

### Caso 2: Área Gratuita
```
Área: Salón de Eventos ($0/hora)
Horario: 18:00 - 22:00 (4h)
Total: $0.00
Estado: CONFIRMADA
Email: ✅ Confirmación automática
```

## 🚀 Beneficios

✅ **Profesional**: Email con diseño corporativo
✅ **Automático**: Sin intervención manual
✅ **Informativo**: Toda la información necesaria
✅ **Claro**: Estado de pago visible
✅ **Confiable**: No afecta la creación si falla
✅ **Trazable**: Logs en consola del servidor

## 📝 Logs del Servidor

```bash
✅ Factura enviada a juan.perez@email.com - MessageId: <abc123>
✅ Factura enviada para reserva #123
```

Si hay error:
```bash
⚠️ Error al enviar factura por email: [detalles]
```

## 🔜 Próximos Pasos Sugeridos

1. ✅ Email de confirmación al pagar
2. ✅ Email de recordatorio 24h antes
3. ✅ Email de cancelación
4. ✅ Adjuntar PDF de factura
5. ✅ Enviar copia a administración

## 🧪 Cómo Probar

1. Asegúrate de tener tu `BREVO_API_KEY` configurada
2. Reinicia el servidor: `npm run dev`
3. Crea una nueva reserva desde el dashboard
4. Verifica:
   - ✅ Mensaje de éxito en el dashboard
   - ✅ Log en consola del servidor
   - ✅ Email en la bandeja del residente

---

**Estado:** ✅ Implementado y Funcional
**Versión:** 1.0
**Fecha:** 20 de octubre de 2025
