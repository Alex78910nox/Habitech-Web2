// Importar SDK de Brevo (igual que notificaciones.js)

import SibApiV3Sdk from '@sendinblue/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Configurar Brevo API
const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
const brevoApiKey = brevoApi.authentications['apiKey'];
brevoApiKey.apiKey = process.env.BREVO_API_KEY;


// Enviar solo correo HTML para pagos pendientes (sin PDF adjunto)
export async function enviarFacturaPago(datosPago) {
  try {
    console.log('📧 Enviando correo de factura de pago pendiente...');
    const {
      pago_id,
      residente_nombre,
      residente_apellido,
      residente_correo,
      departamento_numero,
      mes_pago,
      monto_mantenimiento,
      monto_total,
      fecha_vencimiento,
      descripcion,
      reservas = []
    } = datosPago;

    // Formatear fecha de vencimiento
    const fechaVencimientoObj = new Date(fecha_vencimiento);
    const fechaVencimientoFormato = fechaVencimientoObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calcular total de reservas
    const totalReservas = reservas.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0);
    const tieneReservas = reservas.length > 0;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a2744 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.95; font-size: 14px; }
        .badge { display: inline-block; background: #f59e0b; color: white; padding: 8px 20px; border-radius: 25px; font-size: 13px; font-weight: 600; margin-top: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
        .content { padding: 35px; }
        .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .invoice-number { font-size: 16px; color: #6b7280; }
        .invoice-number strong { color: #1f2937; font-size: 20px; }
        .client-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .client-info h3 { margin: 0 0 12px 0; color: #1f2937; font-size: 16px; }
        .client-info p { margin: 5px 0; color: #4b5563; font-size: 14px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .details-table th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .details-table td { padding: 15px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; }
        .details-table tr:last-child td { border-bottom: none; }
        .item-name { font-weight: 600; color: #1f2937; }
        .item-description { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .reserva-item { background: #fef3c7; padding: 12px; border-radius: 6px; margin: 8px 0; border-left: 4px solid #f59e0b; }
        .reserva-item-header { font-weight: 600; color: #92400e; margin-bottom: 4px; }
        .reserva-item-details { font-size: 13px; color: #78350f; }
        .subtotal-row { background: #f9fafb; }
        .total-row { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; font-size: 18px; font-weight: 700; }
        .total-row td { padding: 20px 12px !important; border: none !important; }
        .nota { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 8px; margin: 25px 0; color: #78350f; }
        .nota strong { color: #92400e; }
        .footer { background: #f9fafb; padding: 25px; text-align: center; color: #6b7280; font-size: 13px; }
        .footer p { margin: 5px 0; }
        .amount { text-align: right; font-weight: 600; color: #1f2937; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 HABITECH</h1>
          <p>Sistema de Gestión Residencial</p>
          <div class="badge">⏳ PENDIENTE DE PAGO</div>
        </div>

        <div class="content">
          <div class="invoice-header">
            <div class="invoice-number">
              Factura Nº <strong>#${String(pago_id).padStart(6, '0')}</strong>
            </div>
            <div style="text-align: right; color: #6b7280; font-size: 14px;">
              <div><strong>Fecha de Emisión:</strong></div>
              <div>${new Date().toLocaleDateString('es-ES')}</div>
              <div style="margin-top: 10px;"><strong>Vence:</strong></div>
              <div style="color: #ef4444; font-weight: 600;">${fechaVencimientoFormato}</div>
            </div>
          </div>

          <div class="client-info">
            <h3>📋 Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${residente_nombre} ${residente_apellido}</p>
            <p><strong>Departamento:</strong> ${departamento_numero}</p>
            <p><strong>Correo:</strong> ${residente_correo}</p>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 15px;">💰 Detalle del Pago</h3>
          
          <table class="details-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="item-name">🏠 Mantenimiento Mensual</div>
                  <div class="item-description">${mes_pago}</div>
                </td>
                <td class="amount">$${parseFloat(monto_mantenimiento).toFixed(2)}</td>
              </tr>
              
              ${tieneReservas ? `
              <tr>
                <td colspan="2" style="padding: 0;">
                  <div style="padding: 15px 12px;">
                    <div class="item-name" style="margin-bottom: 10px;">🏊 Reservas de Áreas Comunes</div>
                    ${reservas.map(reserva => `
                      <div class="reserva-item">
                        <div class="reserva-item-header">${reserva.area_nombre}</div>
                        <div class="reserva-item-details">
                          📅 ${new Date(reserva.fecha).toLocaleDateString('es-ES')} | 
                          🕐 ${reserva.hora_inicio} - ${reserva.hora_fin} | 
                          💵 $${parseFloat(reserva.monto).toFixed(2)}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>Subtotal Reservas (${reservas.length})</strong></td>
                <td class="amount">$${totalReservas.toFixed(2)}</td>
              </tr>
              ` : ''}
              
              <tr class="total-row">
                <td>TOTAL A PAGAR</td>
                <td style="text-align: right;">$${parseFloat(monto_total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="nota">
            <strong>⚠️ Importante:</strong> 
            Este pago está en estado <strong>PENDIENTE</strong>. 
            Por favor, realice el pago antes de la fecha de vencimiento para evitar recargos. 
            ${tieneReservas ? `Las reservas de áreas comunes quedarán confirmadas una vez realizado el pago.` : ''}
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
            Si tiene alguna pregunta o necesita más información, no dude en contactarnos.
          </p>
          <p style="color: #1f2937; margin-top: 15px;">
            Atentamente,<br>
            <strong>Equipo de Administración - Habitech</strong>
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0; font-weight: 600;">© ${new Date().getFullYear()} Habitech - Sistema de Gestión Residencial</p>
          <p style="margin: 5px 0 0 0;">Esta es una factura automática, por favor no responder a este correo.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Crear el objeto de email para Brevo SDK
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = `💰 Factura de Pago #${String(pago_id).padStart(6, '0')} - ${mes_pago}`;
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

    console.log('📤 Enviando factura de pago pendiente con Brevo SDK...');
    console.log(`📧 Para: ${residente_correo}`);
    console.log(`📋 Asunto: ${sendSmtpEmail.subject}`);

    // Enviar email usando el SDK
    const result = await brevoApi.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Factura de pago pendiente enviada exitosamente!');
    console.log(`✅ Email enviado a ${residente_correo} - MessageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('❌ Error al enviar factura de pago pendiente:', error.message);
    console.error('❌ Stack:', error.stack);
    // No lanzar error para que no falle la creación del pago
  }
}
