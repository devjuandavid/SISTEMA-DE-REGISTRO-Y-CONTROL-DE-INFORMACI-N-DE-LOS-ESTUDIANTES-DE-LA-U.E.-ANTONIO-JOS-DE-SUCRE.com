const express = require('express');
const router = express.Router();
const db = require('../database/db');

const auth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

router.get('/', auth, async (req, res) => {
    const { curso_id, fecha } = req.query;
    try {
        const cursos = await db.query('SELECT * FROM cursos');
        let estudiantes = [];
        let resumen = { presentes: 0, faltas: 0, atrasos: 0 };

        if (curso_id && fecha) {
            const resEst = await db.query(`
                SELECT e.id, e.nombres, e.apellidos, COALESCE(a.estado, 'Presente') as estado_asistencia
                FROM estudiantes e
                LEFT JOIN asistencia a ON e.id = a.estudiante_id AND a.fecha = $1
                WHERE e.curso_id = $2 AND e.estado = 'Activo'
                ORDER BY e.apellidos ASC
            `, [fecha, curso_id]);

            estudiantes = resEst.rows;

            estudiantes.forEach(est => {
                if (est.estado_asistencia === 'Presente') resumen.presentes++;
                if (est.estado_asistencia === 'Falta') resumen.faltas++;
                if (est.estado_asistencia === 'Atraso') resumen.atrasos++;
            });
        }

        res.render('asistencia/index', { 
            cursos: cursos.rows, 
            estudiantes, 
            curso_id: curso_id || '', 
            fecha: fecha || new Date().toISOString().split('T')[0],
            resumen
        });
    } catch (err) {
        res.redirect('/dashboard');
    }
});

router.post('/guardar', auth, async (req, res) => {
    const { fecha, asistencia } = req.body; 

    try {
        if (asistencia) {
            for (const estudiante_id in asistencia) {
                const estado = asistencia[estudiante_id];
                
                await db.query(`
                    INSERT INTO asistencia (estudiante_id, fecha, estado)
                    VALUES ($1, $2, $3)
                    ON CONFLICT DO NOTHING
                `, [estudiante_id, fecha, estado]);
            }
        }
        res.redirect('/asistencia');
    } catch (err) {
        res.redirect('/asistencia');
    }
});

module.exports = router;