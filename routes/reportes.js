const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verificarAuth } = require('../middleware/auth');
const htmlPDF = require('html-pdf-node');

// Vista del Reporte
router.get('/', verificarAuth, async (req, res) => {
    try {
        const { curso_id } = req.query;
        const cursos = await db.query('SELECT * FROM cursos ORDER BY grado, paralelo');
        let estudiantes = [];
        let cursoSeleccionado = null;

        if (curso_id) {
            const resEst = await db.query(
                `SELECT e.*, c.grado, c.paralelo, c.nivel 
                 FROM estudiantes e 
                 LEFT JOIN cursos c ON e.curso_id = c.id 
                 WHERE e.curso_id = $1 
                 ORDER BY e.apellidos, e.nombres`,
                [curso_id]
            );
            estudiantes = resEst.rows;
            if (estudiantes.length > 0) cursoSeleccionado = estudiantes[0];
        }

        res.render('reportes/index', { cursos: cursos.rows, estudiantes, curso_id, cursoSeleccionado });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al generar el reporte');
    }
});

// Descarga Directa en PDF
router.get('/pdf', verificarAuth, async (req, res) => {
    try {
        const { curso_id } = req.query;
        const resEst = await db.query(
            `SELECT e.*, c.grado, c.paralelo, c.nivel, c.sie 
             FROM estudiantes e 
             LEFT JOIN cursos c ON e.curso_id = c.id 
             WHERE e.curso_id = $1 
             ORDER BY e.apellidos, e.nombres`,
            [curso_id]
        );

        const estudiantes = resEst.rows;
        const curso = estudiantes[0] || {};

        let filasHtml = estudiantes.map((e, index) => `
            <tr>
                <td style="border:1px solid #ccc; padding:6px; text-align:center;">${index + 1}</td>
                <td style="border:1px solid #ccc; padding:6px;">${e.rude}</td>
                <td style="border:1px solid #ccc; padding:6px;">${e.ci || 'S/N'}</td>
                <td style="border:1px solid #ccc; padding:6px;">${e.apellidos} ${e.nombres}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:center;">${e.grado || ''} ${e.paralelo || ''}</td>
                <td style="border:1px solid #ccc; padding:6px; text-align:center;">${e.matricula}</td>
            </tr>
        `).join('');

        const contenidoHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
                    h2, h3 { text-align: center; margin: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background-color: #1e3a8a; color: white; border: 1px solid #ccc; padding: 6px; }
                </style>
            </head>
            <body>
                <h2>UNIDAD EDUCATIVA ANTONIO JOSÉ DE SUCRE</h2>
                <h3>Nómina General de Inscritos - Gestión 2026</h3>
                <p><b>Código SIE:</b> ${curso.sie || '70620085'} | <b>Curso:</b> ${curso.grado || ''} ${curso.paralelo || ''} - ${curso.nivel || ''}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Nº</th>
                            <th>RUDE</th>
                            <th>CI</th>
                            <th>Nombre Completo</th>
                            <th>Curso</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const options = { format: 'A4', printBackground: true };
        const file = { content: contenidoHtml };

        htmlPDF.generatePdf(file, options).then(pdfBuffer => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Estudiantes.pdf');
            res.send(pdfBuffer);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al exportar PDF');
    }
});

module.exports = router;