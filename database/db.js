const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/escuela',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const initDb = async () => {
    try {
        // 1. Tabla de Usuarios (Admin / Director / Profesores)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre_completo VARCHAR(100) NOT NULL,
                rol VARCHAR(20) DEFAULT 'profesor' CHECK (rol IN ('admin', 'director', 'profesor'))
            );
        `);

        // 2. Tabla de Cursos y Turnos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cursos (
                id SERIAL PRIMARY KEY,
                nivel VARCHAR(100) NOT NULL,
                grado VARCHAR(50) NOT NULL,
                paralelo VARCHAR(10) NOT NULL,
                turno VARCHAR(20) DEFAULT 'MAÑANA'
            );
        `);

        // 3. Tabla de Materias / Áreas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS materias (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                area VARCHAR(100)
            );
        `);

        // 4. Asignación de Materias y Cursos a Profesores
        await pool.query(`
            CREATE TABLE IF NOT EXISTS profesor_materia (
                id SERIAL PRIMARY KEY,
                profesor_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                curso_id INT REFERENCES cursos(id) ON DELETE CASCADE
            );
        `);

        // 5. Tabla de Estudiantes (Formato SIE / RUDE Bolivia)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS estudiantes (
                id SERIAL PRIMARY KEY,
                rude VARCHAR(30) UNIQUE,
                ci VARCHAR(20),
                apellidos VARCHAR(100) NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                genero CHAR(1) CHECK (genero IN ('M', 'F')),
                fecha_nacimiento DATE,
                pais VARCHAR(50) DEFAULT 'BOLIVIA',
                departamento VARCHAR(50),
                provincia VARCHAR(50),
                localidad VARCHAR(50),
                matricula VARCHAR(50) DEFAULT 'EFECTIVO',
                curso_id INT REFERENCES cursos(id) ON DELETE SET NULL
            );
        `);

        // 6. Control de Asistencia Diario (A=Asistencia, F=Falta, R=Retraso, L=Licencia)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS asistencia (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                estado CHAR(1) CHECK (estado IN ('A', 'F', 'R', 'L'))
            );
        `);

        // 7. Cuadro de Evaluación Trimestral (Ley 070)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notas (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                trimestre INT CHECK (trimestre IN (1, 2, 3)),
                ser NUMERIC(5,2) DEFAULT 0 CHECK (ser <= 10),
                saber NUMERIC(5,2) DEFAULT 0 CHECK (saber <= 45),
                hacer NUMERIC(5,2) DEFAULT 0 CHECK (hacer <= 40),
                autoevaluacion NUMERIC(5,2) DEFAULT 0 CHECK (autoevaluacion <= 5),
                nota_trimestral NUMERIC(5,2) GENERATED ALWAYS AS (ser + saber + hacer + autoevaluacion) STORED,
                cualitativo TEXT
            );
        `);

        // --- DATOS POR DEFECTO ---

        // 1. Director/Admin General
        const passAdmin = bcrypt.hashSync('admin123', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario, password, nombre_completo, rol) 
            VALUES ('admin', $1, 'Director General', 'director') 
            ON CONFLICT (usuario) DO NOTHING;
        `, [passAdmin]);

        // 2. Profesor de prueba
        const passProfe = bcrypt.hashSync('profe123', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario, password, nombre_completo, rol) 
            VALUES ('profe_eugenia', $1, 'Eugenia Virginia Cadena Lima', 'profesor') 
            ON CONFLICT (usuario) DO NOTHING;
        `, [passProfe]);

        // 3. Curso por defecto
        await pool.query(`
            INSERT INTO cursos (id, nivel, grado, paralelo, turno) 
            VALUES (1, 'Secundaria Comunitaria Productiva', 'Primero', 'A', 'MAÑANA') 
            ON CONFLICT (id) DO NOTHING;
        `);

        // 4. Materia por defecto
        await pool.query(`
            INSERT INTO materias (id, nombre, area) 
            VALUES (1, 'Matemática', 'Ciencia Tecnología y Producción') 
            ON CONFLICT (id) DO NOTHING;
        `);

        console.log('Base de datos inicializada correctamente para SIE y Ley 070.');

    } catch (err) {
        console.error('Error al inicializar las tablas:', err);
    }
};

initDb();

module.exports = {
    query: (text, params) => pool.query(text, params)
};