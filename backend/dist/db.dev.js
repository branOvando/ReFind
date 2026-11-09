"use strict";

var _require = require("pg"),
    Pool = _require.Pool;

require("dotenv").config();

var pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
pool.on("connect", function () {
  console.log("PostgreSQL conectado correctamente");
});
pool.on("error", function (error) {
  console.error("Error de PostgreSQL:", error);
});
module.exports = pool;
//# sourceMappingURL=db.dev.js.map
