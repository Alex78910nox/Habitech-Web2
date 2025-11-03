// Endpoint para obtener residentes activos y su departamento (para el formulario de nueva solicitud)
import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();

router.get('/residentes', async (req, res) => {
  try {
    const residentes = await prisma.$queryRaw`
      SELECT r.id, r.departamento_id, d.numero AS departamento_numero, u.nombre, u.apellido
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE r.activo = true
      ORDER BY u.nombre, u.apellido
    `;
    res.json(residentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener residentes' });
  }
});

export default router;
