// Importar SDK de Brevo (igual que notificaciones.js)
import SibApiV3Sdk from '@sendinblue/client';

// Configurar Brevo API
const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
const brevoApiKey = brevoApi.authentications['apiKey'];
brevoApiKey.apiKey = process.env.BREVO_API_KEY;

export async function enviarFacturaReserva(reserva) {
  try {
    console.log('📧 Iniciando envío de factura por email...');
    console.log('📋 Datos de reserva:', JSON.stringify(reserva, null, 2));
    
    const { 
      residente_nombre, 
      residente_apellido, 
      residente_correo,
      departamento_numero,
      area_nombre,
      fecha_reserva,
      hora_inicio,
      hora_fin,
      monto_pago,
      estado,
      id
    } = reserva;

    console.log(`📧 Email destino: ${residente_correo}`);
    
    // Formatear fecha
    const fecha = new Date(fecha_reserva);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calcular duración
    const [horaInicioH, horaInicioM] = hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = hora_fin.split(':').map(Number);
    const minutosTotales = (horaFinH * 60 + horaFinM) - (horaInicioH * 60 + horaInicioM);
    const horas = (minutosTotales / 60).toFixed(1);

    const estadoTexto = estado === 'pendiente' ? 'PENDIENTE DE PAGO' : 'CONFIRMADA';
    const estadoColor = estado === 'pendiente' ? '#f59e0b' : '#10b981';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-left: 3px solid #667eea;
          border-right: 3px solid #667eea;
        }
        .factura-box {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin: 20px 0;
        }
        .factura-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .factura-numero {
          font-size: 14px;
          color: #6b7280;
        }
        .estado-badge {
          background: ${estadoColor};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #4b5563;
        }
        .info-value {
          color: #1f2937;
        }
        .total-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-top: 20px;
        }
        .total-label {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .total-amount {
          font-size: 36px;
          font-weight: bold;
          margin: 0;
        }
        .nota {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin-top: 20px;
          border-radius: 4px;
        }
        .footer {
          background: #1f2937;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏢 HABITECH</h1>
        <p style="margin: 10px 0 0 0;">Factura de Reserva de Área Común</p>
      </div>

      <div class="content">
        <p>Estimado/a <strong>${residente_nombre} ${residente_apellido}</strong>,</p>
        <p>Se ha registrado exitosamente su reserva del área común <strong>${area_nombre}</strong>.</p>

        <div class="factura-box">
          <div class="factura-header">
            <div class="factura-numero">Factura #${String(id).padStart(6, '0')}</div>
            <div class="estado-badge">${estadoTexto}</div>
          </div>

          <div class="info-row">
            <span class="info-label">👤 Cliente:</span>
            <span class="info-value">${residente_nombre} ${residente_apellido}</span>
          </div>

          <div class="info-row">
            <span class="info-label">🏠 Departamento:</span>
            <span class="info-value">${departamento_numero}</span>
          </div>

          <div class="info-row">
            <span class="info-label">🏊 Área Común:</span>
            <span class="info-value">${area_nombre}</span>
          </div>

          <div class="info-row">
            <span class="info-label">📅 Fecha:</span>
            <span class="info-value">${fechaFormateada}</span>
          </div>

          <div class="info-row">
            <span class="info-label">⏰ Horario:</span>
            <span class="info-value">${hora_inicio} - ${hora_fin}</span>
          </div>

          <div class="info-row">
            <span class="info-label">⏱️ Duración:</span>
            <span class="info-value">${horas} hora(s)</span>
          </div>
        </div>

        <div class="total-box">
          <div class="total-label">TOTAL A PAGAR</div>
          <div class="total-amount">$${parseFloat(monto_pago).toFixed(2)}</div>
        </div>

        ${monto_pago > 0 ? `
        <div class="nota">
          <strong>⚠️ Importante:</strong> Su reserva está en estado <strong>PENDIENTE DE PAGO</strong>. 
          Por favor, realice el pago correspondiente para confirmar su reserva. Una vez confirmado el pago, 
          su reserva será activada automáticamente.
        </div>
        ` : `
        <div class="nota" style="background: #d1fae5; border-color: #10b981;">
          <strong>✅ Confirmado:</strong> Esta área común es de uso gratuito. Su reserva ha sido confirmada automáticamente.
        </div>
        `}

        <p style="margin-top: 30px;">Si tiene alguna pregunta o necesita modificar su reserva, no dude en contactarnos.</p>
        <p>Atentamente,<br><strong>Equipo de Administración - Habitech</strong></p>
      </div>

      <div class="footer">
        <p style="margin: 0;">© ${new Date().getFullYear()} Habitech - Sistema de Gestión Residencial</p>
        <p style="margin: 5px 0 0 0;">Este es un correo automático, por favor no responder.</p>
      </div>
    </body>
    </html>
    `;

    // Crear el objeto de email para Brevo SDK
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = `Factura de Reserva #${String(id).padStart(6, '0')} - ${area_nombre}`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { 
      name: "Habitech - Administración", 
      email: process.env.BREVO_FROM_EMAIL || 'noreply@habitech.com'
    };
    sendSmtpEmail.to = [
      { 
        email: residente_correo, 
        name: `${residente_nombre} ${residente_apellido}` 
      }
    ];

    console.log('📤 Enviando email con Brevo SDK...');
    console.log(`📧 Para: ${residente_correo}`);
    console.log(`📋 Asunto: ${sendSmtpEmail.subject}`);

    // Enviar email usando el SDK
    const result = await brevoApi.sendTransacEmail(sendSmtpEmail);

    console.log('✅ Email enviado exitosamente!');
    console.log(`✅ Factura enviada a ${residente_correo} - MessageId: ${result.messageId}`);
    return result;

  } catch (error) {
    console.error('❌ Error al enviar factura:', error.message);
    console.error('❌ Stack:', error.stack);
    throw error;
  }
}
