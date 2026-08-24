const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth, esAdmin } = require('../middleware/auth');

router.get('/', verificarAuth, esAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.render('profesores/index', { profesores: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar profesores');
    }
});

router.post('/nuevo', verificarAuth, esAdmin, async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        await db.query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4)',
            [nombre, email, password, rol || 'PROFESOR']
        );
        res.redirect('/profesores');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar usuario');
    }
});

router.get('/eliminar/:id', verificarAuth, esAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
        res.redirect('/profesores');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar usuario');
    }
});

module.exports = router;