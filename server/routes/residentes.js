import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Función para hashear la contraseña con SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Obtener todos los residentes
router.get('/', async (req, res) => {
  try {
    // Como la tabla residentes no tiene primary key válida, hacemos una query raw
    const residentes = await prisma.$queryRaw`
      SELECT 
        r.*,
        u.correo, u.nombre, u.apellido, u.telefono, u.activo as usuario_activo,
        d.numero as departamento_numero, d.piso
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE r.activo = true
      ORDER BY r.creado_en DESC
    `;
    
    res.json(residentes);
  } catch (error) {
    console.error('Error al obtener residentes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo residente con su usuario
router.post('/', async (req, res) => {
  try {
    const {
      // Datos del usuario
      correo,
      nombre,
      apellido,
      telefono,
      numero_documento,
      contrasena,
      // Códigos de verificación
      codigo_verif_correo,
      codigo_verif_telefono,
      // Datos del residente
      departamento_id,
      tipo_relacion,
      fecha_ingreso,
      nombre_contacto_emergencia,
      telefono_contacto_emergencia,
      es_principal
    } = req.body;
    
    // Validación
    if (!correo || !nombre || !apellido || !numero_documento || !contrasena || !departamento_id || !tipo_relacion || !fecha_ingreso) {
      return res.status(400).json({ 
        error: 'Campos requeridos: correo, nombre, apellido, numero_documento, contrasena, departamento_id, tipo_relacion, fecha_ingreso' 
      });
    }
    
    // Validar códigos de verificación
    if (!codigo_verif_correo || !codigo_verif_telefono) {
      return res.status(400).json({ 
        error: 'Debes verificar tu correo y teléfono antes de crear la cuenta' 
      });
    }
    
    // Verificar que el departamento existe
    const departamento = await prisma.departamentos.findUnique({
      where: { id: parseInt(departamento_id) }
    });
    
    if (!departamento) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }
    
    // Hashear la contraseña
    const hashedPassword = hashPassword(contrasena);
    
    // Crear usuario con rol de residente (asumimos rol_id = 2 para residentes)
    const usuario = await prisma.usuarios.create({
      data: {
        correo: correo.toLowerCase(),
        hash_contrasena: hashedPassword,
        nombre,
        apellido,
        telefono,
        numero_documento,
        rol_id: 2,  // Rol de residente
        activo: true,
        codigo_verif_correo,
        codigo_verif_telefono
      }
    });
    
    // Crear residente usando query raw porque no tiene primary key válida
    await prisma.$executeRaw`
      INSERT INTO residentes (
        usuario_id, 
        departamento_id, 
        tipo_relacion, 
        fecha_ingreso,
        nombre_contacto_emergencia,
        telefono_contacto_emergencia,
        es_principal,
        activo
      ) VALUES (
        ${usuario.id},
        ${parseInt(departamento_id)},
        ${tipo_relacion}::tipo_relacion,
        ${new Date(fecha_ingreso)},
        ${nombre_contacto_emergencia || null},
        ${telefono_contacto_emergencia || null},
        ${es_principal || false},
        true
      )
    `;
    
    // Obtener el residente creado
    const residenteCreado = await prisma.$queryRaw`
      SELECT 
        r.*,
        u.correo, u.nombre, u.apellido, u.telefono,
        d.numero as departamento_numero
      FROM residentes r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN departamentos d ON r.departamento_id = d.id
      WHERE r.usuario_id = ${usuario.id}
      LIMIT 1
    `;
    
    res.status(201).json({
      success: true,
      message: 'Residente creado exitosamente',
      residente: residenteCreado[0]
    });
    
  } catch (error) {
    console.error('Error al crear residente:', error);
    
    // Si falla, intentar hacer rollback del usuario creado
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'El correo o número de documento ya está registrado' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Obtener departamentos disponibles
router.get('/departamentos', async (req, res) => {
  try {
    const departamentos = await prisma.departamentos.findMany({
      where: {
        activo: true
      },
      select: {
        id: true,
        numero: true,
        piso: true,
        dormitorios: true,
        estado: true,
        renta_mensual: true
      },
      orderBy: {
        numero: 'asc'
      }
    });
    
    res.json(departamentos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desactivar un residente
router.delete('/:usuario_id', async (req, res) => {
  try {
    const usuario_id = parseInt(req.params.usuario_id);
    
    // Desactivar residente
    await prisma.$executeRaw`
      UPDATE residentes 
      SET activo = false 
      WHERE usuario_id = ${usuario_id}
    `;
    
    // Desactivar usuario
    await prisma.usuarios.update({
      where: { id: usuario_id },
      data: { activo: false }
    });
    
    res.json({ 
      success: true, 
      message: 'Residente desactivado correctamente' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
