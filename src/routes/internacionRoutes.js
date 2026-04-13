// importo el modulo express
const express = require('express');

// creo el enrutador
const router = express.Router();

// requiero el controlador de internacion
const internacionController = require('../controllers/internacionController');

// defino middleware para verificar sesion iniciada
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/login');
};

// creo middleware para mapa de camas permitiendo admision de internacion y medico
const canViewMapaCamas = (req, res, next) => {
    if (req.session.user && (req.session.user.rol === 'admision_internacion' || req.session.user.rol === 'medico')) {
        return next();
    }
    res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Solo personal de internación y médicos pueden acceder al mapa de camas.' });
};

// configuro middleware para lista de espera solo para admision de internacion
const canViewEspera = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'admision_internacion') {
        return next();
    }
    res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Solo personal de admisión de internación puede acceder a la lista de espera.' });
};

// rutas para marta de admision de internacion
// defino la ruta para ver el mapa de camas
router.get('/mapa-camas', canViewMapaCamas, internacionController.getMapaCamas);

// agrego las rutas para ver la lista de pacientes en espera
router.get('/pacientes-espera', canViewEspera, internacionController.getPacientesEspera);
router.get('/espera', canViewEspera, internacionController.getPacientesEspera);

// creo la ruta que captura la pre asignacion de cama desde la lista
router.get('/pre-asignar/:idAdmision', isAuthenticated, internacionController.iniciarAsignacion);

// declaro la ruta que procesa y asigna la cama de internacion
router.post('/asignar-cama', isAuthenticated, internacionController.asignarCama);

// configuro la ruta de egreso para finalizar la internacion y liberar cama
router.post('/finalizar', isAuthenticated, internacionController.finalizarInternacion);

// rutas para medicos de sala
// defino las rutas para ver y guardar la evolucion del paciente
router.get('/evolucion/:idInternacion', isAuthenticated, internacionController.getEvolucion);
router.post('/evolucion/:idInternacion', isAuthenticated, internacionController.guardarEvolucion);

// agrego la ruta para autorizar el alta del paciente
router.post('/autorizar-alta/:idInternacion', isAuthenticated, internacionController.autorizarAlta);

// exporto el enrutador
module.exports = router;
