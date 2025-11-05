import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/reportes/pagos-mantenimiento
 * Obtiene los pagos de mantenimiento del mes para generar Excel
 * Query params:
 *   - mes: número del mes (1-12)
 *   - anio: año (2025)
 */
router.get('/pagos-mantenimiento', async (req, res) => {
  try {
    const { mes, anio } = req.query;

    // Si no se especifica mes/año, usar el actual
    const fecha = new Date();
    const mesActual = mes ? parseInt(mes) : fecha.getMonth() + 1;
    const anioActual = anio ? parseInt(anio) : fecha.getFullYear();

    // Consulta para obtener todos los pagos de mantenimiento del mes
    const pagos = await prisma.$queryRawUnsafe(`
      SELECT 
        d.numero as departamento,
        d.piso,
        u.nombre || ' ' || u.apellido as residente,
        u.correo as email,
        u.telefono,
        r.tipo_relacion,
        p.monto as monto_mantenimiento,
        p.fecha_vencimiento,
        p.fecha_pago,
        p.estado,
        p.metodo_pago,
        CASE 
          WHEN p.estado = 'pagado' THEN 'PAGADO'
          WHEN p.fecha_vencimiento < CURRENT_DATE THEN 'ATRASADO'
          ELSE 'PENDIENTE'
        END as estado_detallado,
        CASE 
          WHEN p.fecha_pago IS NOT NULL 
          THEN EXTRACT(DAY FROM (p.fecha_pago - p.fecha_vencimiento))
          ELSE EXTRACT(DAY FROM (CURRENT_DATE - p.fecha_vencimiento))
        END as dias_diferencia
      FROM pagos p
      JOIN departamentos d ON p.departamento_id = d.id
      JOIN residentes r ON p.residente_id = r.id
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE p.tipo_pago = 'mantenimiento'
        AND EXTRACT(MONTH FROM p.fecha_vencimiento) = ${mesActual}
        AND EXTRACT(YEAR FROM p.fecha_vencimiento) = ${anioActual}
        AND r.activo = true
      ORDER BY d.numero
    `);

    // Calcular estadísticas
    const totalPagos = pagos.length;
    const totalPagados = pagos.filter(p => p.estado === 'pagado').length;
    const totalPendientes = pagos.filter(p => p.estado === 'pendiente').length;
    const totalAtrasados = pagos.filter(p => p.estado === 'atrasado').length;
    
    const montoTotal = pagos.reduce((sum, p) => sum + parseFloat(p.monto_mantenimiento), 0);
    const montoPagado = pagos
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + parseFloat(p.monto_mantenimiento), 0);
    const montoPendiente = montoTotal - montoPagado;

    // Formatear datos para Excel
    const datosExcel = pagos.map(p => ({
      Departamento: p.departamento,
      Piso: p.piso,
      Residente: p.residente,
      Email: p.email,
      Teléfono: p.telefono || 'N/A',
      'Tipo Relación': p.tipo_relacion,
      Monto: parseFloat(p.monto_mantenimiento).toFixed(2),
      'Fecha Vencimiento': new Date(p.fecha_vencimiento).toLocaleDateString('es-ES'),
      'Fecha Pago': p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-ES') : 'No pagado',
      Estado: p.estado_detallado,
      'Método Pago': p.metodo_pago || 'N/A',
      'Días': p.dias_diferencia || 0
    }));

    res.json({
      success: true,
      metadata: {
        mes: mesActual,
        anio: anioActual,
        mesNombre: new Date(anioActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long' }),
        fechaGeneracion: new Date().toISOString(),
        totalDepartamentos: totalPagos,
        totalPagados,
        totalPendientes,
        totalAtrasados,
        montoTotal: montoTotal.toFixed(2),
        montoPagado: montoPagado.toFixed(2),
        montoPendiente: montoPendiente.toFixed(2),
        porcentajePagado: ((totalPagados / totalPagos) * 100).toFixed(1)
      },
      datos: datosExcel
    });

  } catch (error) {
    console.error('Error al obtener pagos de mantenimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte',
      details: error.message
    });
  }
});

/**
 * GET /api/reportes/pagos-mantenimiento/resumen-anual
 * Obtiene resumen de pagos por mes para todo el año
 */
router.get('/pagos-mantenimiento/resumen-anual', async (req, res) => {
  try {
    const { anio } = req.query;
    const anioActual = anio ? parseInt(anio) : new Date().getFullYear();

    const resumenMensual = await prisma.$queryRawUnsafe(`
      SELECT 
        EXTRACT(MONTH FROM p.fecha_vencimiento) as mes,
        COUNT(*) as total_pagos,
        COUNT(CASE WHEN p.estado = 'pagado' THEN 1 END) as pagados,
        COUNT(CASE WHEN p.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN p.estado = 'atrasado' THEN 1 END) as atrasados,
        SUM(p.monto) as monto_total,
        SUM(CASE WHEN p.estado = 'pagado' THEN p.monto ELSE 0 END) as monto_pagado
      FROM pagos p
      WHERE p.tipo_pago = 'mantenimiento'
        AND EXTRACT(YEAR FROM p.fecha_vencimiento) = ${anioActual}
      GROUP BY EXTRACT(MONTH FROM p.fecha_vencimiento)
      ORDER BY mes
    `);

    res.json({
      success: true,
      anio: anioActual,
      resumenMensual: resumenMensual.map(m => ({
        mes: parseInt(m.mes),
        mesNombre: new Date(anioActual, m.mes - 1).toLocaleDateString('es-ES', { month: 'long' }),
        totalPagos: parseInt(m.total_pagos),
        pagados: parseInt(m.pagados),
        pendientes: parseInt(m.pendientes),
        atrasados: parseInt(m.atrasados),
        montoTotal: parseFloat(m.monto_total).toFixed(2),
        montoPagado: parseFloat(m.monto_pagado).toFixed(2),
        porcentajePagado: ((parseInt(m.pagados) / parseInt(m.total_pagos)) * 100).toFixed(1)
      }))
    });

  } catch (error) {
    console.error('Error al obtener resumen anual:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar resumen',
      details: error.message
    });
  }
});

export default router;
