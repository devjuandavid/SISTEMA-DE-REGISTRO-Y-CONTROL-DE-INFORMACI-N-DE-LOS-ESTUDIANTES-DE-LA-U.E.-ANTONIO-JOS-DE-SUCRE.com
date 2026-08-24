const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');

router.get('/', verificarAuth, async (req, res) => {
    try {
        const { curso_id, materia_id, fecha } = req.query;
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        let materias = [];
        let estudiantes = [];

        if (curso_id) {
            const resMat = await db.query('SELECT * FROM materias WHERE curso_id = $1', [curso_id]);
            materias = resMat.rows;
        }

        if (curso_id && materia_id && fecha) {
            const resEst = await db.query(`
                SELECT e.id, e.apellidos, e.nombres, a.estado
                FROM estudiantes e
                LEFT JOIN asistencias a ON e.id = a.estudiante_id AND a.materia_id = $1 AND a.fecha = $2
                WHERE e.curso_id = $3
                ORDER BY e.apellidos, e.nombres
            `, [materia_id, fecha, curso_id]);
            estudiantes = resEst.rows;
        }

        res.render('asistencia/index', { cursos: cursos.rows, materias, estudiantes, curso_id, materia_id, fecha });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar la asistencia');
    }
});

router.post('/guardar', verificarAuth, async (req, res) => {
    try {
        const { materia_id, fecha, asistencia, curso_id } = req.body;
        
        for (const [estudiante_id, estado] of Object.entries(asistencia)) {
            await db.query(`
                INSERT INTO asistencias (estudiante_id, materia_id, fecha, estado)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (estudiante_id, materia_id, fecha)
                DO UPDATE SET estado = EXCLUDED.estado
            `, [estudiante_id, materia_id, fecha, estado]);
        }

        res.redirect(`/asistencia?curso_id=${curso_id}&materia_id=${materia_id}&fecha=${fecha}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar la asistencia');
    }
});

module.exports = router;