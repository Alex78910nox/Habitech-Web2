# Estructura Modular del Dashboard

## 📁 Organización de Archivos

```
src/
├── utils/                          # Utilidades compartidas
│   ├── api.js                      # Configuración de API
│   ├── auth.js                     # Autenticación y sesión
│   └── messages.js                 # Sistema de mensajes
│
├── modules/                        # Módulos funcionales
│   ├── dashboard-home.js           # Página principal del dashboard
│   ├── usuarios.js                 # Gestión de administradores
│   ├── residentes.js               # Gestión de residentes
│   ├── notificaciones.js           # Sistema de notificaciones
│   ├── reservas.js                 # Reserva de áreas comunes
│   ├── gestion-financiera.js       # Gestión financiera (pagos, reportes)
│   ├── verificacion.js             # Verificación email/SMS
│   └── configuracion.js            # Configuración del sistema
│
├── dashboard-main.js               # Archivo principal (punto de entrada)
├── dashboard-old-backup.js         # Respaldo del archivo original
├── dashboard.css                   # Estilos
├── login.js                        # Login
└── login.css                       # Estilos del login
```

## 📋 Descripción de Módulos

### Utils (Utilidades)

**`api.js`**
- Configuración de la URL de la API
- Detecta automáticamente localhost vs producción

**`auth.js`**
- `checkAuthentication()` - Verifica si el usuario está autenticado
- `logout()` - Cierra la sesión del usuario
- `displayUserProfile()` - Muestra info del usuario en el sidebar

**`messages.js`**
- `showMessage()` - Sistema de notificaciones toast (éxito/error)

### Modules (Módulos Funcionales)

**`dashboard-home.js`**
- `renderDashboard()` - Renderiza la página principal con estadísticas
- `loadDashboardStats()` - Carga contadores de usuarios, residentes, etc.

**`usuarios.js`**
- `renderUsuarios()` - Renderiza la gestión de administradores
- `loadUsers()` - Carga la lista de administradores
- `deleteUser()` - Desactiva un administrador

**`residentes.js`**
- `renderResidentes()` - Renderiza la gestión de residentes
- `loadResidentes()` - Carga la lista de residentes
- `loadDepartamentos()` - Carga departamentos disponibles
- `deleteResidente()` - Desactiva un residente

**`notificaciones.js`**
- `renderNotificaciones()` - Renderiza el sistema de notificaciones
- `loadNotificaciones()` - Carga historial de notificaciones
- `loadResidentesSelector()` - Carga residentes para el selector
- Funciones de envío individual y masivo

**`reservas.js`**
- `renderReservas()` - Renderiza el sistema de reservas de áreas comunes
- `loadReservas()` - Carga lista de reservas activas
- `loadAreas()` - Carga áreas comunes disponibles
- `loadResidentesReserva()` - Carga residentes para reservar
- `cancelarReserva()` - Cancela una reserva
- `confirmarReserva()` - Confirma una reserva pendiente
- `eliminarReserva()` - Elimina una reserva
- `calcularCostoTotal()` - Calcula el costo basado en horas y precio por hora

**`gestion-financiera.js`**
- `renderGestionFinanciera()` - Renderiza el módulo de finanzas
- `loadResumenFinanciero()` - Carga resumen de ingresos y pagos
- `loadPagos()` - Carga historial de pagos
- `loadReservasFinanzas()` - Carga ingresos por reservas
- `registrarPago()` - Registra un nuevo pago (en desarrollo)
- `generarReporte()` - Genera reportes financieros (en desarrollo)

**`verificacion.js`**
- `sendEmailVerification()` - Envía código de verificación por email
- `sendSmsVerification()` - Envía código de verificación por SMS
- `sendSmsVerificationResidente()` - Envía SMS específico para residentes

**`configuracion.js`**
- `renderConfiguracion()` - Módulo de configuración (en desarrollo)

### Archivo Principal

**`dashboard-main.js`**
- Importa todos los módulos
- Configura la navegación entre secciones
- Expone funciones globales necesarias para onclick
- Inicializa la aplicación

## 🔄 Flujo de Trabajo

1. El usuario carga `index.html`
2. Se ejecuta `dashboard-main.js` (type="module")
3. Se verifica la autenticación
4. Se muestra el perfil del usuario
5. Se configura la navegación
6. Se renderiza el dashboard inicial
7. Cada clic en el menú renderiza el módulo correspondiente

## ✅ Ventajas de esta Estructura

- ✨ **Modularidad**: Cada funcionalidad en su propio archivo
- 🔧 **Mantenibilidad**: Fácil de encontrar y modificar código
- 📦 **Reutilización**: Funciones compartidas en `utils/`
- 🧪 **Testing**: Más fácil probar módulos individuales
- 🚀 **Escalabilidad**: Agregar nuevas funciones sin afectar existentes
- 📖 **Legibilidad**: Código más limpio y organizado

## 🔨 Cómo Agregar un Nuevo Módulo

1. Crear archivo en `src/modules/mi-modulo.js`
2. Exportar función de renderizado: `export function renderMiModulo() { ... }`
3. Importar en `dashboard-main.js`: `import { renderMiModulo } from './modules/mi-modulo.js';`
4. Agregar case en el switch de navegación
5. Agregar enlace en el sidebar del `index.html`

## 📌 Notas Importantes

- Todos los módulos usan ES6 modules (`import`/`export`)
- El HTML debe usar `<script type="module">`
- Las funciones usadas en `onclick` deben exponerse en `window`
- El archivo original está respaldado como `dashboard-old-backup.js`
