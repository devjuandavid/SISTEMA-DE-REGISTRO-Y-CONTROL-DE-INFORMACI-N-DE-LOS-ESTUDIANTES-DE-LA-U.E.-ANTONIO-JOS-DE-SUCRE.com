const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');

// Vista del Centralizador / Planilla de Notas
router.get('/', verificarAuth, async (req, res) => {
    try {
        const { curso_id, materia_id, trimestre } = req.query;
        const trimestreSel = trimestre || 1;

        // Cargar listas para los selectores
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        
        let materias = [];
        let estudiantes = [];

        if (curso_id) {
            const materiasResult = await db.query(
                'SELECT * FROM materias WHERE curso_id = $1 OR curso_id IS NULL ORDER BY nombre',
                [curso_id]
            );
            materias = materiasResult.rows;

            if (materia_id) {
                // Obtener estudiantes junto con sus notas si existen
                const estudiantesResult = await db.query(`
                    SELECT e.id, e.apellidos, e.nombres, e.rude,
                           COALESCE(n.ser, 0) as ser,
                           COALESCE(n.saber, 0) as saber,
                           COALESCE(n.hacer, 0) as hacer,
                           COALESCE(n.decidir, 0) as decidir,
                           COALESCE(n.autoevaluacion, 0) as autoevaluacion,
                           COALESCE(n.nota_final, 0) as nota_final
                    FROM estudiantes e
                    LEFT JOIN notas n ON e.id = n.estudiante_id 
                         AND n.materia_id = $1 AND n.trimestre = $2
                    WHERE e.curso_id = $3
                    ORDER BY e.apellidos, e.nombres
                `, [materia_id, trimestreSel, curso_id]);

                estudiantes = estudiantesResult.rows;
            }
        }

        res.render('notas/index', {
            cursos: cursos.rows,
            materias: materias,
            estudiantes: estudiantes,
            curso_id: curso_id || '',
            materia_id: materia_id || '',
            trimestre: trimestreSel
        });
    } catch (err) {
        console.error('Error detallado en centralizador de notas:', err);
        res.status(500).send('Error al cargar la planilla de notas. Revisa que la tabla "notas" exista en PostgreSQL.');
    }
});

// Guardar Notas
router.post('/guardar', verificarAuth, async (req, res) => {
    try {
        const { curso_id, materia_id, trimestre, notas } = req.body;

        if (notas && typeof notas === 'object') {
            for (const [estudiante_id, datos] of Object.entries(notas)) {
                const ser = parseInt(datos.ser) || 0;
                const saber = parseInt(datos.saber) || 0;
                const hacer = parseInt(datos.hacer) || 0;
                const decidir = parseInt(datos.decidir) || 0;
                const autoevaluacion = parseInt(datos.autoevaluacion) || 0;
                const nota_final = ser + saber + hacer + decidir + autoevaluacion;

                await db.query(`
                    INSERT INTO notas (estudiante_id, materia_id, trimestre, ser, saber, hacer, decidir, autoevaluacion, nota_final)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (estudiante_id, materia_id, trimestre)
                    DO UPDATE SET ser=EXCLUDED.ser, saber=EXCLUDED.saber, hacer=EXCLUDED.hacer, 
                                  decidir=EXCLUDED.decidir, autoevaluacion=EXCLUDED.autoevaluacion, 
                                  nota_final=EXCLUDED.nota_final
                `, [estudiante_id, materia_id, trimestre, ser, saber, hacer, decidir, autoevaluacion, nota_final]);
            }
        }

        res.redirect(`/notas?curso_id=${curso_id}&materia_id=${materia_id}&trimestre=${trimestre}`);
    } catch (err) {
        console.error('Error al guardar notas:', err);
        res.status(500).send('Error al guardar las notas');
    }
});

module.exports = router;