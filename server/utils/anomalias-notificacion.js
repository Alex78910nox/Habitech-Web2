import { PrismaClient } from '@prisma/client';
import SibApiV3Sdk from '@sendinblue/client';

const prisma = new PrismaClient();
const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
brevoApi.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

export async function createAnomaliaNotificationBackend(departamentoId, datosAnomalia, departamentoNumero) {
  try {
    // Obtener residentes del departamento
    const residentes = await prisma.$queryRaw`
      SELECT r.id, u.nombre, u.apellido, u.correo, u.id as usuario_id
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.departamento_id = ${departamentoId} AND r.activo = true
    `;

    // Crear notificación y enviar email a cada residente
    for (const residente of residentes) {
      await prisma.$queryRaw`
        INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, creado_en)
        VALUES (
          ${residente.usuario_id},
          '⚠️ Anomalía detectada en Departamento ${departamentoNumero}',
          'Se ha detectado una anomalía en el consumo de ${datosAnomalia.tipo} en tu departamento. Descripción: ${datosAnomalia.descripcion}',
          'sistema',
          NOW()
        )
      `;
      // Enviar email
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = `⚠️ Anomalía detectada en Departamento ${departamentoNumero}`;
      sendSmtpEmail.htmlContent = `
        <html><body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
          <div style="max-width:600px;margin:40px auto;background:white;border-radius:12px;box-shadow:0 2px 16px #0002;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc3545,#c82333);color:white;padding:30px;text-align:center;">
              <h1 style="margin:0;font-size:2rem;">⚠️ Anomalía Detectada</h1>
              <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:5px 15px;border-radius:20px;font-size:14px;margin-top:10px;">Departamento ${departamentoNumero}</span>
            </div>
            <div style="padding:36px 30px;">
              <h2 style="color:#dc3545;margin-top:0;">Hola ${residente.nombre} ${residente.apellido},</h2>
              <p style="color:#666;line-height:1.7;font-size:1.1rem;">Se ha detectado una anomalía en el consumo de <b>${datosAnomalia.tipo}</b> en tu departamento que requiere atención inmediata.</p>
              <div style="background:#fff3cd;border:1px solid #ffeaa7;border-radius:8px;padding:24px;margin:24px 0;">
                <h3 style="color:#856404;margin-top:0;margin-bottom:12px;">📋 Detalles de la Anomalía</h3>
                <table style="width:100%;border-collapse:collapse;font-size:1rem;">
                  <tr><td style="padding:8px 0;font-weight:bold;color:#495057;width:140px;">Tipo:</td><td style="padding:8px 0;color:#6c757d;text-transform:capitalize;">${datosAnomalia.tipo}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#495057;">Descripción:</td><td style="padding:8px 0;color:#6c757d;">${datosAnomalia.descripcion}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#495057;">Valor Observado:</td><td style="padding:8px 0;color:#dc3545;font-weight:bold;">${datosAnomalia.valor_observado}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#495057;">Valor Esperado:</td><td style="padding:8px 0;color:#28a745;font-weight:bold;">${datosAnomalia.valor_esperado}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#495057;">Severidad:</td><td style="padding:8px 0;"><span style="background:${datosAnomalia.severidad==='alta'?'#dc3545':datosAnomalia.severidad==='media'?'#ffc107':'#28a745'};color:white;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:bold;text-transform:uppercase;">${datosAnomalia.severidad}</span></td></tr>
                  <tr><td style="padding:8px 0;font-weight:bold;color:#495057;">Fecha:</td><td style="padding:8px 0;color:#6c757d;">${datosAnomalia.fecha}</td></tr>
                </table>
              </div>
              <div style="background:#e3f2fd;border-left:4px solid #2196f3;padding:18px;margin:24px 0;border-radius:8px;">
                <p style="margin:0;color:#1976d2;font-weight:bold;font-size:1rem;">📞 Contacta con la administración si tienes preguntas sobre esta anomalía.</p>
              </div>
              <p style="color:#666;font-size:14px;margin-top:36px;">Este es un mensaje automático del sistema Habitech. Por favor, no respondas a este email.</p>
            </div>
          </div>
        </body></html>
      `;
      sendSmtpEmail.sender = { name: "Habitech", email: process.env.BREVO_FROM_EMAIL };
      sendSmtpEmail.to = [{ email: residente.correo, name: `${residente.nombre} ${residente.apellido}` }];
      try {
        await brevoApi.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Email de anomalía enviado a:', residente.correo);
      } catch (error) {
        console.error('❌ Error al enviar email de anomalía:', error);
      }
    }
    return { success: true, residentesNotificados: residentes.length };
  } catch (error) {
    console.error('❌ Error en createAnomaliaNotificationBackend:', error);
    return { success: false, error: error.message };
  }
}
