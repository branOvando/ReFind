"use strict";

var express = require("express");

var bcrypt = require("bcryptjs");

var jwt = require("jsonwebtoken");

var pool = require("../db");

var router = express.Router();
/*
========================================
HU01 - REGISTRAR USUARIO
POST /api/auth/register
========================================
*/

router.post("/register", function _callee(req, res) {
  var _req$body, nombre, correo, password, correoNormalizado, usuarioExistente, passwordHash, resultado;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, nombre = _req$body.nombre, correo = _req$body.correo, password = _req$body.password;

          if (!(!nombre || !correo || !password)) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            mensaje: "Nombre, correo y contraseña son obligatorios"
          }));

        case 4:
          if (!(password.length < 6)) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            mensaje: "La contraseña debe tener mínimo 6 caracteres"
          }));

        case 6:
          correoNormalizado = correo.trim().toLowerCase();
          _context.next = 9;
          return regeneratorRuntime.awrap(pool.query("\n        SELECT id_usuario\n        FROM usuarios\n        WHERE correo = $1\n        ", [correoNormalizado]));

        case 9:
          usuarioExistente = _context.sent;

          if (!(usuarioExistente.rows.length > 0)) {
            _context.next = 12;
            break;
          }

          return _context.abrupt("return", res.status(409).json({
            mensaje: "Este correo ya está registrado"
          }));

        case 12:
          _context.next = 14;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 14:
          passwordHash = _context.sent;
          _context.next = 17;
          return regeneratorRuntime.awrap(pool.query("\n        INSERT INTO usuarios\n        (\n          nombre,\n          correo,\n          password_hash,\n          rol\n        )\n\n        VALUES ($1, $2, $3, $4)\n\n        RETURNING\n          id_usuario,\n          nombre,\n          correo,\n          rol,\n          fecha_registro\n        ", [nombre.trim(), correoNormalizado, passwordHash, "estudiante"]));

        case 17:
          resultado = _context.sent;
          return _context.abrupt("return", res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: resultado.rows[0]
          }));

        case 21:
          _context.prev = 21;
          _context.t0 = _context["catch"](0);
          console.error("Error al registrar:", _context.t0);
          return _context.abrupt("return", res.status(500).json({
            mensaje: "Error interno del servidor"
          }));

        case 25:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 21]]);
});
/*
========================================
HU02 - INICIAR SESIÓN
POST /api/auth/login
========================================
*/

router.post("/login", function _callee2(req, res) {
  var _req$body2, correo, password, correoNormalizado, resultado, usuario, passwordCorrecta, token;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body2 = req.body, correo = _req$body2.correo, password = _req$body2.password;

          if (!(!correo || !password)) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            mensaje: "Correo y contraseña son obligatorios"
          }));

        case 4:
          correoNormalizado = correo.trim().toLowerCase();
          _context2.next = 7;
          return regeneratorRuntime.awrap(pool.query("\n        SELECT *\n        FROM usuarios\n        WHERE correo = $1\n        ", [correoNormalizado]));

        case 7:
          resultado = _context2.sent;

          if (!(resultado.rows.length === 0)) {
            _context2.next = 10;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            mensaje: "Correo o contraseña incorrectos"
          }));

        case 10:
          usuario = resultado.rows[0];
          _context2.next = 13;
          return regeneratorRuntime.awrap(bcrypt.compare(password, usuario.password_hash));

        case 13:
          passwordCorrecta = _context2.sent;

          if (passwordCorrecta) {
            _context2.next = 16;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            mensaje: "Correo o contraseña incorrectos"
          }));

        case 16:
          /*
          Creamos un token JWT.
          */
          token = jwt.sign({
            id_usuario: usuario.id_usuario,
            correo: usuario.correo,
            rol: usuario.rol
          }, process.env.JWT_SECRET, {
            expiresIn: "8h"
          });
          return _context2.abrupt("return", res.json({
            mensaje: "Inicio de sesión correcto",
            token: token,
            usuario: {
              id_usuario: usuario.id_usuario,
              nombre: usuario.nombre,
              correo: usuario.correo,
              rol: usuario.rol
            }
          }));

        case 20:
          _context2.prev = 20;
          _context2.t0 = _context2["catch"](0);
          console.error("Error en login:", _context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            mensaje: "Error interno del servidor"
          }));

        case 24:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 20]]);
});
/*
========================================
HU03 - CERRAR SESIÓN
POST /api/auth/logout
========================================
*/

router.post("/logout", function (req, res) {
  return res.json({
    mensaje: "Sesión cerrada correctamente"
  });
});
module.exports = router;
//# sourceMappingURL=auth.dev.js.map
