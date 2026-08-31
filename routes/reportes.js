const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');

// Vista del Boletín de Promoción Preliminar
router.get('/boletin', verificarAuth, async (req, res) => {
    try {
        const { curso_id, trimestre } = req.query;
        const trimestreSel = trimestre || 1;

        if (!curso_id) {
            const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
            return res.render('reportes/index', { cursos: cursos.rows });
        }

        const cursoInfo = await db.query('SELECT * FROM cursos WHERE id = $1', [curso_id]);
        
        const estudiantes = await db.query(`
            SELECT e.*, 
                   ec.desarrollo_comunicacion, ec.desarrollo_conocimiento,
                   ec.desarrollo_biosicomotriz, ec.desarrollo_sociocultural
            FROM estudiantes e
            LEFT JOIN evaluaciones_cualitativas ec ON e.id = ec.estudiante_id AND ec.trimestre = $2
            WHERE e.curso_id = $1
            ORDER BY e.apellidos, e.nombres
        `, [curso_id, trimestreSel]);

        res.render('reportes/boletin_oficial', {
            curso: cursoInfo.rows[0],
            estudiantes: estudiantes.rows,
            trimestre: trimestreSel
        });
    } catch (err) {
        console.error('Error al generar boletín:', err);
        res.status(500).send('Error al generar boletín');
    }
});

// Vista de Lista RUDE Oficial
router.get('/lista-rude', verificarAuth, async (req, res) => {
    try {
        const { curso_id } = req.query;
        const cursoInfo = await db.query('SELECT * FROM cursos WHERE id = $1', [curso_id]);
        const estudiantes = await db.query('SELECT * FROM estudiantes WHERE curso_id = $1 ORDER BY apellidos, nombres', [curso_id]);

        res.render('reportes/lista_rude', {
            curso: cursoInfo.rows[0],
            estudiantes: estudiantes.rows
        });
    } catch (err) {
        console.error('Error al generar lista RUDE:', err);
        res.status(500).send('Error interno');
    }
});

module.exports = router;