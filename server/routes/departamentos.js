import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET - Obtener todos los departamentos
router.get('/', async (req, res) => {
  try {
    const departamentos = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        numero,
        piso,
        dormitorios,
        banos,
        area_m2,
        renta_mensual::numeric as renta_mensual,
        mantenimiento_mensual::numeric as mantenimiento_mensual,
        estado,
        descripcion,
        activo
      FROM departamentos 
      WHERE activo = true 
      ORDER BY numero
    `);

    console.log('📋 Departamentos enviados al frontend:', departamentos);
    res.json(departamentos);
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    res.status(500).json({ error: 'Error al obtener departamentos' });
  }
});

export default router;
