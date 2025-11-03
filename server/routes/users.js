import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Función para hashear la contraseña con SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Obtener todos los usuarios (solo administradores con rol_id = 1)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.usuarios.findMany({
      where: {
        rol_id: 1  // Solo administradores
      },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        telefono: true,
        numero_documento: true,
        imagen_perfil: true,
        rol_id: true,
        activo: true,
        creado_en: true,
        actualizado_en: true
      },
      orderBy: {
        creado_en: 'desc'
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.usuarios.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        telefono: true,
        numero_documento: true,
        imagen_perfil: true,
        rol_id: true,
        activo: true,
        creado_en: true,
        actualizado_en: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { 
      correo, 
      nombre, 
      apellido, 
      telefono, 
      numero_documento, 
      hash_contrasena, 
      rol_id,
      codigo_verif_correo,
      codigo_verif_telefono
    } = req.body;
    
    // Validación básica
    if (!correo || !nombre || !apellido || !numero_documento || !hash_contrasena) {
      return res.status(400).json({ 
        error: 'Campos requeridos: correo, nombre, apellido, numero_documento, hash_contrasena' 
      });
    }
    
    // Validar códigos de verificación
    if (!codigo_verif_correo || !codigo_verif_telefono) {
      return res.status(400).json({ 
        error: 'Debes verificar tu correo y teléfono antes de crear la cuenta' 
      });
    }
    
    // Hashear la contraseña antes de guardar
    const hashedPassword = hashPassword(hash_contrasena);
    
    const user = await prisma.usuarios.create({
      data: { 
        correo: correo.toLowerCase(), 
        nombre, 
        apellido, 
        telefono,
        numero_documento,
        hash_contrasena: hashedPassword,
        rol_id: rol_id || 1,  // Por defecto rol_id = 1 (Administrador)
        activo: true,
        codigo_verif_correo,
        codigo_verif_telefono
      },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        telefono: true,
        numero_documento: true,
        activo: true,
        creado_en: true
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar un usuario
router.put('/:id', async (req, res) => {
  try {
    const { nombre, apellido, telefono, correo } = req.body;
    
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (apellido) updateData.apellido = apellido;
    if (telefono) updateData.telefono = telefono;
    if (correo) updateData.correo = correo;
    updateData.actualizado_en = new Date();
    
    const user = await prisma.usuarios.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        telefono: true,
        numero_documento: true,
        activo: true,
        actualizado_en: true
      }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un usuario (desactivar en lugar de borrar)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.usuarios.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false }
    });
    
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
