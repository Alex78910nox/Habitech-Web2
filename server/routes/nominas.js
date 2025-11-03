import express from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import SibApiV3Sdk from '@sendinblue/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar Brevo (Sendinblue)
const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
const brevoApiKey = brevoApi.authentications['apiKey'];
brevoApiKey.apiKey = process.env.BREVO_API_KEY;

// Función corregida para generar PDF de boleta de pago (1 sola página)
function generarBoletaPagoPDF(nomina, personal) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'letter', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const nombreMes = meses[parseInt(nomina.mes)] || 'Mes desconocido';

      // ==================== ENCABEZADO ====================
      doc.save();
      doc.rect(0, 0, doc.page.width, 140).fill('#1e40af');

      doc.fillColor('#ffffff')
        .fontSize(32)
        .font('Helvetica-Bold')
        .text('HABITECH', 50, 35);

      doc.fontSize(12)
        .font('Helvetica')
        .text('Sistema de Gestión de Edificios', 50, 75);

      doc.fontSize(10)
        .text('Av. Principal #123, La Paz, Bolivia', 50, 92)
        .text('Tel: +591 2 123456 | Email: info@habitech.com', 50, 107);

      doc.fontSize(22)
        .font('Helvetica-Bold')
        .text('BOLETA DE PAGO', doc.page.width - 280, 40, { width: 230, align: 'right' });

      doc.fontSize(11)
        .font('Helvetica')
        .text(`Nº ${String(nomina.id).padStart(6, '0')}`, doc.page.width - 280, 70, { width: 230, align: 'right' });

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(`Período: ${nombreMes} ${nomina.anio || nomina.año}`, doc.page.width - 280, 90, { width: 230, align: 'right' });

      if (nomina.fecha_pago) {
        const fechaPago = new Date(nomina.fecha_pago).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Fecha de Pago: ${fechaPago}`, doc.page.width - 280, 110, { width: 230, align: 'right' });
      }

      // ==================== DATOS DEL EMPLEADO ====================
      doc.restore();
      let y = 170;

      doc.fillColor('#000000')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('DATOS DEL EMPLEADO', 50, y);

      doc.roundedRect(50, y + 20, doc.page.width - 100, 100, 5)
        .fillAndStroke('#f0f9ff', '#bfdbfe');

      let infoY = y + 35;
      doc.fillColor('#000000')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Nombre Completo:', 65, infoY)
        .font('Helvetica')
        .text(`${personal.nombre} ${personal.apellido}`, 180, infoY)
        .font('Helvetica-Bold')
        .text('Cargo:', 65, infoY + 22)
        .font('Helvetica')
        .text(personal.cargo || 'N/A', 180, infoY + 22)
        .font('Helvetica-Bold')
        .text('Correo Electrónico:', 65, infoY + 44)
        .font('Helvetica')
        .text(personal.correo || 'N/A', 180, infoY + 44)
        .font('Helvetica-Bold')
        .text('ID Personal:', 65, infoY + 66)
        .font('Helvetica')
        .text(`EMP-${String(nomina.personal_id).padStart(4, '0')}`, 180, infoY + 66);

      // ==================== DETALLE DE CONCEPTOS ====================
      y = 315;
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('DETALLE DE CONCEPTOS', 50, y);

      y += 20;
      const col1X = 50;
      const col2X = 420;
      const rowHeight = 30;

      // Header tabla
      doc.roundedRect(col1X, y, doc.page.width - 100, rowHeight, 3)
        .fillAndStroke('#1e40af', '#1e40af');
      doc.fillColor('#ffffff')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('CONCEPTO', col1X + 15, y + 10)
        .text('MONTO (Bs)', col2X, y + 10, { width: 110, align: 'right' });
      y += rowHeight;

      // Filas dinámicas
      const filas = [
        { concepto: 'Salario Base del Mes', monto: parseFloat(nomina.salario_base), color: '#ffffff', borde: '#e5e7eb' },
      ];
      if (parseFloat(nomina.bonos || 0) > 0)
        filas.push({ concepto: '(+) Bonos e Incentivos', monto: parseFloat(nomina.bonos), color: '#d1fae5', borde: '#6ee7b7' });
      if (parseFloat(nomina.deducciones || 0) > 0)
        filas.push({ concepto: '(-) Deducciones y Descuentos', monto: -parseFloat(nomina.deducciones), color: '#fee2e2', borde: '#fca5a5' });

      filas.forEach(f => {
        doc.roundedRect(col1X, y, doc.page.width - 100, rowHeight, 3)
          .fillAndStroke(f.color, f.borde);
        doc.fillColor('#1f2937')
          .fontSize(10)
          .font('Helvetica')
          .text(f.concepto, col1X + 15, y + 10);
        doc.font('Helvetica-Bold')
          .text(f.monto.toFixed(2), col2X, y + 10, { width: 110, align: 'right' });
        y += rowHeight;
      });

      // Total
      y += 5;
      doc.roundedRect(col1X, y, doc.page.width - 100, rowHeight + 10, 5)
        .fillAndStroke('#1e3a8a', '#1e3a8a');
      doc.fillColor('#ffffff')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('TOTAL A PAGAR', col1X + 15, y + 14)
        .fontSize(18)
        .text(`Bs ${parseFloat(nomina.total_pagar).toFixed(2)}`, col2X - 30, y + 14, { width: 140, align: 'right' });
      y += rowHeight + 25;

      // ==================== INFORMACIÓN ADICIONAL ====================
      doc.fillColor('#000000')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Método de Pago:', 50, y)
        .font('Helvetica')
        .text(nomina.metodo_pago || 'Efectivo', 170, y);
      y += 20;

      doc.font('Helvetica-Bold')
        .text('Estado:', 50, y);
      doc.fillColor(nomina.estado === 'pagado' ? '#059669' : '#f59e0b')
        .font('Helvetica-Bold')
        .text(nomina.estado === 'pagado' ? '✓ PAGADO' : '⏳ PENDIENTE', 170, y);
      y += 25;

      // ==================== PIE DE PÁGINA ====================
      const footerMargin = 80;
      const footerY = Math.min(y + 40, doc.page.height - footerMargin);

      doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).stroke('#e5e7eb');

      doc.fontSize(7)
        .fillColor('#9ca3af')
        .font('Helvetica')
        .text(
          'Este documento es una boleta de pago oficial generada electrónicamente por el sistema HABITECH.',
          50,
          footerY + 10,
          { width: doc.page.width - 100, align: 'center' }
        )
        .text(
          'Tiene validez legal sin necesidad de firma autógrafa según normativa vigente.',
          50,
          footerY + 22,
          { width: doc.page.width - 100, align: 'center' }
        )
        .fillColor('#6b7280')
        .text(
          `Documento generado el ${new Date().toLocaleString('es-ES')} | ID: BOL-${nomina.id}-${Date.now()}`,
          50,
          footerY + 36,
          { width: doc.page.width - 100, align: 'center' }
        )
        .fillColor('#4b5563')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('Habitech © 2025 - Sistema de Gestión de Edificios', 50, footerY + 50, {
          width: doc.page.width - 100,
          align: 'center',
        })
        .fillColor('#9ca3af')
        .font('Helvetica')
        .fontSize(7)
        .text(
          `Código de Verificación: ${Buffer.from(
            `${nomina.id}-${nomina.personal_id}-${nomina.mes}-${nomina.anio}`
          )
            .toString('base64')
            .substring(0, 20)}`,
          50,
          footerY + 64,
          { width: doc.page.width - 100, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


// Función para enviar email con boleta de pago
async function enviarBoletaPagoEmail(personal, nomina, pdfBuffer) {
  try {
    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombreMes = meses[parseInt(nomina.mes)] || 'Mes desconocido';

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = `💰 Boleta de Pago - ${nombreMes} ${nomina.anio || nomina.año}`;
    sendSmtpEmail.htmlContent = `
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Encabezado -->
          <div style="background: linear-gradient(135deg, #1e40af, #1e3a8a); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">HABITECH</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Sistema de Gestión de Edificios</p>
          </div>

          <!-- Contenido -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0;">Hola ${personal.nombre},</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Tu nómina correspondiente al período de <strong>${nombreMes} ${nomina.anio || nomina.año}</strong> ha sido procesada exitosamente.
            </p>

            <!-- Tarjeta de resumen -->
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; border-radius: 12px; margin: 25px 0;">
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">TOTAL PAGADO</p>
                <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold;">Bs ${parseFloat(nomina.total_pagar).toFixed(2)}</p>
              </div>
            </div>

            <!-- Detalles -->
            <div style="background: #f8f9fa; border-left: 4px solid #1e40af; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">📋 Detalle de Pago</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Salario Base:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937;">Bs ${parseFloat(nomina.salario_base).toFixed(2)}</td>
                </tr>
                ${parseFloat(nomina.bonos || 0) > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #059669;">Bonos:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #059669;">+ Bs ${parseFloat(nomina.bonos).toFixed(2)}</td>
                </tr>
                ` : ''}
                ${parseFloat(nomina.deducciones || 0) > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #dc2626;">Deducciones:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">- Bs ${parseFloat(nomina.deducciones).toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0 0 0; color: #1f2937; font-weight: bold; font-size: 16px;">TOTAL:</td>
                  <td style="padding: 12px 0 0 0; text-align: right; font-weight: bold; color: #1e40af; font-size: 18px;">Bs ${parseFloat(nomina.total_pagar).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${nomina.observaciones && nomina.observaciones.trim() !== '' ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>📝 Observaciones:</strong></p>
              <p style="margin: 8px 0 0 0; color: #78350f;">${nomina.observaciones}</p>
            </div>
            ` : ''}

            <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #3730a3; font-size: 14px;">
                <strong>📎 Adjunto:</strong> Encontrarás tu boleta de pago oficial en formato PDF adjunta a este correo.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si tienes alguna consulta sobre tu pago, no dudes en contactar con el departamento de administración.
            </p>
          </div>

          <!-- Pie de página -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">Habitech © 2025 - Sistema de Gestión de Edificios</p>
            <p style="margin: 5px 0 0 0;">Esta es una notificación automática, por favor no responder a este correo.</p>
          </div>

        </div>
      </body>
      </html>
    `;

    sendSmtpEmail.sender = { 
      name: "Habitech - Nóminas", 
      email: process.env.BREVO_FROM_EMAIL 
    };
    
    sendSmtpEmail.to = [{ 
      email: personal.correo, 
      name: `${personal.nombre} ${personal.apellido}` 
    }];

    // Adjuntar PDF
    sendSmtpEmail.attachment = [{
      content: pdfBuffer.toString('base64'),
      name: `Boleta_${nombreMes}_${nomina.anio || nomina.año}_${personal.nombre}_${personal.apellido}.pdf`
    }];

    await brevoApi.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Boleta de pago enviada a ${personal.correo}`);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error al enviar email con boleta:', error);
    return { success: false, error: error.message };
  }
}

// GET - Obtener todas las nóminas
router.get('/', async (req, res) => {
  try {
    const { estado, mes } = req.query;
    
    console.log('🔍 Filtros recibidos en backend:', { estado, mes });
    
    const query = `
      SELECT 
        n.*,
        p.nombre,
        p.apellido,
        p.cargo,
        p.correo,
        TO_CHAR(n.fecha_pago, 'YYYY-MM-DD') as fecha_pago_formatted,
        TO_CHAR(n.creado_en, 'YYYY-MM-DD HH24:MI:SS') as creado_en_formatted
      FROM nominas n
      INNER JOIN personal_edificio p ON n.personal_id = p.id
      WHERE ($1::text IS NULL OR n.estado = $1)
        AND ($2::int IS NULL OR n.mes = $2)
      ORDER BY n.anio DESC, n.mes DESC, p.nombre ASC
    `;
    const estadoParam = estado || null;
    const mesParam = mes ? parseInt(mes) : null;
    
    const nominas = await prisma.$queryRawUnsafe(query, estadoParam, mesParam);

    console.log('✅ Nóminas encontradas:', nominas.length);
    
    res.json(nominas);
  } catch (error) {
    console.error('❌ Error al obtener nóminas:', error);
    res.status(500).json({ error: 'Error al obtener nóminas' });
  }
});

// GET - Obtener personal activo
router.get('/personal', async (req, res) => {
  try {
    const personal = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        nombre,
        apellido,
        cargo,
        correo,
        salario::numeric as salario,
        TO_CHAR(fecha_contratacion, 'YYYY-MM-DD') as fecha_contratacion
      FROM personal_edificio
      WHERE activo = true
      ORDER BY nombre, apellido
    `);

    res.json(personal);
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ error: 'Error al obtener personal' });
  }
});

// POST - Crear nómina individual
router.post('/', async (req, res) => {
  try {
    const { personal_id, mes, anio, salario_base, bonos = 0, deducciones = 0, observaciones = '' } = req.body;

    if (!personal_id || !mes || !anio || !salario_base) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: personal_id, mes, año, salario_base' 
      });
    }

    const total_pagar = parseFloat(salario_base) + parseFloat(bonos) - parseFloat(deducciones);

    const nomina = await prisma.$queryRawUnsafe(`
      INSERT INTO nominas (
        personal_id, mes, anio, salario_base, bonos, deducciones, 
        total_pagar, estado, observaciones, creado_en, actualizado_en
      ) VALUES (
        ${parseInt(personal_id)},
        ${parseInt(mes)},
        ${parseInt(anio)},
        ${parseFloat(salario_base)},
        ${parseFloat(bonos)},
        ${parseFloat(deducciones)},
        ${total_pagar},
        'pendiente',
        '${observaciones}',
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    console.log('✅ Nómina creada:', nomina[0]);
    res.status(201).json(nomina[0]);

  } catch (error) {
    if (error.message?.includes('duplicate key')) {
      return res.status(409).json({ 
        error: 'Ya existe una nómina para este empleado en el mes/año especificado' 
      });
    }
    console.error('Error al crear nómina:', error);
    res.status(500).json({ error: 'Error al crear nómina', details: error.message });
  }
});

// POST - Crear nóminas para todo el personal (masivo)
router.post('/crear-todos', async (req, res) => {
  try {
    const { mes, anio } = req.body;

    if (!mes || !anio || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mes o año inválido' });
    }

    const personal = await prisma.$queryRawUnsafe(`
      SELECT id, nombre, apellido, salario::numeric as salario, correo
      FROM personal_edificio
      WHERE activo = true
      ORDER BY nombre
    `);

    let creados = 0;
    const errores = [];

    for (const empleado of personal) {
      try {
        const existe = await prisma.$queryRawUnsafe(`
          SELECT id FROM nominas 
          WHERE personal_id = ${empleado.id} 
            AND mes = ${mes} 
            AND anio = ${anio}
          LIMIT 1
        `);

        if (existe && existe.length > 0) {
          console.log(`⚠️ Nómina ya existe para ${empleado.nombre} ${empleado.apellido}`);
          continue;
        }

        const salario = parseFloat(empleado.salario || 0);

        await prisma.$queryRawUnsafe(`
          INSERT INTO nominas (
            personal_id, mes, anio, salario_base, bonos, deducciones, 
            total_pagar, estado, creado_en, actualizado_en
          ) VALUES (
            ${empleado.id},
            ${mes},
            ${anio},
            ${salario},
            0.00,
            0.00,
            ${salario},
            'pendiente',
            NOW(),
            NOW()
          )
        `);

        creados++;
        console.log(`✅ Nómina creada para ${empleado.nombre} ${empleado.apellido}`);

      } catch (error) {
        errores.push({
          empleado: `${empleado.nombre} ${empleado.apellido}`,
          error: error.message
        });
        console.error(`Error al crear nómina para ${empleado.nombre}:`, error);
      }
    }

    console.log(`✅ Proceso completado: ${creados} nóminas creadas`);
    
    res.json({
      creados,
      total: personal.length,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('Error al crear nóminas masivas:', error);
    res.status(500).json({ error: 'Error al crear nóminas masivas', details: error.message });
  }
});

// PUT - Actualizar nómina (marcar como pagado y enviar boleta)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha_pago, metodo_pago, bonos, deducciones, observaciones } = req.body;

    // Obtener datos actuales de la nómina y personal
    const nominaActual = await prisma.$queryRawUnsafe(`
      SELECT n.*, p.nombre, p.apellido, p.cargo, p.correo
      FROM nominas n
      INNER JOIN personal_edificio p ON n.personal_id = p.id
      WHERE n.id = ${parseInt(id)}
    `);

    if (!nominaActual || nominaActual.length === 0) {
      return res.status(404).json({ error: 'Nómina no encontrada' });
    }

    const nominaAnterior = nominaActual[0];
    const personal = {
      nombre: nominaAnterior.nombre,
      apellido: nominaAnterior.apellido,
      cargo: nominaAnterior.cargo,
      correo: nominaAnterior.correo
    };

    let updates = [];
    
    if (estado) updates.push(`estado = '${estado}'`);
    if (fecha_pago) updates.push(`fecha_pago = '${fecha_pago}'`);
    if (metodo_pago) updates.push(`metodo_pago = '${metodo_pago}'`);
    if (bonos !== undefined) updates.push(`bonos = ${parseFloat(bonos)}`);
    if (deducciones !== undefined) updates.push(`deducciones = ${parseFloat(deducciones)}`);
    if (observaciones !== undefined) updates.push(`observaciones = '${observaciones}'`);
    
    updates.push('actualizado_en = NOW()');

    // Recalcular total si cambian bonos o deducciones
    if (bonos !== undefined || deducciones !== undefined) {
      const nuevoTotal = parseFloat(nominaAnterior.salario_base) + 
                        parseFloat(bonos !== undefined ? bonos : nominaAnterior.bonos) - 
                        parseFloat(deducciones !== undefined ? deducciones : nominaAnterior.deducciones);
      updates.push(`total_pagar = ${nuevoTotal}`);
    }

    const query = `
      UPDATE nominas 
      SET ${updates.join(', ')}
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    const nominaActualizada = await prisma.$queryRawUnsafe(query);
    const nomina = nominaActualizada[0];

    console.log('✅ Nómina actualizada:', nomina);

    // Si se marcó como pagado, generar y enviar boleta
    if (estado === 'pagado' && personal.correo) {
      try {
        console.log('📄 Generando boleta de pago PDF...');
        
        // Generar PDF
        const pdfBuffer = await generarBoletaPagoPDF(nomina, personal);
        
        console.log('✅ PDF generado exitosamente');
        console.log('📧 Enviando boleta por correo...');
        
        // Enviar por email al empleado
        await enviarBoletaPagoEmail(personal, nomina, pdfBuffer);
        
        console.log('✅ Boleta enviada exitosamente al empleado');
        
        // Devolver el PDF al frontend para descarga automática
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Boleta_${personal.nombre}_${personal.apellido}_${nomina.mes}_${nomina.anio}.pdf"`);
        return res.send(pdfBuffer);
        
      } catch (emailError) {
        console.error('⚠️ Error al generar/enviar boleta:', emailError);
        // Si falla el email, devolver el PDF de todas formas
        try {
          const pdfBuffer = await generarBoletaPagoPDF(nomina, personal);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="Boleta_${personal.nombre}_${personal.apellido}_${nomina.mes}_${nomina.anio}.pdf"`);
          return res.send(pdfBuffer);
        } catch (pdfError) {
          // Si todo falla, devolver JSON con warning
          return res.json({
            ...nomina,
            warning: 'Nómina actualizada pero hubo un error al generar la boleta'
          });
        }
      }
    } else {
      // Si no se marca como pagado, solo devolver JSON
      res.json(nomina);
    }

  } catch (error) {
    console.error('Error al actualizar nómina:', error);
    res.status(500).json({ error: 'Error al actualizar nómina', details: error.message });
  }
});

// DELETE - Eliminar nómina
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$executeRawUnsafe(`DELETE FROM nominas WHERE id = ${parseInt(id)}`);

    console.log('✅ Nómina eliminada:', id);
    res.json({ message: 'Nómina eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar nómina:', error);
    res.status(500).json({ error: 'Error al eliminar nómina', details: error.message });
  }
});

// Al final de tu archivo nominas.js (o donde corresponda)
router.get('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  // Busca la nómina y el personal
  const nomina = await prisma.nomina.findUnique({ where: { id: Number(id) } });
  const personal = await prisma.personal.findUnique({ where: { id: nomina.personal_id } });
  if (!nomina || !personal) return res.status(404).send('No encontrada');

  // Genera el PDF
  const pdfBuffer = await generarBoletaPagoPDF(nomina, personal); // Asegúrate que esta función devuelva un buffer

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Boleta_${nomina.id}.pdf`);
  res.send(pdfBuffer);
});

export default router;