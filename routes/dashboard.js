const express = require('express');
const router = express.Router();
const db = require('../database/db');

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

router.get('/', requireAuth, async (req, res) => {
    try {
        const totalEstudiantes = await db.query('SELECT COUNT(*) FROM estudiantes');
        const totalCursos = await db.query('SELECT COUNT(*) FROM cursos');
        const totalMaterias = await db.query('SELECT COUNT(*) FROM materias');

        res.render('dashboard', {
            totales: {
                estudiantes: totalEstudiantes.rows[0].count,
                cursos: totalCursos.rows[0].count,
                materias: totalMaterias.rows[0].count
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar el dashboard");
    }
});

module.exports = router;