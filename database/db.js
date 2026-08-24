const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Conexión a PostgreSQL (Render proporciona DATABASE_URL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/escuela',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Creación automática de tablas al iniciar
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                rol VARCHAR(20) DEFAULT 'admin'
            );

            CREATE TABLE IF NOT EXISTS cursos (
                id SERIAL PRIMARY KEY,
                grado VARCHAR(50) NOT NULL,
                nivel VARCHAR(100) NOT NULL,
                paralelo VARCHAR(10) NOT NULL,
                turno VARCHAR(20) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS materias (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS estudiantes (
                id SERIAL PRIMARY KEY,
                rude VARCHAR(30) UNIQUE NOT NULL,
                ci VARCHAR(20) UNIQUE NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                genero VARCHAR(10) NOT NULL,
                fecha_nacimiento DATE NOT NULL,
                lugar_nacimiento VARCHAR(100),
                curso_id INT REFERENCES cursos(id),
                matricula VARCHAR(50) DEFAULT 'EFECTIVO',
                estado VARCHAR(20) DEFAULT 'Activo'
            );

            CREATE TABLE IF NOT EXISTS asistencia (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                estado VARCHAR(20) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notas (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                periodo VARCHAR(50) NOT NULL,
                nota NUMERIC(5,2) NOT NULL
            );
        `);

        // Insertar usuario Admin por defecto
        const adminPass = bcrypt.hashSync('admin123', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario, password, rol) 
            VALUES ('admin', $1, 'admin') 
            ON CONFLICT (usuario) DO NOTHING;
        `, [adminPass]);

        // Insertar Curso de Prueba
        await pool.query(`
            INSERT INTO cursos (id, grado, nivel, paralelo, turno) 
            VALUES (1, 'Primero', 'Inicial en Familia Comunitaria', 'A', 'MAÑANA') 
            ON CONFLICT (id) DO NOTHING;
        `);

        // Insertar Materias
        await pool.query(`
            INSERT INTO materias (id, nombre) VALUES 
            (1, 'Lenguaje y Comunicación'),
            (2, 'Matemáticas'),
            (3, 'Ciencias Naturales')
            ON CONFLICT (id) DO NOTHING;
        `);

    } catch (err) {
        console.error('Error al inicializar las tablas de PostgreSQL:', err);
    }
};

initDb();

module.exports = {
    query: (text, params) => pool.query(text, params)
};