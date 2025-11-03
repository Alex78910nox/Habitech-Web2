import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET - Obtener todos los registros de acceso
router.get('/', async (req, res) => {
  try {
    const { tipo, fecha_desde, fecha_hasta } = req.query;
    
    let whereConditions = [];
    
    if (tipo) {
      whereConditions.push(`ra.tipo = '${tipo}'`);
    }
    
    if (fecha_desde) {
      whereConditions.push(`ra.fecha_hora >= '${fecha_desde}'::timestamp`);
    }
    
    if (fecha_hasta) {
      whereConditions.push(`ra.fecha_hora <= '${fecha_hasta}'::timestamp`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const registros = await prisma.$queryRawUnsafe(`
      SELECT 
        ra.id,
        ra.usuario_id,
        ra.dispositivo_id,
        ra.tipo,
        ra.fecha_hora,
        u.nombre || ' ' || u.apellido as usuario_nombre,
        u.correo as usuario_correo,
        ds.tipo as dispositivo_tipo,
        ds.ubicacion as dispositivo_ubicacion
      FROM registros_acceso ra
      LEFT JOIN usuarios u ON ra.usuario_id = u.id
      LEFT JOIN dispositivos_seguridad ds ON ra.dispositivo_id = ds.id
      ${whereClause}
      ORDER BY ra.fecha_hora DESC
      LIMIT 500
    `);

    res.json(registros);
  } catch (error) {
    console.error('Error al obtener registros de acceso:', error);
    res.status(500).json({ error: 'Error al obtener registros de acceso', details: error.message });
  }
});

// POST - Crear nuevo registro de acceso
router.post('/', async (req, res) => {
  try {
    const { usuario_id, dispositivo_id, tipo } = req.body;

    if (!usuario_id || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos: usuario_id, tipo' });
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO registros_acceso (usuario_id, dispositivo_id, tipo, fecha_hora)
      VALUES (${usuario_id}, ${dispositivo_id || 'NULL'}, '${tipo}', NOW())
    `);

    res.status(201).json({ message: 'Registro de acceso creado exitosamente' });
  } catch (error) {
    console.error('Error al crear registro de acceso:', error);
    res.status(500).json({ error: 'Error al crear registro de acceso', details: error.message });
  }
});

// DELETE - Eliminar registro de acceso
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$executeRawUnsafe(`DELETE FROM registros_acceso WHERE id = ${parseInt(id)}`);

    res.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({ error: 'Error al eliminar registro', details: error.message });
  }
});

export default router;
