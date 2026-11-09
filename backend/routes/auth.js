const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../db");

const router = express.Router();


/*
========================================
HU01 - REGISTRAR USUARIO
POST /api/auth/register
========================================
*/

router.post("/register", async (req, res) => {

  try {

    const {
      nombre,
      correo,
      password
    } = req.body;


    if (!nombre || !correo || !password) {

      return res.status(400).json({
        mensaje:
          "Nombre, correo y contraseña son obligatorios"
      });

    }


    if (password.length < 6) {

      return res.status(400).json({
        mensaje:
          "La contraseña debe tener mínimo 6 caracteres"
      });

    }


    const correoNormalizado =
      correo.trim().toLowerCase();


    const usuarioExistente =
      await pool.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE correo = $1
        `,
        [correoNormalizado]
      );


    if (usuarioExistente.rows.length > 0) {

      return res.status(409).json({
        mensaje:
          "Este correo ya está registrado"
      });

    }


    /*
    Convertimos la contraseña
    en un hash.
    */

    const passwordHash =
      await bcrypt.hash(password, 10);


    const resultado =
      await pool.query(
        `
        INSERT INTO usuarios
        (
          nombre,
          correo,
          password_hash,
          rol
        )

        VALUES ($1, $2, $3, $4)

        RETURNING
          id_usuario,
          nombre,
          correo,
          rol,
          fecha_registro
        `,
        [
          nombre.trim(),
          correoNormalizado,
          passwordHash,
          "estudiante"
        ]
      );


    return res.status(201).json({

      mensaje:
        "Usuario registrado correctamente",

      usuario:
        resultado.rows[0]

    });


  } catch (error) {

    console.error(
      "Error al registrar:",
      error
    );


    return res.status(500).json({
      mensaje:
        "Error interno del servidor"
    });

  }

});


/*
========================================
HU02 - INICIAR SESIÓN
POST /api/auth/login
========================================
*/

router.post("/login", async (req, res) => {

  try {

    const {
      correo,
      password
    } = req.body;


    if (!correo || !password) {

      return res.status(400).json({
        mensaje:
          "Correo y contraseña son obligatorios"
      });

    }


    const correoNormalizado =
      correo.trim().toLowerCase();


    const resultado =
      await pool.query(
        `
        SELECT *
        FROM usuarios
        WHERE correo = $1
        `,
        [correoNormalizado]
      );


    if (resultado.rows.length === 0) {

      return res.status(401).json({
        mensaje:
          "Correo o contraseña incorrectos"
      });

    }


    const usuario =
      resultado.rows[0];


    const passwordCorrecta =
      await bcrypt.compare(
        password,
        usuario.password_hash
      );


    if (!passwordCorrecta) {

      return res.status(401).json({
        mensaje:
          "Correo o contraseña incorrectos"
      });

    }


    /*
    Creamos un token JWT.
    */

    const token =
      jwt.sign(
        {
          id_usuario:
            usuario.id_usuario,

          correo:
            usuario.correo,

          rol:
            usuario.rol
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "8h"
        }
      );


    return res.json({

      mensaje:
        "Inicio de sesión correcto",

      token,

      usuario: {

        id_usuario:
          usuario.id_usuario,

        nombre:
          usuario.nombre,

        correo:
          usuario.correo,

        rol:
          usuario.rol

      }

    });


  } catch (error) {

    console.error(
      "Error en login:",
      error
    );


    return res.status(500).json({
      mensaje:
        "Error interno del servidor"
    });

  }

});


/*
========================================
HU03 - CERRAR SESIÓN
POST /api/auth/logout
========================================
*/

router.post("/logout", (req, res) => {

  return res.json({
    mensaje:
      "Sesión cerrada correctamente"
  });

});


module.exports = router;