const express = require('express');
const router = express.Router();
const internacionController = require('../controllers/internacionController');

// Middleware para asegurar que solo usuarios logueados accedan
// (Asumiendo que usas req.session.user)
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/login');
};

// Rutas para Marta (admision_internacion)
router.get('/mapa-camas', isAuthenticated, internacionController.getMapaCamas);
router.get('/pacientes-espera', isAuthenticated, internacionController.getPacientesEspera);
router.post('/asignar-cama', isAuthenticated, internacionController.asignarCama);

// Rutas para Médicos de Sala
router.get('/evolucion/:idInternacion', isAuthenticated, internacionController.getEvolucion);
router.post('/evolucion/:idInternacion', isAuthenticated, internacionController.guardarEvolucion);
router.post('/autorizar-alta/:idInternacion', isAuthenticated, internacionController.autorizarAlta);

module.exports = router;