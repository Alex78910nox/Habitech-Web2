import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Configuración de n8n
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

/**
 * POST /api/n8n/trigger
 * Dispara un workflow de n8n con datos del sistema
 */
router.post('/trigger/:workflowName', async (req, res) => {
  try {
    const { workflowName } = req.params;
    const data = req.body;

    // Construir URL del webhook de n8n
    const webhookUrl = `${N8N_WEBHOOK_URL}/${workflowName}`;

    console.log(`🔄 Disparando workflow n8n: ${workflowName}`);

    // Enviar datos a n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'habitech',
        timestamp: new Date().toISOString(),
        workflow: workflowName,
        data: data
      })
    });

    if (!response.ok) {
      throw new Error(`Error en n8n: ${response.status}`);
    }

    const result = await response.json();

    res.json({
      success: true,
      workflow: workflowName,
      result: result
    });

  } catch (error) {
    console.error('❌ Error al disparar workflow n8n:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/n8n/ai-analysis
 * Envía datos a n8n para análisis con IA
 */
router.post('/ai-analysis', async (req, res) => {
  try {
    const { type, data, prompt } = req.body;

    const webhookUrl = `${N8N_WEBHOOK_URL}/ai-analysis`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisType: type,
        data: data,
        prompt: prompt,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Error en análisis IA: ${response.status}`);
    }

    const result = await response.json();

    res.json({
      success: true,
      analysis: result
    });

  } catch (error) {
    console.error('❌ Error en análisis IA:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/n8n/webhook-receiver
 * Recibe respuestas de n8n de vuelta al sistema
 */
router.post('/webhook-receiver', async (req, res) => {
  try {
    const data = req.body;

    console.log('📥 Respuesta recibida de n8n:', data);

    // Aquí puedes procesar la respuesta de n8n
    // Por ejemplo: guardar en BD, enviar notificación, etc.

    res.json({
      success: true,
      message: 'Datos recibidos correctamente'
    });

  } catch (error) {
    console.error('❌ Error al recibir webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Ejemplos de workflows que puedes crear:
 * 
 * 1. Análisis de anomalías:
 *    POST /api/n8n/trigger/analyze-anomalies
 *    { departmentId: 123, metrics: {...} }
 * 
 * 2. Bienvenida automatizada:
 *    POST /api/n8n/trigger/welcome-resident
 *    { residentName: "Juan", email: "juan@email.com", unit: "301" }
 * 
 * 3. Clasificación de solicitudes:
 *    POST /api/n8n/trigger/classify-maintenance
 *    { description: "...", priority: "high" }
 * 
 * 4. Generación de reportes:
 *    POST /api/n8n/trigger/generate-report
 *    { type: "monthly", period: "2025-11" }
 */

export default router;
