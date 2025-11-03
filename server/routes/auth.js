import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Función para hashear la contraseña con SHA-256 (igual que probablemente uses en tu DB)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Login - validar correo y contraseña
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    
    if (!correo || !contrasena) {
      return res.status(400).json({ 
        error: 'Correo y contraseña son requeridos' 
      });
    }
    
    // Buscar usuario por correo
    const usuario = await prisma.usuarios.findUnique({
      where: { correo: correo.toLowerCase() },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        hash_contrasena: true,
        activo: true,
        rol_id: true
      }
    });
    
    if (!usuario) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }
    
    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ 
        error: 'Usuario inactivo. Contacte al administrador' 
      });
    }
    
    // Verificar que el usuario tenga rol_id = 1 (Administrador)
    if (usuario.rol_id !== 1) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Solo administradores pueden acceder a este sistema' 
      });
    }
    
    // Verificar contraseña
    const hashedPassword = hashPassword(contrasena);
    
    if (usuario.hash_contrasena !== hashedPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }
    
    // Login exitoso - devolver datos del usuario (sin la contraseña)
    const { hash_contrasena, ...usuarioSinPassword } = usuario;
    
    res.json({
      success: true,
      message: 'Login exitoso',
      usuario: usuarioSinPassword
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Verificar si el usuario está autenticado (opcional, para validar sesión)
router.get('/verify', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const usuario = await prisma.usuarios.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        activo: true
      }
    });
    
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }
    
    res.json({ success: true, usuario });
    
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
