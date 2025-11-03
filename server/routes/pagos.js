import express from 'express';
import { PrismaClient } from '@prisma/client';
import { enviarFacturaPago } from '../utils/emailFacturaPago.js';
import Stripe from 'stripe';

const router = express.Router();
const prisma = new PrismaClient();

// Debug: todas las variables de entorno disponibles
console.log('� Variables de entorno disponibles:');
console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
console.log('BREVO_API_KEY existe:', !!process.env.BREVO_API_KEY);
console.log('STRIPE_SECRET_KEY existe:', !!process.env.STRIPE_SECRET_KEY);
console.log('Todas las keys que empiezan con STRIPE:', Object.keys(process.env).filter(k => k.startsWith('STRIPE')));

// Inicializar Stripe - hardcodeado temporalmente para debug
const stripeKey = process.env.STRIPE_SECRET_KEY;

console.log('🔑 Usando Stripe key (primeros 20 chars):', stripeKey.substring(0, 20));

const stripe = new Stripe(stripeKey);
console.log('✅ Stripe inicializado correctamente');

// GET - Obtener todos los pagos
router.get('/', async (req, res) => {
  try {
    const pagos = await prisma.$queryRawUnsafe(`
      SELECT 
        p.id,
        p.departamento_id,
        p.residente_id,
        p.tipo_pago,
        p.monto,
        p.descripcion,
        p.estado,
        p.metodo_pago,
        p.id_transaccion,
        p.recargo,
        p.url_recibo,
        p.procesado_por,
        p.reservas_ids,
        r.id as residente_id_ref,
        u.nombre as residente_nombre,
        u.apellido as residente_apellido,
        d.numero as departamento_numero,
        TO_CHAR(p.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento,
        TO_CHAR(p.fecha_pago, 'YYYY-MM-DD') as fecha_pago,
        TO_CHAR(p.creado_en, 'YYYY-MM-DD HH24:MI:SS') as creado_en
      FROM pagos p
      INNER JOIN residentes r ON p.residente_id = r.id
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON p.departamento_id = d.id
      ORDER BY p.creado_en DESC
    `);

    console.log('📋 Pagos encontrados:', pagos.length);
    res.json(Array.isArray(pagos) ? pagos : []);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

// GET - Obtener pagos por residente
router.get('/residente/:residenteId', async (req, res) => {
  try {
    const { residenteId } = req.params;

    const pagos = await prisma.$queryRawUnsafe(`
      SELECT 
        p.*,
        d.numero as departamento_numero,
        TO_CHAR(p.fecha_vencimiento, 'YYYY-MM-DD') as fecha_vencimiento,
        TO_CHAR(p.fecha_pago, 'YYYY-MM-DD') as fecha_pago
      FROM pagos p
      INNER JOIN departamentos d ON p.departamento_id = d.id
      WHERE p.residente_id = ${parseInt(residenteId)}
      ORDER BY p.fecha_vencimiento DESC
    `);

    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos del residente:', error);
    res.status(500).json({ error: 'Error al obtener pagos del residente' });
  }
});

// GET - Resumen financiero
router.get('/resumen', async (req, res) => {
  try {
    const mesActual = new Date();
    const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);

    const resumen = await prisma.$queryRawUnsafe(`
      SELECT 
        COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0) as ingresos_mes,
        COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END), 0) as pendientes_mes,
        COALESCE(SUM(CASE WHEN estado = 'atrasado' THEN monto ELSE 0 END), 0) as atrasados_mes,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as cantidad_pendientes,
        COUNT(CASE WHEN estado = 'atrasado' THEN 1 END) as cantidad_atrasados
      FROM pagos
      WHERE fecha_vencimiento >= '${primerDiaMes.toISOString().split('T')[0]}'
        AND fecha_vencimiento <= '${ultimoDiaMes.toISOString().split('T')[0]}'
    `);

    res.json(resumen[0]);
  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({ error: 'Error al obtener resumen financiero' });
  }
});

// POST - Crear nuevo pago
router.post('/', async (req, res) => {
  try {
    const { residente_id, tipo_pago, monto, fecha_vencimiento, descripcion, reservas = [] } = req.body;

    // Validar datos requeridos
    if (!residente_id || !tipo_pago || !monto || !fecha_vencimiento || !descripcion) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        requeridos: ['residente_id', 'tipo_pago', 'monto', 'fecha_vencimiento', 'descripcion']
      });
    }

    // Obtener datos completos del residente
    const residenteData = await prisma.$queryRawUnsafe(`
      SELECT 
        r.id,
        r.departamento_id,
        u.nombre as residente_nombre,
        u.apellido as residente_apellido,
        u.correo as residente_correo,
        d.numero as departamento_numero
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE r.id = ${parseInt(residente_id)}
    `);

    if (!residenteData || residenteData.length === 0) {
      return res.status(404).json({ error: 'Residente no encontrado' });
    }

    const residente = residenteData[0];

    // Extraer los IDs de las reservas si existen
    const reservasIds = reservas.length > 0 ? reservas.map(r => r.id) : [];
    const reservasIdsJson = reservasIds.length > 0 ? JSON.stringify(reservasIds) : null;

    // Crear el pago
    const nuevoPago = await prisma.$queryRawUnsafe(`
      INSERT INTO pagos (
        departamento_id,
        residente_id,
        tipo_pago,
        monto,
        descripcion,
        fecha_vencimiento,
        estado,
        reservas_ids,
        creado_en,
        actualizado_en
      ) VALUES (
        ${residente.departamento_id},
        ${parseInt(residente_id)},
        '${tipo_pago}',
        ${parseFloat(monto)},
        '${descripcion}',
        '${fecha_vencimiento}',
        'pendiente',
        ${reservasIdsJson ? `'${reservasIdsJson}'::jsonb` : 'NULL'},
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    const pagoCreado = nuevoPago[0];
    console.log('✅ Pago creado:', pagoCreado);

    // Enviar factura por email
    try {
      await enviarFacturaPago({
        pago_id: pagoCreado.id,
        residente_nombre: residente.residente_nombre,
        residente_apellido: residente.residente_apellido,
        residente_correo: residente.residente_correo,
        departamento_numero: residente.departamento_numero,
        mes_pago: descripcion.replace(' + Reservas de áreas', '').replace(/\s*\(\d+\)/, ''),
        monto_mantenimiento: reservas.length > 0 ? monto - reservas.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0) : monto,
        monto_total: monto,
        fecha_vencimiento: fecha_vencimiento,
        descripcion: descripcion,
        reservas: reservas
      });
      console.log('✅ Factura enviada por email');
    } catch (emailError) {
      console.error('⚠️ Error al enviar email (pago creado correctamente):', emailError);
    }

    res.status(201).json(pagoCreado);

  } catch (error) {
    console.error('❌ Error al crear pago:', error);
    res.status(500).json({ error: 'Error al crear pago', details: error.message });
  }
});

// POST - Crear pagos de mantenimiento para todos los residentes
router.post('/crear-todos', async (req, res) => {
  try {
    const { mes } = req.body;

    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Mes inválido' });
    }

    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombreMes = meses[mes];

    // Obtener todos los residentes activos con sus departamentos
    const residentes = await prisma.$queryRawUnsafe(`
      SELECT 
        r.id as residente_id,
        r.departamento_id,
        u.nombre as residente_nombre,
        u.apellido as residente_apellido,
        u.correo as residente_correo,
        d.numero as departamento_numero,
        d.mantenimiento_mensual::numeric as mantenimiento_mensual
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE r.activo = true AND r.es_principal = true
      ORDER BY d.numero
    `);

    console.log(`📋 Creando pagos para ${residentes.length} residentes - Mes: ${nombreMes}`);

    // Calcular fecha de vencimiento (último día del mes)
    const año = 2025;
    const ultimoDia = new Date(año, mes, 0).getDate();
    const fechaVencimiento = `${año}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    let pagosCreados = 0;
    const errores = [];

    // Crear un pago para cada residente
    for (const residente of residentes) {
      try {
        const descripcion = `Mantenimiento de ${nombreMes} 2025`;
        const monto = parseFloat(residente.mantenimiento_mensual);

        // Verificar que no exista ya un pago similar
        const pagoExistente = await prisma.$queryRawUnsafe(`
          SELECT id FROM pagos 
          WHERE residente_id = ${residente.residente_id} 
            AND descripcion = '${descripcion}'
            AND fecha_vencimiento = '${fechaVencimiento}'
          LIMIT 1
        `);

        if (pagoExistente && pagoExistente.length > 0) {
          console.log(`⚠️ Pago ya existe para ${residente.residente_nombre} - ${descripcion}`);
          continue;
        }

        // Crear el pago
        await prisma.$queryRawUnsafe(`
          INSERT INTO pagos (
            departamento_id,
            residente_id,
            tipo_pago,
            monto,
            descripcion,
            fecha_vencimiento,
            estado,
            reservas_ids,
            creado_en,
            actualizado_en
          ) VALUES (
            ${residente.departamento_id},
            ${residente.residente_id},
            'mantenimiento',
            ${monto},
            '${descripcion}',
            '${fechaVencimiento}',
            'pendiente',
            NULL,
            NOW(),
            NOW()
          )
        `);

        // Enviar email de factura pendiente
        try {
          await enviarFacturaPago({
            pago_id: 0, // No tenemos el ID exacto pero no es crítico
            residente_nombre: residente.residente_nombre,
            residente_apellido: residente.residente_apellido,
            residente_correo: residente.residente_correo,
            departamento_numero: residente.departamento_numero,
            mes_pago: descripcion,
            monto_mantenimiento: monto,
            monto_total: monto,
            fecha_vencimiento: fechaVencimiento,
            descripcion: descripcion,
            reservas: []
          });
        } catch (emailError) {
          console.error(`⚠️ Error al enviar email a ${residente.residente_correo}:`, emailError.message);
        }

        pagosCreados++;
        console.log(`✅ Pago creado para ${residente.residente_nombre} ${residente.residente_apellido} - Depto ${residente.departamento_numero}`);

      } catch (error) {
        errores.push({
          residente: `${residente.residente_nombre} ${residente.residente_apellido}`,
          error: error.message
        });
        console.error(`❌ Error al crear pago para residente ${residente.residente_id}:`, error);
      }
    }

    console.log(`✅ Proceso completado: ${pagosCreados} pagos creados`);
    
    res.json({
      creados: pagosCreados,
      total: residentes.length,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('❌ Error al crear pagos masivos:', error);
    res.status(500).json({ error: 'Error al crear pagos masivos', details: error.message });
  }
});

// PUT - Actualizar estado de pago (marcar como pagado)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha_pago, metodo_pago } = req.body;

    let query = `UPDATE pagos SET estado = '${estado}', actualizado_en = NOW()`;
    
    if (fecha_pago) {
      query += `, fecha_pago = '${fecha_pago}'`;
    }
    
    if (metodo_pago) {
      query += `, metodo_pago = '${metodo_pago}'`;
    }
    
    query += ` WHERE id = ${parseInt(id)} RETURNING *`;

    const pagoActualizado = await prisma.$queryRawUnsafe(query);

    if (!pagoActualizado || pagoActualizado.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const pago = pagoActualizado[0];
    console.log('✅ Pago actualizado:', pago);

  // Si se marcó como pagado, confirmar reservas y enviar email y devolver PDF
  let pdfBuffer = null;
  let pdfFileName = null;
  if (estado === 'pagado') {
  // Obtener datos del residente para el email
  const residenteData = await prisma.$queryRawUnsafe(`
        SELECT 
          r.id,
          u.nombre as residente_nombre,
          u.apellido as residente_apellido,
          u.correo as residente_correo,
          d.numero as departamento_numero
        FROM residentes r
        INNER JOIN usuarios u ON r.usuario_id = u.id
        INNER JOIN departamentos d ON r.departamento_id = d.id
        WHERE r.id = ${pago.residente_id}
      `);

      const residente = residenteData[0];

  // Leer los IDs de reservas desde el campo reservas_ids
  let reservas_ids = [];
  if (Array.isArray(pago.reservas_ids)) {
    reservas_ids = pago.reservas_ids.filter(id => Number.isFinite(Number(id))).map(id => Number(id));
  } else if (typeof pago.reservas_ids === 'string') {
    try {
      const parsed = JSON.parse(pago.reservas_ids);
      if (Array.isArray(parsed)) {
        reservas_ids = parsed.filter(id => Number.isFinite(Number(id))).map(id => Number(id));
      }
    } catch (e) {
      reservas_ids = [];
    }
  }

  // Extraer el mes de mantenimiento desde la descripción si existe
  let mes_pago = '';
  if (pago.tipo_pago === 'mantenimiento' && pago.descripcion) {
    // Ejemplo: "Mantenimiento de Octubre 2025"
    const match = pago.descripcion.match(/Mantenimiento de ([A-Za-záéíóúÁÉÍÓÚ]+ \d{4})/);
    if (match) {
      mes_pago = match[1];
    }
  }
      
  // Si hay reservas asociadas, confirmarlas
  let reservasConfirmadas = [];
  if (reservas_ids && reservas_ids.length > 0) {
        console.log(`🏊 Confirmando ${reservas_ids.length} reserva(s)...`);
        
        for (const reservaId of reservas_ids) {
          if (!Number.isFinite(reservaId)) continue;
          try {
            await prisma.$executeRawUnsafe(`
              UPDATE reservas_areas 
              SET estado = 'confirmada' 
              WHERE id = ${reservaId}
            `);
            console.log(`✅ Reserva ${reservaId} confirmada`);
          } catch (err) {
            console.error(`Error al confirmar reserva ${reservaId}:`, err);
          }
        }

        // Obtener detalles de las reservas confirmadas para el email
  reservasConfirmadas = await prisma.$queryRawUnsafe(`
          SELECT 
            ra.id,
            ac.nombre as area_nombre,
            TO_CHAR(ra.fecha_reserva, 'YYYY-MM-DD') as fecha_reserva,
            TO_CHAR(ra.hora_inicio, 'HH24:MI') as hora_inicio,
            TO_CHAR(ra.hora_fin, 'HH24:MI') as hora_fin,
            ra.monto_pago
          FROM reservas_areas ra
          INNER JOIN areas_comunes ac ON ra.area_id = ac.id
          WHERE ra.id IN (${reservas_ids.length > 0 ? reservas_ids.join(',') : 'NULL'})
        `);

        // Enviar email de confirmación con reservas y generar PDF
        try {
          const { enviarFacturaPagada } = await import('../utils/emailFacturaPagada.js');
          const { generarFacturaPDF } = await import('../utils/pdfFacturaPagada.js');
          await enviarFacturaPagada({
            pago_id: pago.id,
            residente_nombre: residente.residente_nombre,
            residente_apellido: residente.residente_apellido,
            residente_correo: residente.residente_correo,
            departamento_numero: residente.departamento_numero,
            tipo_pago: pago.tipo_pago,
            monto_total: pago.monto,
            fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
            metodo_pago: metodo_pago || 'efectivo',
            descripcion: pago.descripcion,
            reservas: reservasConfirmadas.map(r => ({
              area_nombre: r.area_nombre,
              fecha: r.fecha_reserva,
              hora_inicio: r.hora_inicio,
              hora_fin: r.hora_fin,
              monto: r.monto_pago
            })),
            mes_pago
          });
          // Generar PDF y guardar en buffer
          const pdfResult = await generarFacturaPDF({
            pago_id: pago.id,
            residente_nombre: residente.residente_nombre,
            residente_apellido: residente.residente_apellido,
            residente_correo: residente.residente_correo,
            departamento_numero: residente.departamento_numero,
            tipo_pago: pago.tipo_pago,
            monto_total: pago.monto,
            fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
            metodo_pago: metodo_pago || 'efectivo',
            descripcion: pago.descripcion,
            reservas: reservasConfirmadas.map(r => ({
              area_nombre: r.area_nombre,
              fecha: r.fecha_reserva,
              hora_inicio: r.hora_inicio,
              hora_fin: r.hora_fin,
              monto: r.monto_pago
            })),
            mes_pago
          });
          pdfBuffer = pdfResult.buffer;
          pdfFileName = pdfResult.fileName;
          console.log('✅ Email de confirmación de pago enviado y PDF generado');
        } catch (emailError) {
          console.error('⚠️ Error al enviar email de confirmación o generar PDF:', emailError);
        }
      } else {
        // Enviar email sin reservas (solo mantenimiento u otro tipo) y generar PDF
        try {
          // Extraer el mes de mantenimiento desde la descripción si existe
          let mes_pago = '';
          if (pago.tipo_pago === 'mantenimiento' && pago.descripcion) {
            const match = pago.descripcion.match(/Mantenimiento de ([A-Za-záéíóúÁÉÍÓÚ]+ \d{4})/);
            if (match) {
              mes_pago = match[1];
            }
          }
          const { enviarFacturaPagada } = await import('../utils/emailFacturaPagada.js');
          const { generarFacturaPDF } = await import('../utils/pdfFacturaPagada.js');
          await enviarFacturaPagada({
            pago_id: pago.id,
            residente_nombre: residente.residente_nombre,
            residente_apellido: residente.residente_apellido,
            residente_correo: residente.residente_correo,
            departamento_numero: residente.departamento_numero,
            tipo_pago: pago.tipo_pago,
            monto_total: pago.monto,
            fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
            metodo_pago: metodo_pago || 'efectivo',
            descripcion: pago.descripcion,
            reservas: [],
            mes_pago
          });
          // Generar PDF y guardar en buffer
          const pdfResult = await generarFacturaPDF({
            pago_id: pago.id,
            residente_nombre: residente.residente_nombre,
            residente_apellido: residente.residente_apellido,
            residente_correo: residente.residente_correo,
            departamento_numero: residente.departamento_numero,
            tipo_pago: pago.tipo_pago,
            monto_total: pago.monto,
            fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
            metodo_pago: metodo_pago || 'efectivo',
            descripcion: pago.descripcion,
            reservas: [],
            mes_pago
          });
          pdfBuffer = pdfResult.buffer;
          pdfFileName = pdfResult.fileName;
          console.log('✅ Email de confirmación de pago enviado y PDF generado');
        } catch (emailError) {
          console.error('⚠️ Error al enviar email de confirmación o generar PDF:', emailError);
        }
      }
    }

    // Si se generó el PDF, devolverlo como archivo descargable
    // Ahora también para pagos online (Stripe)
    if (pdfBuffer && pdfFileName && (metodo_pago === 'efectivo' || metodo_pago === 'online')) {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFileName}"`,
      });
      return res.send(pdfBuffer);
    }
    // Si no, devolver el pago actualizado como antes
    res.json(pagoActualizado[0]);

  } catch (error) {
    console.error('❌ Error al actualizar pago:', error);
    res.status(500).json({ error: 'Error al actualizar pago', details: error.message });
  }
});

// POST - Crear sesión de pago con Stripe
router.post('/:id/stripe-checkout', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos del pago
    const pagoData = await prisma.$queryRawUnsafe(`
      SELECT 
        p.*,
        u.nombre as residente_nombre,
        u.apellido as residente_apellido,
        u.correo as residente_correo,
        d.numero as departamento_numero
      FROM pagos p
      INNER JOIN residentes r ON p.residente_id = r.id
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON p.departamento_id = d.id
      WHERE p.id = ${parseInt(id)}
    `);

    if (!pagoData || pagoData.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const pago = pagoData[0];

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bob', // Bolivianos
            product_data: {
              name: pago.descripcion,
              description: `Pago #${pago.id} - ${pago.departamento_numero}`,
            },
            unit_amount: Math.round(parseFloat(pago.monto) * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gestion-financiera.html?pago_exitoso=${pago.id}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gestion-financiera.html?pago_cancelado=true`,
      metadata: {
        pago_id: pago.id,
        residente_id: pago.residente_id,
      },
      customer_email: pago.residente_correo,
    });

    console.log('✅ Sesión de Stripe creada:', session.id);
    res.json({ url: session.url });

  } catch (error) {
    console.error('❌ Error al crear sesión de Stripe:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago', details: error.message });
  }
});

// POST - Webhook de Stripe para confirmar pago
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const pagoId = session.metadata.pago_id;

    console.log('✅ Pago confirmado por Stripe para pago ID:', pagoId);

    // Marcar el pago como pagado
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE pagos 
        SET estado = 'pagado',
            fecha_pago = CURRENT_DATE,
            metodo_pago = 'online',
            id_transaccion = '${session.payment_intent}',
            actualizado_en = NOW()
        WHERE id = ${parseInt(pagoId)}
      `);

      // Obtener el pago actualizado
      const pagoData = await prisma.$queryRawUnsafe(`
        SELECT * FROM pagos WHERE id = ${parseInt(pagoId)}
      `);
      const pago = pagoData[0];

      // Confirmar reservas si existen
      const reservas_ids = pago.reservas_ids || [];
      
      if (reservas_ids && reservas_ids.length > 0) {
        console.log(`🏊 Confirmando ${reservas_ids.length} reserva(s) para pago Stripe...`);
        
        for (const reservaId of reservas_ids) {
          await prisma.$executeRawUnsafe(`
            UPDATE reservas_areas 
            SET estado = 'confirmada' 
            WHERE id = ${parseInt(reservaId)}
          `);
        }

        // Obtener detalles de las reservas
        const reservasConfirmadas = await prisma.$queryRawUnsafe(`
          SELECT 
            ra.id,
            ac.nombre as area_nombre,
            TO_CHAR(ra.fecha_reserva, 'YYYY-MM-DD') as fecha_reserva,
            TO_CHAR(ra.hora_inicio, 'HH24:MI') as hora_inicio,
            TO_CHAR(ra.hora_fin, 'HH24:MI') as hora_fin,
            ra.monto_pago
          FROM reservas_areas ra
          INNER JOIN areas_comunes ac ON ra.area_id = ac.id
          WHERE ra.id IN (${reservas_ids.join(',')})
        `);

        // Obtener datos del residente
        const residenteData = await prisma.$queryRawUnsafe(`
          SELECT 
            u.nombre as residente_nombre,
            u.apellido as residente_apellido,
            u.correo as residente_correo,
            d.numero as departamento_numero
          FROM residentes r
          INNER JOIN usuarios u ON r.usuario_id = u.id
          INNER JOIN departamentos d ON r.departamento_id = d.id
          WHERE r.id = ${pago.residente_id}
        `);
        const residente = residenteData[0];

        // Generar PDF y enviar email de confirmación con PDF adjunto
        try {
          const { enviarFacturaPagada } = await import('../utils/emailFacturaPagada.js');
          const { generarFacturaPDF } = await import('../utils/pdfFacturaPagada.js');
          const datosFactura = {
            pago_id: pago.id,
            residente_nombre: residente.residente_nombre,
            residente_apellido: residente.residente_apellido,
            residente_correo: residente.residente_correo,
            departamento_numero: residente.departamento_numero,
            tipo_pago: pago.tipo_pago,
            monto_total: pago.monto,
            fecha_pago: pago.fecha_pago,
            metodo_pago: 'online',
            descripcion: pago.descripcion,
            reservas: reservasConfirmadas.map(r => ({
              area_nombre: r.area_nombre,
              fecha: r.fecha_reserva,
              hora_inicio: r.hora_inicio,
              hora_fin: r.hora_fin,
              monto: r.monto_pago
            }))
          };
          const pdfResult = await generarFacturaPDF(datosFactura);
          await enviarFacturaPagada({ ...datosFactura, pdfBuffer: pdfResult.buffer, pdfFileName: pdfResult.fileName });
        } catch (emailError) {
          console.error('⚠️ Error al enviar email o generar PDF:', emailError);
        }
      }

      console.log('✅ Pago procesado exitosamente vía Stripe');
    } catch (dbError) {
      console.error('❌ Error al procesar pago en BD:', dbError);
    }
  }

  res.json({ received: true });
});

// DELETE - Eliminar pago
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$executeRawUnsafe(`DELETE FROM pagos WHERE id = ${parseInt(id)}`);

    console.log('✅ Pago eliminado:', id);
    res.json({ message: 'Pago eliminado exitosamente' });

  } catch (error) {
    console.error('❌ Error al eliminar pago:', error);
    res.status(500).json({ error: 'Error al eliminar pago', details: error.message });
  }
});

export default router;
