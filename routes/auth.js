const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Vista de Login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Procesar Login
router.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
        if (result.rows.length === 0) {
            return res.render('login', { error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render('login', { error: 'Contraseña incorrecta' });
        }

        req.session.user = {
            id: user.id,
            usuario: user.usuario,
            nombre_completo: user.nombre_completo,
            rol: user.rol
        };

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error en Login:', err);
        res.render('login', { error: 'Error interno en el servidor' });
    }
});

// Cerrar Sesión
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;