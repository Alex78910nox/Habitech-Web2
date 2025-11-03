import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generarFacturaPendientePDF(datosPago) {
  return new Promise((resolve, reject) => {
    try {
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

      // Crear directorio temporal si no existe
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const fileName = `factura_pendiente_${pago_id}_${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);

      // Crear documento PDF
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Pipe el PDF a un archivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Colores
      const primaryColor = '#6366f1';
      const darkGray = '#1f2937';
      const mediumGray = '#6b7280';
      const lightGray = '#e5e7eb';
      const warningOrange = '#f59e0b';
      const warningRed = '#ef4444';

      // HEADER - Logo y título
      doc.fontSize(28)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('HABITECH', 50, 50);

      doc.fontSize(10)
         .fillColor(mediumGray)
         .font('Helvetica')
         .text('Sistema de Gestión Residencial', 50, 85);

      // Badge de PENDIENTE
      doc.rect(420, 50, 130, 30)
         .fillAndStroke(warningOrange, warningOrange);
      
      doc.fontSize(11)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('PENDIENTE DE PAGO', 420, 60, { width: 130, align: 'center' });

      // Línea separadora
      doc.moveTo(50, 110)
         .lineTo(562, 110)
         .strokeColor(lightGray)
         .lineWidth(2)
         .stroke();

      // INFORMACIÓN DE FACTURA
      doc.fontSize(11)
         .fillColor(mediumGray)
         .font('Helvetica')
         .text('Factura No:', 50, 130);

      doc.fontSize(16)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text(`#${String(pago_id).padStart(6, '0')}`, 50, 145);

      // Formatear fecha de vencimiento
      const fechaVencimientoObj = new Date(fecha_vencimiento);
      const fechaVencimientoFormato = fechaVencimientoObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const fechaEmision = new Date().toLocaleDateString('es-ES');

      // Fecha de emisión (derecha)
      doc.fontSize(11)
         .fillColor(mediumGray)
         .font('Helvetica')
         .text('Fecha de Emisión:', 400, 130);

      doc.fontSize(12)
         .fillColor(darkGray)
         .font('Helvetica')
         .text(fechaEmision, 400, 145);

      // Fecha de vencimiento
      doc.fontSize(11)
         .fillColor(mediumGray)
         .font('Helvetica')
         .text('Vence:', 400, 170);

      doc.fontSize(12)
         .fillColor(warningRed)
         .font('Helvetica-Bold')
         .text(fechaVencimientoFormato, 400, 185, { width: 150, align: 'left' });

      // INFORMACIÓN DEL CLIENTE
      let yPos = 220;

      // Fondo gris claro para info del cliente
      doc.rect(50, yPos, 512, 80)
         .fillColor('#f9fafb')
         .fill();

      yPos += 15;

      doc.fontSize(12)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN DEL CLIENTE', 60, yPos);

      yPos += 20;

      doc.fontSize(11)
         .fillColor(mediumGray)
         .font('Helvetica')
         .text('Nombre:', 60, yPos);

      doc.fillColor(darkGray)
         .font('Helvetica')
         .text(`${residente_nombre} ${residente_apellido}`, 150, yPos);

      yPos += 18;

      doc.fillColor(mediumGray)
         .text('Departamento:', 60, yPos);

      doc.fillColor(darkGray)
         .text(departamento_numero, 150, yPos);

      yPos += 18;

      doc.fillColor(mediumGray)
         .text('Correo:', 60, yPos);

      doc.fillColor(darkGray)
         .text(residente_correo, 150, yPos);

      // DETALLE DEL PAGO
      yPos = 340;

      doc.fontSize(12)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text('DETALLE DEL PAGO', 50, yPos);

      yPos += 25;

      // Tabla header
      const tableTop = yPos;
      const col1X = 50;
      const col2X = 450;

      // Header background
      doc.rect(col1X, tableTop, 512, 25)
         .fillColor('#f3f4f6')
         .fill();

      doc.fontSize(10)
         .fillColor(mediumGray)
         .font('Helvetica-Bold')
         .text('CONCEPTO', col1X + 10, tableTop + 8);

      doc.text('MONTO', col2X + 10, tableTop + 8, { width: 100, align: 'right' });

      yPos = tableTop + 30;

      // Calcular totales
      const totalReservas = reservas.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0);
      const tieneReservas = reservas.length > 0;

      // Línea de separación
      doc.moveTo(col1X, tableTop + 25)
         .lineTo(562, tableTop + 25)
         .strokeColor(lightGray)
         .lineWidth(1)
         .stroke();

      // Mantenimiento mensual
      doc.fontSize(11)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text('Mantenimiento Mensual', col1X + 10, yPos);

      yPos += 15;

      doc.fontSize(9)
         .fillColor(mediumGray)
         .font('Helvetica')
         .text(mes_pago, col1X + 10, yPos, { width: 350 });

      doc.fontSize(11)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text(`$${parseFloat(monto_mantenimiento).toFixed(2)}`, col2X + 10, yPos - 15, { width: 100, align: 'right' });

      yPos += 30;

      // Línea separadora
      doc.moveTo(col1X, yPos)
         .lineTo(562, yPos)
         .strokeColor(lightGray)
         .lineWidth(0.5)
         .stroke();

      yPos += 15;

      // Reservas
      if (tieneReservas) {
        doc.fontSize(11)
           .fillColor(darkGray)
           .font('Helvetica-Bold')
           .text('Reservas de Áreas Comunes', col1X + 10, yPos);

        yPos += 20;

        reservas.forEach((reserva, index) => {
          // Fondo amarillo claro para cada reserva
          doc.rect(col1X + 10, yPos, 492, 40)
             .fillColor('#fef3c7')
             .fill();

          doc.fontSize(10)
             .fillColor('#92400e')
             .font('Helvetica-Bold')
             .text(reserva.area_nombre, col1X + 20, yPos + 8);

          const fechaReserva = new Date(reserva.fecha).toLocaleDateString('es-ES');
          
          doc.fontSize(9)
             .fillColor('#78350f')
             .font('Helvetica')
             .text(`${fechaReserva} | ${reserva.hora_inicio} - ${reserva.hora_fin}`, 
                    col1X + 20, yPos + 24);

          doc.fontSize(10)
             .fillColor('#92400e')
             .font('Helvetica-Bold')
             .text(`$${parseFloat(reserva.monto).toFixed(2)}`, 
                    col2X + 10, yPos + 15, { width: 80, align: 'right' });

          yPos += 48;
        });

        // Subtotal reservas
        doc.rect(col1X, yPos, 512, 25)
           .fillColor('#f9fafb')
           .fill();

        doc.fontSize(11)
           .fillColor(darkGray)
           .font('Helvetica-Bold')
           .text(`Subtotal Reservas (${reservas.length})`, col1X + 10, yPos + 8);

        doc.text(`$${totalReservas.toFixed(2)}`, col2X + 10, yPos + 8, { width: 100, align: 'right' });

        yPos += 30;
      }

      // TOTAL
      doc.rect(col1X, yPos, 512, 35)
         .fillAndStroke(primaryColor, primaryColor);

      doc.fontSize(14)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('TOTAL A PAGAR', col1X + 10, yPos + 10);

      doc.fontSize(16)
         .text(`$${parseFloat(monto_total).toFixed(2)}`, col2X + 10, yPos + 10, { width: 100, align: 'right' });

      // NOTA IMPORTANTE
      yPos += 60;

      doc.rect(col1X, yPos, 512, 70)
         .fillColor('#fef3c7')
         .fill();

      doc.moveTo(col1X, yPos)
         .lineTo(col1X, yPos + 70)
         .strokeColor(warningOrange)
         .lineWidth(4)
         .stroke();

      doc.fontSize(10)
         .fillColor('#92400e')
         .font('Helvetica-Bold')
         .text('IMPORTANTE:', col1X + 15, yPos + 12);

      doc.font('Helvetica')
         .fillColor('#78350f')
         .text(
           `Este pago está en estado PENDIENTE. Por favor, realice el pago antes de la fecha de vencimiento para evitar recargos. ${tieneReservas ? `Las reservas de áreas comunes quedarán confirmadas una vez realizado el pago.` : ''}`,
           col1X + 15,
           yPos + 28,
           { width: 480, align: 'left', lineGap: 3 }
         );

      // FOOTER
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 80;

      doc.fontSize(9)
         .fillColor(mediumGray)
         .font('Helvetica')
         .text(
           'Si tiene alguna pregunta o necesita más información, no dude en contactarnos.',
           50,
           footerY,
           { width: 512, align: 'center' }
         );

      doc.fontSize(10)
         .fillColor(darkGray)
         .font('Helvetica')
         .text(
           'Atentamente,',
           50,
           footerY + 20,
           { width: 512, align: 'center' }
         );

      doc.font('Helvetica-Bold')
         .text(
           'Equipo de Administración - Habitech',
           50,
           footerY + 35,
           { width: 512, align: 'center' }
         );

      // Línea final
      doc.moveTo(50, pageHeight - 35)
         .lineTo(562, pageHeight - 35)
         .strokeColor(lightGray)
         .lineWidth(1)
         .stroke();

      doc.fontSize(8)
         .fillColor(mediumGray)
         .font('Helvetica-Bold')
         .text(
           `© ${new Date().getFullYear()} Habitech - Sistema de Gestión Residencial`,
           50,
           pageHeight - 25,
           { width: 512, align: 'center' }
         );

      // Finalizar el PDF
      doc.end();

      // Esperar a que termine de escribirse
      stream.on('finish', () => {
        console.log('✅ PDF de factura pendiente generado exitosamente:', filePath);
        resolve(filePath);
      });

      stream.on('error', (error) => {
        console.error('❌ Error al escribir PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      reject(error);
    }
  });
}
