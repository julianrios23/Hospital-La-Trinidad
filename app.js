const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const hospitalRoutes = require('./src/routes/hospitalRoutes');
const internacionRoutes = require('./src/routes/internacionRoutes');

// Cargar variables de entorno
dotenv.config();

const app = express();

// 1. Configuración del motor de plantillas PUG
// Es vital que path.join apunte correctamente a src/views
app.set('views', path.join(__dirname, 'src', 'views'))
app.set('view engine', 'pug');

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'hospital-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Configuración de archivos estáticos (CSS, Imágenes, JS del cliente)
app.use(express.static(path.join(__dirname, 'src', 'public')));

// 3. RUTAS
// IMPORTANTE: Eliminamos cualquier app.get('/') que use res.send()
app.use('/', hospitalRoutes)

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).render('utiles/error', { mensaje: 'La página solicitada no existe.' });
});
//internacion routes
app.use('/internacion', internacionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de La Trinidad corriendo en http://localhost:${PORT}`);
});