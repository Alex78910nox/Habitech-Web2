import express from 'express';
import fetch from 'node-fetch';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// FUNCIONES DE CONSULTA A LA BASE DE DATOS
// ============================================

// Obtener estadísticas generales del sistema
async function getEstadisticasGenerales() {
  try {
    const [
      totalUsuarios,
      totalDepartamentos,
      totalResidentes,
      pagosPendientes,
      pagosPagados,
      solicitudesMantenimiento,
      reservasActivas,
      areasComunes
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM usuarios WHERE activo = true`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM departamentos WHERE activo = true`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM residentes WHERE activo = true`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM pagos WHERE estado = 'pendiente'`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM pagos WHERE estado = 'pagado'`,
      prisma.$queryRaw`SELECT COUNT(*) as count, estado FROM solicitudes_mantenimiento GROUP BY estado`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM reservas_areas WHERE fecha_reserva >= CURRENT_DATE`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM areas_comunes WHERE estado = 'disponible'`
    ]);

    return {
      usuarios: Number(totalUsuarios[0]?.count || 0),
      departamentos: Number(totalDepartamentos[0]?.count || 0),
      residentes: Number(totalResidentes[0]?.count || 0),
      pagos: {
        pendientes: Number(pagosPendientes[0]?.count || 0),
        pagados: Number(pagosPagados[0]?.count || 0)
      },
      mantenimiento: solicitudesMantenimiento.map(s => ({
        estado: s.estado,
        cantidad: Number(s.count)
      })),
      reservas: Number(reservasActivas[0]?.count || 0),
      areasDisponibles: Number(areasComunes[0]?.count || 0)
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return null;
  }
}

// Buscar información de residentes
async function buscarResidentes(criterio = '') {
  try {
    let query;
    if (criterio) {
      query = `
        SELECT 
          u.nombre, 
          u.apellido, 
          u.correo, 
          u.telefono,
          d.numero as departamento,
          r.tipo_relacion,
          r.fecha_ingreso
        FROM residentes r
        JOIN usuarios u ON r.usuario_id = u.id
        JOIN departamentos d ON r.departamento_id = d.id
        WHERE r.activo = true
        AND (u.nombre ILIKE '%${criterio}%' OR u.apellido ILIKE '%${criterio}%' OR d.numero ILIKE '%${criterio}%')
        LIMIT 10
      `;
    } else {
      query = `
        SELECT 
          u.nombre, 
          u.apellido, 
          u.correo, 
          u.telefono,
          d.numero as departamento,
          r.tipo_relacion,
          r.fecha_ingreso
        FROM residentes r
        JOIN usuarios u ON r.usuario_id = u.id
        JOIN departamentos d ON r.departamento_id = d.id
        WHERE r.activo = true
        LIMIT 10
      `;
    }
    
    const residentes = await prisma.$queryRawUnsafe(query);
    return residentes;
  } catch (error) {
    console.error('Error al buscar residentes:', error);
    return [];
  }
}

// Obtener solicitudes de mantenimiento recientes
async function getSolicitudesMantenimiento(estado = null) {
  try {
    let query;
    if (estado) {
      query = `
        SELECT 
          sm.id,
          sm.descripcion,
          sm.estado,
          sm.fecha_creacion,
          d.numero as departamento,
          u.nombre || ' ' || u.apellido as solicitante
        FROM solicitudes_mantenimiento sm
        JOIN departamentos d ON sm.departamento_id = d.id
        JOIN usuarios u ON sm.creado_por = u.id
        WHERE sm.estado = '${estado}'
        ORDER BY sm.fecha_creacion DESC
        LIMIT 10
      `;
    } else {
      query = `
        SELECT 
          sm.id,
          sm.descripcion,
          sm.estado,
          sm.fecha_creacion,
          d.numero as departamento,
          u.nombre || ' ' || u.apellido as solicitante
        FROM solicitudes_mantenimiento sm
        JOIN departamentos d ON sm.departamento_id = d.id
        JOIN usuarios u ON sm.creado_por = u.id
        ORDER BY sm.fecha_creacion DESC
        LIMIT 10
      `;
    }

    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return [];
  }
}

// Obtener áreas comunes disponibles
async function getAreasComunes() {
  try {
    const areas = await prisma.$queryRaw`
      SELECT 
        id,
        nombre,
        descripcion,
        capacidad,
        estado,
        pago_por_uso
      FROM areas_comunes
      ORDER BY nombre
    `;
    
    return areas;
  } catch (error) {
    console.error('Error al obtener áreas comunes:', error);
    return [];
  }
}

// Obtener información de pagos recientes
async function getPagosRecientes(limite = 10) {
  try {
    const query = `
      SELECT 
        p.tipo_pago,
        p.monto,
        p.estado,
        p.fecha_vencimiento,
        p.fecha_pago,
        d.numero as departamento,
        u.nombre || ' ' || u.apellido as residente
      FROM pagos p
      JOIN departamentos d ON p.departamento_id = d.id
      JOIN usuarios u ON p.residente_id = u.id
      ORDER BY p.fecha_vencimiento DESC
      LIMIT ${limite}
    `;
    
    const pagos = await prisma.$queryRawUnsafe(query);
    return pagos;
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return [];
  }
}

// Obtener anomalías detectadas
async function getAnomalias(tipo = null, severidad = null) {
  try {
    let query = `
      SELECT 
        ad.id,
        ad.tipo,
        ad.descripcion,
        ad.severidad,
        ad.valor_observado,
        ad.valor_esperado,
        ad.fecha,
        d.numero as departamento
      FROM anomalias_detectadas ad
      LEFT JOIN departamentos d ON ad.departamento_id = d.id
      WHERE 1=1
    `;
    
    if (tipo) query += ` AND ad.tipo = '${tipo}'`;
    if (severidad) query += ` AND ad.severidad = '${severidad}'`;
    
    query += ` ORDER BY ad.fecha DESC LIMIT 10`;
    
    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener anomalías:', error);
    return [];
  }
}

// Obtener reservas de áreas comunes
async function getReservas(estado = null) {
  try {
    let query = `
      SELECT 
        r.id,
        r.fecha_reserva,
        r.hora_inicio,
        r.hora_fin,
        r.estado,
        r.monto_pago,
        a.nombre as area,
        d.numero as departamento,
        u.nombre || ' ' || u.apellido as residente
      FROM reservas_areas r
      JOIN areas_comunes a ON r.area_id = a.id
      JOIN departamentos d ON r.residente_id = d.id
      JOIN usuarios u ON d.id = u.id
      WHERE 1=1
    `;
    
    if (estado) query += ` AND r.estado = '${estado}'`;
    
    query += ` ORDER BY r.fecha_reserva DESC LIMIT 10`;
    
    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return [];
  }
}

// Obtener información de departamentos
async function getDepartamentos(estado = null) {
  try {
    let query = `
      SELECT 
        d.numero,
        d.piso,
        d.dormitorios,
        d.banos,
        d.area_m2,
        d.renta_mensual,
        d.mantenimiento_mensual,
        d.estado,
        COUNT(r.id) as num_residentes
      FROM departamentos d
      LEFT JOIN residentes r ON d.id = r.departamento_id AND r.activo = true
      WHERE d.activo = true
    `;
    
    if (estado) query += ` AND d.estado = '${estado}'`;
    
    query += ` GROUP BY d.id ORDER BY d.numero LIMIT 20`;
    
    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    return [];
  }
}

// Obtener registros de acceso recientes
async function getRegistrosAcceso(tipo = null, limite = 10) {
  try {
    let query = `
      SELECT 
        ra.id,
        ra.tipo,
        ra.fecha_hora,
        u.nombre || ' ' || u.apellido as usuario,
        ds.ubicacion as dispositivo
      FROM registros_acceso ra
      LEFT JOIN usuarios u ON ra.usuario_id = u.id
      LEFT JOIN dispositivos_seguridad ds ON ra.dispositivo_id = ds.id
      WHERE 1=1
    `;
    
    if (tipo) query += ` AND ra.tipo = '${tipo}'`;
    
    query += ` ORDER BY ra.fecha_hora DESC LIMIT ${limite}`;
    
    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener registros de acceso:', error);
    return [];
  }
}

// Obtener usuarios del sistema
async function getUsuarios(activo = true) {
  try {
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.correo,
        u.telefono,
        u.activo,
        r.nombre as rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.activo = ${activo}
      ORDER BY u.nombre
      LIMIT 20
    `;
    
    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

// Obtener métricas de consumo
async function getMetricasConsumo(tipo = null) {
  try {
    let query = `
      SELECT 
        mc.tipo_servicio,
        mc.consumo,
        mc.fecha_registro,
        d.numero as departamento
      FROM metricas_consumo mc
      JOIN departamentos d ON mc.departamento_id = d.id
      WHERE 1=1
    `;
    
    if (tipo) query += ` AND mc.tipo_servicio = '${tipo}'`;
    
    query += ` ORDER BY mc.fecha_registro DESC LIMIT 20`;
    
    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener métricas de consumo:', error);
    return [];
  }
}

// Obtener notificaciones recientes
async function getNotificaciones(leidas = null, tipo = null, limite = 10) {
  try {
    let query = `
      SELECT 
        n.id,
        n.titulo,
        n.mensaje,
        n.tipo,
        n.leido,
        n.creado_en,
        u.nombre || ' ' || u.apellido as destinatario
      FROM notificaciones n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE 1=1
    `;
    
    if (leidas !== null) query += ` AND n.leido = ${leidas}`;
    if (tipo) query += ` AND n.tipo = '${tipo}'`;
    
    query += ` ORDER BY n.creado_en DESC LIMIT ${limite}`;
    
    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return [];
  }
}

// ============================================
// ENDPOINT DEL CHATBOT
// ============================================

// GET - Listar modelos disponibles (para debugging)
router.get('/models', async (req, res) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key de Gemini no configurada' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error al listar modelos:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Enviar mensaje al chatbot
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key de Gemini no configurada' });
    }

    // Obtener datos de la base de datos según el contexto del mensaje
    let contextoBD = '';
    const messageLower = message.toLowerCase();

    // Detectar intención del usuario y cargar datos relevantes
    
    // ESTADÍSTICAS GENERALES
    if (messageLower.includes('estadística') || messageLower.includes('resumen') || 
        messageLower.includes('cuántos') || messageLower.includes('total') ||
        messageLower.includes('cantidad') || messageLower.includes('general')) {
      const stats = await getEstadisticasGenerales();
      if (stats) {
        contextoBD = `\n\nDatos actuales del sistema:
- Total de usuarios activos: ${stats.usuarios}
- Total de departamentos: ${stats.departamentos}
- Total de residentes: ${stats.residentes}
- Pagos pendientes: ${stats.pagos.pendientes}
- Pagos pagados: ${stats.pagos.pagados}
- Solicitudes de mantenimiento: ${stats.mantenimiento.map(m => `${m.estado}: ${m.cantidad}`).join(', ')}
- Reservas activas: ${stats.reservas}
- Áreas comunes disponibles: ${stats.areasDisponibles}`;
      }
    }

    // RESIDENTES
    if (messageLower.includes('residente') || messageLower.includes('inquilino') ||
        messageLower.includes('propietario') || messageLower.includes('quien vive')) {
      const palabrasClave = message.split(' ').filter(p => p.length > 3);
      const criterio = palabrasClave[palabrasClave.length - 1];
      const residentes = await buscarResidentes(messageLower.includes('todos') ? '' : criterio);
      if (residentes.length > 0) {
        contextoBD += `\n\nResidentes encontrados:\n${residentes.map(r => 
          `- ${r.nombre} ${r.apellido} (Depto ${r.departamento}, ${r.tipo_relacion}, Tel: ${r.telefono || 'N/A'})`
        ).join('\n')}`;
      }
    }

    // MANTENIMIENTO
    if (messageLower.includes('mantenimiento') || messageLower.includes('solicitud') || 
        messageLower.includes('reparaci') || messageLower.includes('arreglo')) {
      const solicitudes = await getSolicitudesMantenimiento();
      if (solicitudes.length > 0) {
        contextoBD += `\n\nSolicitudes de mantenimiento recientes:\n${solicitudes.slice(0, 5).map(s => 
          `- ID ${s.id}: ${s.descripcion} (Depto ${s.departamento}, Estado: ${s.estado}, Solicitante: ${s.solicitante})`
        ).join('\n')}`;
      }
    }

    // ÁREAS COMUNES
    if (messageLower.includes('área') || messageLower.includes('reservar') || 
        messageLower.includes('disponible') || messageLower.includes('salon') ||
        messageLower.includes('piscina') || messageLower.includes('gimnasio')) {
      const areas = await getAreasComunes();
      if (areas.length > 0) {
        contextoBD += `\n\nÁreas comunes:\n${areas.map(a => 
          `- ${a.nombre}: ${a.estado} (Capacidad: ${a.capacidad || 'N/A'}, Costo: $${a.pago_por_uso || 0})`
        ).join('\n')}`;
      }
    }

    // PAGOS
    if (messageLower.includes('pago') || messageLower.includes('deuda') || 
        messageLower.includes('pendiente') || messageLower.includes('cobro') ||
        messageLower.includes('factura')) {
      const pagos = await getPagosRecientes(5);
      if (pagos.length > 0) {
        contextoBD += `\n\nPagos recientes:\n${pagos.map(p => 
          `- Depto ${p.departamento}: ${p.tipo_pago} - $${p.monto} (${p.estado}) - Vence: ${new Date(p.fecha_vencimiento).toLocaleDateString()}`
        ).join('\n')}`;
      }
    }

    // ANOMALÍAS
    if (messageLower.includes('anomalía') || messageLower.includes('anomalia') || 
        messageLower.includes('alerta') || messageLower.includes('problema') ||
        messageLower.includes('irregular')) {
      const anomalias = await getAnomalias();
      if (anomalias.length > 0) {
        contextoBD += `\n\nAnomalías detectadas:\n${anomalias.slice(0, 5).map(a => 
          `- ${a.tipo} (Severidad: ${a.severidad}): ${a.descripcion} - Depto ${a.departamento || 'N/A'}`
        ).join('\n')}`;
      }
    }

    // RESERVAS
    if (messageLower.includes('reserva') || messageLower.includes('reservacion') ||
        messageLower.includes('agendada') || messageLower.includes('próxima')) {
      const reservas = await getReservas();
      if (reservas.length > 0) {
        contextoBD += `\n\nReservas recientes:\n${reservas.slice(0, 5).map(r => 
          `- ${r.area} - Depto ${r.departamento} (${r.residente}): ${new Date(r.fecha_reserva).toLocaleDateString()} ${r.hora_inicio}-${r.hora_fin} - Estado: ${r.estado}`
        ).join('\n')}`;
      }
    }

    // DEPARTAMENTOS
    if (messageLower.includes('departamento') || messageLower.includes('depto') ||
        messageLower.includes('apartamento') || messageLower.includes('unidad') ||
        messageLower.includes('ocupado') || messageLower.includes('vacío')) {
      const deptos = await getDepartamentos();
      if (deptos.length > 0) {
        contextoBD += `\n\nDepartamentos:\n${deptos.slice(0, 10).map(d => 
          `- Depto ${d.numero} (Piso ${d.piso}): ${d.estado} - ${d.dormitorios} dorms, ${d.banos} baños, ${d.area_m2}m² - Renta: $${d.renta_mensual} - Residentes: ${d.num_residentes}`
        ).join('\n')}`;
      }
    }

    // ACCESOS / SEGURIDAD
    if (messageLower.includes('acceso') || messageLower.includes('entrada') ||
        messageLower.includes('salida') || messageLower.includes('seguridad') ||
        messageLower.includes('registro')) {
      const accesos = await getRegistrosAcceso(null, 10);
      if (accesos.length > 0) {
        contextoBD += `\n\nRegistros de acceso recientes:\n${accesos.slice(0, 8).map(a => 
          `- ${a.tipo}: ${a.usuario || 'Usuario desconocido'} - ${a.dispositivo || 'Dispositivo N/A'} - ${new Date(a.fecha_hora).toLocaleString()}`
        ).join('\n')}`;
      }
    }

    // USUARIOS DEL SISTEMA
    if (messageLower.includes('usuario') || messageLower.includes('administrador') ||
        messageLower.includes('cuenta') || messageLower.includes('staff')) {
      const usuarios = await getUsuarios(true);
      if (usuarios.length > 0) {
        contextoBD += `\n\nUsuarios del sistema:\n${usuarios.slice(0, 10).map(u => 
          `- ${u.nombre} ${u.apellido} (${u.rol || 'Sin rol'}) - ${u.correo}`
        ).join('\n')}`;
      }
    }

    // CONSUMO / SERVICIOS
    if (messageLower.includes('consumo') || messageLower.includes('agua') ||
        messageLower.includes('luz') || messageLower.includes('gas') ||
        messageLower.includes('servicio') || messageLower.includes('métrica')) {
      let tipoServicio = null;
      if (messageLower.includes('agua')) tipoServicio = 'agua';
      else if (messageLower.includes('luz') || messageLower.includes('electricidad')) tipoServicio = 'luz';
      else if (messageLower.includes('gas')) tipoServicio = 'gas';
      
      const metricas = await getMetricasConsumo(tipoServicio);
      if (metricas.length > 0) {
        contextoBD += `\n\nMétricas de consumo:\n${metricas.slice(0, 10).map(m => 
          `- Depto ${m.departamento}: ${m.tipo_servicio} - ${m.consumo} - ${new Date(m.fecha_registro).toLocaleDateString()}`
        ).join('\n')}`;
      }
    }

    // NOTIFICACIONES
    if (messageLower.includes('notificaci') || messageLower.includes('aviso') ||
        messageLower.includes('alerta') || messageLower.includes('mensaje') ||
        messageLower.includes('pendiente de leer') || messageLower.includes('sin leer')) {
      let leidas = null;
      if (messageLower.includes('sin leer') || messageLower.includes('no leídas') || messageLower.includes('pendiente')) {
        leidas = false;
      } else if (messageLower.includes('leídas')) {
        leidas = true;
      }
      
      const notificaciones = await getNotificaciones(leidas, null, 10);
      if (notificaciones.length > 0) {
        contextoBD += `\n\nNotificaciones:\n${notificaciones.map(n => 
          `- ${n.leido ? '✓' : '●'} ${n.tipo.toUpperCase()}: "${n.titulo}" - ${n.destinatario} (${new Date(n.creado_en).toLocaleDateString()})`
        ).join('\n')}`;
      }
    }

    // Construir el prompt con contexto
    const promptConContexto = `Eres el asistente virtual de Habitech, un sistema de gestión inteligente de edificios residenciales. 

Tu rol es ayudar a los administradores con:

📊 ESTADÍSTICAS Y REPORTES:
- Resúmenes generales del edificio
- Conteos de residentes, pagos, solicitudes
- Estados de ocupación y disponibilidad

👥 GESTIÓN DE RESIDENTES:
- Búsqueda de residentes por nombre o departamento
- Información de contacto y tipo de relación
- Historial y datos generales

🔧 MANTENIMIENTO:
- Estado de solicitudes de mantenimiento
- Filtrado por estado (pendiente, en proceso, resuelto)
- Detalles de solicitudes y asignaciones

💰 GESTIÓN FINANCIERA:
- Pagos pendientes y realizados
- Montos y fechas de vencimiento
- Estado de cuentas por departamento

🏊 ÁREAS COMUNES Y RESERVAS:
- Disponibilidad de espacios
- Reservas activas y programadas
- Costos y horarios

🏢 DEPARTAMENTOS:
- Estado de ocupación (disponible, ocupado, mantenimiento)
- Características (dormitorios, baños, área)
- Rentas y número de residentes

🔒 SEGURIDAD Y ACCESOS:
- Registros de entrada y salida
- Control de accesos por dispositivo
- Historial de movimientos

⚠️ ANOMALÍAS Y ALERTAS:
- Detección de anomalías por tipo
- Niveles de severidad
- Consumos irregulares

📈 MÉTRICAS DE CONSUMO:
- Consumo de agua, luz y gas
- Comparativas por departamento
- Tendencias de uso

� NOTIFICACIONES:
- Listado de notificaciones recientes
- Filtrado por leídas/sin leer
- Notificaciones por tipo (pago, anuncio, sistema, chat)
- Destinatarios y fechas

�👤 USUARIOS DEL SISTEMA:
- Listado de usuarios activos
- Roles y permisos
- Información de contacto

IMPORTANTE:
- Responde de manera amable, clara y profesional
- Si tienes datos de la base de datos, úsalos para dar respuestas precisas y detalladas
- Si no tienes información suficiente, sugiere al usuario consultar el módulo específico
- Formatea las respuestas de manera legible (usa listas, negritas, saltos de línea)
- Si mencionas números o datos, asegúrate de que sean exactos según la información proporcionada
- Ofrece recomendaciones proactivas cuando sea apropiado
- Si detectas patrones o problemas en los datos, menciónalos
${contextoBD}

Usuario: ${message}`;


    // Llamar a la API de Gemini (usando gemini-2.5-flash - modelo estable y gratuito)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptConContexto
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error de Gemini API:', errorData);
      throw new Error(`Error de Gemini API: ${response.status}`);
    }

    const data = await response.json();
    
    // Extraer la respuesta del formato de Gemini
    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                        'Lo siento, no pude procesar tu mensaje.';

    res.json({ response: botResponse });

  } catch (error) {
    console.error('Error en chatbot:', error);
    res.status(500).json({ 
      error: 'Error al procesar el mensaje',
      details: error.message 
    });
  }
});

export default router;
