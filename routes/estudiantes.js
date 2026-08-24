const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Listar y filtrar estudiantes
router.get('/', async (req, res) => {
    try {
        const { curso_id } = req.query;
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        
        let query = `
            SELECT e.*, CONCAT(c.grado, ' ', c.paralelo, ' (', c.nivel, ')') AS curso_nombre 
            FROM estudiantes e 
            LEFT JOIN cursos c ON e.curso_id = c.id
        `;
        let params = [];
        
        if (curso_id) {
            query += ' WHERE e.curso_id = $1';
            params.push(curso_id);
        }
        query += ' ORDER BY e.apellidos, e.nombres';

        const estudiantes = await db.query(query, params);
        res.render('estudiantes/index', { estudiantes: estudiantes.rows, cursos: cursos.rows, curso_id: curso_id || '' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener estudiantes');
    }
});

// Guardar nuevo estudiante
router.post('/nuevo', async (req, res) => {
    try {
        const { rude, ci, apellidos, nombres, genero, fecha_nacimiento, curso_id } = req.body;
        await db.query(`
            INSERT INTO estudiantes (rude, ci, apellidos, nombres, genero, fecha_nacimiento, curso_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [rude, ci, apellidos, nombres, genero, fecha_nacimiento || null, curso_id || null]);
        res.redirect('/estudiantes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar estudiante');
    }
});

// Editar estudiante
router.post('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rude, ci, apellidos, nombres, genero, fecha_nacimiento, curso_id } = req.body;
        await db.query(`
            UPDATE estudiantes 
            SET rude = $1, ci = $2, apellidos = $3, nombres = $4, genero = $5, fecha_nacimiento = $6, curso_id = $7
            WHERE id = $8
        `, [rude, ci, apellidos, nombres, genero, fecha_nacimiento || null, curso_id || null, id]);
        res.redirect('/estudiantes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar estudiante');
    }
});

// Eliminar estudiante
router.get('/eliminar/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM estudiantes WHERE id = $1', [req.params.id]);
        res.redirect('/estudiantes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar estudiante');
    }
});

module.exports = router;