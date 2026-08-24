const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password]);
        
        if (result.rows.length > 0) {
            req.session.usuario = result.rows[0];
            return res.redirect('/estudiantes');
        }
        res.render('auth/login', { error: 'Credenciales incorrectas' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en inicio de sesión');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
});

module.exports = router;