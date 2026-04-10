const express = require('express');
const path = require('path');
const db = require('./config/db'); // Importamos la conexión
require('dotenv').config();

const app = express();

// Configuración de Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true })); // Para leer formularios
app.use(express.static(path.join(__dirname, 'public'))); // Archivos CSS/JS

// Ruta de prueba para verificar que la DB y el servidor hablan
app.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM obras_sociales LIMIT 5');
        res.send(`<h1>Servidor Funcionando</h1><p>Conexión a DB OK. Obras sociales encontradas: ${rows.length}</p>`);
    } catch (error) {
        res.status(500).send("Error conectando a la base de datos: " + error.message);
    }
});

// Ruta Principal: Ventanilla
app.get('/', (req, res) => {
    res.render('index');
});

// Lógica de búsqueda de paciente
app.post('/buscar-paciente', async (req, res) => {
    const { dni } = req.body;
    try {
        const [paciente] = await db.query('SELECT * FROM pacientes WHERE dni = ?', [dni]);

        if (paciente.length > 0) {
            // El paciente existe, vamos a crear la admisión (Episodio)
            // Aquí podríamos redirigir a un formulario de "Motivo de Consulta"
            res.send(`Paciente encontrado: ${paciente[0].nombre}. Iniciando admisión...`);
        } else {
            // No existe, hay que cargarlo (Tu requerimiento de "Si no está en la base, cargar datos")
            res.render('registro-paciente', { dni }); 
        }
    } catch (error) {
        res.render('index', { error: 'Error al buscar en la base de datos' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});