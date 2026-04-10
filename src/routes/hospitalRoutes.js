const express = require('express');
const router = express.Router();
// Importaríamos el controlador aquí más adelante
// const hospitalController = require('../controllers/hospitalController');

// --- MÓDULO 1: ADMISIÓN (Ventanilla) ---

// 1.1 Pantalla de inicio: Buscador por DNI
router.get('/', (req, res) => res.render('index'));

// 1.2 Lógica de búsqueda (Redirecciona según si existe o no)
router.post('/buscar-paciente', (req, res) => {
    const { dni } = req.body;
    // Lógica: buscar en DB. Si existe -> /admitir/:dni, si no -> /registro/:dni [cite: 20, 21]
    res.redirect(`/registro/${dni}`); 
});

// 1.3 Formularios de ingreso
router.get('/registro/:dni', (req, res) => res.render('registro-paciente', { dni: req.params.dni }));
router.get('/admitir/:dni', (req, res) => res.render('admitir-existente', { dni: req.params.dni }));

// 1.4 Guardado y Confirmación
router.post('/guardar-ingreso', (req, res) => res.render('confirmacion'));


// --- MÓDULO 2: ENFERMERÍA (Triage) ---

// 2.1 Lista de pacientes "En Espera" [cite: 22, 161]
router.get('/triage', (req, res) => res.render('triage', { seleccionado: null }));

// 2.2 Selección de paciente para tomar signos vitales
router.get('/triage/:id_admision', (req, res) => res.render('triage', { seleccionado: { id_admision: req.params.id_admision } }));

// 2.3 Guardar Triage y pasar a "Espera Médico" [cite: 24, 164]
router.post('/guardar-triage', (req, res) => res.redirect('/triage'));


// --- MÓDULO 3: MÉDICOS (Atención) ---

// 3.1 Dashboard médico (Lista por prioridad) [cite: 25, 162]
router.get('/atencion-medica', (req, res) => res.render('medico', { consultaActiva: null }));

// 3.2 Atender a un paciente específico
router.get('/atender/:id_admision', (req, res) => res.render('medico', { consultaActiva: { id_admision: req.params.id_admision } }));

// 3.3 Finalizar atención y dar el alta [cite: 26, 165]
router.post('/finalizar-atencion', (req, res) => res.redirect('/atencion-medica'));

module.exports = router;