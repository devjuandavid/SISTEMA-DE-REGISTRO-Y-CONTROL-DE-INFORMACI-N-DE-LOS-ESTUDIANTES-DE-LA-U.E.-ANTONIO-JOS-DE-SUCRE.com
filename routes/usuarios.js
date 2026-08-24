const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');

// Listar Usuarios
router.get('/', verificarAuth, async (req, res) => {
    try {
        const usuarios = await db.query('SELECT id, nombre, usuario, email, rol FROM usuarios ORDER BY rol, nombre');
        res.render('usuarios/index', { usuarios: usuarios.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener usuarios');
    }
});

// Crear Usuario (Director / Admin / Profesor)
router.post('/crear', verificarAuth, async (req, res) => {
    try {
        const { nombre, usuario, email, password, rol } = req.body;
        await db.query(
            'INSERT INTO usuarios (nombre, usuario, email, password, rol) VALUES ($1, $2, $3, $4, $5)',
            [nombre, usuario, email, password, rol]
        );
        res.redirect('/usuarios');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear usuario');
    }
});

// Editar Usuario
router.post('/editar/:id', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, usuario, email, password, rol } = req.body;

        if (password && password.trim() !== '') {
            await db.query(
                'UPDATE usuarios SET nombre=$1, usuario=$2, email=$3, password=$4, rol=$5 WHERE id=$6',
                [nombre, usuario, email, password, rol, id]
            );
        } else {
            await db.query(
                'UPDATE usuarios SET nombre=$1, usuario=$2, email=$3, rol=$4 WHERE id=$5',
                [nombre, usuario, email, rol, id]
            );
        }
        res.redirect('/usuarios');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar usuario');
    }
});

// Eliminar Usuario
router.post('/eliminar/:id', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.redirect('/usuarios');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar usuario');
    }
});

module.exports = router;