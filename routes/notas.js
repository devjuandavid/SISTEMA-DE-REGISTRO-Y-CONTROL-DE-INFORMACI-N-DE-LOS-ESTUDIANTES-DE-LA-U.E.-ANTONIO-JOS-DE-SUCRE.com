const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', async (req, res) => {
    try {
        const { curso_id, materia_id, trimestre = 1 } = req.query;

        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        const materias = await db.query('SELECT * FROM materias ORDER BY nombre');

        let estudiantes = [];
        if (curso_id && materia_id) {
            const query = `
                SELECT 
                    e.id AS estudiante_id,
                    e.apellidos,
                    e.nombres,
                    COALESCE(n.ser, 0) AS ser,
                    COALESCE(n.saber, 0) AS saber,
                    COALESCE(n.hacer, 0) AS hacer,
                    COALESCE(n.autoevaluacion, 0) AS autoevaluacion,
                    COALESCE(n.nota_trimestral, 0) AS nota_trimestral,
                    COALESCE(n.cualitativo, '') AS cualitativo
                FROM estudiantes e
                LEFT JOIN notas n ON e.id = n.estudiante_id 
                    AND n.materia_id = $2 
                    AND n.trimestre = $3
                WHERE e.curso_id = $1
                ORDER BY e.apellidos, e.nombres
            `;
            const result = await db.query(query, [curso_id, materia_id, trimestre]);
            estudiantes = result.rows;
        }

        // Si tu vista está en views/notas/index.ejs usas 'notas/index'
        res.render('notas/index', {
            cursos: cursos.rows,
            materias: materias.rows,
            estudiantes,
            curso_id: curso_id || '',
            materia_id: materia_id || '',
            trimestre
        });
    } catch (err) {
        console.error('Error al cargar notas:', err);
        res.status(500).send('Error al cargar cuadro de notas');
    }
});

module.exports = router;