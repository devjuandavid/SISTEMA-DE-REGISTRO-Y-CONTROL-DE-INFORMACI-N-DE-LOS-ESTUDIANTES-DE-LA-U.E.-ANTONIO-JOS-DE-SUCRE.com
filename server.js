require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

// 1. Inicializar Express
const app = express();

// 2. Middlewares de datos y estáticos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 3. Configuración de Vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Configuración de Sesiones
app.use(session({
    secret: 'secret_key_sucre_2026',
    resave: false,
    saveUninitialized: false
}));

// 5. Pasar el usuario en sesión a las vistas
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// 6. Registrar Rutas del Sistema
// Se apunta a './routes/asistencia' (singular) que es el archivo existente
const asistenciaRoutes = require('./routes/asistencia');

app.use('/auth', require('./routes/auth'));
app.use('/estudiantes', require('./routes/estudiantes'));
app.use('/cursos', require('./routes/cursos'));
app.use('/materias', require('./routes/materias'));
app.use('/usuarios', require('./routes/usuarios'));

// Soporta tanto /asistencia como /asistencias para el menú
app.use('/asistencia', asistenciaRoutes);
app.use('/asistencias', asistenciaRoutes);

app.use('/notas', require('./routes/notas'));
app.use('/centralizador', require('./routes/notas'));
app.use('/reportes', require('./routes/reportes'));

// 7. Redirección inicial al Login
app.get('/', (req, res) => res.redirect('/auth/login'));

// 8. Puerto y Arranque
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`));