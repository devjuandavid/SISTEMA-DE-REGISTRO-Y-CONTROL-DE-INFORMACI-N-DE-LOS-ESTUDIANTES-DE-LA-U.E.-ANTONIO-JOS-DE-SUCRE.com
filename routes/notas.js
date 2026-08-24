const express = require('express');
const router = express.Router();
const db = require('../database/db');

const auth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

router.get('/', auth, async (req, res) => {
    const { curso_id, materia_id, periodo } = req.query;
    try {
        const cursos = await db.query('SELECT * FROM cursos');
        const materias = await db.query('SELECT * FROM materias');
        let estudiantes = [];

        if (curso_id && materia_id && periodo) {
            const resEst = await db.query(`
                SELECT e.id, e.nombres, e.apellidos, COALESCE(n.nota, 0) as nota
                FROM estudiantes e
                LEFT JOIN notas n ON e.id = n.estudiante_id AND n.materia_id = $1 AND n.periodo = $2
                WHERE e.curso_id = $3 AND e.estado = 'Activo'
                ORDER BY e.apellidos ASC
            `, [materia_id, periodo, curso_id]);

            estudiantes = resEst.rows;
        }

        res.render('notas/index', {
            cursos: cursos.rows,
            materias: materias.rows,
            estudiantes,
            curso_id: curso_id || '',
            materia_id: materia_id || '',
            periodo: periodo || '1er Trimestre'
        });
    } catch (err) {
        res.redirect('/dashboard');
    }
});

router.post('/guardar', auth, async (req, res) => {
    const { materia_id, periodo, notas } = req.body;

    try {
        if (notas) {
            for (const estudiante_id in notas) {
                const notaVal = parseFloat(notas[estudiante_id]);
                if (notaVal >= 0 && notaVal <= 100) {
                    await db.query(`
                        INSERT INTO notas (estudiante_id, materia_id, periodo, nota)
                        VALUES ($1, $2, $3, $4)
                    `, [estudiante_id, materia_id, periodo, notaVal]);
                }
            }
        }
        res.redirect('/notas');
    } catch (err) {
        res.redirect('/notas');
    }
});

module.exports = router;