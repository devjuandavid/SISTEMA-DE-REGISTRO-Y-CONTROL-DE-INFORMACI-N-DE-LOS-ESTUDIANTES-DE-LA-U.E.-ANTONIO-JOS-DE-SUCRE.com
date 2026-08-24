const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth, esAdmin } = require('../middleware/auth');

// Obtener todos los cursos
router.get('/', verificarAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        res.render('cursos/index', { cursos: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener cursos');
    }
});

// Crear nuevo curso
router.post('/nuevo', verificarAuth, esAdmin, async (req, res) => {
    try {
        const { grado, paralelo, nivel } = req.body;
        await db.query(
            'INSERT INTO cursos (grado, paralelo, nivel) VALUES ($1, $2, $3)',
            [grado, paralelo, nivel]
        );
        res.redirect('/cursos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear curso');
    }
});

// Eliminar curso
router.get('/eliminar/:id', verificarAuth, esAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM cursos WHERE id = $1', [req.params.id]);
        res.redirect('/cursos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar curso');
    }
});

module.exports = router;