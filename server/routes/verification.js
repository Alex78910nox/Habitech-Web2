import express from 'express';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import SibApiV3Sdk from '@sendinblue/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar Twilio
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const twilioNumber = process.env.TWILIO_NUMBER;

// Configurar Brevo (Sendinblue)
const brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
const brevoApiKey = brevoApi.authentications['apiKey'];
brevoApiKey.apiKey = process.env.BREVO_API_KEY;

// Generar código de 6 dígitos
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Enviar código de verificación por SMS
router.post('/send-sms', async (req, res) => {
  try {
    let { telefono } = req.body;
    
    if (!telefono) {
      return res.status(400).json({ error: 'Teléfono requerido' });
    }
    
    // Formatear número: agregar +591 si no tiene código de país
    if (!telefono.startsWith('+')) {
      telefono = '+591' + telefono.replace(/\s+/g, ''); // Eliminar espacios y agregar +591
    }
    
    // Generar código
    const codigo = generateCode();
    
    // Verificar si ya existe un usuario con ese teléfono (sin verificar)
    const usuarioExistente = await prisma.usuarios.findFirst({
      where: { telefono }
    });
    
    if (usuarioExistente && usuarioExistente.codigo_verif_telefono) {
      // Actualizar código existente
      await prisma.usuarios.update({
        where: { id: usuarioExistente.id },
        data: { codigo_verif_telefono: codigo }
      });
    }
    
    // Enviar SMS con Twilio
    try {
      await twilioClient.messages.create({
        body: `Tu código de verificación de Habitech es: ${codigo}`,
        from: twilioNumber,
        to: telefono
      });
      
      res.json({ 
        success: true, 
        message: 'Código enviado por SMS',
        // En desarrollo, devolver el código (QUITAR EN PRODUCCIÓN)
        codigo: process.env.NODE_ENV === 'development' ? codigo : undefined
      });
    } catch (twilioError) {
      console.error('Error de Twilio:', twilioError);
      
      // Si falla Twilio, devolver el código para desarrollo
      res.json({ 
        success: true, 
        message: 'Código generado (SMS no enviado - modo desarrollo)',
        codigo: codigo,
        warning: 'SMS no enviado. Usa este código para verificar.'
      });
    }
    
  } catch (error) {
    console.error('Error al enviar SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar código de verificación por Email
router.post('/send-email', async (req, res) => {
  try {
    const { correo, nombre } = req.body;
    
    if (!correo) {
      return res.status(400).json({ error: 'Correo requerido' });
    }
    
    // Generar código
    const codigo = generateCode();
    
    // Verificar si ya existe un usuario con ese correo (sin verificar)
    const usuarioExistente = await prisma.usuarios.findFirst({
      where: { correo: correo.toLowerCase() }
    });
    
    if (usuarioExistente && usuarioExistente.codigo_verif_correo) {
      // Actualizar código existente
      await prisma.usuarios.update({
        where: { id: usuarioExistente.id },
        data: { codigo_verif_correo: codigo }
      });
    }
    
    // Enviar Email con Brevo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = "Código de Verificación - Habitech";
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a2744, #6366f1); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .code-box { background: #f8f9fa; border: 2px dashed #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 8px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 HABITECH</h1>
            <p>Gestión Inteligente, Convivencia Eficiente</p>
          </div>
          <div class="content">
            <h2>Hola ${nombre || 'Usuario'},</h2>
            <p>Has solicitado crear una cuenta en Habitech. Utiliza el siguiente código para verificar tu correo electrónico:</p>
            <div class="code-box">
              <div class="code">${codigo}</div>
            </div>
            <p><strong>Este código expirará en 10 minutos.</strong></p>
            <p>Si no solicitaste este código, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>Habitech © 2025 - Sistema de Gestión de Edificios</p>
          </div>
        </div>
      </body>
      </html>
    `;
    sendSmtpEmail.sender = { 
      name: "Habitech", 
      email: process.env.BREVO_FROM_EMAIL 
    };
    sendSmtpEmail.to = [{ email: correo, name: nombre || 'Usuario' }];
    
    try {
      await brevoApi.sendTransacEmail(sendSmtpEmail);
      
      res.json({ 
        success: true, 
        message: 'Código enviado por email',
        // En desarrollo, devolver el código (QUITAR EN PRODUCCIÓN)
        codigo: process.env.NODE_ENV === 'development' ? codigo : undefined
      });
    } catch (brevoError) {
      console.error('Error de Brevo:', brevoError);
      
      // Si falla Brevo, devolver el código para desarrollo
      res.json({ 
        success: true, 
        message: 'Código generado (Email no enviado - modo desarrollo)',
        codigo: codigo,
        warning: 'Email no enviado. Usa este código para verificar.'
      });
    }
    
  } catch (error) {
    console.error('Error al enviar email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar código de teléfono
router.post('/verify-phone', async (req, res) => {
  try {
    const { telefono, codigo } = req.body;
    
    if (!telefono || !codigo) {
      return res.status(400).json({ error: 'Teléfono y código requeridos' });
    }
    
    // Buscar usuario con ese teléfono y código
    const usuario = await prisma.usuarios.findFirst({
      where: { 
        telefono,
        codigo_verif_telefono: codigo
      }
    });
    
    if (!usuario) {
      return res.status(400).json({ 
        error: 'Código inválido o teléfono no encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Teléfono verificado correctamente',
      verificado: true
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar código de email
router.post('/verify-email', async (req, res) => {
  try {
    const { correo, codigo } = req.body;
    
    if (!correo || !codigo) {
      return res.status(400).json({ error: 'Correo y código requeridos' });
    }
    
    // Buscar usuario con ese correo y código
    const usuario = await prisma.usuarios.findFirst({
      where: { 
        correo: correo.toLowerCase(),
        codigo_verif_correo: codigo
      }
    });
    
    if (!usuario) {
      return res.status(400).json({ 
        error: 'Código inválido o correo no encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Correo verificado correctamente',
      verificado: true
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
