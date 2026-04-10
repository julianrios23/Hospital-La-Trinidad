const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

// --- RUTAS DE ADMISIÓN (Ventanilla) ---
router.get('/', hospitalController.renderIndex);
router.post('/buscar-paciente', hospitalController.buscarPaciente);
router.post('/guardar-paciente', hospitalController.guardarNuevoPaciente);
router.post('/crear-admision', hospitalController.crearAdmisionExistente);

// RUTA DE REDIRECCIÓN (Invocada por el script del Toast)
router.get('/registro-paciente/:dni', hospitalController.renderRegistroDni);

// --- RUTAS DE ENFERMERÍA ---
router.get('/triage/:id', hospitalController.renderTriagePaciente);
router.get('/triage', hospitalController.renderTriage);
router.post('/guardar-triage', hospitalController.guardarTriage);

// --- RUTAS DE MÉDICOS ---
router.get('/atencion-medica', hospitalController.renderAtencionMedica);
router.get('/atender/:id', hospitalController.renderDiagnostico);
router.post('/guardar-diagnostico', hospitalController.guardarDiagnostico);

module.exports = router;