const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', async (req, res) => {
    try {
        const { curso_id, materia_id, tipo = 'boletin' } = req.query;
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        const materias = await db.query('SELECT * FROM materias ORDER BY nombre');

        let estudiantes = [];
        if (curso_id) {
            const query = `
                SELECT e.*, 
                    COALESCE(n.ser, 0) AS ser, COALESCE(n.saber, 0) AS saber, 
                    COALESCE(n.hacer, 0) AS hacer, COALESCE(n.autoevaluacion, 0) AS autoevaluacion,
                    COALESCE(n.nota_trimestral, 0) AS nota_trimestral, COALESCE(n.cualitativo, '') AS cualitativo
                FROM estudiantes e
                LEFT JOIN notas n ON e.id = n.estudiante_id AND n.materia_id = $2
                WHERE e.curso_id = $1 ORDER BY e.apellidos, e.nombres
            `;
            const result = await db.query(query, [curso_id, materia_id || 0]);
            estudiantes = result.rows;
        }

        res.render('reportes/index', {
            cursos: cursos.rows,
            materias: materias.rows,
            estudiantes,
            curso_id: curso_id || '',
            materia_id: materia_id || '',
            tipo
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en reportes');
    }
});

module.exports = router;