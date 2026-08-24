module.exports = {
    verificarAuth: (req, res, next) => {
        if (req.session && req.session.usuario) {
            return next();
        }
        res.redirect('/auth/login');
    },
    esAdmin: (req, res, next) => {
        if (req.session && req.session.usuario && req.session.usuario.rol === 'ADMIN') {
            return next();
        }
        res.status(403).send('Acceso denegado: Se requieren permisos de Administrador');
    }
};