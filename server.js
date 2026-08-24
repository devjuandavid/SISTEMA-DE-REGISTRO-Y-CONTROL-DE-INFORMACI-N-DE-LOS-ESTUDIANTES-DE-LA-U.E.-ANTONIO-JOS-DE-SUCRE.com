const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'secret_key_sucre_2026',
    resave: false,
    saveUninitialized: false
}));

// Importar Rutas
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/estudiantes', require('./routes/estudiantes'));
app.use('/cursos', require('./routes/cursos'));
app.use('/materias', require('./routes/materias'));
app.use('/asistencia', require('./routes/asistencia'));
app.use('/notas', require('./routes/notas'));
app.use('/reportes', require('./routes/reportes'));

app.get('/', (req, res) => res.redirect('/auth/login'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));