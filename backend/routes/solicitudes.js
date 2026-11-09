
const express = require("express");
const pool = require("../db");
const verificarToken = require("../middleware/auth");

const router = express.Router();

// =======================================
// VERIFICACIÓN DE ROLES
// =======================================

function requiereRol(rol) {
  return async (req, res, next) => {
    try {
      const resultado = await pool.query(
        "SELECT rol FROM usuarios WHERE id_usuario = $1",
        [req.usuario.id_usuario]
      );

      if (
        !resultado.rows.length ||
        resultado.rows[0].rol !== rol
      ) {
        return res.status(403).json({
          mensaje: "No tienes permiso"
        });
      }

      next();

    } catch (error) {
      console.error(error);
      res.status(500).json({
        mensaje: "Error de autorización"
      });
    }
  };
}

// =======================================
// VALIDACIÓN DE DESCRIPCIÓN
// =======================================

function validarDescripcion(body) {

  const {
    id_objeto,
    marca_declarada,
    color_declarado,
    tipo_conexion_declarado,
    lugar_perdida,
    fecha_perdida,
    descripcion_propiedad
  } = body;

  if (
    !Number.isSafeInteger(Number(id_objeto)) ||
    Number(id_objeto) <= 0
  ) {
    return "Selecciona un objeto";
  }

  const campos = [
    marca_declarada,
    color_declarado,
    tipo_conexion_declarado,
    lugar_perdida
  ];

  if (
    campos.some(
      valor =>
        typeof valor !== "string" ||
        valor.trim().length < 2 ||
        valor.trim().length > 150
    )
  ) {
    return "Completa marca, color, tipo y lugar";
  }

  if (
    typeof fecha_perdida !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha_perdida)
  ) {
    return "Fecha incorrecta";
  }

  const fecha = new Date(fecha_perdida + "T00:00:00Z");

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== fecha_perdida ||
    fecha_perdida > new Date().toISOString().slice(0, 10)
  ) {
    return "Fecha no válida";
  }

  if (
    typeof descripcion_propiedad !== "string" ||
    descripcion_propiedad.trim().length < 15 ||
    descripcion_propiedad.length > 2000
  ) {
    return "Describe características adicionales (mínimo 15 caracteres)";
  }

  return null;
}

// =======================================
// REGISTRAR DESCRIPCIÓN DEL ESTUDIANTE
// POST /api/solicitudes
// =======================================

router.post(
  "/",
  verificarToken,
  requiereRol("estudiante"),
  async (req, res) => {

    try {

      const validacion = validarDescripcion(req.body);

      if (validacion) {
        return res.status(400).json({
          mensaje: validacion
        });
      }

      const {
        id_objeto,
        marca_declarada,
        color_declarado,
        tipo_conexion_declarado,
        lugar_perdida,
        fecha_perdida,
        descripcion_propiedad
      } = req.body;

      const idObjeto = Number(id_objeto);

      const objeto = await pool.query(
        `
        SELECT id_objeto
        FROM objetos
        WHERE id_objeto = $1
          AND tipo = 'encontrado'
          AND estado = 'activo'
        `,
        [idObjeto]
      );

      if (!objeto.rows.length) {
        return res.status(404).json({
          mensaje: "Objeto no disponible"
        });
      }

      const resultado = await pool.query(
        `
        INSERT INTO solicitudes (
          id_objeto,
          id_usuario,
          marca_declarada,
          color_declarado,
          tipo_conexion_declarado,
          lugar_perdida,
          fecha_perdida,
          descripcion_propiedad,
          estado
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, 'pendiente'
        )
        ON CONFLICT (id_objeto, id_usuario)
        DO NOTHING
        RETURNING id_solicitud, estado
        `,
        [
          idObjeto,
          req.usuario.id_usuario,
          marca_declarada.trim(),
          color_declarado.trim(),
          tipo_conexion_declarado.trim(),
          lugar_perdida.trim(),
          fecha_perdida,
          descripcion_propiedad.trim()
        ]
      );

      if (!resultado.rows.length) {
        return res.status(409).json({
          mensaje: "Ya describiste este objeto anteriormente"
        });
      }

      return res.status(201).json({
        mensaje: "Descripción guardada. La comparación se implementará en un próximo Sprint.",
        solicitud: resultado.rows[0]
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al registrar descripción"
      });
    }
  }
);

// =======================================
// MIS DESCRIPCIONES - ESTUDIANTE
// =======================================

router.get(
  "/mis-solicitudes",
  verificarToken,
  requiereRol("estudiante"),
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          s.id_solicitud,
          s.id_objeto,
          s.marca_declarada,
          s.color_declarado,
          s.tipo_conexion_declarado,
          s.lugar_perdida,
          s.fecha_perdida,
          s.descripcion_propiedad,
          s.estado,
          s.fecha_solicitud,
          o.titulo AS objeto_titulo,
          o.categoria
        FROM solicitudes s
        JOIN objetos o
          ON o.id_objeto = s.id_objeto
        WHERE s.id_usuario = $1
        ORDER BY s.fecha_solicitud DESC
        `,
        [req.usuario.id_usuario]
      );

      return res.json({
        solicitudes: resultado.rows
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al consultar descripciones"
      });
    }
  }
);

// =======================================
// TODAS LAS DESCRIPCIONES - ADMINISTRADOR
// =======================================

router.get(
  "/",
  verificarToken,
  requiereRol("administrador"),
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          s.*,
          o.titulo AS objeto_titulo,
          o.categoria,
          u.nombre AS estudiante_nombre,
          u.correo AS estudiante_correo
        FROM solicitudes s
        JOIN objetos o
          ON o.id_objeto = s.id_objeto
        JOIN usuarios u
          ON u.id_usuario = s.id_usuario
        ORDER BY s.fecha_solicitud DESC
        `
      );

      return res.json({
        solicitudes: resultado.rows
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al consultar solicitudes"
      });
    }
  }
);

// =======================================
// EL ENDPOINT DE APROBACIÓN YA NO EXISTE.
// SE IMPLEMENTARÁ JUNTO CON ENTREVISTAS.
// =======================================

module.exports = router;
