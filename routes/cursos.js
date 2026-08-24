const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');

// Listar Cursos
router.get('/', verificarAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        res.render('cursos/index', { cursos: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener cursos');
    }
});

// Crear Curso
router.post('/crear', verificarAuth, async (req, res) => {
    try {
        const { nivel, grado, paralelo, turno, sie } = req.body;
        await db.query(
            'INSERT INTO cursos (nivel, grado, paralelo, turno, sie) VALUES ($1, $2, $3, $4, $5)',
            [nivel, grado, paralelo, turno || 'MAÑANA', sie || '70620085']
        );
        res.redirect('/cursos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear curso');
    }
});

// Editar Curso
router.post('/editar/:id', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nivel, grado, paralelo, turno, sie } = req.body;
        await db.query(
            'UPDATE cursos SET nivel=$1, grado=$2, paralelo=$3, turno=$4, sie=$5 WHERE id=$6',
            [nivel, grado, paralelo, turno, sie, id]
        );
        res.redirect('/cursos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar curso');
    }
});

// Eliminar Curso
router.post('/eliminar/:id', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM cursos WHERE id = $1', [id]);
        res.redirect('/cursos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar curso');
    }
});

module.exports = router;