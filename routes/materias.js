const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');

// Listar Materias con su Curso y Profesor asignado
router.get('/', verificarAuth, async (req, res) => {
    try {
        const materias = await db.query(`
            SELECT m.id, m.nombre, m.curso_id, m.profesor_id, 
                   c.grado, c.paralelo, c.nivel, u.nombre as profesor 
            FROM materias m
            LEFT JOIN cursos c ON m.curso_id = c.id
            LEFT JOIN usuarios u ON m.profesor_id = u.id
            ORDER BY c.grado, c.paralelo, m.nombre
        `);
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        const profesores = await db.query("SELECT * FROM usuarios WHERE rol = 'PROFESOR' OR rol = 'ADMIN' ORDER BY nombre");

        res.render('materias/index', { 
            materias: materias.rows, 
            cursos: cursos.rows, 
            profesores: profesores.rows 
        });
    } catch (err) {
        console.error('Error al obtener materias:', err);
        res.status(500).send('Error al obtener materias');
    }
});

// Crear Materia (Soporta /crear y /nuevo)
const crearMateriaHandler = async (req, res) => {
    try {
        const { nombre, curso_id, profesor_id } = req.body;
        
        const cursoValido = curso_id && curso_id !== '' ? curso_id : null;
        const profesorValido = profesor_id && profesor_id !== '' ? profesor_id : null;

        await db.query(
            'INSERT INTO materias (nombre, curso_id, profesor_id) VALUES ($1, $2, $3)',
            [nombre, cursoValido, profesorValido]
        );
        res.redirect('/materias');
    } catch (err) {
        console.error('Error al crear materia:', err);
        res.status(500).send('Error al crear materia');
    }
};

router.post('/crear', verificarAuth, crearMateriaHandler);
router.post('/nuevo', verificarAuth, crearMateriaHandler);

// Editar Materia
router.post('/editar/:id', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, curso_id, profesor_id } = req.body;

        const cursoValido = curso_id && curso_id !== '' ? curso_id : null;
        const profesorValido = profesor_id && profesor_id !== '' ? profesor_id : null;

        await db.query(
            'UPDATE materias SET nombre=$1, curso_id=$2, profesor_id=$3 WHERE id=$4',
            [nombre, cursoValido, profesorValido, id]
        );
        res.redirect('/materias');
    } catch (err) {
        console.error('Error al editar materia:', err);
        res.status(500).send('Error al editar materia');
    }
});

// Eliminar Materia (Soporta GET y POST)
const eliminarMateriaHandler = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM materias WHERE id = $1', [id]);
        res.redirect('/materias');
    } catch (err) {
        console.error('Error al eliminar materia:', err);
        res.status(500).send('Error al eliminar materia');
    }
};

router.get('/eliminar/:id', verificarAuth, eliminarMateriaHandler);
router.post('/eliminar/:id', verificarAuth, eliminarMateriaHandler);

module.exports = router;