const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Cargar pantalla de notas
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
        res.status(500).send('Error interno al cargar la sección de notas: ' + err.message);
    }
});

// Guardar/Actualizar notas
router.post('/guardar', async (req, res) => {
    try {
        const { curso_id, materia_id, trimestre, notas } = req.body;

        if (notas && typeof notas === 'object') {
            for (const estudiante_id in notas) {
                const data = notas[estudiante_id];
                const ser = parseFloat(data.ser) || 0;
                const saber = parseFloat(data.saber) || 0;
                const hacer = parseFloat(data.hacer) || 0;
                const autoevaluacion = parseFloat(data.autoevaluacion) || 0;
                const nota_trimestral = ser + saber + hacer + autoevaluacion;
                const cualitativo = data.cualitativo || '';

                await db.query(`
                    INSERT INTO notas (estudiante_id, materia_id, trimestre, ser, saber, hacer, autoevaluacion, nota_trimestral, cualitativo)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (estudiante_id, materia_id, trimestre) DO UPDATE SET
                        ser = EXCLUDED.ser,
                        saber = EXCLUDED.saber,
                        hacer = EXCLUDED.hacer,
                        autoevaluacion = EXCLUDED.autoevaluacion,
                        nota_trimestral = EXCLUDED.nota_trimestral,
                        cualitativo = EXCLUDED.cualitativo
                `, [estudiante_id, materia_id, trimestre, ser, saber, hacer, autoevaluacion, nota_trimestral, cualitativo]);
            }
        }

        res.redirect(`/notas?curso_id=${curso_id}&materia_id=${materia_id}&trimestre=${trimestre}`);
    } catch (err) {
        console.error('Error al guardar notas:', err);
        res.status(500).send('Error al guardar las notas');
    }
});

module.exports = router;