import express from 'express';
import { PrismaClient } from '@prisma/client';
import SibApiV3Sdk from '@sendinblue/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar Brevo (Sendinblue)
const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
const brevoApiKey = brevoApi.authentications['apiKey'];
brevoApiKey.apiKey = process.env.BREVO_API_KEY;

// Función para enviar email con Brevo
async function sendNotificationEmail(to, nombre, titulo, mensaje, tipo) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  // Definir colores por tipo de notificación
  const colores = {
    pago: '#f59e0b',
    anuncio: '#6366f1',
    sistema: '#3b82f6',
    chat: '#10b981'
  };
  
  const iconos = {
    pago: '💰',
    anuncio: '📢',
    sistema: '⚙️',
    chat: '💬'
  };
  
  const color = colores[tipo] || '#6366f1';
  const icono = iconos[tipo] || '📬';
  
  sendSmtpEmail.subject = `${icono} ${titulo} - Habitech`;
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a2744, ${color}); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
        .content { padding: 40px 30px; }
        .notification-box { background: #f8f9fa; border-left: 4px solid ${color}; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .notification-title { font-size: 20px; font-weight: bold; color: ${color}; margin-bottom: 15px; }
        .notification-message { color: #333; line-height: 1.6; font-size: 16px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .footer a { color: ${color}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 HABITECH</h1>
          <span class="badge">${tipo.toUpperCase()}</span>
        </div>
        <div class="content">
          <h2>Hola ${nombre},</h2>
          <p>Tienes una nueva notificación:</p>
          <div class="notification-box">
            <div class="notification-title">${icono} ${titulo}</div>
            <div class="notification-message">${mensaje}</div>
          </div>
          <p>Puedes ver más detalles ingresando a tu cuenta de Habitech.</p>
        </div>
        <div class="footer">
          <p>Habitech © 2025 - Sistema de Gestión de Edificios</p>
          <p>Esta es una notificación automática, por favor no responder a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  sendSmtpEmail.sender = { 
    name: "Habitech Notificaciones", 
    email: process.env.BREVO_FROM_EMAIL 
  };
  sendSmtpEmail.to = [{ email: to, name: nombre }];
  
  try {
    await brevoApi.sendTransacEmail(sendSmtpEmail);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
}

// Obtener todas las notificaciones (para el dashboard)
router.get('/', async (req, res) => {
  try {
    // Como la tabla no tiene primary key, usamos queryRaw
    const notificaciones = await prisma.$queryRaw`
      SELECT 
        n.*,
        u.nombre, u.apellido, u.correo
      FROM notificaciones n
      INNER JOIN usuarios u ON n.usuario_id = u.id
      ORDER BY n.creado_en DESC
      LIMIT 50
    `;
    
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar notificación a un residente específico
router.post('/enviar-individual', async (req, res) => {
  try {
    const { usuario_id, titulo, mensaje, tipo } = req.body;
    
    // Validación
    if (!usuario_id || !titulo || !mensaje || !tipo) {
      return res.status(400).json({ 
        error: 'Campos requeridos: usuario_id, titulo, mensaje, tipo' 
      });
    }
    
    // Verificar que el usuario existe y es residente
    const usuario = await prisma.usuarios.findFirst({
      where: { id: parseInt(usuario_id) },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        rol_id: true,
        activo: true
      }
    });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (usuario.rol_id !== 2) {
      return res.status(400).json({ error: 'El usuario debe ser un residente (rol_id = 2)' });
    }
    
    if (!usuario.activo) {
      return res.status(400).json({ error: 'El usuario no está activo' });
    }
    
    // Crear notificación en la base de datos
    await prisma.$executeRaw`
      INSERT INTO notificaciones (
        usuario_id,
        titulo,
        mensaje,
        tipo,
        leido,
        creado_en
      ) VALUES (
        ${usuario.id},
        ${titulo},
        ${mensaje},
        ${tipo}::tipo_notificacion,
        false,
        NOW()
      )
    `;
    
    // Enviar email
    const emailResult = await sendNotificationEmail(
      usuario.correo,
      `${usuario.nombre} ${usuario.apellido}`,
      titulo,
      mensaje,
      tipo
    );
    
    res.json({
      success: true,
      message: 'Notificación enviada exitosamente',
      usuario: {
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        correo: usuario.correo
      },
      emailEnviado: emailResult.success
    });
    
  } catch (error) {
    console.error('Error al enviar notificación individual:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar notificación a todos los residentes
router.post('/enviar-masiva', async (req, res) => {
  try {
    const { titulo, mensaje, tipo } = req.body;
    
    // Validación
    if (!titulo || !mensaje || !tipo) {
      return res.status(400).json({ 
        error: 'Campos requeridos: titulo, mensaje, tipo' 
      });
    }
    
    // Obtener todos los residentes activos (rol_id = 2)
    const residentes = await prisma.usuarios.findMany({
      where: {
        rol_id: 2,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true
      }
    });
    
    if (residentes.length === 0) {
      return res.status(404).json({ 
        error: 'No hay residentes activos para enviar notificaciones' 
      });
    }
    
    let notificacionesCreadas = 0;
    let emailsEnviados = 0;
    const errores = [];
    
    // Crear notificación y enviar email para cada residente
    for (const residente of residentes) {
      try {
        // Crear notificación en BD
        await prisma.$executeRaw`
          INSERT INTO notificaciones (
            usuario_id,
            titulo,
            mensaje,
            tipo,
            leido,
            creado_en
          ) VALUES (
            ${residente.id},
            ${titulo},
            ${mensaje},
            ${tipo}::tipo_notificacion,
            false,
            NOW()
          )
        `;
        notificacionesCreadas++;
        
        // Enviar email
        const emailResult = await sendNotificationEmail(
          residente.correo,
          `${residente.nombre} ${residente.apellido}`,
          titulo,
          mensaje,
          tipo
        );
        
        if (emailResult.success) {
          emailsEnviados++;
        } else {
          errores.push({
            residente: `${residente.nombre} ${residente.apellido}`,
            error: emailResult.error
          });
        }
        
      } catch (error) {
        errores.push({
          residente: `${residente.nombre} ${residente.apellido}`,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Notificación masiva enviada',
      estadisticas: {
        totalResidentes: residentes.length,
        notificacionesCreadas,
        emailsEnviados,
        errores: errores.length
      },
      erroresDetalle: errores.length > 0 ? errores : undefined
    });
    
  } catch (error) {
    console.error('Error al enviar notificación masiva:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener residentes activos (para el selector)
router.get('/residentes', async (req, res) => {
  try {
    const residentes = await prisma.usuarios.findMany({
      where: {
        rol_id: 2,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    res.json(residentes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
