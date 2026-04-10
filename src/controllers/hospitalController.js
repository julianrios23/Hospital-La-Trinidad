const db = require('../../config/db');

// --- REGLAS DE VALIDACIÓN (Regex para Backend) ---
const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const regexNumeros = /^\d+$/;
const regexAlfanumerico = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,.-]+$/;

const hospitalController = {
    // 0. Renderiza la vista principal (Buscador)
    renderIndex: (req, res) => {
        res.render('index', { pacienteNoEncontrado: false });
    },

    // 1. Lógica de Búsqueda por DNI con señal de Toast
    buscarPaciente: async (req, res) => {
        const { dni } = req.body;
        try {
            const [pacientes] = await db.query('SELECT * FROM pacientes WHERE dni = ?', [dni]);
            const [obrasSociales] = await db.query('SELECT * FROM obras_sociales ORDER BY nombre_obra_social ASC');

            if (pacientes.length > 0) {
                // PACIENTE EXISTE: Redirigir a confirmación de datos
                res.render('utiles/admitir-existente', { 
                    paciente: pacientes[0], 
                    obrasSociales 
                });
            } else {
                // PACIENTE NUEVO: Activar Toast en el index
                res.render('index', { 
                    pacienteNoEncontrado: true, 
                    dniBuscado: dni 
                });
            }
        } catch (error) {
            console.error(error);
            res.render('utiles/error', { mensaje: 'Error al consultar la base de datos.' });
        }
    },

    // 2. Renderizar Formulario de Registro (Invocado tras el Toast)
    renderRegistroDni: async (req, res) => {
        const { dni } = req.params;
        try {
            const [obrasSociales] = await db.query('SELECT * FROM obras_sociales ORDER BY nombre_obra_social ASC');
            res.render('pacientes/registro-paciente', { dni, obrasSociales });
        } catch (error) {
            res.render('utiles/error', { mensaje: 'Error al cargar el formulario de registro.' });
        }
    },

    // 3. Guardar Nuevo Paciente y Crear Admisión (Flujo corregido)
    guardarNuevoPaciente: async (req, res) => {
        const { dni, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, obra_social_id, motivo_consulta } = req.body;
        
        // Validación de Backend antes de procesar
        if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
            return res.render('utiles/error', { mensaje: 'Nombre y Apellido deben contener solo letras.' });
        }

        // Manejo de Nulos: Si no se selecciona obra social, asignamos ID 1 ("No posee") 
        const idOS = obra_social_id || 1; 

        try {
            // Paso 1: Insertar en la tabla pacientes
            const [resPaciente] = await db.query(
                `INSERT INTO pacientes (dni, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, obrasocial) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [dni, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, idOS]
            );
            
            const nuevoPacienteId = resPaciente.insertId;

            // Paso 2: Insertar en la tabla admisiones [cite: 528]
            const [resAdmision] = await db.query(
                `INSERT INTO admisiones (paciente_id, obra_social_id, motivo_consulta, estado_admision) 
                 VALUES (?, ?, ?, 'Ventanilla')`,
                [nuevoPacienteId, idOS, motivo_consulta]
            );

            // Paso 3: Renderizado con ruta sincronizada a subcarpeta 'utiles' 
            res.render('utiles/confirmacion', { 
                paciente: { nombre, apellido, dni },
                idAdmision: resAdmision.insertId,
                horaIngreso: new Date().toLocaleTimeString()
            });

        } catch (error) {
            console.error("Error en admisión:", error.message);
            res.render('utiles/error', { mensaje: 'Error técnico al generar el ingreso: ' + error.message });
        }
    },

    // 4. Crear Admisión para Paciente Existente
    crearAdmisionExistente: async (req, res) => {
        const { paciente_id, obra_social_id, motivo_consulta, telefono } = req.body;
        const idOS = obra_social_id || 1;

        try {
            // Actualizamos el teléfono/obra social y creamos la admisión
            await db.query('UPDATE pacientes SET telefono = ?, obrasocial = ? WHERE id_paciente = ?', 
                [telefono, idOS, paciente_id]);

            const [resAdmision] = await db.query(
                `INSERT INTO admisiones (paciente_id, obra_social_id, motivo_consulta, estado_admision) 
                 VALUES (?, ?, ?, 'Ventanilla')`,
                [paciente_id, idOS, motivo_consulta]
            );

            const [pac] = await db.query('SELECT nombre, apellido, dni FROM pacientes WHERE id_paciente = ?', [paciente_id]);
            
            res.render('utiles/confirmacion', { 
                paciente: pac[0],
                idAdmision: resAdmision.insertId,
                horaIngreso: new Date().toLocaleTimeString()
            });
        } catch (error) {
            res.render('utiles/error', { mensaje: 'Error al procesar la admisión del paciente existente.' });
        }
    },

    // Módulo de Triage
    renderTriage: async (req, res) => {
        try {
            const [listaEspera] = await db.query(`
                SELECT a.id_admision, p.nombre, p.apellido, p.dni, DATE_FORMAT(a.fecha_ingreso, '%H:%i') as hora_ingreso 
                FROM admisiones a JOIN pacientes p ON a.paciente_id = p.id_paciente 
                WHERE a.estado_admision = 'Ventanilla' ORDER BY a.fecha_ingreso ASC`);
            res.render('enfermeria/triage', { listaEspera, seleccionado: null });
        } catch (error) {
            res.render('utiles/error', { mensaje: error.message });
        }
    },

    // Módulo de Médicos
    renderAtencionMedica: async (req, res) => {
        try {
            const [pacientesMed] = await db.query(`
                SELECT a.id_admision, p.nombre, p.apellido, t.prioridad, t.presion_arterial as presion, t.temperatura
                FROM admisiones a JOIN pacientes p ON a.paciente_id = p.id_paciente
                JOIN atenciones_triage t ON a.id_admision = t.admision_id
                WHERE a.estado_admision = 'Espera Médico' ORDER BY t.prioridad ASC, a.fecha_ingreso ASC`);
            res.render('medico/medico', { pacientesMed, consultaActiva: null });
        } catch (error) {
            res.render('utiles/error', { mensaje: error.message });
        }
    }
};

module.exports = hospitalController;