const express = require("express");

const pool =
  require("../db");

const verificarToken =
  require("../middleware/auth");


const router =
  express.Router();


/*
========================================
CONSULTAR PERFIL
GET /api/users/me
========================================
*/

router.get(
  "/me",
  verificarToken,
  async (req, res) => {

    try {

      const idUsuario =
        req.usuario.id_usuario;


      const resultado =
        await pool.query(
          `
          SELECT
            id_usuario,
            nombre,
            correo,
            rol,
            fecha_registro

          FROM usuarios

          WHERE id_usuario = $1
          `,
          [idUsuario]
        );


      if (
        resultado.rows.length === 0
      ) {

        return res.status(404).json({
          mensaje:
            "Usuario no encontrado"
        });

      }


      return res.json({

        usuario:
          resultado.rows[0]

      });


    } catch (error) {

      console.error(
        "Error al consultar perfil:",
        error
      );


      return res.status(500).json({
        mensaje:
          "Error interno del servidor"
      });

    }

  }
);


/*
========================================
HU05 - EDITAR PERFIL
PUT /api/users/me
========================================
*/

router.put(
  "/me",
  verificarToken,
  async (req, res) => {

    try {

      const idUsuario =
        req.usuario.id_usuario;


      const {
        nombre,
        correo
      } = req.body;


      if (!nombre || !correo) {

        return res.status(400).json({
          mensaje:
            "Nombre y correo son obligatorios"
        });

      }


      const correoNormalizado =
        correo.trim().toLowerCase();


      /*
      Comprobar si el nuevo correo
      pertenece a otro usuario.
      */

      const correoExistente =
        await pool.query(
          `
          SELECT id_usuario

          FROM usuarios

          WHERE correo = $1
          AND id_usuario <> $2
          `,
          [
            correoNormalizado,
            idUsuario
          ]
        );


      if (
        correoExistente.rows.length > 0
      ) {

        return res.status(409).json({
          mensaje:
            "Este correo ya pertenece a otro usuario"
        });

      }


      const resultado =
        await pool.query(
          `
          UPDATE usuarios

          SET
            nombre = $1,
            correo = $2

          WHERE id_usuario = $3

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
            idUsuario
          ]
        );


      return res.json({

        mensaje:
          "Perfil actualizado correctamente",

        usuario:
          resultado.rows[0]

      });


    } catch (error) {

      console.error(
        "Error al actualizar:",
        error
      );


      return res.status(500).json({
        mensaje:
          "Error interno del servidor"
      });

    }

  }
);


module.exports = router;