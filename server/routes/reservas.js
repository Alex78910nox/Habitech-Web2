import express from 'express';
import { PrismaClient } from '@prisma/client';
import { enviarFacturaReserva } from '../utils/emailReserva.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reservas - Obtener todas las reservas
router.get('/', async (req, res) => {
  try {
    const reservas = await prisma.$queryRawUnsafe(
      `SELECT 
        ra.id,
        ra.area_id,
        ra.residente_id,
        TO_CHAR(ra.fecha_reserva, 'YYYY-MM-DD') as fecha_reserva,
        TO_CHAR(ra.hora_inicio, 'HH24:MI') as hora_inicio,
        TO_CHAR(ra.hora_fin, 'HH24:MI') as hora_fin,
        ra.estado,
        ra.monto_pago,
        ra.creado_en,
        ac.nombre as area_nombre,
        ac.capacidad as area_capacidad,
        ac.pago_por_uso as area_precio,
        u.nombre as residente_nombre,
        u.apellido as residente_apellido,
        u.correo as residente_correo,
        d.numero as departamento_numero
      FROM reservas_areas ra
      INNER JOIN areas_comunes ac ON ra.area_id = ac.id
      INNER JOIN residentes r ON ra.residente_id = r.id
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      ORDER BY ra.fecha_reserva DESC, ra.hora_inicio DESC`
    );
    
    res.json(reservas);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// GET /api/reservas/calendario - Obtener reservas para calendario por mes y año
router.get('/calendario', async (req, res) => {
  try {
    const { mes, anio, area_id } = req.query;
    
    // Validar parámetros
    if (!mes || !anio) {
      return res.status(400).json({ 
        error: 'Se requieren los parámetros mes y anio' 
      });
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    // Validar rangos
    if (mesNum < 1 || mesNum > 12 || anioNum < 2000 || anioNum > 2100) {
      return res.status(400).json({ 
        error: 'Mes o año inválido' 
      });
    }

    // Calcular primer y último día del mes
    const primerDia = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anioNum, mesNum, 0).getDate();
    const ultimaFecha = `${anioNum}-${String(mesNum).padStart(2, '0')}-${ultimoDia}`;

    // Query base
    let query = `
      SELECT 
        ra.id,
        ra.area_id,
        ra.residente_id,
        TO_CHAR(ra.fecha_reserva, 'YYYY-MM-DD') as fecha_reserva,
        TO_CHAR(ra.hora_inicio, 'HH24:MI') as hora_inicio,
        TO_CHAR(ra.hora_fin, 'HH24:MI') as hora_fin,
        ra.estado,
        ra.monto_pago,
        ac.nombre as area_nombre,
        ac.capacidad as area_capacidad,
        ac.pago_por_uso as area_precio,
        u.nombre as residente_nombre,
        u.apellido as residente_apellido,
        u.correo as residente_correo,
        d.numero as departamento_numero
      FROM reservas_areas ra
      INNER JOIN areas_comunes ac ON ra.area_id = ac.id
      INNER JOIN residentes r ON ra.residente_id = r.id
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE ra.fecha_reserva >= $1::date 
        AND ra.fecha_reserva <= $2::date
    `;

    let params = [primerDia, ultimaFecha];

    // Si se especifica un área, filtrar por ella
    if (area_id && area_id !== 'todas') {
      query += ` AND ra.area_id = $3`;
      params.push(parseInt(area_id));
    }

    query += ` ORDER BY ra.fecha_reserva ASC, ra.hora_inicio ASC`;

    const reservas = await prisma.$queryRawUnsafe(query, ...params);
    
    res.json(reservas);
  } catch (error) {
    console.error('Error al obtener reservas del calendario:', error);
    res.status(500).json({ error: 'Error al obtener reservas del calendario' });
  }
});

// GET /api/reservas/areas - Obtener áreas comunes disponibles
router.get('/areas', async (req, res) => {
  try {
    const areas = await prisma.areas_comunes.findMany({
      where: {
        estado: 'disponible'
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    res.json(areas);
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    res.status(500).json({ error: 'Error al obtener áreas comunes' });
  }
});

// GET /api/reservas/residentes - Obtener residentes activos
router.get('/residentes', async (req, res) => {
  try {
    const residentes = await prisma.$queryRawUnsafe(
      `SELECT 
        r.id,
        r.departamento_id,
        u.nombre,
        u.apellido,
        u.correo,
        d.numero as departamento_numero
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE u.activo = true
        AND r.activo = true
        AND u.rol_id = 2
      ORDER BY u.nombre, u.apellido`
    );
    
    console.log('👥 Residentes con departamento_id:', residentes);
    res.json(residentes);
  } catch (error) {
    console.error('Error al obtener residentes:', error);
    res.status(500).json({ error: 'Error al obtener residentes' });
  }
});

// POST /api/reservas - Crear nueva reserva
router.post('/', async (req, res) => {
  try {
    const { area_id, residente_id, fecha_reserva, hora_inicio, hora_fin } = req.body;

    // Validar datos
    if (!area_id || !residente_id || !fecha_reserva || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Obtener información del área para calcular el costo
    const area = await prisma.areas_comunes.findUnique({
      where: { id: parseInt(area_id) }
    });

    if (!area) {
      return res.status(404).json({ error: 'Área común no encontrada' });
    }

    // Calcular el monto del pago basado en las horas
    const [horaInicioH, horaInicioM] = hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = hora_fin.split(':').map(Number);
    const minutosInicio = horaInicioH * 60 + horaInicioM;
    const minutosFin = horaFinH * 60 + horaFinM;
    const horas = (minutosFin - minutosInicio) / 60;
    const precioPorHora = area.pago_por_uso || 0;
    const montoPago = (precioPorHora * horas).toFixed(2);

    // Verificar que no haya conflicto de horarios usando queryRawUnsafe
    const conflicto = await prisma.$queryRawUnsafe(
      `SELECT * FROM reservas_areas
       WHERE area_id = $1
         AND fecha_reserva = $2::date
         AND estado != 'cancelada'
         AND (
           ($3::time >= hora_inicio AND $3::time < hora_fin)
           OR
           ($4::time > hora_inicio AND $4::time <= hora_fin)
           OR
           ($3::time <= hora_inicio AND $4::time >= hora_fin)
         )`,
      parseInt(area_id),
      fecha_reserva,
      hora_inicio,
      hora_fin
    );

    if (conflicto.length > 0) {
      return res.status(400).json({ 
        error: 'Ya existe una reserva en ese horario para esta área' 
      });
    }

    // Crear la reserva con el monto calculado usando executeRawUnsafe para evitar caché
    await prisma.$executeRawUnsafe(
      `INSERT INTO reservas_areas (area_id, residente_id, fecha_reserva, hora_inicio, hora_fin, estado, monto_pago)
       VALUES ($1, $2, $3::date, $4::time, $5::time, 'pendiente', $6)`,
      parseInt(area_id),
      parseInt(residente_id),
      fecha_reserva,
      hora_inicio,
      hora_fin,
      parseFloat(montoPago)
    );

    // Obtener la reserva creada con todos los datos
    const reservaCreada = await prisma.$queryRawUnsafe(
      `SELECT 
        ra.id,
        ra.area_id,
        ra.residente_id,
        TO_CHAR(ra.fecha_reserva, 'YYYY-MM-DD') as fecha_reserva,
        TO_CHAR(ra.hora_inicio, 'HH24:MI') as hora_inicio,
        TO_CHAR(ra.hora_fin, 'HH24:MI') as hora_fin,
        ra.estado,
        ra.monto_pago,
        ac.nombre as area_nombre,
        u.nombre as residente_nombre,
        u.apellido as residente_apellido,
        u.correo as residente_correo,
        d.numero as departamento_numero
      FROM reservas_areas ra
      INNER JOIN areas_comunes ac ON ra.area_id = ac.id
      INNER JOIN residentes r ON ra.residente_id = r.id
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE ra.area_id = $1
        AND ra.residente_id = $2
        AND ra.fecha_reserva = $3::date
      ORDER BY ra.id DESC
      LIMIT 1`,
      parseInt(area_id),
      parseInt(residente_id),
      fecha_reserva
    );

    // Enviar factura por correo al residente
    if (reservaCreada && reservaCreada.length > 0) {
      try {
        await enviarFacturaReserva(reservaCreada[0]);
        console.log(`✅ Factura enviada para reserva #${reservaCreada[0].id}`);
      } catch (emailError) {
        console.error('⚠️ Error al enviar factura por email:', emailError);
        // No fallar la creación de la reserva si el email falla
      }
    }

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente. Se ha enviado la factura por correo.',
      reserva: reservaCreada[0]
    });

  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
});

// PUT /api/reservas/:id/cancelar - Cancelar una reserva
router.put('/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$executeRawUnsafe(
      `UPDATE reservas_areas
       SET estado = 'cancelada'
       WHERE id = $1`,
      parseInt(id)
    );

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
});

// PUT /api/reservas/:id/confirmar - Confirmar una reserva pendiente
router.put('/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$executeRawUnsafe(
      `UPDATE reservas_areas
       SET estado = 'confirmada'
       WHERE id = $1`,
      parseInt(id)
    );

    res.json({
      success: true,
      message: 'Reserva confirmada exitosamente'
    });

  } catch (error) {
    console.error('Error al confirmar reserva:', error);
    res.status(500).json({ error: 'Error al confirmar la reserva' });
  }
});

// DELETE /api/reservas/:id - Eliminar una reserva
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$executeRawUnsafe(
      `DELETE FROM reservas_areas
       WHERE id = $1`,
      parseInt(id)
    );

    res.json({
      success: true,
      message: 'Reserva eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    res.status(500).json({ error: 'Error al eliminar la reserva' });
  }
});

export default router;