"use strict";

var express = require("express");

var pool = require("../db");

var verificarToken = require("../middleware/auth");

var router = express.Router();
var categorias = ["Electrónica", "Documentos", "Accesorios", "Ropa", "Libros", "Llaves", "Otros"]; // =======================================
// VERIFICAR ROL REAL EN POSTGRESQL
// =======================================

function obtenerRol(req, res, next) {
  var resultado;
  return regeneratorRuntime.async(function obtenerRol$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(pool.query("SELECT rol FROM usuarios WHERE id_usuario = $1", [req.usuario.id_usuario]));

        case 3:
          resultado = _context.sent;

          if (resultado.rows.length) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(401).json({
            mensaje: "Usuario no encontrado"
          }));

        case 6:
          req.rolActual = resultado.rows[0].rol;
          next();
          _context.next = 14;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            mensaje: "Error al verificar usuario"
          });

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
}

function soloAdmin(req, res, next) {
  if (req.rolActual !== "administrador") {
    return res.status(403).json({
      mensaje: "Solo el administrador puede realizar esta operación"
    });
  }

  next();
} // =======================================
// DATOS PÚBLICOS: SOLO LO GENERAL
// =======================================


var CAMPOS_PUBLICOS = "\n  id_objeto,\n  titulo,\n  categoria,\n  tipo,\n  estado\n"; // =======================================
// DATOS PRIVADOS: ADMINISTRADOR
// =======================================

var CAMPOS_ADMIN = "\n  o.*,\n  u.nombre AS nombre_usuario\n"; // =======================================
// VALIDAR OBJETO DEL ADMINISTRADOR
// =======================================

function validarObjeto(body) {
  var tipo = body.tipo,
      titulo = body.titulo,
      categoria = body.categoria,
      descripcion = body.descripcion,
      lugar = body.lugar,
      fecha_evento = body.fecha_evento,
      marca = body.marca,
      color = body.color,
      tipo_conexion = body.tipo_conexion,
      caracteristicas_privadas = body.caracteristicas_privadas;

  if (!["perdido", "encontrado"].includes(tipo)) {
    return "Tipo de objeto incorrecto";
  }

  if (typeof titulo !== "string" || titulo.trim().length < 3 || titulo.trim().length > 120) {
    return "Escribe un nombre genérico de 3 a 120 caracteres";
  }

  if (!categorias.includes(categoria)) {
    return "Categoría incorrecta";
  }

  if (typeof descripcion !== "string" || descripcion.trim().length < 10 || descripcion.trim().length > 2000) {
    return "La descripción debe tener entre 10 y 2000 caracteres";
  }

  if (typeof lugar !== "string" || lugar.trim().length < 3 || lugar.trim().length > 150) {
    return "Lugar incorrecto";
  }

  if (typeof fecha_evento !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_evento)) {
    return "Fecha incorrecta";
  }

  var fecha = new Date(fecha_evento + "T00:00:00Z");

  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== fecha_evento || fecha_evento > new Date().toISOString().slice(0, 10)) {
    return "Fecha no válida";
  }

  for (var _i = 0, _arr = [marca, color, tipo_conexion]; _i < _arr.length; _i++) {
    var dato = _arr[_i];

    if (typeof dato !== "string" || dato.trim().length < 2 || dato.trim().length > 100) {
      return "Completa marca, color y tipo o característica técnica";
    }
  }

  if (typeof caracteristicas_privadas !== "string" || caracteristicas_privadas.trim().length < 10 || caracteristicas_privadas.length > 2000) {
    return "Describe las características privadas del objeto";
  }

  return null;
} // =======================================
// PUBLICAR OBJETO
// SOLO ADMINISTRADOR
// =======================================


router.post("/", verificarToken, obtenerRol, soloAdmin, function _callee(req, res) {
  var validacion, _req$body, tipo, titulo, descripcion, categoria, lugar, fecha_evento, marca, color, tipo_conexion, caracteristicas_privadas, resultado;

  return regeneratorRuntime.async(function _callee$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          validacion = validarObjeto(req.body);

          if (!validacion) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            mensaje: validacion
          }));

        case 4:
          _req$body = req.body, tipo = _req$body.tipo, titulo = _req$body.titulo, descripcion = _req$body.descripcion, categoria = _req$body.categoria, lugar = _req$body.lugar, fecha_evento = _req$body.fecha_evento, marca = _req$body.marca, color = _req$body.color, tipo_conexion = _req$body.tipo_conexion, caracteristicas_privadas = _req$body.caracteristicas_privadas;
          _context2.next = 7;
          return regeneratorRuntime.awrap(pool.query("\n        INSERT INTO objetos (\n          id_usuario,\n          tipo,\n          titulo,\n          descripcion,\n          categoria,\n          lugar,\n          fecha_evento,\n          marca,\n          color,\n          tipo_conexion,\n          caracteristicas_privadas\n        )\n        VALUES (\n          $1, $2, $3, $4, $5, $6,\n          $7, $8, $9, $10, $11\n        )\n        RETURNING *\n        ", [req.usuario.id_usuario, tipo, titulo.trim(), descripcion.trim(), categoria, lugar.trim(), fecha_evento, marca.trim(), color.trim(), tipo_conexion.trim(), caracteristicas_privadas.trim()]));

        case 7:
          resultado = _context2.sent;
          return _context2.abrupt("return", res.status(201).json({
            mensaje: "Objeto registrado correctamente",
            objeto: resultado.rows[0]
          }));

        case 11:
          _context2.prev = 11;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            mensaje: "Error al registrar objeto"
          }));

        case 15:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 11]]);
}); // =======================================
// LISTAR OBJETOS SEGÚN EL ROL
// =======================================

router.get("/", verificarToken, obtenerRol, function _callee2(req, res) {
  var _req$query, _req$query$busqueda, busqueda, _req$query$tipo, tipo, _req$query$categoria, categoria, _req$query$estado, estado, valores, condiciones, where, consulta, resultado;

  return regeneratorRuntime.async(function _callee2$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$query = req.query, _req$query$busqueda = _req$query.busqueda, busqueda = _req$query$busqueda === void 0 ? "" : _req$query$busqueda, _req$query$tipo = _req$query.tipo, tipo = _req$query$tipo === void 0 ? "" : _req$query$tipo, _req$query$categoria = _req$query.categoria, categoria = _req$query$categoria === void 0 ? "" : _req$query$categoria, _req$query$estado = _req$query.estado, estado = _req$query$estado === void 0 ? "" : _req$query$estado;

          if (![busqueda, tipo, categoria, estado].some(function (valor) {
            return typeof valor !== "string";
          })) {
            _context3.next = 4;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            mensaje: "Filtros incorrectos"
          }));

        case 4:
          if (!(busqueda.length > 120)) {
            _context3.next = 6;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            mensaje: "Búsqueda demasiado larga"
          }));

        case 6:
          if (!(tipo && !["perdido", "encontrado"].includes(tipo))) {
            _context3.next = 8;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            mensaje: "Tipo incorrecto"
          }));

        case 8:
          if (!(categoria && !categorias.includes(categoria))) {
            _context3.next = 10;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            mensaje: "Categoría incorrecta"
          }));

        case 10:
          if (!(estado && !["activo", "resuelto"].includes(estado))) {
            _context3.next = 12;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            mensaje: "Estado incorrecto"
          }));

        case 12:
          valores = [];
          condiciones = [];

          if (busqueda.trim()) {
            valores.push("%" + busqueda.trim() + "%"); // Solo se busca por campos públicos.

            condiciones.push("o.titulo ILIKE $".concat(valores.length));
          }

          if (tipo) {
            valores.push(tipo);
            condiciones.push("o.tipo = $".concat(valores.length));
          }

          if (categoria) {
            valores.push(categoria);
            condiciones.push("o.categoria = $".concat(valores.length));
          }

          if (estado) {
            valores.push(estado);
            condiciones.push("o.estado = $".concat(valores.length));
          }

          where = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";

          if (req.rolActual === "administrador") {
            consulta = "\n          SELECT ".concat(CAMPOS_ADMIN, "\n          FROM objetos o\n          INNER JOIN usuarios u\n            ON o.id_usuario = u.id_usuario\n          ").concat(where, "\n          ORDER BY o.fecha_publicacion DESC\n          LIMIT 100\n        ");
          } else {
            consulta = "\n          SELECT ".concat(CAMPOS_PUBLICOS, "\n          FROM objetos o\n          ").concat(where, "\n          ORDER BY o.fecha_publicacion DESC\n          LIMIT 100\n        ");
          }

          _context3.next = 22;
          return regeneratorRuntime.awrap(pool.query(consulta, valores));

        case 22:
          resultado = _context3.sent;
          return _context3.abrupt("return", res.json({
            objetos: resultado.rows
          }));

        case 26:
          _context3.prev = 26;
          _context3.t0 = _context3["catch"](0);
          console.error(_context3.t0);
          return _context3.abrupt("return", res.status(500).json({
            mensaje: "Error al consultar objetos"
          }));

        case 30:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 26]]);
}); // =======================================
// CONSULTAR OBJETO POR ID
// =======================================

router.get("/:id", verificarToken, obtenerRol, function _callee3(req, res) {
  var id, consulta, resultado;
  return regeneratorRuntime.async(function _callee3$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          id = Number(req.params.id);

          if (!(!Number.isSafeInteger(id) || id <= 0)) {
            _context4.next = 4;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            mensaje: "ID incorrecto"
          }));

        case 4:
          consulta = req.rolActual === "administrador" ? "\n            SELECT ".concat(CAMPOS_ADMIN, "\n            FROM objetos o\n            INNER JOIN usuarios u\n              ON o.id_usuario = u.id_usuario\n            WHERE o.id_objeto = $1\n          ") : "\n            SELECT ".concat(CAMPOS_PUBLICOS, "\n            FROM objetos o\n            WHERE o.id_objeto = $1\n          ");
          _context4.next = 7;
          return regeneratorRuntime.awrap(pool.query(consulta, [id]));

        case 7:
          resultado = _context4.sent;

          if (resultado.rows.length) {
            _context4.next = 10;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            mensaje: "Objeto no encontrado"
          }));

        case 10:
          return _context4.abrupt("return", res.json({
            objeto: resultado.rows[0]
          }));

        case 13:
          _context4.prev = 13;
          _context4.t0 = _context4["catch"](0);
          console.error(_context4.t0);
          return _context4.abrupt("return", res.status(500).json({
            mensaje: "Error al consultar objeto"
          }));

        case 17:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 13]]);
}); // =======================================
// ACTUALIZAR ESTADO
// SOLO ADMINISTRADOR
// =======================================

router.patch("/:id/estado", verificarToken, obtenerRol, soloAdmin, function _callee4(req, res) {
  var id, estado, resultado;
  return regeneratorRuntime.async(function _callee4$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          id = Number(req.params.id);
          estado = req.body.estado;

          if (!(!Number.isSafeInteger(id) || id <= 0)) {
            _context5.next = 5;
            break;
          }

          return _context5.abrupt("return", res.status(400).json({
            mensaje: "ID incorrecto"
          }));

        case 5:
          if (["activo", "resuelto"].includes(estado)) {
            _context5.next = 7;
            break;
          }

          return _context5.abrupt("return", res.status(400).json({
            mensaje: "Estado incorrecto"
          }));

        case 7:
          if (!(estado === "resuelto")) {
            _context5.next = 9;
            break;
          }

          return _context5.abrupt("return", res.status(409).json({
            mensaje: "La resolución del objeto requiere el proceso de verificación de una etapa posterior"
          }));

        case 9:
          _context5.next = 11;
          return regeneratorRuntime.awrap(pool.query("\n        UPDATE objetos\n        SET\n          estado = $1,\n          fecha_actualizacion = NOW()\n        WHERE id_objeto = $2\n        RETURNING *\n        ", [estado, id]));

        case 11:
          resultado = _context5.sent;

          if (resultado.rows.length) {
            _context5.next = 14;
            break;
          }

          return _context5.abrupt("return", res.status(404).json({
            mensaje: "Objeto no encontrado"
          }));

        case 14:
          return _context5.abrupt("return", res.json({
            mensaje: "Objeto reactivado",
            objeto: resultado.rows[0]
          }));

        case 17:
          _context5.prev = 17;
          _context5.t0 = _context5["catch"](0);
          console.error(_context5.t0);
          return _context5.abrupt("return", res.status(500).json({
            mensaje: "Error al actualizar objeto"
          }));

        case 21:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 17]]);
}); // =======================================
// ELIMINAR OBJETO
// SOLO ADMINISTRADOR
// =======================================

router["delete"]("/:id", verificarToken, obtenerRol, soloAdmin, function _callee5(req, res) {
  var id, resultado;
  return regeneratorRuntime.async(function _callee5$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          id = Number(req.params.id);

          if (!(!Number.isSafeInteger(id) || id <= 0)) {
            _context6.next = 4;
            break;
          }

          return _context6.abrupt("return", res.status(400).json({
            mensaje: "ID incorrecto"
          }));

        case 4:
          _context6.next = 6;
          return regeneratorRuntime.awrap(pool.query("\n        DELETE FROM objetos\n        WHERE id_objeto = $1\n        RETURNING id_objeto\n        ", [id]));

        case 6:
          resultado = _context6.sent;

          if (resultado.rows.length) {
            _context6.next = 9;
            break;
          }

          return _context6.abrupt("return", res.status(404).json({
            mensaje: "Objeto no encontrado"
          }));

        case 9:
          return _context6.abrupt("return", res.json({
            mensaje: "Objeto eliminado"
          }));

        case 12:
          _context6.prev = 12;
          _context6.t0 = _context6["catch"](0);
          console.error(_context6.t0);
          return _context6.abrupt("return", res.status(500).json({
            mensaje: "Error al eliminar objeto"
          }));

        case 16:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 12]]);
});
module.exports = router;
//# sourceMappingURL=objetos.dev.js.map
