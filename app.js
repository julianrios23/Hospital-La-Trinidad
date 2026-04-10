const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const hospitalRoutes = require('./src/routes/hospitalRoutes'); // Importamos las nuevas rutas

// Configuración de Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src/views'));

// Middleware
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public'))); 

// Uso de Rutas
app.use('/', hospitalRoutes); // 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`La Trinidad HIS activo en: http://localhost:${PORT}`);
});