const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');

router.get('/', verificarAuth, async (req, res) => {
    try {
        const { curso_id, materia_id, trimestre } = req.query;
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        let materias = [];
        let estudiantes = [];

        if (curso_id) {
            const resMat = await db.query('SELECT * FROM materias WHERE curso_id = $1', [curso_id]);
            materias = resMat.rows;
        }

        if (curso_id && materia_id && trimestre) {
            const resEst = await db.query(`
                SELECT e.id, e.apellidos, e.nombres, 
                       COALESCE(n.saber, 0) as saber, COALESCE(n.hacer, 0) as hacer, 
                       COALESCE(n.ser, 0) as ser, COALESCE(n.decidir, 0) as decidir, 
                       COALESCE(n.autoevaluacion, 0) as autoevaluacion, COALESCE(n.nota_final, 0) as nota_final
                FROM estudiantes e
                LEFT JOIN notas n ON e.id = n.estudiante_id AND n.materia_id = $1 AND n.trimestre = $2
                WHERE e.curso_id = $3
                ORDER BY e.apellidos, e.nombres
            `, [materia_id, trimestre, curso_id]);
            estudiantes = resEst.rows;
        }

        res.render('notas/index', { cursos: cursos.rows, materias, estudiantes, curso_id, materia_id, trimestre });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en centralizador de notas');
    }
});

router.post('/guardar', verificarAuth, async (req, res) => {
    try {
        const { materia_id, trimestre, notas, curso_id } = req.body;

        for (const [estudiante_id, datos] of Object.entries(notas)) {
            const saber = parseFloat(datos.saber) || 0;
            const hacer = parseFloat(datos.hacer) || 0;
            const ser = parseFloat(datos.ser) || 0;
            const decidir = parseFloat(datos.decidir) || 0;
            const autoevaluacion = parseFloat(datos.autoevaluacion) || 0;
            const nota_final = saber + hacer + ser + decidir + autoevaluacion;

            await db.query(`
                INSERT INTO notas (estudiante_id, materia_id, trimestre, saber, hacer, ser, decidir, autoevaluacion, nota_final)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (estudiante_id, materia_id, trimestre)
                DO UPDATE SET saber = $4, hacer = $5, ser = $6, decidir = $7, autoevaluacion = $8, nota_final = $9
            `, [estudiante_id, materia_id, trimestre, saber, hacer, ser, decidir, autoevaluacion, nota_final]);
        }

        res.redirect(`/notas?curso_id=${curso_id}&materia_id=${materia_id}&trimestre=${trimestre}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al guardar las notas');
    }
});

module.exports = router;