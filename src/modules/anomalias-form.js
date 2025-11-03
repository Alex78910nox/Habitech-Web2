import express from 'express';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import pkg from '@sendinblue/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar Sendinblue
const apiInstance = new pkg.TransactionalEmailsApi();
apiInstance.setApiKey(pkg.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Función para enviar email de anomalía
async function sendAnomaliaEmail(to, nombre, datosAnomalia, departamentoNumero) {
  try {
    const emailData = {
      to: [{ email: to, name: nombre }],
      subject: `⚠️ Anomalía detectada en Departamento ${departamentoNumero}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Anomalía Detectada</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Departamento ${departamentoNumero}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #dc3545; margin-top: 0;">Hola ${nombre},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Se ha detectado una anomalía en el consumo de <b>${datosAnomalia.tipo}</b> en tu departamento que requiere atención inmediata.
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">📋 Detalles de la Anomalía</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057; width: 120px;">Tipo:</td>
                  <td style="padding: 8px 0; color: #6c757d; text-transform: capitalize;">${datosAnomalia.tipo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Descripción:</td>
                  <td style="padding: 8px 0; color: #6c757d;">${datosAnomalia.descripcion}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Valor Observado:</td>
                  <td style="padding: 8px 0; color: #dc3545; font-weight: bold;">${datosAnomalia.valor_observado}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Valor Esperado:</td>
                  <td style="padding: 8px 0; color: #28a745; font-weight: bold;">${datosAnomalia.valor_esperado}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Severidad:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${datosAnomalia.severidad === 'alta' ? '#dc3545' : datosAnomalia.severidad === 'media' ? '#ffc107' : '#28a745'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                      ${datosAnomalia.severidad}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Fecha:</td>
                  <td style="padding: 8px 0; color: #6c757d;">${new Date(datosAnomalia.fecha).toLocaleString('es-ES')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2; font-weight: bold;">
                📞 Contacta con la administración si tienes preguntas sobre esta anomalía.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Este es un mensaje automático del sistema Habitech. Por favor, no respondas a este email.
            </p>
          </div>
        </div>
      `,
      sender: { email: process.env.BREVO_FROM_EMAIL, name: 'Habitech - Sistema de Gestión' }
    };

    const result = await apiInstance.sendTransacEmail(emailData);
    console.log('✅ Email de anomalía enviado:', result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email de anomalía:', error);
    return { success: false, error: error.message };
  }
}

// Función para crear notificación en la base de datos
export async function createAnomaliaNotification(departamentoId, datosAnomalia, departamentoNumero) {
  try {
    // Obtener residentes del departamento
    const residentes = await prisma.$queryRaw`
      SELECT r.id, u.nombre, u.apellido, u.correo, u.id as usuario_id
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.departamento_id = ${departamentoId} AND r.activo = true
    `;

    console.log('👥 Residentes encontrados para el departamento:', residentes);

    // Crear notificación para cada residente
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

      // Enviar email al residente
      await sendAnomaliaEmail(
        residente.correo,
        `${residente.nombre} ${residente.apellido}`,
        datosAnomalia,
        departamentoNumero
      );
    }

    return { success: true, residentesNotificados: residentes.length };
  } catch (error) {
    console.error('❌ Error al crear notificaciones:', error);
    return { success: false, error: error.message };
  }
}

// GET - Obtener todas las anomalías
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ad.*,
        d.numero as departamento_numero
      FROM anomalias_detectadas ad
      LEFT JOIN departamentos d ON ad.departamento_id = d.id
      ORDER BY ad.fecha DESC, ad.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener anomalías:', error);
    res.status(500).json({ error: 'Error al obtener anomalías', details: error.message });
  }
});

// POST - Reportar anomalía
router.post('/', async (req, res) => {
  try {
    console.log('🔍 Datos recibidos:', req.body);
    
    const {
      tipo_anomalia, // Cambiado de 'tipo' a 'tipo_anomalia'
      descripcion,
      valor_observado,
      valor_esperado,
      fecha,
      severidad,
      departamento_id
    } = req.body;

    // Validar y convertir departamento_id
    const deptId = departamento_id && departamento_id !== 'undefined' && departamento_id !== 'null' 
      ? parseInt(departamento_id) 
      : null;

    console.log('📝 Valores a insertar:', { tipo_anomalia, descripcion, valor_observado, valor_esperado, fecha, severidad, departamento_id: deptId });

    const result = await pool.query(
      `INSERT INTO anomalias_detectadas (tipo, descripcion, valor_observado, valor_esperado, fecha, severidad, departamento_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tipo_anomalia, descripcion, valor_observado, valor_esperado, fecha, severidad, deptId]
    );
    
    console.log('✅ Anomalía insertada:', result.rows[0]);
    
    // Enviar notificaciones y emails a los residentes del departamento
    if (deptId) {
      try {
        // Obtener número del departamento
        const deptResult = await pool.query('SELECT numero FROM departamentos WHERE id = $1', [deptId]);
        const departamentoNumero = deptResult.rows[0]?.numero || deptId;
        
        // Crear notificaciones y enviar emails
        const notificationResult = await createAnomaliaNotification(deptId, {
          tipo: tipo_anomalia, // Cambiado de 'tipo' a 'tipo_anomalia'
          descripcion,
          valor_observado,
          valor_esperado,
          fecha,
          severidad
        }, departamentoNumero);
        
        console.log('📧 Notificaciones enviadas:', notificationResult);
      } catch (notificationError) {
        console.error('⚠️ Error al enviar notificaciones (anomalía guardada):', notificationError);
        // No fallar la respuesta principal si las notificaciones fallan
      }
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al reportar anomalía:', error);
    res.status(500).json({ error: 'Error al reportar anomalía', details: error.message });
  }
});

export default router;

/* Código del formulario (anomalias-form.js) */
export function renderAnomaliaForm() {
  const content = document.getElementById('anomalia-form-content');
  content.innerHTML = `
    <form id="anomaliaForm">
      <label for="tipo">Tipo:</label>
      <select id="tipo" name="tipo" required>
        <option value="">Selecciona...</option>
        <option value="consumo">Consumo</option>
        <option value="otra">Otra</option>
      </select>

      <label for="tipo_anomalia">Tipo de consumo:</label>
      <select id="tipo_anomalia" name="tipo_anomalia" required>
        <option value="">Selecciona...</option>
        <option value="agua">Agua</option>
        <option value="luz">Luz</option>
        <option value="gas">Gas</option>
      </select>

      <label for="descripcion">Descripción:</label>
      <textarea id="descripcion" name="descripcion" required></textarea>
      <!-- ...otros campos como valor_observado, valor_esperado, fecha, severidad, departamento_id... -->
      <button type="submit">Reportar Anomalía</button>
    </form>
  `;

  document.getElementById('anomaliaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      tipo: form.tipo.value,
      tipo_anomalia: form.tipo_anomalia.value,
      descripcion: form.descripcion.value,
      // ...agrega aquí los demás campos que uses...
      // valor_observado: form.valor_observado.value,
      // valor_esperado: form.valor_esperado.value,
      // fecha: form.fecha.value,
      // severidad: form.severidad.value,
      // departamento_id: form.departamento_id.value,
    };
    // ...envío al backend...
    // fetch/post a /anomalias-detectadas con data
  });
}