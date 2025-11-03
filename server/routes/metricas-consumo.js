import express from 'express';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { createAnomaliaNotificationBackend } from '../utils/anomalias-notificacion.js';
const router = express.Router();
const prisma = new PrismaClient();
// Crear anomalía y enviar correo al residente
router.post('/anomalia', async (req, res) => {
  try {
    const { departamento_id, tipo, descripcion, valor_observado, valor_esperado, severidad, fecha } = req.body;
    if (!departamento_id || !tipo || !descripcion) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    // Obtener número de departamento
    const depto = await prisma.departamentos.findUnique({ where: { id: Number(departamento_id) } });
    const departamentoNumero = depto ? depto.numero : '';
    // Guardar anomalía en la base de datos (opcional, si tienes tabla de anomalías)
    // await prisma.anomalias.create({ data: { departamento_id, tipo, descripcion, valor_observado, valor_esperado, severidad, fecha } });
    // Enviar notificación y correo
    const result = await createAnomaliaNotificationBackend(
      departamento_id,
      { tipo, descripcion, valor_observado, valor_esperado, severidad, fecha },
      departamentoNumero
    );
    res.json({ success: true, notificados: result.residentesNotificados });
  } catch (error) {
    console.error('Error al crear anomalía y enviar correo:', error);
    res.status(500).json({ error: error.message || 'Error al crear anomalía' });
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        mc.id,
        mc.departamento_id,
        d.numero AS departamento,
        mc.tipo_servicio,
        mc.consumo,
        mc.fecha_registro
      FROM metricas_consumo mc
      JOIN departamentos d ON mc.departamento_id = d.id
      ORDER BY mc.fecha_registro DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métricas de consumo', details: error.message });
  }
});

export default router;
