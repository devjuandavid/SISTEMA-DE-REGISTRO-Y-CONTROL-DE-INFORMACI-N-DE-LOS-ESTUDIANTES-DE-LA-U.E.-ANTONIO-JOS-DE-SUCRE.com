const express = require('express');
const router = express.Router();
const db = require('../database/db');

const auth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

router.get('/', auth, async (req, res) => {
    const { buscar, estado } = req.query;
    let sql = `SELECT e.*, c.grado, c.paralelo, c.turno 
               FROM estudiantes e 
               LEFT JOIN cursos c ON e.curso_id = c.id WHERE 1=1`;
    let params = [];

    if (buscar) {
        sql += ` AND (e.nombres ILIKE $${params.length + 1} OR e.apellidos ILIKE $${params.length + 1} OR e.rude ILIKE $${params.length + 1} OR e.ci ILIKE $${params.length + 1})`;
        params.push(`%${buscar}%`);
    }

    if (estado) {
        sql += ` AND e.estado = $${params.length + 1}`;
        params.push(estado);
    }

    sql += ` ORDER BY e.apellidos ASC`;

    try {
        const result = await db.query(sql, params);
        res.render('estudiantes/index', { estudiantes: result.rows, buscar: buscar || '', estado: estado || '' });
    } catch (err) {
        res.render('estudiantes/index', { estudiantes: [], buscar: '', estado: '' });
    }
});

router.get('/nuevo', auth, async (req, res) => {
    try {
        const cursos = await db.query('SELECT * FROM cursos');
        res.render('estudiantes/nuevo', { cursos: cursos.rows, error: null });
    } catch (err) {
        res.redirect('/estudiantes');
    }
});

router.post('/nuevo', auth, async (req, res) => {
    const { rude, ci, nombres, apellidos, genero, fecha_nacimiento, lugar_nacimiento, curso_id, estado } = req.body;

    try {
        await db.query(`
            INSERT INTO estudiantes (rude, ci, nombres, apellidos, genero, fecha_nacimiento, lugar_nacimiento, curso_id, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [rude, ci, nombres, apellidos, genero, fecha_nacimiento, lugar_nacimiento, curso_id, estado]);

        res.redirect('/estudiantes');
    } catch (err) {
        const cursos = await db.query('SELECT * FROM cursos');
        res.render('estudiantes/nuevo', { cursos: cursos.rows, error: 'El RUDE o CI introducido ya existe.' });
    }
});

module.exports = router;