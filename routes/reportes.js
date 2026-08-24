const express = require('express');
const router = express.Router();
const db = require('../database/db');

const auth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT e.rude, e.ci, e.nombres, e.apellidos, e.estado, c.grado, c.paralelo, c.turno
            FROM estudiantes e
            LEFT JOIN cursos c ON e.curso_id = c.id
            ORDER BY e.apellidos ASC
        `);
        res.render('reportes/index', { estudiantes: result.rows });
    } catch (err) {
        res.render('reportes/index', { estudiantes: [] });
    }
});

module.exports = router;