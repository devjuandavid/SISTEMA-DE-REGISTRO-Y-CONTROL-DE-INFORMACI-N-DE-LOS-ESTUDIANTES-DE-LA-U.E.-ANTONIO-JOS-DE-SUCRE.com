const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de Sesiones
app.use(session({
    secret: 'ue_antonio_jose_de_sucre_2026_key',
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));
// Variable global de usuario para las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Redirección Inicial
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.redirect('/dashboard');
});

// Rutas del Sistema
app.use('/', require('./routes/auth'));
app.use('/estudiantes', require('./routes/estudiantes'));
app.use('/asistencia', require('./routes/asistencia'));
app.use('/notas', require('./routes/notas'));
app.use('/reportes', require('./routes/reportes'));

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});