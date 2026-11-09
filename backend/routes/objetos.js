
const express = require("express");
const pool = require("../db");
const verificarToken = require("../middleware/auth");

const router = express.Router();

const categorias = [
  "Electrónica",
  "Documentos",
  "Accesorios",
  "Ropa",
  "Libros",
  "Llaves",
  "Otros"
];

// =======================================
// VERIFICAR ROL REAL EN POSTGRESQL
// =======================================

async function obtenerRol(req, res, next) {
  try {
    const resultado = await pool.query(
      "SELECT rol FROM usuarios WHERE id_usuario = $1",
      [req.usuario.id_usuario]
    );

    if (!resultado.rows.length) {
      return res.status(401).json({
        mensaje: "Usuario no encontrado"
      });
    }

    req.rolActual = resultado.rows[0].rol;
    next();

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al verificar usuario"
    });
  }
}

function soloAdmin(req, res, next) {
  if (req.rolActual !== "administrador") {
    return res.status(403).json({
      mensaje: "Solo el administrador puede realizar esta operación"
    });
  }

  next();
}

// =======================================
// DATOS PÚBLICOS: SOLO LO GENERAL
// =======================================

const CAMPOS_PUBLICOS = `
  id_objeto,
  titulo,
  categoria,
  tipo,
  estado
`;

// =======================================
// DATOS PRIVADOS: ADMINISTRADOR
// =======================================

const CAMPOS_ADMIN = `
  o.*,
  u.nombre AS nombre_usuario
`;

// =======================================
// VALIDAR OBJETO DEL ADMINISTRADOR
// =======================================

function validarObjeto(body) {

  const {
    tipo,
    titulo,
    categoria,
    descripcion,
    lugar,
    fecha_evento,
    marca,
    color,
    tipo_conexion,
    caracteristicas_privadas
  } = body;

  if (!["perdido", "encontrado"].includes(tipo)) {
    return "Tipo de objeto incorrecto";
  }

  if (
    typeof titulo !== "string" ||
    titulo.trim().length < 3 ||
    titulo.trim().length > 120
  ) {
    return "Escribe un nombre genérico de 3 a 120 caracteres";
  }

  if (!categorias.includes(categoria)) {
    return "Categoría incorrecta";
  }

  if (
    typeof descripcion !== "string" ||
    descripcion.trim().length < 10 ||
    descripcion.trim().length > 2000
  ) {
    return "La descripción debe tener entre 10 y 2000 caracteres";
  }

  if (
    typeof lugar !== "string" ||
    lugar.trim().length < 3 ||
    lugar.trim().length > 150
  ) {
    return "Lugar incorrecto";
  }

  if (
    typeof fecha_evento !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha_evento)
  ) {
    return "Fecha incorrecta";
  }

  const fecha = new Date(fecha_evento + "T00:00:00Z");

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== fecha_evento ||
    fecha_evento > new Date().toISOString().slice(0, 10)
  ) {
    return "Fecha no válida";
  }

  for (const dato of [
    marca,
    color,
    tipo_conexion
  ]) {
    if (
      typeof dato !== "string" ||
      dato.trim().length < 2 ||
      dato.trim().length > 100
    ) {
      return "Completa marca, color y tipo o característica técnica";
    }
  }

  if (
    typeof caracteristicas_privadas !== "string" ||
    caracteristicas_privadas.trim().length < 10 ||
    caracteristicas_privadas.length > 2000
  ) {
    return "Describe las características privadas del objeto";
  }

  return null;
}

// =======================================
// PUBLICAR OBJETO
// SOLO ADMINISTRADOR
// =======================================

router.post(
  "/",
  verificarToken,
  obtenerRol,
  soloAdmin,
  async (req, res) => {

    try {

      const validacion = validarObjeto(req.body);

      if (validacion) {
        return res.status(400).json({
          mensaje: validacion
        });
      }

      const {
        tipo,
        titulo,
        descripcion,
        categoria,
        lugar,
        fecha_evento,
        marca,
        color,
        tipo_conexion,
        caracteristicas_privadas
      } = req.body;

      const resultado = await pool.query(
        `
        INSERT INTO objetos (
          id_usuario,
          tipo,
          titulo,
          descripcion,
          categoria,
          lugar,
          fecha_evento,
          marca,
          color,
          tipo_conexion,
          caracteristicas_privadas
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11
        )
        RETURNING *
        `,
        [
          req.usuario.id_usuario,
          tipo,
          titulo.trim(),
          descripcion.trim(),
          categoria,
          lugar.trim(),
          fecha_evento,
          marca.trim(),
          color.trim(),
          tipo_conexion.trim(),
          caracteristicas_privadas.trim()
        ]
      );

      return res.status(201).json({
        mensaje: "Objeto registrado correctamente",
        objeto: resultado.rows[0]
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al registrar objeto"
      });
    }
  }
);

// =======================================
// LISTAR OBJETOS SEGÚN EL ROL
// =======================================

router.get(
  "/",
  verificarToken,
  obtenerRol,
  async (req, res) => {

    try {

      const {
        busqueda = "",
        tipo = "",
        categoria = "",
        estado = ""
      } = req.query;

      if (
        [busqueda, tipo, categoria, estado].some(
          valor => typeof valor !== "string"
        )
      ) {
        return res.status(400).json({
          mensaje: "Filtros incorrectos"
        });
      }

      if (busqueda.length > 120) {
        return res.status(400).json({
          mensaje: "Búsqueda demasiado larga"
        });
      }

      if (
        tipo &&
        !["perdido", "encontrado"].includes(tipo)
      ) {
        return res.status(400).json({
          mensaje: "Tipo incorrecto"
        });
      }

      if (categoria && !categorias.includes(categoria)) {
        return res.status(400).json({
          mensaje: "Categoría incorrecta"
        });
      }

      if (
        estado &&
        !["activo", "resuelto"].includes(estado)
      ) {
        return res.status(400).json({
          mensaje: "Estado incorrecto"
        });
      }

      const valores = [];
      const condiciones = [];

      if (busqueda.trim()) {
        valores.push("%" + busqueda.trim() + "%");

        // Solo se busca por campos públicos.
        condiciones.push(
          `o.titulo ILIKE $${valores.length}`
        );
      }

      if (tipo) {
        valores.push(tipo);
        condiciones.push(
          `o.tipo = $${valores.length}`
        );
      }

      if (categoria) {
        valores.push(categoria);
        condiciones.push(
          `o.categoria = $${valores.length}`
        );
      }

      if (estado) {
        valores.push(estado);
        condiciones.push(
          `o.estado = $${valores.length}`
        );
      }

      const where = condiciones.length
        ? "WHERE " + condiciones.join(" AND ")
        : "";

      let consulta;

      if (req.rolActual === "administrador") {

        consulta = `
          SELECT ${CAMPOS_ADMIN}
          FROM objetos o
          INNER JOIN usuarios u
            ON o.id_usuario = u.id_usuario
          ${where}
          ORDER BY o.fecha_publicacion DESC
          LIMIT 100
        `;

      } else {

        consulta = `
          SELECT ${CAMPOS_PUBLICOS}
          FROM objetos o
          ${where}
          ORDER BY o.fecha_publicacion DESC
          LIMIT 100
        `;

      }

      const resultado = await pool.query(
        consulta,
        valores
      );

      return res.json({
        objetos: resultado.rows
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al consultar objetos"
      });
    }
  }
);

// =======================================
// CONSULTAR OBJETO POR ID
// =======================================

router.get(
  "/:id",
  verificarToken,
  obtenerRol,
  async (req, res) => {

    try {

      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "ID incorrecto"
        });
      }

      const consulta =
        req.rolActual === "administrador"
          ? `
            SELECT ${CAMPOS_ADMIN}
            FROM objetos o
            INNER JOIN usuarios u
              ON o.id_usuario = u.id_usuario
            WHERE o.id_objeto = $1
          `
          : `
            SELECT ${CAMPOS_PUBLICOS}
            FROM objetos o
            WHERE o.id_objeto = $1
          `;

      const resultado = await pool.query(
        consulta,
        [id]
      );

      if (!resultado.rows.length) {
        return res.status(404).json({
          mensaje: "Objeto no encontrado"
        });
      }

      return res.json({
        objeto: resultado.rows[0]
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al consultar objeto"
      });
    }
  }
);

// =======================================
// ACTUALIZAR ESTADO
// SOLO ADMINISTRADOR
// =======================================

router.patch(
  "/:id/estado",
  verificarToken,
  obtenerRol,
  soloAdmin,
  async (req, res) => {

    try {

      const id = Number(req.params.id);
      const { estado } = req.body;

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "ID incorrecto"
        });
      }

      if (!["activo", "resuelto"].includes(estado)) {
        return res.status(400).json({
          mensaje: "Estado incorrecto"
        });
      }

      // No se permite marcar un objeto como entregado
      // desde este endpoint. La devolución tendrá
      // su propio proceso de verificación futuro.

      if (estado === "resuelto") {
        return res.status(409).json({
          mensaje: "La resolución del objeto requiere el proceso de verificación de una etapa posterior"
        });
      }

      const resultado = await pool.query(
        `
        UPDATE objetos
        SET
          estado = $1,
          fecha_actualizacion = NOW()
        WHERE id_objeto = $2
        RETURNING *
        `,
        [estado, id]
      );

      if (!resultado.rows.length) {
        return res.status(404).json({
          mensaje: "Objeto no encontrado"
        });
      }

      return res.json({
        mensaje: "Objeto reactivado",
        objeto: resultado.rows[0]
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al actualizar objeto"
      });
    }
  }
);

// =======================================
// ELIMINAR OBJETO
// SOLO ADMINISTRADOR
// =======================================

router.delete(
  "/:id",
  verificarToken,
  obtenerRol,
  soloAdmin,
  async (req, res) => {

    try {

      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "ID incorrecto"
        });
      }

      const resultado = await pool.query(
        `
        DELETE FROM objetos
        WHERE id_objeto = $1
        RETURNING id_objeto
        `,
        [id]
      );

      if (!resultado.rows.length) {
        return res.status(404).json({
          mensaje: "Objeto no encontrado"
        });
      }

      return res.json({
        mensaje: "Objeto eliminado"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        mensaje: "Error al eliminar objeto"
      });
    }
  }
);

module.exports = router;
