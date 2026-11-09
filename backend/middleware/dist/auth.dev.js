"use strict";

var jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  var authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      mensaje: "Debes iniciar sesión"
    });
  }

  var partes = authorization.split(" ");

  if (partes.length !== 2 || partes[0] !== "Bearer") {
    return res.status(401).json({
      mensaje: "Token incorrecto"
    });
  }

  var token = partes[1];

  try {
    var usuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: "Sesión inválida o expirada"
    });
  }
}

module.exports = verificarToken;
//# sourceMappingURL=auth.dev.js.map
