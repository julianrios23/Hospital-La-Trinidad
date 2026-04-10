const db = require('../../config/db');

// --- REGLAS DE VALIDACIÓN (Regex para Backend) ---
const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const regexNumeros = /^\d+$/;
const regexAlfanumerico = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,.-]+$/;

// Función auxiliar para obtener pacientes en espera
const getPacientesEnEspera = async () => {
    try {
        const [result] = await db.query(
            'SELECT COUNT(*) as total FROM admisiones WHERE estado_admision = ?',
            ['Ventanilla']
        );
        return result[0].total;
    } catch (error) {
        console.error('Error al contar pacientes en espera:', error);
        return 0;
    }
};

const hospitalController = {

    // 0. Renderiza la vista principal (Buscador)
    renderIndex: async (req, res) => {
        try {
            const pacientesEnEspera = await getPacientesEnEspera();
            res.render('index', {
                pacienteNoEncontrado: false,
                pacientesEnEspera: pacientesEnEspera
            });
        } catch (error) {
            console.error('Error al obtener pacientes en espera:', error);
            res.render('index', {
                pacienteNoEncontrado: false,
                pacientesEnEspera: 0
            });
        }
    },

    // 1. Lógica de Búsqueda por DNI con señal de Toast
    buscarPaciente: async (req, res) => {
        const { dni } = req.body;
        try {
            const [pacientes] = await db.query('SELECT * FROM pacientes WHERE dni = ?', [dni]);
            const [obrasSociales] = await db.query('SELECT * FROM obras_sociales ORDER BY nombre_obra_social ASC');
            const pacientesEnEspera = await getPacientesEnEspera();

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
                    dniBuscado: dni,
                    pacientesEnEspera: pacientesEnEspera
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
                SELECT a.id_admision, p.nombre, p.apellido, p.dni, a.motivo_consulta, DATE_FORMAT(a.fecha_ingreso, '%H:%i') as hora_ingreso 
                FROM admisiones a JOIN pacientes p ON a.paciente_id = p.id_paciente 
                WHERE a.estado_admision = 'Ventanilla' ORDER BY a.fecha_ingreso ASC`);
            res.render('enfermeria/triage', { listaEspera, seleccionado: null });
        } catch (error) {
            res.render('utiles/error', { mensaje: error.message });
        }
    },

    renderTriagePaciente: async (req, res) => {
        const { id } = req.params;
        try {
            const [listaEspera] = await db.query(`
                SELECT a.id_admision, p.nombre, p.apellido, p.dni, a.motivo_consulta, DATE_FORMAT(a.fecha_ingreso, '%H:%i') as hora_ingreso 
                FROM admisiones a JOIN pacientes p ON a.paciente_id = p.id_paciente 
                WHERE a.estado_admision = 'Ventanilla' ORDER BY a.fecha_ingreso ASC`);

            const [seleccionado] = await db.query(`
                SELECT a.id_admision, p.nombre, p.apellido, p.dni, a.motivo_consulta
                FROM admisiones a JOIN pacientes p ON a.paciente_id = p.id_paciente
                WHERE a.id_admision = ?`, [id]);

            if (!seleccionado.length) {
                return res.render('utiles/error', { mensaje: 'Paciente no encontrado en triage.' });
            }

            res.render('enfermeria/triage', { listaEspera, seleccionado: seleccionado[0] });
        } catch (error) {
            res.render('utiles/error', { mensaje: error.message });
        }
    },

    guardarTriage: async (req, res) => {
        const { id_admision, prioridad, presion, temperatura, frecuencia, saturacion, observaciones } = req.body;

        if (!id_admision || !prioridad) {
            return res.render('utiles/error', { mensaje: 'Faltan datos obligatorios para guardar el triage.' });
        }

        try {
            await db.query(
                `INSERT INTO atenciones_triage
                 (admision_id, prioridad, presion_arterial, temperatura, frecuencia_cardiaca, saturacion_oxigeno, observaciones_enfermeria)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id_admision, prioridad, presion || null, temperatura || null, frecuencia || null, saturacion || null, observaciones || null]
            );

            await db.query(
                'UPDATE admisiones SET estado_admision = ? WHERE id_admision = ?',
                ['Espera Médico', id_admision]
            );

            res.redirect('/atencion-medica');
        } catch (error) {
            console.error('Error al guardar triage:', error);
            res.render('utiles/error', { mensaje: 'Error técnico al guardar el triage.' });
        }
    },

    // Módulo de Médicos
    renderAtencionMedica: async (req, res) => {
        try {
            const [pacientesMed] = await db.query(`
                SELECT a.id_admision, p.nombre, p.apellido, t.prioridad, t.presion_arterial as presion, t.temperatura, t.frecuencia_cardiaca, t.saturacion_oxigeno,
                       TIMESTAMPDIFF(MINUTE, a.fecha_ingreso, NOW()) as tiempo_espera_minutos
                FROM admisiones a JOIN pacientes p ON a.paciente_id = p.id_paciente
                JOIN atenciones_triage t ON a.id_admision = t.admision_id
                WHERE a.estado_admision = 'Espera Médico' ORDER BY t.prioridad ASC, a.fecha_ingreso ASC`);
            res.render('medico/medico', { pacientesMed, consultaActiva: null });
        } catch (error) {
            res.render('utiles/error', { mensaje: error.message });
        }
    },

    // Renderizar vista de diagnóstico para un paciente específico
    renderDiagnostico: async (req, res) => {
        const { id } = req.params;
        try {
            // Obtener datos del paciente, admisión y triage
            const [pacienteData] = await db.query(`
                SELECT p.nombre, p.apellido, p.dni, p.fecha_nacimiento, p.genero,
                       o.nombre_obra_social as obra_social, a.id_admision,
                       TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) as edad
                FROM admisiones a
                JOIN pacientes p ON a.paciente_id = p.id_paciente
                LEFT JOIN obras_sociales o ON p.obrasocial = o.id_obra_social
                WHERE a.id_admision = ?`, [id]);

            if (!pacienteData.length) {
                return res.render('utiles/error', { mensaje: 'Paciente no encontrado.' });
            }

            // Obtener datos del triage
            const [triageData] = await db.query(`
                SELECT prioridad, presion_arterial, temperatura, frecuencia_cardiaca,
                       saturacion_oxigeno, observaciones_enfermeria
                FROM atenciones_triage
                WHERE admision_id = ?`, [id]);

            if (!triageData.length) {
                return res.render('utiles/error', { mensaje: 'Datos de triage no encontrados.' });
            }

            res.render('medico/diagnostico', {
                paciente: pacienteData[0],
                triage: triageData[0],
                admision_id: id
            });
        } catch (error) {
            console.error('Error al cargar diagnóstico:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar los datos del paciente.' });
        }
    },

    // Método de prueba
    testMethod: (req, res) => {
        res.send('Test method works');
    },

    // Método de prueba simple
    testDiagnostico: (req, res) => {
        res.send('Test diagnostico works');
    },

    // Guardar diagnóstico y finalizar atención médica
    guardarDiagnostico: async (req, res) => {
        const { admision_id, diagnostico, tratamiento_medicacion, indicaciones_alta, requiere_internacion } = req.body;

        try {
            // Calcular tiempo total desde la admisión
            const [tiempoData] = await db.query(
                'SELECT TIMESTAMPDIFF(MINUTE, fecha_ingreso, NOW()) as tiempo_total FROM admisiones WHERE id_admision = ?',
                [admision_id]
            );

            const tiempoTotalMinutos = tiempoData[0].tiempo_total;

            // Determinar estado final
            const estadoAtencion = requiere_internacion === '1' ? 'internacion' : 'completada';
            const estadoAdmision = requiere_internacion === '1' ? 'Internado' : 'Alta';

            // Insertar atención médica
            await db.query(
                `INSERT INTO atenciones_medicas
                 (admision_id, diagnostico, tratamiento_medicacion, indicaciones_alta, requiere_internacion,
                  estado_atencion, fecha_completada, tiempo_total_minutos)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [admision_id, diagnostico, tratamiento_medicacion || null, indicaciones_alta || null,
                 requiere_internacion || 0, estadoAtencion, tiempoTotalMinutos]
            );

            // Actualizar estado de la admisión
            await db.query(
                'UPDATE admisiones SET estado_admision = ? WHERE id_admision = ?',
                [estadoAdmision, admision_id]
            );

            // Redirigir de vuelta a la lista de atención médica
            res.redirect('/atencion-medica');
        } catch (error) {
            console.error('Error al guardar diagnóstico:', error);
            res.render('utiles/error', { mensaje: 'Error al guardar el diagnóstico médico.' });
        }
    }
};

module.exports = hospitalController;