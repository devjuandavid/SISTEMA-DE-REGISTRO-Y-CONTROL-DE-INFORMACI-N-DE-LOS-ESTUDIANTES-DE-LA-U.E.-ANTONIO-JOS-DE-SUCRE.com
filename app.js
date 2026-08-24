app.use('/auth', require('./routes/auth'));
app.use('/estudiantes', require('./routes/estudiantes'));
app.use('/cursos', require('./routes/cursos'));
app.use('/materias', require('./routes/materias'));
app.use('/profesores', require('./routes/profesores'));
app.use('/asistencia', require('./routes/asistencia'));
app.use('/notas', require('./routes/notas'));
app.use('/reportes', require('./routes/reportes'));