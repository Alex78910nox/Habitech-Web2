import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno PRIMERO
dotenv.config();

// Importar rutas (después de cargar .env)
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import residentesRoutes from './routes/residentes.js';
import verificationRoutes from './routes/verification.js';
import notificacionesRoutes from './routes/notificaciones.js';
import reservasRoutes from './routes/reservas.js';
import pagosRoutes from './routes/pagos.js';
import departamentosRoutes from './routes/departamentos.js';
import nominasRoutes from './routes/nominas.js';
import solicitudesMantenimientoRoutes from './routes/solicitudes-mantenimiento.js';
import residentesMantenimientoRoutes from './routes/residentes-mantenimiento.js';
import estadisticasRoutes from './routes/estadisticas.js';
import metricasConsumoRoutes from './routes/metricas-consumo.js';
import anomaliasDetectadasRoutes from './routes/anomalias-detectadas.js';
import registrosAccesoRoutes from './routes/registros-acceso.js';
import chatbotRoutes from './routes/chatbot.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/residentes', residentesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/departamentos', departamentosRoutes);
app.use('/api/nominas', nominasRoutes);
app.use('/api/solicitudes-mantenimiento', solicitudesMantenimientoRoutes);
app.use('/api/solicitudes-mantenimiento', residentesMantenimientoRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/metricas-consumo', metricasConsumoRoutes);
app.use('/api/anomalias-detectadas', anomaliasDetectadasRoutes);
app.use('/api/registros-acceso', registrosAccesoRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Ruta para probar la conexión a la base de datos
app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', message: 'Conexión a PostgreSQL exitosa' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Servir el frontend para cualquier ruta que no sea /api/*
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});

// Cerrar Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
