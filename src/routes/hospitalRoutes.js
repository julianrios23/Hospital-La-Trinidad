const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

// --- RUTAS DE ADMISIÓN (Ventanilla) ---
router.get('/', hospitalController.renderIndex);
router.post('/buscar-paciente', hospitalController.buscarPaciente);
router.post('/guardar-paciente', hospitalController.guardarNuevoPaciente);
router.post('/crear-admision', hospitalController.crearAdmisionExistente);

// RUTA DE REDIRECCIÓN (Invocada por el script del Toast) [cite: 325, 345, 364]
router.get('/registro-paciente/:dni', hospitalController.renderRegistroDni);

// --- RUTAS DE ENFERMERÍA ---
router.get('/triage', hospitalController.renderTriage);

// --- RUTAS DE MÉDICOS ---
router.get('/atencion-medica', hospitalController.renderAtencionMedica);

module.exports = router;