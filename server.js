const express = require('express');
const session = require('express-session');
const path = require('path');
const cursosRouter = require('./routes/cursos');
const materiasRouter = require('./routes/materias');
const usuariosRouter = require('./routes/usuarios');

app.use('/cursos', cursosRouter);
app.use('/materias', materiasRouter);
app.use('/usuarios', usuariosRouter);
require('dotenv').config();

const app = express();

// Middlewares para procesar datos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de Sesiones
app.use(session({
    secret: 'secret_key_sucre_2026',
    resave: false,
    saveUninitialized: false
}));

// Pasar el usuario en sesión a todas las vistas automáticamente
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});
app.use(express.urlencoded({ extended: true }));
// Importar y Registrar Rutas
app.use('/auth', require('./routes/auth'));
app.use('/estudiantes', require('./routes/estudiantes'));
app.use('/cursos', require('./routes/cursos'));
app.use('/materias', require('./routes/materias'));
app.use('/profesores', require('./routes/profesores'));
app.use('/asistencia', require('./routes/asistencia'));
app.use('/notas', require('./routes/notas'));
app.use('/reportes', require('./routes/reportes'));

// Redirección inicial al Login
// Redirección inicial al Login (Línea 41)
app.get('/', (req, res) => res.redirect('/auth/login'));

// Puerto y Arranque
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));