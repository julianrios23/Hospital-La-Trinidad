const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.rol === 'administrador') {
    return next();
  }
  res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Solo administradores pueden acceder a esta sección.' });
};

// Middleware para verificar que NO sea admision_internacion
const ensureNotInternacion = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.rol === 'admision_internacion') {
    return res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Su rol solo permite acceder a Espera y Mapa de Camas.' });
  }
  return next();
};

// Middleware para verificar que SÍ sea admision_internacion
const ensureInternacion = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.rol === 'admision_internacion') {
    return next();
  }
  res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Esta sección es solo para administradores de internación.' });
};

// --- RUTAS DE ADMISIÓN (Ventanilla) ---
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return hospitalController.renderIndex(req, res);
  }
  return hospitalController.renderLogin(req, res);
});
router.get('/login', hospitalController.renderLogin);
router.post('/login', hospitalController.loginUser);
router.get('/logout', hospitalController.logoutUser);
router.get('/cambiar-password', ensureAuthenticated, hospitalController.renderCambiarPassword);
router.post('/cambiar-password', ensureAuthenticated, hospitalController.cambiarPassword);
router.post('/buscar-paciente', ensureAuthenticated, ensureNotInternacion, hospitalController.buscarPaciente);
router.post('/guardar-paciente', ensureAuthenticated, ensureNotInternacion, hospitalController.guardarNuevoPaciente);
router.post('/crear-admision', ensureAuthenticated, ensureNotInternacion, hospitalController.crearAdmisionExistente);

// RUTA DE REDIRECCIÓN (Invocada por el script del Toast)
router.get('/registro-paciente/:dni', ensureAuthenticated, ensureNotInternacion, hospitalController.renderRegistroDni);

// --- RUTAS DE ENFERMERÍA ---
router.get('/triage/:id', ensureAuthenticated, ensureNotInternacion, hospitalController.renderTriagePaciente);
router.get('/triage', ensureAuthenticated, ensureNotInternacion, hospitalController.renderTriage);
router.post('/guardar-triage', ensureAuthenticated, ensureNotInternacion, hospitalController.guardarTriage);

// --- RUTAS DE MÉDICOS ---
router.get('/atencion-medica', ensureAuthenticated, ensureNotInternacion, hospitalController.renderAtencionMedica);
router.get('/atender/:id', ensureAuthenticated, ensureNotInternacion, hospitalController.renderDiagnostico);
router.post('/guardar-diagnostico', ensureAuthenticated, ensureNotInternacion, hospitalController.guardarDiagnostico);

// --- RUTAS DE INTERNACIÓN ---
router.get('/internacion/espera', ensureAuthenticated, ensureInternacion, hospitalController.renderEspera);
router.get('/internacion/mapa-camas', ensureAuthenticated, ensureInternacion, hospitalController.renderMapaCamas);

// --- RUTAS DE PACIENTES ---
router.get('/lista-pacientes', ensureAuthenticated, ensureNotInternacion, hospitalController.renderListaPacientes);
router.get('/pacientes/:id/editar', ensureAuthenticated, ensureNotInternacion, hospitalController.renderEditarPaciente);
router.post('/pacientes/:id/actualizar', ensureAuthenticated, ensureNotInternacion, hospitalController.actualizarPaciente);

// --- RUTAS DE ADMINISTRACIÓN ---
router.get('/admin/usuarios', ensureAdmin, hospitalController.renderAdminUsuarios);
router.get('/admin/usuarios/nuevo', ensureAdmin, hospitalController.renderNuevoUsuario);
router.get('/admin/usuarios/validar-dni', ensureAdmin, hospitalController.validarDniUsuario);
router.get('/admin/usuarios/validar-email', ensureAdmin, hospitalController.validarEmailUsuario);
router.post('/admin/usuarios/crear', ensureAdmin, hospitalController.crearUsuario);
router.get('/admin/usuarios/:id/editar', ensureAdmin, hospitalController.renderEditarUsuario);
router.post('/admin/usuarios/:id/actualizar', ensureAdmin, hospitalController.actualizarUsuario);
router.post('/admin/usuarios/:id/eliminar', ensureAdmin, hospitalController.eliminarUsuario);
router.post('/admin/usuarios/:id/toggle-estado', ensureAdmin, hospitalController.toggleEstadoUsuario);

module.exports = router;