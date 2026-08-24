const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/escuela',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const initDb = async () => {
    try {
        // 1. Crear tabla de Usuarios si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        `);
        
        // AGREGAR COLUMNAS SI YA EXISTÍA LA TABLA VIEJA
        await pool.query(`
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(100) DEFAULT 'Usuario';
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'profesor';
        `);
          // Asegurar columnas en la tabla notas si fue creada anteriormente
            await pool.query(`
                ALTER TABLE notas ADD COLUMN IF NOT EXISTS trimestre INT DEFAULT 1;
                ALTER TABLE notas ADD COLUMN IF NOT EXISTS ser NUMERIC(5,2) DEFAULT 0;
                ALTER TABLE notas ADD COLUMN IF NOT EXISTS saber NUMERIC(5,2) DEFAULT 0;
                ALTER TABLE notas ADD COLUMN IF NOT EXISTS hacer NUMERIC(5,2) DEFAULT 0;
                ALTER TABLE notas ADD COLUMN IF NOT EXISTS autoevaluacion NUMERIC(5,2) DEFAULT 0;
                ALTER TABLE notas ADD COLUMN IF NOT EXISTS nota_trimestral NUMERIC(5,2) DEFAULT 0;
                ALTER TABLE notas ADD COLUMN IF NOT EXISTS cualitativo TEXT;
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

        // 4. Asignación de Materias a Profesores
        await pool.query(`
            CREATE TABLE IF NOT EXISTS profesor_materia (
                id SERIAL PRIMARY KEY,
                profesor_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                curso_id INT REFERENCES cursos(id) ON DELETE CASCADE
            );
        `);

        // 5. Tabla de Estudiantes (RUDE Bolivia)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS estudiantes (
                id SERIAL PRIMARY KEY,
                rude VARCHAR(30) UNIQUE,
                ci VARCHAR(20),
                apellidos VARCHAR(100) NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                genero CHAR(1),
                fecha_nacimiento DATE,
                pais VARCHAR(50) DEFAULT 'BOLIVIA',
                departamento VARCHAR(50),
                provincia VARCHAR(50),
                localidad VARCHAR(50),
                matricula VARCHAR(50) DEFAULT 'EFECTIVO',
                curso_id INT REFERENCES cursos(id) ON DELETE SET NULL
            );
        `);

        // 6. Asistencia
        await pool.query(`
            CREATE TABLE IF NOT EXISTS asistencia (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                estado CHAR(1)
            );
        `);

        // 7. Cuadro de Evaluación (Ley 070)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notas (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                trimestre INT,
                ser NUMERIC(5,2) DEFAULT 0,
                saber NUMERIC(5,2) DEFAULT 0,
                hacer NUMERIC(5,2) DEFAULT 0,
                autoevaluacion NUMERIC(5,2) DEFAULT 0,
                nota_trimestral NUMERIC(5,2),
                cualitativo TEXT
            );
        `);

        // --- INSERTAR DATOS INICIALES ---

        // Insertar Director/Admin
        const passAdmin = bcrypt.hashSync('admin123', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario, password, nombre_completo, rol) 
            VALUES ('admin', $1, 'Director General', 'director') 
            ON CONFLICT (usuario) DO NOTHING;
        `, [passAdmin]);

        // Insertar Profesor de prueba
        const passProfe = bcrypt.hashSync('profe123', 10);
        await pool.query(`
            INSERT INTO usuarios (usuario, password, nombre_completo, rol) 
            VALUES ('profe_eugenia', $1, 'Eugenia Virginia Cadena Lima', 'profesor') 
            ON CONFLICT (usuario) DO NOTHING;
        `, [passProfe]);

        console.log('Base de datos inicializada correctamente.');

    } catch (err) {
        console.error('Error al inicializar las tablas:', err);
    }
};

initDb();

module.exports = {
    query: (text, params) => pool.query(text, params)
};