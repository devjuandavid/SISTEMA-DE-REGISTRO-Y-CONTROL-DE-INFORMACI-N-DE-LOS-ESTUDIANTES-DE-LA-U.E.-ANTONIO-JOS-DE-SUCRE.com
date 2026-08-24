const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth, esAdmin } = require('../middleware/auth');

// Obtener todas las materias con su profesor y curso
router.get('/', verificarAuth, async (req, res) => {
    try {
        const resultMaterias = await db.query(`
            SELECT m.*, c.grado, c.paralelo, c.nivel, u.nombre as profesor_nombre
            FROM materias m
            LEFT JOIN cursos c ON m.curso_id = c.id
            LEFT JOIN usuarios u ON m.profesor_id = u.id
            ORDER BY m.nombre ASC
        `);
        const resultCursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        const resultProfesores = await db.query("SELECT * FROM usuarios WHERE rol = 'PROFESOR' OR rol = 'ADMIN'");

        res.render('materias/index', { 
            materias: resultMaterias.rows, 
            cursos: resultCursos.rows, 
            profesores: resultProfesores.rows 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener materias');
    }
});

// Crear nueva materia
router.post('/nuevo', verificarAuth, esAdmin, async (req, res) => {
    try {
        const { nombre, curso_id, profesor_id } = req.body;
        await db.query(
            'INSERT INTO materias (nombre, curso_id, profesor_id) VALUES ($1, $2, $3)',
            [nombre, curso_id, profesor_id || null]
        );
        res.redirect('/materias');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar materia');
    }
});

// Eliminar materia
router.get('/eliminar/:id', verificarAuth, esAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM materias WHERE id = $1', [req.params.id]);
        res.redirect('/materias');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar materia');
    }
});

module.exports = router;