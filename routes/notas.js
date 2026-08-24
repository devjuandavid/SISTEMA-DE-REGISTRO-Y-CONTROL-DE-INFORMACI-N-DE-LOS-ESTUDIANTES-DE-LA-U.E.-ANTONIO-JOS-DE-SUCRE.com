const express = require('express');
const router = express.Router();
const db = require('../database/db');

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

router.get('/', requireAuth, async (req, res) => {
    try {
        const { curso_id, materia_id, trimestre } = req.query;
        const cursos = await db.query('SELECT * FROM cursos');
        const materias = await db.query('SELECT * FROM materias');

        let planilla = [];
        if (curso_id && materia_id && trimestre) {
            const result = await db.query(`
                SELECT e.id as estudiante_id, e.apellidos, e.nombres,
                       COALESCE(n.ser, 0) as ser,
                       COALESCE(n.saber, 0) as saber,
                       COALESCE(n.hacer, 0) as hacer,
                       COALESCE(n.autoevaluacion, 0) as autoevaluacion,
                       COALESCE(n.nota_trimestral, 0) as nota_trimestral,
                       n.cualitativo,
                       (SELECT COUNT(*) FROM asistencia a WHERE a.estudiante_id = e.id AND a.materia_id = $2 AND a.estado = 'A') as asistencia,
                       (SELECT COUNT(*) FROM asistencia a WHERE a.estudiante_id = e.id AND a.materia_id = $2 AND a.estado = 'F') as faltas,
                       (SELECT COUNT(*) FROM asistencia a WHERE a.estudiante_id = e.id AND a.materia_id = $2 AND a.estado = 'R') as retrasos,
                       (SELECT COUNT(*) FROM asistencia a WHERE a.estudiante_id = e.id AND a.materia_id = $2 AND a.estado = 'L') as licencias
                FROM estudiantes e
                LEFT JOIN notas n ON e.id = n.estudiante_id AND n.materia_id = $2 AND n.trimestre = $3
                WHERE e.curso_id = $1
                ORDER BY e.apellidos ASC
            `, [curso_id, materia_id, trimestre]);
            planilla = result.rows;
        }

        res.render('notas/index', { 
            cursos: cursos.rows, 
            materias: materias.rows, 
            planilla, 
            curso_id, 
            materia_id, 
            trimestre 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar cuadro de notas");
    }
});

// Guardar Cuadro de Evaluación
router.post('/guardar', requireAuth, async (req, res) => {
    const { curso_id, materia_id, trimestre, notas } = req.body;
    try {
        for (let estudiante_id in notas) {
            const { ser, saber, hacer, autoevaluacion, cualitativo } = notas[estudiante_id];
            await db.query(`
                INSERT INTO notas (estudiante_id, materia_id, trimestre, ser, saber, hacer, autoevaluacion, cualitativo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) DO UPDATE SET 
                    ser = EXCLUDED.ser,
                    saber = EXCLUDED.saber,
                    hacer = EXCLUDED.hacer,
                    autoevaluacion = EXCLUDED.autoevaluacion,
                    cualitativo = EXCLUDED.cualitativo;
            `, [estudiante_id, materia_id, trimestre, ser || 0, saber || 0, hacer || 0, autoevaluacion || 0, cualitativo || '']);
        }
        res.redirect(`/notas?curso_id=${curso_id}&materia_id=${materia_id}&trimestre=${trimestre}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al guardar notas");
    }
});

module.exports = router;