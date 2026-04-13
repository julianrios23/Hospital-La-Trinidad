// importo el modulo express
const express = require('express');

// creo el enrutador
const router = express.Router();

// requiero el controlador del hospital
const hospitalController = require('../controllers/hospitalController');

// defino middleware para verificar sesion iniciada
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// creo middleware para validar rol de administrador
const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.rol === 'administrador') {
    return next();
  }
  res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Solo administradores pueden acceder a esta sección.' });
};

// establezco middleware para bloquear rol de admision de internacion
const ensureNotInternacion = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.rol === 'admision_internacion') {
    return res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Su rol solo permite acceder a Espera y Mapa de Camas.' });
  }
  return next();
};

// configuro middleware para asegurar rol de admision de internacion
const ensureInternacion = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.rol === 'admision_internacion') {
    return next();
  }
  res.status(403).render('utiles/error', { mensaje: 'Acceso denegado. Esta sección es solo para administradores de internación.' });
};

// rutas de admision
// defino la ruta principal que renderiza el inicio o redirige al login
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return hospitalController.renderIndex(req, res);
  }
  return hospitalController.renderLogin(req, res);
});

// configuro rutas basicas de sesion
router.get('/login', hospitalController.renderLogin);
router.post('/login', hospitalController.loginUser);
router.get('/logout', hospitalController.logoutUser);

// agrego rutas para cambio de clave con autenticacion previa
router.get('/cambiar-password', ensureAuthenticated, hospitalController.renderCambiarPassword);
router.post('/cambiar-password', ensureAuthenticated, hospitalController.cambiarPassword);

// defino rutas de admision para buscar y guardar pacientes
router.post('/buscar-paciente', ensureAuthenticated, ensureNotInternacion, hospitalController.buscarPaciente);
router.post('/guardar-paciente', ensureAuthenticated, ensureNotInternacion, hospitalController.guardarNuevoPaciente);
router.post('/crear-admision', ensureAuthenticated, ensureNotInternacion, hospitalController.crearAdmisionExistente);

// creo ruta para registrar pacientes por dni
router.get('/registro-paciente/:dni', ensureAuthenticated, ensureNotInternacion, hospitalController.renderRegistroDni);

// rutas de enfermeria
// configuro rutas para manejar el triage de los pacientes
router.get('/triage/:id', ensureAuthenticated, ensureNotInternacion, hospitalController.renderTriagePaciente);
router.get('/triage', ensureAuthenticated, ensureNotInternacion, hospitalController.renderTriage);
router.post('/guardar-triage', ensureAuthenticated, ensureNotInternacion, hospitalController.guardarTriage);

// rutas de medicos
// agrego rutas para la atencion y diagnosticos medicos
router.get('/atencion-medica', ensureAuthenticated, ensureNotInternacion, hospitalController.renderAtencionMedica);
router.get('/atender/:id', ensureAuthenticated, ensureNotInternacion, hospitalController.renderDiagnostico);
router.post('/guardar-diagnostico', ensureAuthenticated, ensureNotInternacion, hospitalController.guardarDiagnostico);

// rutas de internacion
// nota: las rutas de internacion especificas se manejan en src/routes/internacionroutes.js

// rutas de pacientes
// defino las rutas para gestionar y actualizar pacientes
router.get('/lista-pacientes', ensureAuthenticated, hospitalController.renderListaPacientes);
router.get('/pacientes/:id/editar', ensureAuthenticated, hospitalController.renderEditarPaciente);
router.post('/pacientes/:id/actualizar', ensureAuthenticated, hospitalController.actualizarPaciente);

// rutas de administracion
// declaro las rutas de administracion de usuarios con rol de admin
router.get('/admin/usuarios', ensureAdmin, hospitalController.renderAdminUsuarios);
router.get('/admin/usuarios/nuevo', ensureAdmin, hospitalController.renderNuevoUsuario);
router.get('/admin/usuarios/validar-dni', ensureAdmin, hospitalController.validarDniUsuario);
router.get('/admin/usuarios/validar-email', ensureAdmin, hospitalController.validarEmailUsuario);
router.post('/admin/usuarios/crear', ensureAdmin, hospitalController.crearUsuario);
router.get('/admin/usuarios/:id/editar', ensureAdmin, hospitalController.renderEditarUsuario);
router.post('/admin/usuarios/:id/actualizar', ensureAdmin, hospitalController.actualizarUsuario);
router.post('/admin/usuarios/:id/eliminar', ensureAdmin, hospitalController.eliminarUsuario);
router.post('/admin/usuarios/:id/toggle-estado', ensureAdmin, hospitalController.toggleEstadoUsuario);

// exporto el enrutador para usarlo globalmente
module.exports = router;
