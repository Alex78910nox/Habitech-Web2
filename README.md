# 🚀 Habitech Web - Sistema Completo

Sistema web full-stack con backend y frontend integrados, construido con Node.js, Express y PostgreSQL (Neon).

## 📋 Características

- ✅ Backend con Express.js
- ✅ Frontend con Vite
- ✅ Base de datos PostgreSQL en Neon
- ✅ ORM Prisma para gestión de base de datos
- ✅ API RESTful completa
- ✅ Interfaz de usuario moderna y responsive
- ✅ Sistema CRUD de usuarios administradores y residentes
- ✅ Verificación de correo electrónico con Brevo (Sendinblue)
- ✅ Verificación de teléfono por SMS con Twilio
- ✅ Autenticación con SHA-256
- ✅ Roles de usuario (Administrador y Residente)

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript (Vite)
- **Base de datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Verificación Email**: Brevo (Sendinblue)
- **Verificación SMS**: Twilio
- **Herramientas**: Nodemon, Concurrently

## 📦 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en [Neon](https://neon.tech) (base de datos PostgreSQL gratuita)
- npm o yarn

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos

1. Crea una cuenta en [Neon](https://neon.tech)
2. Crea un nuevo proyecto PostgreSQL
3. Copia la cadena de conexión (connection string)
4. Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

5. Edita el archivo `.env` y configura todas las variables necesarias:

```env
DATABASE_URL="postgresql://usuario:password@endpoint.neon.tech/nombredb?sslmode=require"
PORT=3000

# Twilio (Verificación SMS)
TWILIO_SID=tu_account_sid
TWILIO_TOKEN=tu_auth_token
TWILIO_NUMBER=+1234567890

# Brevo / Sendinblue (Verificación Email)
BREVO_API_KEY=tu_api_key
BREVO_FROM_EMAIL=tu_email@ejemplo.com
```

**Obtener credenciales:**
- **Twilio**: Registrate en [twilio.com](https://twilio.com), obtén tu Account SID, Auth Token y un número de teléfono
- **Brevo**: Registrate en [brevo.com](https://brevo.com) (antes Sendinblue), crea una API Key en la configuración

### 3. Configurar Prisma y crear las tablas

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Crear las migraciones y tablas en la base de datos
npm run prisma:migrate
```

Cuando te pida un nombre para la migración, escribe algo como: `init`

## 🎯 Uso

### Modo Desarrollo

Ejecuta tanto el backend como el frontend simultáneamente:

```bash
npm run dev
```

Esto iniciará:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

### Acceso al Sistema

1. **Abre tu navegador** en: http://localhost:5174/login.html (o el puerto que indique Vite)
2. **Inicia sesión** con tu correo y contraseña de administrador (rol_id = 1)
3. Una vez autenticado, serás redirigido al dashboard principal

**Nota importante:** Solo los usuarios con rol_id = 1 (administradores) pueden iniciar sesión. La contraseña se hashea con SHA-256 antes de comparar con la base de datos.

### Sistema de Verificación

Al crear nuevas cuentas (administradores o residentes), el sistema requiere verificación de correo y teléfono:

1. **Ingresa el correo** y haz clic en "Enviar Código" → Recibirás un código de 6 dígitos por email
2. **Ingresa el teléfono** y haz clic en "Enviar Código" → Recibirás un código de 6 dígitos por SMS
3. **Ingresa ambos códigos** en los campos que aparecen
4. **Completa el formulario** y crea la cuenta

**En modo desarrollo:** Si Twilio o Brevo no están configurados correctamente, el sistema mostrará los códigos en pantalla para que puedas probar la funcionalidad.

### Solo Backend

```bash
npm run server:dev
```

### Solo Frontend

```bash
npm run client:dev
```

### Modo Producción

```bash
# 1. Construir el frontend
npm run build

# 2. Iniciar el servidor (servirá el frontend construido)
npm start
```

## 📚 Endpoints de la API

### Autenticación

- `POST /api/auth/login` - Iniciar sesión con correo y contraseña
  ```json
  {
    "correo": "usuario@ejemplo.com",
    "contrasena": "tu_contraseña"
  }
  ```
- `GET /api/auth/verify` - Verificar si el usuario está autenticado

### Estado del Sistema

- `GET /api/health` - Verificar estado del servidor
- `GET /api/db-test` - Verificar conexión a la base de datos

### Usuarios (Administradores)

- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener un usuario por ID
- `POST /api/users` - Crear un nuevo usuario administrador (requiere códigos de verificación)
- `PUT /api/users/:id` - Actualizar un usuario
- `DELETE /api/users/:id` - Desactivar un usuario

### Residentes

- `GET /api/residentes` - Obtener todos los residentes
- `POST /api/residentes` - Crear un nuevo residente (requiere códigos de verificación)
- `DELETE /api/residentes/:usuario_id` - Desactivar un residente
- `GET /api/residentes/departamentos` - Obtener departamentos disponibles

### Verificación

- `POST /api/verification/send-email` - Enviar código de verificación por email
  ```json
  {
    "correo": "usuario@ejemplo.com",
    "nombre": "Usuario"
  }
  ```
- `POST /api/verification/send-sms` - Enviar código de verificación por SMS
  ```json
  {
    "telefono": "+51999999999"
  }
  ```
- `POST /api/verification/verify-email` - Verificar código de email
- `POST /api/verification/verify-phone` - Verificar código de teléfono

### Ejemplo de petición POST

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","email":"juan@example.com"}'
```

## 🗂️ Estructura del Proyecto

```
habitech-web/
├── server/                      # Backend
│   ├── index.js                # Servidor Express principal
│   └── routes/                 # Rutas de la API
│       ├── auth.js            # Autenticación
│       ├── users.js           # Gestión de administradores
│       ├── residentes.js      # Gestión de residentes
│       └── verification.js    # Verificación email/SMS
├── src/                        # Frontend
│   ├── dashboard.js           # Lógica del dashboard
│   ├── dashboard.css          # Estilos del dashboard
│   ├── login.js               # Lógica del login
│   └── login.css              # Estilos del login
├── public/                     # Archivos públicos
│   └── habitech-logo.png      # Logo de Habitech
├── prisma/                     # Configuración de Prisma
│   └── schema.prisma          # Schema de la base de datos (33 tablas)
├── login.html                  # Página de login
├── index.html                  # Dashboard principal
├── vite.config.js             # Configuración de Vite
├── package.json               # Dependencias y scripts
├── .env                       # Variables de entorno (no incluir en git)
└── README.md                  # Documentación
```

## 🎨 Herramientas Adicionales

### Prisma Studio

Interfaz visual para gestionar tu base de datos:

```bash
npm run prisma:studio
```

Esto abrirá Prisma Studio en http://localhost:5555

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecuta backend y frontend en modo desarrollo
- `npm run server:dev` - Solo backend con hot reload
- `npm run client:dev` - Solo frontend con Vite
- `npm run build` - Construye el frontend para producción
- `npm start` - Inicia el servidor en modo producción
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:migrate` - Ejecuta las migraciones
- `npm run prisma:studio` - Abre Prisma Studio

## 📝 Agregar Nuevos Modelos

1. Edita `prisma/schema.prisma` y agrega tu modelo:

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

2. Crea una migración:

```bash
npm run prisma:migrate
```

3. Crea las rutas en `server/routes/`

4. Importa y usa las rutas en `server/index.js`

## 🌐 Despliegue

### Preparación para Producción

1. **Construir el frontend:**
```bash
npm run build
```

2. **Configurar variables de entorno en el servidor:**
```env
DATABASE_URL="tu_cadena_de_conexion_neon"
PORT=3000
NODE_ENV=production
```

3. **El código detecta automáticamente el entorno:**
   - En **desarrollo** (localhost): usa `http://localhost:3000/api`
   - En **producción**: usa rutas relativas `/api`

### Opciones de Hosting

#### Backend (Node.js + Express)

Puedes desplegar el backend en:
- **Render** (Recomendado - Gratis)
  - Conecta tu repositorio de GitHub
  - Configurar Build Command: `npm install`
  - Start Command: `npm start`
  - Agregar variables de entorno

- **Railway** (Fácil de usar)
  - Deploy automático desde GitHub
  - Variables de entorno en el dashboard

- **Vercel** (Serverless)
  - Ideal para proyectos pequeños
  - Deploy rápido

- **Heroku** (Clásico)
  - Dynos gratuitos disponibles

#### Frontend

El frontend se sirve automáticamente desde Express en producción (carpeta `dist/`).

**O puedes desplegarlo por separado en:**
- Vercel
- Netlify
- Cloudflare Pages

- Vercel
- Netlify
- Cloudflare Pages

**Importante:** Si despliegas frontend y backend por separado, actualiza la variable `API_URL` en:
- `/src/login.js`
- `/src/dashboard.js`

Para apuntar a tu servidor backend:
```javascript
const API_URL = 'https://tu-backend.onrender.com/api';
```

### Ejemplo de Despliegue Completo en Render

1. **Crear cuenta en** [Render](https://render.com)

2. **Nuevo Web Service:**
   - Repository: Tu repositorio de GitHub
   - Branch: `main`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Variables de Entorno:**
   ```
   DATABASE_URL=postgresql://...
   NODE_ENV=production
   PORT=3000
   ```

4. **Deploy** y listo! Tu aplicación estará en `https://tu-app.onrender.com`

Asegúrate de configurar las variables de entorno en tu servicio de hosting.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

ISC

## 👨‍💻 Autor

Habitech © 2025

---

## 🆘 Solución de Problemas

### Error de conexión a la base de datos

- Verifica que tu cadena de conexión en `.env` sea correcta
- Asegúrate de que tu base de datos en Neon esté activa
- Verifica que tengas acceso a internet

### El frontend no se conecta al backend

- Verifica que ambos servidores estén corriendo
- Revisa la configuración del proxy en `vite.config.js`
- Asegúrate de que el puerto 3000 no esté siendo usado por otra aplicación

### Errores de Prisma

```bash
# Resetear completamente la base de datos
npm run prisma:migrate

# Si persisten los problemas
rm -rf node_modules prisma/migrations
npm install
npm run prisma:generate
npm run prisma:migrate
```

## 📞 Soporte

Para más información, consulta la documentación oficial:
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/docs)
- [Vite](https://vitejs.dev/)
- [Neon](https://neon.tech/docs/introduction)
