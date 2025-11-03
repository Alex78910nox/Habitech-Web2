
import PDFDocument from 'pdfkit';

export async function generarFacturaPDF(datosPago) {
  const {
    pago_id,
    residente_nombre,
    residente_apellido,
    residente_correo,
    departamento_numero,
    tipo_pago,
    monto_total,
    fecha_pago,
    metodo_pago,
    descripcion,
    reservas = [],
    mes_pago // Nuevo campo para el mes de mantenimiento
  } = datosPago;

  // Calcular totales
  const totalReservas = reservas.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0);
  const tieneReservas = reservas.length > 0;
  const montoMantenimiento = tieneReservas ? monto_total - totalReservas : monto_total;




  // Crear PDF en buffer
  const doc = new PDFDocument({ margin: 40 });
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // Encabezado con fondo azul oscuro y logo sobre recuadro blanco
  const azulOscuro = '#1a2744';
  doc.rect(0, 0, doc.page.width, 70).fill(azulOscuro);
  try {
    // Logo sin fondo blanco
    doc.image('logo.png', doc.page.width - 108, 12, { width: 46, height: 46 });
  } catch (e) {
    // Si no se encuentra el logo, no falla el PDF
  }
  doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('HABITECH', 40, 22, { align: 'left' });
  doc.fontSize(12).font('Helvetica').text('Sistema de Gestión Residencial', 40, 48, { align: 'left' });
  doc.moveDown(2.5);


  // Recibo y datos principales
  doc.moveDown(0.5);
  doc.fillColor('#222').fontSize(16).font('Helvetica-Bold').text(`Recibo Nº #${String(pago_id).padStart(6, '0')}`);
  doc.fontSize(10).font('Helvetica').text(`Fecha de pago: ${new Date(fecha_pago).toLocaleDateString('es-ES')}`);
  doc.fontSize(10).text(`Método de pago: ${metodo_pago}`);
  if (mes_pago) {
    doc.fontSize(10).text(`Mantenimiento correspondiente a: ${mes_pago}`);
  }
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke(azulOscuro);
  doc.moveDown(0.7);


  // Cliente
  doc.fontSize(12).fillColor(azulOscuro).font('Helvetica-Bold').text('Información del Cliente:');
  doc.fontSize(10).fillColor('#222').font('Helvetica').text(`Nombre: ${residente_nombre} ${residente_apellido}`);
  doc.fontSize(10).text(`Departamento: ${departamento_numero}`);
  doc.fontSize(10).text(`Correo: ${residente_correo}`);
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#e5e7eb');
  doc.moveDown(0.7);


  // Detalle del pago
  doc.fontSize(12).fillColor(azulOscuro).font('Helvetica-Bold').text('Detalle del Pago:');
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor('#222').font('Helvetica');
  if ((tipo_pago === 'mantenimiento' || tipo_pago === 'reservas') && montoMantenimiento > 0) {
    if (mes_pago) {
      doc.text(`Mantenimiento mensual de ${mes_pago}: $${montoMantenimiento.toFixed(2)}`);
    } else {
      doc.text(`Mantenimiento mensual: $${montoMantenimiento.toFixed(2)}`);
    }
  }
  if (tieneReservas) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Reservas de Áreas Comunes:');
    // Tabla de reservas
    doc.font('Helvetica').moveDown(0.2);
    const startX = 60;
    let y = doc.y;
    doc.fontSize(9).fillColor('#222');
    // Encabezado tabla
  doc.rect(startX - 2, y - 2, 290, 16).fill('#e5e7eb');
  doc.fillColor(azulOscuro).font('Helvetica-Bold').text('Área', startX, y, { continued: true });
  doc.text('Fecha', startX + 80, y, { continued: true });
  doc.text('Horario', startX + 150, y, { continued: true });
  doc.text('Monto', startX + 230, y);
    doc.fillColor('#222').font('Helvetica');
    reservas.forEach((reserva) => {
      y = doc.y + 2;
      doc.text(reserva.area_nombre, startX, y, { continued: true });
      doc.text(new Date(reserva.fecha).toLocaleDateString('es-ES'), startX + 80, y, { continued: true });
      doc.text(`${reserva.hora_inicio} - ${reserva.hora_fin}`, startX + 150, y, { continued: true });
      doc.text(`$${parseFloat(reserva.monto).toFixed(2)}`, startX + 230, y);
    });
    doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fillColor(azulOscuro).text(`Subtotal Reservas (${reservas.length}): $${totalReservas.toFixed(2)}`);
  }
  if (!(tipo_pago === 'mantenimiento' || tipo_pago === 'reservas')) {
    doc.font('Helvetica').text(`${descripcion}: $${parseFloat(monto_total).toFixed(2)}`);
  }
  doc.moveDown(0.5);
  // Total pagado con fondo gris claro y texto azul oscuro
  const totalY = doc.y;
  doc.rect(40, totalY, 220, 26).fill('#f3f4f6');
  doc.fillColor(azulOscuro).fontSize(13).font('Helvetica-Bold').text(`TOTAL PAGADO: $${parseFloat(monto_total).toFixed(2)}`, 50, totalY + 7);
  doc.moveDown(2);

  // Nota
  doc.fontSize(9).fillColor('#222').font('Helvetica').text('Su pago ha sido recibido y procesado exitosamente. Conserve este recibo como comprobante de pago.');
  if (tieneReservas) {
    doc.fontSize(9).text(`Sus ${reservas.length} reserva${reservas.length > 1 ? 's' : ''} de áreas comunes han sido confirmadas.`);
  }
  doc.moveDown(1);
  doc.fontSize(9).fillColor('#888').text('Este es un comprobante de pago automático, por favor no responder a este correo.', { align: 'center' });
  doc.end();

  // Esperar a que el PDF se escriba en buffer
  await new Promise((resolve) => doc.on('end', resolve));
  const buffer = Buffer.concat(buffers);
  const fileName = `recibo_pago_${String(pago_id).padStart(6, '0')}.pdf`;
  return { buffer, fileName };
}
