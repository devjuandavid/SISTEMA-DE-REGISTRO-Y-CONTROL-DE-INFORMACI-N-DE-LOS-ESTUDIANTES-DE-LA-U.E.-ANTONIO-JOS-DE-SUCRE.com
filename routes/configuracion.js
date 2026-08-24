const express = require('express');
const router = express.Router();
const db = require('../database/db');

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

// Vista principal de configuración
router.get('/', requireAuth, async (req, res) => {
    try {
        const cursos = await db.query('SELECT * FROM cursos ORDER BY id DESC');
        const materias = await db.query('SELECT * FROM materias ORDER BY id DESC');
        res.render('configuracion/index', { cursos: cursos.rows, materias: materias.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar la configuración");
    }
});

// Guardar Curso y Turno
router.post('/cursos', requireAuth, async (req, res) => {
    const { nivel, grado, paralelo, turno } = req.body;
    try {
        await db.query(
            'INSERT INTO cursos (nivel, grado, paralelo, turno) VALUES ($1, $2, $3, $4)',
            [nivel, grado, paralelo, turno]
        );
        res.redirect('/configuracion');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al guardar el curso");
    }
});

// Guardar Materia y Área
router.post('/materias', requireAuth, async (req, res) => {
    const { nombre, area } = req.body;
    try {
        await db.query(
            'INSERT INTO materias (nombre, area) VALUES ($1, $2)',
            [nombre, area]
        );
        res.redirect('/configuracion');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al guardar la materia");
    }
});

module.exports = router;