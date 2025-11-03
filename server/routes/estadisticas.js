import express from 'express';
import { Pool } from 'pg';
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Endpoint para pagos por tipo
router.get('/pagos-por-tipo', async (req, res) => {
  try {
    const result = await pool.query(`SELECT tipo_pago, COUNT(*) AS total FROM pagos GROUP BY tipo_pago`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener pagos por tipo:', error);
    res.status(500).json({ error: 'Error al obtener pagos por tipo', details: error.message });
  }
});

// Endpoint para departamentos por estado
router.get('/departamentos-por-estado', async (req, res) => {
  try {
    const result = await pool.query(`SELECT estado, COUNT(*) AS total FROM departamentos GROUP BY estado`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener departamentos por estado:', error);
    res.status(500).json({ error: 'Error al obtener departamentos por estado', details: error.message });
  }
});

// Ruta para obtener estadísticas generales
router.get('/generales', async (req, res) => {
  try {
    // Total de usuarios con rol_id = 1
    const usuariosResult = await pool.query('SELECT COUNT(*) AS total FROM usuarios WHERE rol_id = 1');
    const totalUsuarios = parseInt(usuariosResult.rows[0]?.total ?? 0);

    // Total de residentes
    const residentesResult = await pool.query('SELECT COUNT(*) AS total FROM residentes');
    const totalResidentes = parseInt(residentesResult.rows[0]?.total ?? 0);

    // Total de departamentos
    const departamentosResult = await pool.query('SELECT COUNT(*) AS total FROM departamentos');
    const totalDepartamentos = parseInt(departamentosResult.rows[0]?.total ?? 0);

    // Total de pagos pagados
    const pagosPagadosResult = await pool.query("SELECT COUNT(*) AS total FROM pagos WHERE estado = 'pagado'");
    const totalPagosPagados = parseInt(pagosPagadosResult.rows[0]?.total ?? 0);

    // Total de pagos pendientes
    const pagosPendientesResult = await pool.query("SELECT COUNT(*) AS total FROM pagos WHERE estado = 'pendiente'");
    const totalPagosPendientes = parseInt(pagosPendientesResult.rows[0]?.total ?? 0);

    res.json({
      totalUsuarios,
      totalResidentes,
      totalDepartamentos,
      totalPagosPagados,
      totalPagosPendientes,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas generales',
      details: error.message,
    });
  }
});

export default router;