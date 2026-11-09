
const express = require("express");
const cors = require("cors");

require("dotenv").config();

const pool = require("./db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const objetosRoutes = require("./routes/objetos");
const solicitudesRoutes = require("./routes/solicitudes");
const adminRoutes = require("./routes/admin");

const app = express();

const PORT = process.env.PORT || 3000;


// ======================================
// CONFIGURACIÓN
// ======================================

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json({ limit: "100kb" }));


// ======================================
// VERIFICAR CONEXIÓN
// ======================================

app.get("/api/health", async (req, res) => {

  try {

    await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      sistema: "ReFind",
      sprint: 3,
      base_datos: "conectada"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      status: "error",
      sistema: "ReFind",
      base_datos: "sin conexión"
    });

  }

});


// ======================================
// SPRINT 1
// ======================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);


// ======================================
// SPRINT 2
// ======================================

app.use("/api/objetos", objetosRoutes);


// ======================================
// SPRINT 3
// ======================================

app.use("/api/solicitudes", solicitudesRoutes);

app.use("/api/admin", adminRoutes);


// ======================================
// RUTA NO ENCONTRADA
// ======================================

app.use((req, res) => {

  res.status(404).json({
    mensaje: "Ruta no encontrada"
  });

});


// ======================================
// ERRORES
// ======================================

app.use((error, req, res, next) => {

  console.error(error);

  res.status(500).json({
    mensaje: "Error interno del servidor"
  });

});


// ======================================
// INICIAR SERVIDOR
// ======================================

app.listen(PORT, () => {

  console.log("");
  console.log("==================================");
  console.log("       REFIND - SPRINT 3");
  console.log("==================================");
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log("==================================");

});
