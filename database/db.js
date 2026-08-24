const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const inicializarBaseDeDatos = async () => {
    try {
        console.log('🔄 Sincronizando BD con RUDE, Notas y Asistencias...');

        // 1. Usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                rol VARCHAR(20) DEFAULT 'PROFESOR',
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Cursos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cursos (
                id SERIAL PRIMARY KEY,
                nivel VARCHAR(100) NOT NULL,
                grado VARCHAR(50) NOT NULL,
                paralelo VARCHAR(10) NOT NULL,
                turno VARCHAR(20) DEFAULT 'MAÑANA',
                sie VARCHAR(20) DEFAULT '70620085'
            );
        `);

        // 3. Materias
        await pool.query(`
            CREATE TABLE IF NOT EXISTS materias (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                curso_id INT REFERENCES cursos(id) ON DELETE CASCADE,
                profesor_id INT REFERENCES usuarios(id) ON DELETE SET NULL
            );
        `);

        // 4. Estudiantes (RUDE Completo)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS estudiantes (
                id SERIAL PRIMARY KEY,
                rude VARCHAR(30) UNIQUE NOT NULL,
                ci VARCHAR(20),
                apellidos VARCHAR(100) NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                genero CHAR(1) CHECK (genero IN ('M', 'F')),
                fecha_nacimiento DATE,
                pais VARCHAR(50) DEFAULT 'BOLIVIA',
                departamento VARCHAR(50) DEFAULT 'La Paz',
                provincia VARCHAR(50) DEFAULT 'MURILLO',
                localidad VARCHAR(100) DEFAULT 'EL ALTO',
                matricula VARCHAR(30) DEFAULT 'EFECTIVO',
                tutor_nombre VARCHAR(150),
                tutor_ci VARCHAR(20),
                tutor_telefono VARCHAR(20),
                curso_id INT REFERENCES cursos(id) ON DELETE SET NULL
            );
        `);

        // 5. Asistencias
        await pool.query(`
            CREATE TABLE IF NOT EXISTS asistencias (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                estado VARCHAR(20) CHECK (estado IN ('PRESENTE', 'FALTA', 'LICENCIA', 'ATRASO')),
                UNIQUE(estudiante_id, materia_id, fecha)
            );
        `);

        // 6. Centralizador de Notas (Saber, Hacer, Ser, Decidir, Autoevaluación)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notas (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                trimestre INT CHECK (trimestre IN (1, 2, 3)),
                saber DECIMAL(5,2) DEFAULT 0,
                hacer DECIMAL(5,2) DEFAULT 0,
                ser DECIMAL(5,2) DEFAULT 0,
                decidir DECIMAL(5,2) DEFAULT 0,
                autoevaluacion DECIMAL(5,2) DEFAULT 0,
                nota_final DECIMAL(5,2) DEFAULT 0,
                UNIQUE(estudiante_id, materia_id, trimestre)
            );
        `);

        // 7. Modificaciones preventivas (por si las tablas ya existían)
        await pool.query(`
            ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tutor_nombre VARCHAR(150);
            ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tutor_ci VARCHAR(20);
            ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tutor_telefono VARCHAR(20);
        `);

        // Asegurar que la columna 'nombre' exista si la tabla se creó previamente
        await pool.query(`
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
        `);

        // Admin por defecto
        await pool.query(`
            INSERT INTO usuarios (nombre, email, password, rol) 
            VALUES ('Administrador', 'admin@sucre.edu.bo', 'admin123', 'ADMIN')
            ON CONFLICT (email) DO NOTHING;
        `);

        console.log('✅ Base de datos 100% sincronizada.');
    } catch (err) {
        console.error('❌ Error al sincronizar BD:', err);
    }
};

inicializarBaseDeDatos();

module.exports = {
    query: (text, params) => pool.query(text, params)
};