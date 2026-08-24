const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'clave_secreta_ue_sucre',
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Pasar variables globales a las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Redirección de la Ruta Raíz Principal
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Rutas de los módulos
app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/estudiantes', require('./routes/estudiantes'));
app.use('/notas', require('./routes/notas'));
app.use('/asistencia', require('./routes/asistencia'));
app.use('/reportes', require('./routes/reportes'));
app.use('/configuracion', require('./routes/configuracion'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));