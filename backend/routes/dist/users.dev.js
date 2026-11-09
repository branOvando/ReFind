"use strict";

var express = require("express");

var pool = require("../db");

var verificarToken = require("../middleware/auth");

var router = express.Router();
/*
========================================
CONSULTAR PERFIL
GET /api/users/me
========================================
*/

router.get("/me", verificarToken, function _callee(req, res) {
  var idUsuario, resultado;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          idUsuario = req.usuario.id_usuario;
          _context.next = 4;
          return regeneratorRuntime.awrap(pool.query("\n          SELECT\n            id_usuario,\n            nombre,\n            correo,\n            rol,\n            fecha_registro\n\n          FROM usuarios\n\n          WHERE id_usuario = $1\n          ", [idUsuario]));

        case 4:
          resultado = _context.sent;

          if (!(resultado.rows.length === 0)) {
            _context.next = 7;
            break;
          }

          return _context.abrupt("return", res.status(404).json({
            mensaje: "Usuario no encontrado"
          }));

        case 7:
          return _context.abrupt("return", res.json({
            usuario: resultado.rows[0]
          }));

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.error("Error al consultar perfil:", _context.t0);
          return _context.abrupt("return", res.status(500).json({
            mensaje: "Error interno del servidor"
          }));

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
/*
========================================
HU05 - EDITAR PERFIL
PUT /api/users/me
========================================
*/

router.put("/me", verificarToken, function _callee2(req, res) {
  var idUsuario, _req$body, nombre, correo, correoNormalizado, correoExistente, resultado;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          idUsuario = req.usuario.id_usuario;
          _req$body = req.body, nombre = _req$body.nombre, correo = _req$body.correo;

          if (!(!nombre || !correo)) {
            _context2.next = 5;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            mensaje: "Nombre y correo son obligatorios"
          }));

        case 5:
          correoNormalizado = correo.trim().toLowerCase();
          /*
          Comprobar si el nuevo correo
          pertenece a otro usuario.
          */

          _context2.next = 8;
          return regeneratorRuntime.awrap(pool.query("\n          SELECT id_usuario\n\n          FROM usuarios\n\n          WHERE correo = $1\n          AND id_usuario <> $2\n          ", [correoNormalizado, idUsuario]));

        case 8:
          correoExistente = _context2.sent;

          if (!(correoExistente.rows.length > 0)) {
            _context2.next = 11;
            break;
          }

          return _context2.abrupt("return", res.status(409).json({
            mensaje: "Este correo ya pertenece a otro usuario"
          }));

        case 11:
          _context2.next = 13;
          return regeneratorRuntime.awrap(pool.query("\n          UPDATE usuarios\n\n          SET\n            nombre = $1,\n            correo = $2\n\n          WHERE id_usuario = $3\n\n          RETURNING\n            id_usuario,\n            nombre,\n            correo,\n            rol,\n            fecha_registro\n          ", [nombre.trim(), correoNormalizado, idUsuario]));

        case 13:
          resultado = _context2.sent;
          return _context2.abrupt("return", res.json({
            mensaje: "Perfil actualizado correctamente",
            usuario: resultado.rows[0]
          }));

        case 17:
          _context2.prev = 17;
          _context2.t0 = _context2["catch"](0);
          console.error("Error al actualizar:", _context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            mensaje: "Error interno del servidor"
          }));

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 17]]);
});
module.exports = router;
//# sourceMappingURL=users.dev.js.map
