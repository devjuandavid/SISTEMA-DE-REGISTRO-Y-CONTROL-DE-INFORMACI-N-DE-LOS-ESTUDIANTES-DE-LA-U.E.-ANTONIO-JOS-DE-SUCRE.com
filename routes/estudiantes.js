const express = require('express');
const router = express.Router();
const db = require('../database/db');

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

// Lista de Estudiantes
router.get('/', requireAuth, async (req, res) => {
    try {
        const estudiantes = await db.query(`
            SELECT e.*, c.grado, c.paralelo, c.turno 
            FROM estudiantes e 
            LEFT JOIN cursos c ON e.curso_id = c.id 
            ORDER BY e.apellidos ASC
        `);
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        res.render('estudiantes/index', { estudiantes: estudiantes.rows, cursos: cursos.rows });
    } catch (err) {
        res.status(500).send("Error al cargar estudiantes");
    }
});

// Registrar Estudiante RUDE
router.post('/nuevo', requireAuth, async (req, res) => {
    const { rude, ci, apellidos, nombres, genero, fecha_nacimiento, departamento, provincia, localidad, curso_id } = req.body;
    try {
        await db.query(`
            INSERT INTO estudiantes 
            (rude, ci, apellidos, nombres, genero, fecha_nacimiento, departamento, provincia, localidad, curso_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [rude, ci, apellidos, nombres, genero, fecha_nacimiento, departamento, provincia, localidad, curso_id || null]);
        res.redirect('/estudiantes');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al registrar estudiante");
    }
});

module.exports = router;