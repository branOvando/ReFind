
const express = require("express");
const pool = require("../db");
const verificarToken = require("../middleware/auth");

const router = express.Router();


// ======================================
// VERIFICAR ADMINISTRADOR
// ======================================

router.use(verificarToken);

router.use(async (req, res, next) => {

  try {

    const resultado = await pool.query(
      "SELECT rol FROM usuarios WHERE id_usuario = $1",
      [req.usuario.id_usuario]
    );

    if (
      resultado.rows.length === 0 ||
      resultado.rows[0].rol !== "administrador"
    ) {
      return res.status(403).json({
        mensaje: "Solo administradores"
      });
    }

    next();

  } catch (error) {

    console.error(error);

    res.status(500).json({
      mensaje: "Error al verificar permisos"
    });

  }

});


// ======================================
// ESTADÍSTICAS
// GET /api/admin/estadisticas
// ======================================

router.get("/estadisticas", async (req, res) => {

  try {

    const resultado = await pool.query(
      `
      SELECT

        (SELECT COUNT(*) FROM usuarios)
          AS total_usuarios,

        (SELECT COUNT(*) FROM objetos)
          AS total_objetos,

        (SELECT COUNT(*) FROM objetos
         WHERE tipo = 'perdido')
          AS objetos_perdidos,

        (SELECT COUNT(*) FROM objetos
         WHERE tipo = 'encontrado')
          AS objetos_encontrados,

        (SELECT COUNT(*) FROM objetos
         WHERE estado = 'activo')
          AS objetos_activos,

        (SELECT COUNT(*) FROM objetos
         WHERE estado = 'resuelto')
          AS objetos_resueltos,

        (SELECT COUNT(*) FROM solicitudes
         WHERE estado = 'pendiente')
          AS solicitudes_pendientes,

        (SELECT COUNT(*) FROM solicitudes
         WHERE estado = 'aprobada')
          AS solicitudes_aprobadas
      `
    );

    res.json({
      estadisticas: resultado.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      mensaje: "Error al consultar estadísticas"
    });

  }

});


// ======================================
// USUARIOS
// GET /api/admin/usuarios
// ======================================

router.get("/usuarios", async (req, res) => {

  try {

    const resultado = await pool.query(
      `
      SELECT
        id_usuario,
        nombre,
        correo,
        rol,
        fecha_registro
      FROM usuarios
      ORDER BY id_usuario DESC
      `
    );

    res.json({
      usuarios: resultado.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      mensaje: "Error al consultar usuarios"
    });

  }

});


module.exports = router;
