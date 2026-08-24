const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
        const user = result.rows[0];

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.render('login', { error: 'Usuario o contraseña incorrectos' });
        }

        req.session.user = user;
        res.redirect('/dashboard');
    } catch (err) {
        res.render('login', { error: 'Error al conectar con la base de datos' });
    }
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        const estCount = await db.query('SELECT COUNT(*) FROM estudiantes');
        const curCount = await db.query('SELECT COUNT(*) FROM cursos');

        res.render('dashboard', {
            totalEstudiantes: estCount.rows[0].count,
            totalCursos: curCount.rows[0].count
        });
    } catch (err) {
        res.render('dashboard', { totalEstudiantes: 0, totalCursos: 0 });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;