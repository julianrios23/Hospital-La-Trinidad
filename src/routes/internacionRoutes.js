const express = require('express');
const router = express.Router();
const internacionController = require('../controllers/internacionController');

const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/login');
};

// Middleware para mapa de camas - permite admision_internacion y medico
const canViewMapaCamas = (req, res, next) => {
    if (req.session.user && (req.session.user.rol === 'admision_internacion' || req.session.user.rol === 'medico')) {
        return next();
    }
    res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Solo personal de internación y médicos pueden acceder al mapa de camas.' });
};

// Middleware para lista de espera - solo permite admision_internacion
const canViewEspera = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'admision_internacion') {
        return next();
    }
    res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Solo personal de admisión de internación puede acceder a la lista de espera.' });
};

// --- Rutas para Marta (admision_internacion) ---

// 1. Ver el mapa de camas
router.get('/mapa-camas', canViewMapaCamas, internacionController.getMapaCamas);

// 2. Ver lista de pacientes que vienen de guardia
router.get('/pacientes-espera', canViewEspera, internacionController.getPacientesEspera);
router.get('/espera', canViewEspera, internacionController.getPacientesEspera);

// 3. CAPTURA: Esta ruta recibe el clic del botón "Asignar Cama" en la lista
router.get('/pre-asignar/:idAdmision', isAuthenticated, internacionController.iniciarAsignacion);

// 4. ACCIÓN: Procesa la internación (cuando haces clic en una cama verde)
router.post('/asignar-cama', isAuthenticated, internacionController.asignarCama);

// 5. EGRESO: Libera la cama y finaliza el registro
router.post('/finalizar', isAuthenticated, internacionController.finalizarInternacion);


// --- Rutas para Médicos de Sala ---

router.get('/evolucion/:idInternacion', isAuthenticated, internacionController.getEvolucion);
router.post('/evolucion/:idInternacion', isAuthenticated, internacionController.guardarEvolucion);
router.post('/autorizar-alta/:idInternacion', isAuthenticated, internacionController.autorizarAlta);

module.exports = router;