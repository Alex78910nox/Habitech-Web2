import express from 'express';
import { PrismaClient } from '@prisma/client';
import SibApiV3Sdk from '@sendinblue/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar Brevo (Sendinblue)
const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
const brevoApiKey = brevoApi.authentications['apiKey'];
brevoApiKey.apiKey = process.env.BREVO_API_KEY;

// URL base del backend (configurar en .env)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Almacenamiento temporal de tokens (en producción usar Redis o BD)
const tokensAprobacion = new Map();

// Generar token único para aprobación
function generarToken(solicitudId) {
  const token = crypto.randomBytes(32).toString('hex');
  tokensAprobacion.set(token, {
    solicitudId,
    expira: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
  });
  return token;
}

// Validar token
function validarToken(token) {
  const datos = tokensAprobacion.get(token);
  if (!datos) return null;
  
  if (Date.now() > datos.expira) {
    tokensAprobacion.delete(token);
    return null;
  }
  
  return datos.solicitudId;
}

// Función auxiliar para formatear fecha legible
function formatearFecha(fecha) {
  if (!fecha) return '-';
  
  // Si es un string con formato YYYY-MM-DD
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) {
      fecha = fecha.split('T')[0];
    }
    const [year, month, day] = fecha.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${day} de ${meses[parseInt(month) - 1]} de ${year}`;
  }
  
  // Si es objeto Date
  try {
    const d = new Date(fecha);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${day} de ${meses[d.getMonth()]} de ${year}`;
  } catch {
    return String(fecha);
  }
}

// Función auxiliar para formatear hora legible
function formatearHora(hora) {
  if (!hora) return '-';
  
  // Si viene como string tipo "HH:MM:SS" o "HH:MM"
  if (typeof hora === 'string') {
    if (hora.includes('T')) {
      // Formato "1970-01-01T08:12:00"
      hora = hora.split('T')[1];
    }
    const partes = hora.split(':');
    if (partes.length >= 2) {
      return `${partes[0]}:${partes[1]}`;
    }
    return hora;
  }
  
  // Si es objeto Date
  try {
    const d = new Date(hora);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return String(hora);
  }
}

// Función para enviar email de solicitud al residente
async function sendSolicitudEmailResidente(to, nombre, datosSolicitud, ticket) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  let personalAsignado = '';
  if (datosSolicitud.personal_nombre) {
    personalAsignado = `<b>Personal asignado:</b> ${datosSolicitud.personal_nombre}<br>`;
  }

  // Formatear fecha y hora correctamente
  const fechaFormateada = formatearFecha(datosSolicitud.fecha_progamada);
  const horaFormateada = formatearHora(datosSolicitud.hora_programada);
  
  let fechaHoraProgramada = '-';
  if (fechaFormateada !== '-' || horaFormateada !== '-') {
    fechaHoraProgramada = `${fechaFormateada}${horaFormateada !== '-' ? ' a las ' + horaFormateada : ''}`;
  }

  sendSmtpEmail.subject = `🔧 Nueva Solicitud de Mantenimiento - Ticket #${ticket}`;
  sendSmtpEmail.htmlContent = `
    <html><body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:10px;box-shadow:0 2px 10px #0001;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a2744,#3b82f6);color:white;padding:30px;text-align:center;">
          <h1>🏢 HABITECH</h1>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:5px 15px;border-radius:20px;font-size:12px;margin-top:10px;">SOLICITUD DE MANTENIMIENTO</span>
        </div>
        <div style="padding:40px 30px;">
          <h2>Hola ${nombre},</h2>
          <p>Se ha creado una nueva solicitud de mantenimiento:</p>
          <div style="background:#f8f9fa;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin:20px 0;">
            <div style="font-size:18px;font-weight:bold;color:#3b82f6;margin-bottom:10px;">Ticket #${ticket}</div>
            <div style="color:#333;line-height:1.6;font-size:16px;">
              <b>Descripción:</b> ${datosSolicitud.descripcion}<br>
              <b>Departamento:</b> ${datosSolicitud.departamento_numero || datosSolicitud.departamento_id}<br>
              <b>Fecha programada:</b> ${fechaHoraProgramada}<br>
              ${personalAsignado}
              <b>Estado:</b> ${datosSolicitud.estado}<br>
            </div>
          </div>
          <p>Puedes ver más detalles ingresando a tu cuenta de Habitech.</p>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#666;font-size:12px;">
          <p>Habitech © 2025 - Sistema de Gestión de Edificios</p>
          <p>Esta es una notificación automática, por favor no responder a este correo.</p>
        </div>
      </div>
    </body></html>
  `;
  sendSmtpEmail.sender = { name: "Habitech Solicitudes", email: process.env.BREVO_FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: nombre }];
  
  try {
    await brevoApi.sendTransacEmail(sendSmtpEmail);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email al residente:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar email de APROBACIÓN al personal
async function sendEmailAprobacionPersonal(to, nombre, datosSolicitud, token) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  const urlAceptar = `${BASE_URL}/api/solicitudes-mantenimiento/${datosSolicitud.id}/aceptar?token=${token}`;
  const urlRechazar = `${BASE_URL}/api/solicitudes-mantenimiento/${datosSolicitud.id}/rechazar?token=${token}`;

  // Formatear fecha y hora correctamente
  const fechaFormateada = formatearFecha(datosSolicitud.fecha_progamada);
  const horaFormateada = formatearHora(datosSolicitud.hora_programada);

  sendSmtpEmail.subject = `⚠️ APROBACIÓN REQUERIDA - Nueva Solicitud de Mantenimiento`;
  sendSmtpEmail.htmlContent = `
    <html><body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:10px;box-shadow:0 2px 10px #0001;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#ff9800,#ff5722);color:white;padding:30px;text-align:center;">
          <h1>⚠️ APROBACIÓN REQUERIDA</h1>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:5px 15px;border-radius:20px;font-size:12px;margin-top:10px;">NUEVA SOLICITUD DE MANTENIMIENTO</span>
        </div>
        <div style="padding:40px 30px;">
          <h2>Hola ${nombre},</h2>
          <p><strong>Se te ha asignado una nueva solicitud de mantenimiento.</strong></p>
          <p style="color:#ff5722;font-weight:600;">⏰ Por favor, revisa y confirma tu disponibilidad.</p>
          
          <div style="background:#fff3e0;border-left:4px solid #ff9800;border-radius:8px;padding:20px;margin:20px 0;">
            <div style="font-size:18px;font-weight:bold;color:#ff9800;margin-bottom:10px;">Solicitud #${datosSolicitud.id}</div>
            <div style="color:#333;line-height:1.6;font-size:16px;">
              <b>Descripción:</b> ${datosSolicitud.descripcion}<br>
              <b>Departamento:</b> ${datosSolicitud.departamento_numero || datosSolicitud.departamento_id}<br>
              <b>Fecha programada:</b> ${fechaFormateada}<br>
              <b>Hora programada:</b> ${horaFormateada}<br>
              <b>Residente:</b> ${datosSolicitud.residente_nombre || '-'}<br>
            </div>
          </div>

          <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="margin:0 0 15px 0;font-weight:600;color:#333;">¿Puedes atender esta solicitud?</p>
            <div style="display:flex;gap:15px;justify-content:center;">
              <a href="${urlAceptar}" style="background:#4caf50;color:white;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:600;display:inline-block;box-shadow:0 2px 8px rgba(76,175,80,0.3);">
                ✅ ACEPTAR SOLICITUD
              </a>
              <a href="${urlRechazar}" style="background:#f44336;color:white;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:600;display:inline-block;box-shadow:0 2px 8px rgba(244,67,54,0.3);">
                ❌ RECHAZAR
              </a>
            </div>
          </div>

          <p style="color:#666;font-size:14px;margin-top:20px;">
            <strong>Nota:</strong> Si aceptas, se creará automáticamente el ticket de mantenimiento y se notificará al residente.
          </p>
          <p style="color:#999;font-size:12px;">
            Este link de aprobación expira en 24 horas.
          </p>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#666;font-size:12px;">
          <p>Habitech © 2025 - Sistema de Gestión de Edificios</p>
          <p>Esta es una notificación automática, por favor no responder a este correo.</p>
        </div>
      </div>
    </body></html>
  `;
  sendSmtpEmail.sender = { name: "Habitech - Sistema de Aprobaciones", email: process.env.BREVO_FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: nombre }];
  
  try {
    await brevoApi.sendTransacEmail(sendSmtpEmail);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email de aprobación:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar email de confirmación al personal (cuando se acepta)
async function sendEmailConfirmacionPersonal(to, nombre, datosSolicitud, ticket) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  // Formatear fecha y hora correctamente
  const fechaFormateada = formatearFecha(datosSolicitud.fecha_progamada);
  const horaFormateada = formatearHora(datosSolicitud.hora_programada);
  
  let fechaHoraProgramada = '-';
  if (fechaFormateada !== '-' || horaFormateada !== '-') {
    fechaHoraProgramada = `${fechaFormateada}${horaFormateada !== '-' ? ' a las ' + horaFormateada : ''}`;
  }

  sendSmtpEmail.subject = `✅ Ticket Creado - Mantenimiento #${ticket}`;
  sendSmtpEmail.htmlContent = `
    <html><body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:10px;box-shadow:0 2px 10px #0001;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#4caf50,#8bc34a);color:white;padding:30px;text-align:center;">
          <h1>✅ TICKET CREADO</h1>
          <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:5px 15px;border-radius:20px;font-size:12px;margin-top:10px;">CONFIRMACIÓN DE ASIGNACIÓN</span>
        </div>
        <div style="padding:40px 30px;">
          <h2>Hola ${nombre},</h2>
          <p><strong>Has aceptado la solicitud de mantenimiento.</strong></p>
          <p>Se ha creado el ticket oficial y el residente ha sido notificado.</p>
          
          <div style="background:#e8f5e9;border-left:4px solid #4caf50;border-radius:8px;padding:20px;margin:20px 0;">
            <div style="font-size:18px;font-weight:bold;color:#4caf50;margin-bottom:10px;">Ticket #${ticket}</div>
            <div style="color:#333;line-height:1.6;font-size:16px;">
              <b>Descripción:</b> ${datosSolicitud.descripcion}<br>
              <b>Departamento:</b> ${datosSolicitud.departamento_numero || datosSolicitud.departamento_id}<br>
              <b>Fecha programada:</b> ${fechaHoraProgramada}<br>
              <b>Estado:</b> En Proceso<br>
            </div>
          </div>
          
          <p>Puedes gestionar este ticket desde tu cuenta de Habitech.</p>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;color:#666;font-size:12px;">
          <p>Habitech © 2025 - Sistema de Gestión de Edificios</p>
        </div>
      </div>
    </body></html>
  `;
  sendSmtpEmail.sender = { name: "Habitech Tickets", email: process.env.BREVO_FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: nombre }];
  
  try {
    await brevoApi.sendTransacEmail(sendSmtpEmail);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email de confirmación:', error);
    return { success: false, error: error.message };
  }
}

// Obtener todas las solicitudes de mantenimiento
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/solicitudes-mantenimiento: consultando solicitudes...');
    const query = `
      SELECT DISTINCT ON (s.id) s.*, d.numero AS departamento_numero, d.descripcion AS departamento_desc,
        p.nombre AS personal_nombre, p.apellido AS personal_apellido,
        r.id AS residente_id, u.nombre AS residente_nombre, u.apellido AS residente_apellido
      FROM solicitudes_mantenimiento s
      LEFT JOIN departamentos d ON s.departamento_id = d.id
      LEFT JOIN personal_edificio p ON s.asignado_a = p.id
      LEFT JOIN residentes r ON s.departamento_id = r.departamento_id AND r.activo = true
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY s.id, s.fecha_creacion DESC
    `;
    const solicitudes = await prisma.$queryRawUnsafe(query);
    console.log('Solicitudes obtenidas:', solicitudes);
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: error.message || 'Error al obtener solicitudes' });
  }
});

// Crear nueva solicitud de mantenimiento (CON APROBACIÓN PREVIA)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/solicitudes-mantenimiento: datos recibidos:', req.body);
    const { departamento_id, descripcion, creado_por, asignado_a, fecha_programada, hora_programada } = req.body;
    
    if (!departamento_id || !descripcion || !creado_por) {
      return res.status(400).json({ error: 'Campos requeridos: departamento_id, descripcion, creado_por' });
    }

    // Si NO se asigna personal, crear directamente como pendiente
    if (!asignado_a) {
      let campos = ['departamento_id', 'descripcion', 'creado_por', 'estado', 'fecha_creacion'];
      let valores = [Number(departamento_id), descripcion, Number(creado_por), 'pendiente', new Date()];
      let placeholders = ['$1', '$2', '$3', '$4::estado_mantenimiento', '$5'];
      let idx = 6;

      if (fecha_programada) {
        campos.push('fecha_progamada');
        valores.push(fecha_programada);
        placeholders.push(`$${idx}::date`);
        idx++;
      }
      if (hora_programada) {
        campos.push('hora_programada');
        valores.push(hora_programada);
        placeholders.push(`$${idx}::time`);
        idx++;
      }

      const query = `INSERT INTO solicitudes_mantenimiento (${campos.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const result = await prisma.$queryRawUnsafe(query, ...valores);
      return res.json(result[0]);
    }

    // SI se asigna personal, crear con estado "pendiente_aprobacion"
    let campos = ['departamento_id', 'descripcion', 'creado_por', 'asignado_a', 'estado', 'fecha_creacion'];
    let valores = [Number(departamento_id), descripcion, Number(creado_por), Number(asignado_a), 'pendiente_aprobacion', new Date()];
    let placeholders = ['$1', '$2', '$3', '$4', '$5::estado_mantenimiento', '$6'];
    let idx = 7;

    if (fecha_programada) {
      campos.push('fecha_progamada');
      valores.push(fecha_programada);
      placeholders.push(`$${idx}::date`);
      idx++;
    }
    if (hora_programada) {
      campos.push('hora_programada');
      valores.push(hora_programada);
      placeholders.push(`$${idx}::time`);
      idx++;
    }

    const query = `INSERT INTO solicitudes_mantenimiento (${campos.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    console.log('Ejecutando query:', query, valores);
    const result = await prisma.$queryRawUnsafe(query, ...valores);
    const solicitud = result[0];
    console.log('Solicitud creada (pendiente aprobación):', solicitud);

    // Obtener datos del personal asignado
    let personal = null;
    try {
      const personalResult = await prisma.$queryRaw`
        SELECT nombre, apellido, correo FROM personal_edificio WHERE id = ${Number(solicitud.asignado_a)} LIMIT 1
      `;
      personal = personalResult[0];
    } catch (err) {
      console.error('Error al obtener personal:', err);
    }

    // Obtener datos del residente
    let residente = null;
    try {
      const residenteResult = await prisma.$queryRaw`
        SELECT u.nombre, u.apellido, u.correo, d.numero AS departamento_numero
        FROM residentes r
        INNER JOIN usuarios u ON r.usuario_id = u.id
        INNER JOIN departamentos d ON r.departamento_id = d.id
        WHERE r.id = ${Number(solicitud.creado_por)}
        LIMIT 1
      `;
      residente = residenteResult[0];
    } catch (err) {
      console.error('Error al obtener residente:', err);
    }

    // Generar token de aprobación
    const token = generarToken(solicitud.id);

    // Enviar email de APROBACIÓN al personal
    if (personal && personal.correo) {
      await sendEmailAprobacionPersonal(
        personal.correo,
        `${personal.nombre} ${personal.apellido}`,
        {
          ...solicitud,
          departamento_numero: residente ? residente.departamento_numero : '',
          residente_nombre: residente ? `${residente.nombre} ${residente.apellido}` : ''
        },
        token
      );
      console.log(`📧 Email de aprobación enviado a ${personal.correo}`);
    }

    res.json({
      ...solicitud,
      mensaje: '⏳ Solicitud creada. Esperando aprobación del personal.'
    });

  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({ error: error.message || 'Error al crear solicitud' });
  }
});

// ENDPOINT: Aceptar solicitud (desde email)
router.get('/:id/aceptar', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // Validar token
    const solicitudId = validarToken(token);
    if (!solicitudId || solicitudId !== parseInt(id)) {
      return res.status(400).send(`
        <html><body style="font-family:Arial;text-align:center;padding:50px;">
          <h1 style="color:#f44336;">❌ Token inválido o expirado</h1>
          <p>Este enlace ya no es válido. Por favor, contacta al administrador.</p>
        </body></html>
      `);
    }

    // Obtener la solicitud
    const solicitudResult = await prisma.$queryRaw`
      SELECT s.*, d.numero AS departamento_numero,
        p.nombre AS personal_nombre, p.apellido AS personal_apellido, p.correo AS personal_correo,
        u.nombre AS residente_nombre, u.apellido AS residente_apellido, u.correo AS residente_correo
      FROM solicitudes_mantenimiento s
      LEFT JOIN departamentos d ON s.departamento_id = d.id
      LEFT JOIN personal_edificio p ON s.asignado_a = p.id
      LEFT JOIN residentes r ON s.departamento_id = r.departamento_id AND r.activo = true
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE s.id = ${Number(id)}
      LIMIT 1
    `;

    if (!solicitudResult.length) {
      return res.status(404).send(`
        <html><body style="font-family:Arial;text-align:center;padding:50px;">
          <h1 style="color:#f44336;">❌ Solicitud no encontrada</h1>
        </body></html>
      `);
    }

    const solicitud = solicitudResult[0];

    // Actualizar estado a "en_proceso"
    await prisma.$executeRaw`
      UPDATE solicitudes_mantenimiento 
      SET estado = 'en_proceso'
      WHERE id = ${Number(id)}
    `;

    // Eliminar token usado
    tokensAprobacion.delete(token);

    const ticket = solicitud.id;

    // Enviar email de confirmación al personal
    if (solicitud.personal_correo) {
      await sendEmailConfirmacionPersonal(
        solicitud.personal_correo,
        `${solicitud.personal_nombre} ${solicitud.personal_apellido}`,
        solicitud,
        ticket
      );
    }

    // Enviar email al residente notificando que se creó el ticket
    if (solicitud.residente_correo) {
      await sendSolicitudEmailResidente(
        solicitud.residente_correo,
        `${solicitud.residente_nombre} ${solicitud.residente_apellido}`,
        {
          ...solicitud,
          personal_nombre: `${solicitud.personal_nombre} ${solicitud.personal_apellido}`
        },
        ticket
      );
    }

    console.log(`✅ Solicitud #${id} ACEPTADA por el personal`);

    res.send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px;background:#e8f5e9;">
        <div style="max-width:500px;margin:0 auto;background:white;padding:40px;border-radius:10px;box-shadow:0 2px 10px #0001;">
          <h1 style="color:#4caf50;">✅ ¡Solicitud Aceptada!</h1>
          <p style="font-size:18px;color:#333;">Se ha creado el <strong>Ticket #${ticket}</strong></p>
          <p style="color:#666;">El residente ha sido notificado. Puedes cerrar esta ventana.</p>
          <div style="margin-top:30px;padding:20px;background:#f5f5f5;border-radius:8px;">
            <p style="margin:0;"><strong>Depto:</strong> ${solicitud.departamento_numero}</p>
            <p style="margin:0;"><strong>Descripción:</strong> ${solicitud.descripcion}</p>
          </div>
        </div>
      </body></html>
    `);

  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    res.status(500).send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px;">
        <h1 style="color:#f44336;">❌ Error al procesar la solicitud</h1>
        <p>${error.message}</p>
      </body></html>
    `);
  }
});

// ENDPOINT: Rechazar solicitud (desde email)
router.get('/:id/rechazar', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // Validar token
    const solicitudId = validarToken(token);
    if (!solicitudId || solicitudId !== parseInt(id)) {
      return res.status(400).send(`
        <html><body style="font-family:Arial;text-align:center;padding:50px;">
          <h1 style="color:#f44336;">❌ Token inválido o expirado</h1>
          <p>Este enlace ya no es válido. Por favor, contacta al administrador.</p>
        </body></html>
      `);
    }

    // Actualizar estado a "rechazada"
    await prisma.$executeRaw`
      UPDATE solicitudes_mantenimiento 
      SET estado = 'rechazada', asignado_a = NULL
      WHERE id = ${Number(id)}
    `;

    // Eliminar token usado
    tokensAprobacion.delete(token);

    console.log(`❌ Solicitud #${id} RECHAZADA por el personal`);

    res.send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px;background:#ffebee;">
        <div style="max-width:500px;margin:0 auto;background:white;padding:40px;border-radius:10px;box-shadow:0 2px 10px #0001;">
          <h1 style="color:#f44336;">❌ Solicitud Rechazada</h1>
          <p style="font-size:18px;color:#333;">Has rechazado esta solicitud de mantenimiento.</p>
          <p style="color:#666;">El administrador será notificado para reasignar el trabajo. Puedes cerrar esta ventana.</p>
        </div>
      </body></html>
    `);

  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px;">
        <h1 style="color:#f44336;">❌ Error al procesar la solicitud</h1>
        <p>${error.message}</p>
      </body></html>
    `);
  }
});

// Asignar personal a una solicitud (reasignar después de rechazo)
router.put('/:id/asignar', async (req, res) => {
  try {
    const { id } = req.params;
    const { asignado_a } = req.body;
    
    if (!id || !asignado_a) {
      return res.status(400).json({ error: 'Campos requeridos: id, asignado_a' });
    }

    // Obtener la solicitud actual
    const solicitudActual = await prisma.$queryRaw`
      SELECT * FROM solicitudes_mantenimiento WHERE id = ${Number(id)} LIMIT 1
    `;

    if (!solicitudActual.length) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Actualizar con nuevo personal y volver a "pendiente_aprobacion"
    await prisma.$executeRaw`
      UPDATE solicitudes_mantenimiento 
      SET asignado_a = ${Number(asignado_a)}, estado = 'pendiente_aprobacion'
      WHERE id = ${Number(id)}
    `;

    // Obtener datos del nuevo personal
    const personalResult = await prisma.$queryRaw`
      SELECT nombre, apellido, correo FROM personal_edificio WHERE id = ${Number(asignado_a)} LIMIT 1
    `;
    const personal = personalResult[0];

    // Obtener datos completos de la solicitud
    const query = `
      SELECT s.*, d.numero AS departamento_numero,
        u.nombre AS residente_nombre, u.apellido AS residente_apellido
      FROM solicitudes_mantenimiento s
      LEFT JOIN departamentos d ON s.departamento_id = d.id
      LEFT JOIN residentes r ON s.departamento_id = r.departamento_id AND r.activo = true
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE s.id = $1
      LIMIT 1
    `;
    const solicitud = await prisma.$queryRawUnsafe(query, Number(id));

    // Generar nuevo token
    const token = generarToken(Number(id));

    // Enviar email de aprobación al nuevo personal
    if (personal && personal.correo) {
      await sendEmailAprobacionPersonal(
        personal.correo,
        `${personal.nombre} ${personal.apellido}`,
        {
          ...solicitud[0],
          residente_nombre: solicitud[0].residente_nombre ? `${solicitud[0].residente_nombre} ${solicitud[0].residente_apellido}` : ''
        },
        token
      );
      console.log(`📧 Email de aprobación enviado a ${personal.correo}`);
    }

    res.json({
      ...solicitud[0],
      mensaje: '⏳ Personal reasignado. Esperando aprobación.'
    });

  } catch (error) {
    console.error('Error al asignar personal:', error);
    res.status(500).json({ error: error.message || 'Error al asignar personal' });
  }
});

// Listar personal disponible
router.get('/personal', async (req, res) => {
  try {
    const personal = await prisma.$queryRaw`
      SELECT * FROM personal_edificio WHERE activo = true ORDER BY nombre, apellido
    `;
    res.json(personal);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener personal' });
  }
});

// Listar departamentos
router.get('/departamentos', async (req, res) => {
  try {
    const departamentos = await prisma.departamentos.findMany();
    res.json(departamentos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener departamentos' });
  }
});

// Cambiar estado de una solicitud manualmente (admin)
router.put('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'en_proceso', 'resuelto', 'cancelado', 'pendiente_aprobacion', 'rechazada'];
    
    if (!id || !estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido o faltante' });
    }
    
    // Actualizar estado en la base de datos
    await prisma.$executeRawUnsafe(
      `UPDATE solicitudes_mantenimiento SET estado = $1::estado_mantenimiento,
        fecha_resolucion = CASE WHEN $1 = 'resuelto' THEN NOW() ELSE NULL END
      WHERE id = $2`,
      estado,
      Number(id)
    );
    
    // Consultar registro actualizado con JOIN para frontend
    const query = `
      SELECT s.*, d.numero AS departamento_numero, d.descripcion AS departamento_desc,
        p.nombre AS personal_nombre, p.apellido AS personal_apellido,
        r.id AS residente_id, u.nombre AS residente_nombre, u.apellido AS residente_apellido
      FROM solicitudes_mantenimiento s
      LEFT JOIN departamentos d ON s.departamento_id = d.id
      LEFT JOIN personal_edificio p ON s.asignado_a = p.id
      LEFT JOIN residentes r ON s.departamento_id = r.departamento_id AND r.activo = true
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE s.id = $1
      LIMIT 1
    `;
    const solicitud = await prisma.$queryRawUnsafe(query, Number(id));
    res.json(solicitud[0]);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: error.message || 'Error al cambiar estado' });
  }
});

export default router;