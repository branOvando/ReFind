"use strict";

var express = require("express");

var pool = require("../db");

var verificarToken = require("../middleware/auth");

var router = express.Router(); // ======================================
// VERIFICAR ADMINISTRADOR
// ======================================

router.use(verificarToken);
router.use(function _callee(req, res, next) {
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

          if (!(resultado.rows.length === 0 || resultado.rows[0].rol !== "administrador")) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(403).json({
            mensaje: "Solo administradores"
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
            mensaje: "Error al verificar permisos"
          });

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 9]]);
}); // ======================================
// ESTADÍSTICAS
// GET /api/admin/estadisticas
// ======================================

router.get("/estadisticas", function _callee2(req, res) {
  var resultado;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(pool.query("\n      SELECT\n\n        (SELECT COUNT(*) FROM usuarios)\n          AS total_usuarios,\n\n        (SELECT COUNT(*) FROM objetos)\n          AS total_objetos,\n\n        (SELECT COUNT(*) FROM objetos\n         WHERE tipo = 'perdido')\n          AS objetos_perdidos,\n\n        (SELECT COUNT(*) FROM objetos\n         WHERE tipo = 'encontrado')\n          AS objetos_encontrados,\n\n        (SELECT COUNT(*) FROM objetos\n         WHERE estado = 'activo')\n          AS objetos_activos,\n\n        (SELECT COUNT(*) FROM objetos\n         WHERE estado = 'resuelto')\n          AS objetos_resueltos,\n\n        (SELECT COUNT(*) FROM solicitudes\n         WHERE estado = 'pendiente')\n          AS solicitudes_pendientes,\n\n        (SELECT COUNT(*) FROM solicitudes\n         WHERE estado = 'aprobada')\n          AS solicitudes_aprobadas\n      "));

        case 3:
          resultado = _context2.sent;
          res.json({
            estadisticas: resultado.rows[0]
          });
          _context2.next = 11;
          break;

        case 7:
          _context2.prev = 7;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          res.status(500).json({
            mensaje: "Error al consultar estadísticas"
          });

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // ======================================
// USUARIOS
// GET /api/admin/usuarios
// ======================================

router.get("/usuarios", function _callee3(req, res) {
  var resultado;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(pool.query("\n      SELECT\n        id_usuario,\n        nombre,\n        correo,\n        rol,\n        fecha_registro\n      FROM usuarios\n      ORDER BY id_usuario DESC\n      "));

        case 3:
          resultado = _context3.sent;
          res.json({
            usuarios: resultado.rows
          });
          _context3.next = 11;
          break;

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          console.error(_context3.t0);
          res.status(500).json({
            mensaje: "Error al consultar usuarios"
          });

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
module.exports = router;
//# sourceMappingURL=admin.dev.js.map
