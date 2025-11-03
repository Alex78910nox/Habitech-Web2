import express from 'express';
import { Pool } from 'pg';
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
      tipo,
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

    console.log('📝 Valores a insertar:', { tipo, descripcion, valor_observado, valor_esperado, fecha, severidad, departamento_id: deptId });

    const result = await pool.query(
      `INSERT INTO anomalias_detectadas (tipo, descripcion, valor_observado, valor_esperado, fecha, severidad, departamento_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tipo, descripcion, valor_observado, valor_esperado, fecha, severidad, deptId]
    );
    
    console.log('✅ Anomalía insertada:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al reportar anomalía:', error);
    res.status(500).json({ error: 'Error al reportar anomalía', details: error.message });
  }
});

export default router;
