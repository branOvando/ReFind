"use strict";

var express = require("express");

var cors = require("cors");

require("dotenv").config();

var pool = require("./db");

var authRoutes = require("./routes/auth");

var userRoutes = require("./routes/users");

var objetosRoutes = require("./routes/objetos");

var solicitudesRoutes = require("./routes/solicitudes");

var adminRoutes = require("./routes/admin");

var app = express();
var PORT = process.env.PORT || 3000; // ======================================
// CONFIGURACIÓN
// ======================================

app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json({
  limit: "100kb"
})); // ======================================
// VERIFICAR CONEXIÓN
// ======================================

app.get("/api/health", function _callee(req, res) {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(pool.query("SELECT NOW()"));

        case 3:
          res.json({
            status: "ok",
            sistema: "ReFind",
            sprint: 3,
            base_datos: "conectada"
          });
          _context.next = 10;
          break;

        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            status: "error",
            sistema: "ReFind",
            base_datos: "sin conexión"
          });

        case 10:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // ======================================
// SPRINT 1
// ======================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // ======================================
// SPRINT 2
// ======================================

app.use("/api/objetos", objetosRoutes); // ======================================
// SPRINT 3
// ======================================

app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/admin", adminRoutes); // ======================================
// RUTA NO ENCONTRADA
// ======================================

app.use(function (req, res) {
  res.status(404).json({
    mensaje: "Ruta no encontrada"
  });
}); // ======================================
// ERRORES
// ======================================

app.use(function (error, req, res, next) {
  console.error(error);
  res.status(500).json({
    mensaje: "Error interno del servidor"
  });
}); // ======================================
// INICIAR SERVIDOR
// ======================================

app.listen(PORT, function () {
  console.log("");
  console.log("==================================");
  console.log("       REFIND - SPRINT 3");
  console.log("==================================");
  console.log("Servidor: http://localhost:".concat(PORT));
  console.log("API: http://localhost:".concat(PORT, "/api"));
  console.log("==================================");
});
//# sourceMappingURL=server.dev.js.map
