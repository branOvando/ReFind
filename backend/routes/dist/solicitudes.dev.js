"use strict";

var express = require("express");

var pool = require("../db");

var verificarToken = require("../middleware/auth");

var router = express.Router(); // =======================================
// VERIFICACIÓN DE ROLES
// =======================================

function requiereRol(rol) {
  return function _callee(req, res, next) {
    var resultado;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return regeneratorRuntime.awrap(pool.query("SELECT rol FROM usuarios WHERE id_usuario = $1", [req.usuario.id_usuario]));

          case 3:
            resultado = _context.sent;

            if (!(!resultado.rows.length || resultado.rows[0].rol !== rol)) {
              _context.next = 6;
              break;
            }

            return _context.abrupt("return", res.status(403).json({
              mensaje: "No tienes permiso"
            }));

          case 6:
            next();
            _context.next = 13;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](0);
            console.error(_context.t0);
            res.status(500).json({
              mensaje: "Error de autorización"
            });

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[0, 9]]);
  };
} // =======================================
// VALIDACIÓN DE DESCRIPCIÓN
// =======================================


function validarDescripcion(body) {
  var id_objeto = body.id_objeto,
      marca_declarada = body.marca_declarada,
      color_declarado = body.color_declarado,
      tipo_conexion_declarado = body.tipo_conexion_declarado,
      lugar_perdida = body.lugar_perdida,
      fecha_perdida = body.fecha_perdida,
      descripcion_propiedad = body.descripcion_propiedad;

  if (!Number.isSafeInteger(Number(id_objeto)) || Number(id_objeto) <= 0) {
    return "Selecciona un objeto";
  }

  var campos = [marca_declarada, color_declarado, tipo_conexion_declarado, lugar_perdida];

  if (campos.some(function (valor) {
    return typeof valor !== "string" || valor.trim().length < 2 || valor.trim().length > 150;
  })) {
    return "Completa marca, color, tipo y lugar";
  }

  if (typeof fecha_perdida !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_perdida)) {
    return "Fecha incorrecta";
  }

  var fecha = new Date(fecha_perdida + "T00:00:00Z");

  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== fecha_perdida || fecha_perdida > new Date().toISOString().slice(0, 10)) {
    return "Fecha no válida";
  }

  if (typeof descripcion_propiedad !== "string" || descripcion_propiedad.trim().length < 15 || descripcion_propiedad.length > 2000) {
    return "Describe características adicionales (mínimo 15 caracteres)";
  }

  return null;
} // =======================================
// REGISTRAR DESCRIPCIÓN DEL ESTUDIANTE
// POST /api/solicitudes
// =======================================


router.post("/", verificarToken, requiereRol("estudiante"), function _callee2(req, res) {
  var validacion, _req$body, id_objeto, marca_declarada, color_declarado, tipo_conexion_declarado, lugar_perdida, fecha_perdida, descripcion_propiedad, idObjeto, objeto, resultado;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          validacion = validarDescripcion(req.body);

          if (!validacion) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            mensaje: validacion
          }));

        case 4:
          _req$body = req.body, id_objeto = _req$body.id_objeto, marca_declarada = _req$body.marca_declarada, color_declarado = _req$body.color_declarado, tipo_conexion_declarado = _req$body.tipo_conexion_declarado, lugar_perdida = _req$body.lugar_perdida, fecha_perdida = _req$body.fecha_perdida, descripcion_propiedad = _req$body.descripcion_propiedad;
          idObjeto = Number(id_objeto);
          _context2.next = 8;
          return regeneratorRuntime.awrap(pool.query("\n        SELECT id_objeto\n        FROM objetos\n        WHERE id_objeto = $1\n          AND tipo = 'encontrado'\n          AND estado = 'activo'\n        ", [idObjeto]));

        case 8:
          objeto = _context2.sent;

          if (objeto.rows.length) {
            _context2.next = 11;
            break;
          }

          return _context2.abrupt("return", res.status(404).json({
            mensaje: "Objeto no disponible"
          }));

        case 11:
          _context2.next = 13;
          return regeneratorRuntime.awrap(pool.query("\n        INSERT INTO solicitudes (\n          id_objeto,\n          id_usuario,\n          marca_declarada,\n          color_declarado,\n          tipo_conexion_declarado,\n          lugar_perdida,\n          fecha_perdida,\n          descripcion_propiedad,\n          estado\n        )\n        VALUES (\n          $1, $2, $3, $4, $5,\n          $6, $7, $8, 'pendiente'\n        )\n        ON CONFLICT (id_objeto, id_usuario)\n        DO NOTHING\n        RETURNING id_solicitud, estado\n        ", [idObjeto, req.usuario.id_usuario, marca_declarada.trim(), color_declarado.trim(), tipo_conexion_declarado.trim(), lugar_perdida.trim(), fecha_perdida, descripcion_propiedad.trim()]));

        case 13:
          resultado = _context2.sent;

          if (resultado.rows.length) {
            _context2.next = 16;
            break;
          }

          return _context2.abrupt("return", res.status(409).json({
            mensaje: "Ya describiste este objeto anteriormente"
          }));

        case 16:
          return _context2.abrupt("return", res.status(201).json({
            mensaje: "Descripción guardada. La comparación se implementará en un próximo Sprint.",
            solicitud: resultado.rows[0]
          }));

        case 19:
          _context2.prev = 19;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            mensaje: "Error al registrar descripción"
          }));

        case 23:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 19]]);
}); // =======================================
// MIS DESCRIPCIONES - ESTUDIANTE
// =======================================

router.get("/mis-solicitudes", verificarToken, requiereRol("estudiante"), function _callee3(req, res) {
  var resultado;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(pool.query("\n        SELECT\n          s.id_solicitud,\n          s.id_objeto,\n          s.marca_declarada,\n          s.color_declarado,\n          s.tipo_conexion_declarado,\n          s.lugar_perdida,\n          s.fecha_perdida,\n          s.descripcion_propiedad,\n          s.estado,\n          s.fecha_solicitud,\n          o.titulo AS objeto_titulo,\n          o.categoria\n        FROM solicitudes s\n        JOIN objetos o\n          ON o.id_objeto = s.id_objeto\n        WHERE s.id_usuario = $1\n        ORDER BY s.fecha_solicitud DESC\n        ", [req.usuario.id_usuario]));

        case 3:
          resultado = _context3.sent;
          return _context3.abrupt("return", res.json({
            solicitudes: resultado.rows
          }));

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          console.error(_context3.t0);
          return _context3.abrupt("return", res.status(500).json({
            mensaje: "Error al consultar descripciones"
          }));

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // =======================================
// TODAS LAS DESCRIPCIONES - ADMINISTRADOR
// =======================================

router.get("/", verificarToken, requiereRol("administrador"), function _callee4(req, res) {
  var resultado;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return regeneratorRuntime.awrap(pool.query("\n        SELECT\n          s.*,\n          o.titulo AS objeto_titulo,\n          o.categoria,\n          u.nombre AS estudiante_nombre,\n          u.correo AS estudiante_correo\n        FROM solicitudes s\n        JOIN objetos o\n          ON o.id_objeto = s.id_objeto\n        JOIN usuarios u\n          ON u.id_usuario = s.id_usuario\n        ORDER BY s.fecha_solicitud DESC\n        "));

        case 3:
          resultado = _context4.sent;
          return _context4.abrupt("return", res.json({
            solicitudes: resultado.rows
          }));

        case 7:
          _context4.prev = 7;
          _context4.t0 = _context4["catch"](0);
          console.error(_context4.t0);
          return _context4.abrupt("return", res.status(500).json({
            mensaje: "Error al consultar solicitudes"
          }));

        case 11:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // =======================================
// EL ENDPOINT DE APROBACIÓN YA NO EXISTE.
// SE IMPLEMENTARÁ JUNTO CON ENTREVISTAS.
// =======================================

module.exports = router;
//# sourceMappingURL=solicitudes.dev.js.map
