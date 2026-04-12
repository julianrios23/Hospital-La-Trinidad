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
router.post('/buscar-paciente', ensureAuthenticated, hospitalController.buscarPaciente);
router.post('/guardar-paciente', ensureAuthenticated, hospitalController.guardarNuevoPaciente);
router.post('/crear-admision', ensureAuthenticated, hospitalController.crearAdmisionExistente);

// RUTA DE REDIRECCIÓN (Invocada por el script del Toast)
router.get('/registro-paciente/:dni', ensureAuthenticated, hospitalController.renderRegistroDni);

// --- RUTAS DE ENFERMERÍA ---
router.get('/triage/:id', ensureAuthenticated, hospitalController.renderTriagePaciente);
router.get('/triage', ensureAuthenticated, hospitalController.renderTriage);
router.post('/guardar-triage', ensureAuthenticated, hospitalController.guardarTriage);

// --- RUTAS DE MÉDICOS ---
router.get('/atencion-medica', ensureAuthenticated, hospitalController.renderAtencionMedica);
router.get('/atender/:id', ensureAuthenticated, hospitalController.renderDiagnostico);
router.post('/guardar-diagnostico', ensureAuthenticated, hospitalController.guardarDiagnostico);

// --- RUTAS DE PACIENTES ---
router.get('/lista-pacientes', ensureAuthenticated, hospitalController.renderListaPacientes);
router.get('/pacientes/:id/editar', ensureAuthenticated, hospitalController.renderEditarPaciente);
router.post('/pacientes/:id/actualizar', ensureAuthenticated, hospitalController.actualizarPaciente);

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