const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const inicializarBaseDeDatos = async () => {
    try {
        console.log('🔄 Sincronizando BD para módulo SIE y Boletines...');

        // 1. Cursos con metadatos SIE
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

        // 2. Estudiantes completos para RUDE Oficial
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

        // 3. Centralizador y Boletines (Evaluación Cualitativa y Cuantitativa)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS evaluaciones_cualitativas (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                trimestre INT CHECK (trimestre IN (1, 2, 3)),
                desarrollo_comunicacion TEXT,
                desarrollo_conocimiento TEXT,
                desarrollo_biosicomotriz TEXT,
                desarrollo_sociocultural TEXT,
                UNIQUE(estudiante_id, trimestre)
            );
        `);
        // 4. Notas Cuantitativas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notas (
                id SERIAL PRIMARY KEY,
                estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
                trimestre INT CHECK (trimestre IN (1, 2, 3)),
                ser INT DEFAULT 0,
                saber INT DEFAULT 0,
                hacer INT DEFAULT 0,
                decidir INT DEFAULT 0,
                autoevaluacion INT DEFAULT 0,
                nota_final INT DEFAULT 0,
                CONSTRAINT nota_estudiante_materia_trimestre UNIQUE (estudiante_id, materia_id, trimestre)
            );
        `);
        // Resincronizar secuencias
        await pool.query(`
            SELECT setval('cursos_id_seq', COALESCE((SELECT MAX(id) FROM cursos), 1));
            SELECT setval('estudiantes_id_seq', COALESCE((SELECT MAX(id) FROM estudiantes), 1));
        `);

        console.log('✅ Base de datos para reportes SIE lista.');
    } catch (err) {
        console.error('❌ Error al inicializar BD:', err);
    }
};

inicializarBaseDeDatos();

module.exports = {
    query: (text, params) => pool.query(text, params)
};