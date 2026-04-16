const db = require('../../config/db');
const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuarioModel');
const pacienteModel = require('../models/pacienteModel');
const { hashPassword } = require('../helpers/passwordHelper');
const PDFDocument = require('pdfkit');

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

// Función auxiliar para obtener pacientes atendidos hoy
const getPacientesAtendidosHoy = async () => {
    try {
        const [result] = await db.query(
            `SELECT COUNT(*) as total FROM atenciones_medicas 
             WHERE DATE(fecha_completada) = CURDATE()`
        );
        return result[0].total;
    } catch (error) {
        console.error('Error al contar pacientes atendidos hoy:', error);
        return 0;
    }
};

// Función auxiliar para generar promedio de espera aleatorio (30-45 minutos)
const getPromedioEsperaAleatorio = () => {
    return Math.floor(Math.random() * (45 - 30 + 1)) + 30;
};

const hospitalController = {

    // 0. Renderiza la vista de login al iniciar la app
    renderLogin: async (req, res) => {
        if (req.session && req.session.user) {
            return res.redirect('/');
        }

        try {
            // Obtener datos del administrador para el toast de recuperación de contraseña
            const [adminResult] = await db.query(
                'SELECT nombre, apellido, telefono, email FROM usuarios WHERE rol = ? AND estado = ? LIMIT 1',
                ['administrador', 'activo']
            );

            const adminData = adminResult.length > 0 ? adminResult[0] : null;

            res.render('login', { adminData });
        } catch (error) {
            console.error('Error al obtener datos del administrador:', error);
            res.render('login', { adminData: null });
        }
    },

    loginUser: async (req, res) => {
        const { usuario, password } = req.body;

        // Validar que el usuario y la contraseña hayan sido enviados.
        if (!usuario || !password) {
            return res.render('login', { error: 'Ingrese usuario y contraseña.' });
        }

        // Validar longitud mínima de contraseña
        if (password.length < 6) {
            return res.render('login', { error: 'Contraseña inválida.' });
        }

        try {
            // Buscar al usuario activo por email o DNI en la tabla usuarios.
            // IMPORTANTE: Incluir el campo password para validar con bcrypt
            const [usuarios] = await db.query(
                `SELECT id_usuario, nombre, apellido, dni, email, rol, password
                 FROM usuarios
                 WHERE estado = 'activo' AND (email = ? OR dni = ?)
                 LIMIT 1`,
                [usuario, usuario]
            );

            // Si no existe o está inactivo, devolver mensaje de error.
            if (!usuarios.length) {
                return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
            }

            const usuarioEncontrado = usuarios[0];

            // Comparar la contraseña ingresada con el hash almacenado en la BD
            const passwordValida = await bcrypt.compare(password, usuarioEncontrado.password);

            if (!passwordValida) {
                return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
            }

            // Guardar datos esenciales del usuario en la sesión.
            req.session.user = {
                id: usuarioEncontrado.id_usuario,
                nombre: usuarioEncontrado.nombre,
                apellido: usuarioEncontrado.apellido,
                dni: usuarioEncontrado.dni,
                email: usuarioEncontrado.email,
                rol: usuarioEncontrado.rol
            };

            // Redirigir según el rol del usuario tras el login.
            let redirectPath = '/';
            if (usuarioEncontrado.rol === 'administrador') {
                redirectPath = '/admin/usuarios';
            } else if (usuarioEncontrado.rol === 'enfermeria') {
                redirectPath = '/triage';
            } else if (usuarioEncontrado.rol === 'medico') {
                redirectPath = '/atencion-medica';
            } else if (usuarioEncontrado.rol === 'admision_internacion') {
                redirectPath = '/internacion/espera';
            }
            
            return res.redirect(redirectPath);
        } catch (error) {
            console.error('Error al autenticar usuario:', error);
            return res.render('login', { error: 'Error al autenticar usuario. Intente de nuevo.' });
        }
    },

    logoutUser: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    },

    // Renderiza la vista de espera de internación
    renderEspera: async (req, res) => {
        try {
            // Consulta simplificada para debug
            const [pacientesEspera] = await db.query(`
                SELECT 
                    am.id_atencion_medica,
                    a.id_admision,
                    p.nombre,
                    p.apellido,
                    p.dni,
                    am.diagnostico,
                    am.requiere_internacion,
                    am.estado_atencion,
                    a.estado_admision,
                    am.fecha_completada,
                    a.fecha_ingreso
                FROM atenciones_medicas am
                JOIN admisiones a ON am.admision_id = a.id_admision
                JOIN pacientes p ON a.paciente_id = p.id_paciente
                WHERE am.requiere_internacion = 1
            `);
            console.log('Todos los pacientes con requiere_internacion=1:', pacientesEspera.length);
            pacientesEspera.forEach((p, i) => {
                console.log(`${i+1}: ID ${p.id_atencion_medica}, Admision ${p.id_admision}, Estado ${p.estado_atencion}, Admision Estado ${p.estado_admision}`);
            });

            // Consulta original con filtros
            const [pacientesEsperaFiltrados] = await db.query(`
                SELECT 
                    a.id_admision,
                    p.nombre,
                    p.apellido,
                    p.dni,
                    am.diagnostico as diagnostico_guardia,
                    TIMEDIFF(NOW(), COALESCE(am.fecha_completada, a.fecha_ingreso)) as tiempo_transcurrido,
                    COALESCE(t.prioridad, 0) as prioridad
                FROM admisiones a
                JOIN pacientes p ON a.paciente_id = p.id_paciente
                JOIN atenciones_medicas am ON a.id_admision = am.admision_id
                LEFT JOIN atenciones_triage t ON a.id_admision = t.admision_id
                WHERE am.requiere_internacion = 1 
                  AND am.estado_atencion IN ('completada', 'internacion')
                ORDER BY 
                    COALESCE(t.prioridad, 0) ASC,
                    COALESCE(am.fecha_completada, a.fecha_ingreso) ASC
            `);
            console.log('Pacientes filtrados para vista:', pacientesEsperaFiltrados.length);
            console.log('Primeros pacientes filtrados:', pacientesEsperaFiltrados.slice(0, 2));

            res.render('internacion/espera', { pacientesEspera: pacientesEsperaFiltrados, user: req.session.user });
        } catch (error) {
            console.error('Error al obtener pacientes en espera:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar pacientes en espera de internación.' });
        }
    },

    // Renderiza el mapa de camas para internación
    renderMapaCamas: async (req, res) => {
        try {
            const [camasData] = await db.query(`
                SELECT 
                    c.id_cama,
                    c.nombre_cama,
                    h.numero as habitacion_numero,
                    h.id_habitacion,
                    al.nombre_ala,
                    al.id_ala,
                    c.estado_cama,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
                    p.dni
                FROM camas c
                JOIN habitaciones h ON c.habitacion_id = h.id_habitacion
                JOIN alas al ON h.ala_id = al.id_ala
                LEFT JOIN internaciones i ON c.id_cama = i.cama_id AND i.estado_registro = 'Activo'
                LEFT JOIN admisiones a ON i.admision_id = a.id_admision
                LEFT JOIN pacientes p ON a.paciente_id = p.id_paciente
                ORDER BY al.id_ala ASC, h.numero ASC, c.nombre_cama ASC
            `);

            // Definir estructura fija: 3 alas, 5 habitaciones, 2 camas cada una
            const alasNombres = ['Coronaria', 'Medicina General', 'Cirugía'];
            const habitacionesNumeros = [1, 2, 3, 4, 5];
            const camasNombres = ['A', 'B'];

            // Crear mapa de camas existentes por ala, habitación, cama
            const camasMap = new Map();
            camasData.forEach(cama => {
                const key = `${cama.nombre_ala}-${cama.habitacion_numero}-${cama.nombre_cama}`;
                camasMap.set(key, {
                    id_cama: cama.id_cama,
                    estado_cama: cama.estado_cama,
                    paciente_nombre: cama.paciente_nombre,
                    dni: cama.dni
                });
            });

            // Generar estructura completa
            const alas = alasNombres.map(nombreAla => ({
                nombre_ala: nombreAla,
                habitaciones: habitacionesNumeros.map(numHab => ({
                    numero: numHab,
                    camas: camasNombres.map(nombreCama => {
                        const key = `${nombreAla}-${numHab}-${nombreCama}`;
                        const camaExistente = camasMap.get(key);
                        return {
                            id_cama: camaExistente ? camaExistente.id_cama : null,
                            nombre_cama: nombreCama,
                            estado_cama: camaExistente ? camaExistente.estado_cama : 'Libre',
                            paciente_nombre: camaExistente ? camaExistente.paciente_nombre : null,
                            dni: camaExistente ? camaExistente.dni : null,
                            existe: !!camaExistente
                        };
                    })
                }))
            }));

            res.render('internacion/mapa-camas', { alas, user: req.session.user });
        } catch (error) {
            console.error('Error al obtener mapa de camas:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar el mapa de camas.' });
        }
    },

    // Renderiza la vista de cambio de contraseña
    renderCambiarPassword: (req, res) => {
        res.render('cambiar-password', { user: req.session.user });
    },

    // Procesa el cambio de contraseña
    cambiarPassword: async (req, res) => {
        const { passwordActual, passwordNueva, passwordConfirmar } = req.body;
        const userId = req.session.user.id;

        // Validaciones
        if (!passwordActual || !passwordNueva || !passwordConfirmar) {
            return res.render('cambiar-password', { 
                user: req.session.user, 
                error: 'Todos los campos son requeridos.' 
            });
        }

        if (passwordNueva.length < 6) {
            return res.render('cambiar-password', { 
                user: req.session.user, 
                error: 'La contraseña debe tener al menos 6 caracteres.' 
            });
        }

        if (passwordNueva !== passwordConfirmar) {
            return res.render('cambiar-password', { 
                user: req.session.user, 
                error: 'Las contraseñas no coinciden.' 
            });
        }

        if (passwordActual === passwordNueva) {
            return res.render('cambiar-password', { 
                user: req.session.user, 
                error: 'La contraseña nueva debe ser diferente a la actual.' 
            });
        }

        try {
            // Obtener la contraseña actual del usuario
            const [usuarios] = await db.query(
                'SELECT password FROM usuarios WHERE id_usuario = ?',
                [userId]
            );

            if (!usuarios.length) {
                return res.render('cambiar-password', { 
                    user: req.session.user, 
                    error: 'Usuario no encontrado.' 
                });
            }

            // Validar que la contraseña actual sea correcta
            const { hashPassword, validatePassword } = require('../helpers/passwordHelper');
            const passwordEsCorrecto = await validatePassword(passwordActual, usuarios[0].password);

            if (!passwordEsCorrecto) {
                return res.render('cambiar-password', { 
                    user: req.session.user, 
                    error: 'La contraseña actual es incorrecta.' 
                });
            }

            // Hashear la nueva contraseña
            const passwordHasheada = await hashPassword(passwordNueva);

            // Actualizar en la BD
            await db.query(
                'UPDATE usuarios SET password = ? WHERE id_usuario = ?',
                [passwordHasheada, userId]
            );

            return res.render('cambiar-password', { 
                user: req.session.user, 
                exito: 'Contraseña actualizada exitosamente.' 
            });
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            return res.render('cambiar-password', { 
                user: req.session.user, 
                error: 'Error al actualizar la contraseña. Intente de nuevo.' 
            });
        }
    },

    // 1. Renderiza la vista principal (Buscador)
    renderIndex: async (req, res) => {
        try {
            const pacientesEnEspera = await getPacientesEnEspera();
            const atendidosHoy = await getPacientesAtendidosHoy();
            const promedioEspera = getPromedioEsperaAleatorio();
            res.render('index', {
                pacienteNoEncontrado: false,
                pacientesEnEspera: pacientesEnEspera,
                atendidosHoy: atendidosHoy,
                promedioEspera: promedioEspera
            });
        } catch (error) {
            console.error('Error al obtener pacientes en espera:', error);
            res.render('index', {
                pacienteNoEncontrado: false,
                pacientesEnEspera: 0,
                atendidosHoy: 0,
                promedioEspera: 30
            });
        }
    },

    // 1. Lógica de Búsqueda por DNI con señal de Toast
    buscarPaciente: async (req, res) => {
        const { dni } = req.body;
        try {
            const pacientes = await pacienteModel.findByDni(dni);
            const obrasSociales = await pacienteModel.getObrasSociales();
            const pacientesEnEspera = await getPacientesEnEspera();

            if (pacientes.length > 0) {
                res.render('utiles/admitir-existente', {
                    paciente: pacientes[0],
                    obrasSociales
                });
            } else {
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
            const obrasSociales = await pacienteModel.getObrasSociales();
            res.render('pacientes/registro-paciente', { dni, obrasSociales });
        } catch (error) {
            res.render('utiles/error', { mensaje: 'Error al cargar el formulario de registro.' });
        }
    },

    // 3. Guardar Nuevo Paciente y Crear Admisión (Flujo corregido)
    guardarNuevoPaciente: async (req, res) => {
        const { dni, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, obra_social_id, motivo_consulta } = req.body;

        if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
            return res.render('utiles/error', { mensaje: 'Nombre y Apellido deben contener solo letras.' });
        }

        const idOS = obra_social_id || 1;

        try {
            const [resPaciente] = await pacienteModel.insertPaciente({
                dni,
                nombre,
                apellido,
                fecha_nacimiento,
                genero,
                telefono,
                direccion,
                obrasocial: idOS
            });

            const nuevoPacienteId = resPaciente.insertId;

            const [resAdmision] = await pacienteModel.createAdmision({
                paciente_id: nuevoPacienteId,
                obra_social_id: idOS,
                motivo_consulta
            });

            res.render('utiles/confirmacion', {
                paciente: { nombre, apellido, dni },
                idAdmision: resAdmision.insertId,
                horaIngreso: new Date().toLocaleTimeString()
            });
        } catch (error) {
            console.error('Error en admisión:', error.message);
            res.render('utiles/error', { mensaje: 'Error técnico al generar el ingreso: ' + error.message });
        }
    },

    // 4. Crear Admisión para Paciente Existente
    crearAdmisionExistente: async (req, res) => {
        const { paciente_id, obra_social_id, motivo_consulta, telefono } = req.body;
        const idOS = obra_social_id || 1;

        try {
            await pacienteModel.updatePacienteContacto({
                paciente_id,
                telefono,
                obrasocial: idOS
            });

            const [resAdmision] = await pacienteModel.createAdmision({
                paciente_id,
                obra_social_id: idOS,
                motivo_consulta
            });

            const paciente = await pacienteModel.getPacienteById(paciente_id);

            res.render('utiles/confirmacion', {
                paciente: {
                    nombre: paciente.nombre,
                    apellido: paciente.apellido,
                    dni: paciente.dni
                },
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

        // Validaciones de rango
        if (temperatura && (isNaN(temperatura) || temperatura < 35 || temperatura > 42)) {
            return res.render('utiles/error', { mensaje: 'La temperatura debe estar entre 35°C y 42°C.' });
        }

        if (frecuencia && (isNaN(frecuencia) || frecuencia < 40 || frecuencia > 200)) {
            return res.render('utiles/error', { mensaje: 'La frecuencia cardíaca debe estar entre 40 y 200 bpm.' });
        }

        if (saturacion && (isNaN(saturacion) || saturacion < 0 || saturacion > 100)) {
            return res.render('utiles/error', { mensaje: 'La saturación de oxígeno debe estar entre 0 y 100%.' });
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

            // Redirigir según el rol del usuario
            if (req.session.user.rol === 'enfermeria') {
                res.redirect('/triage');
            } else {
                res.redirect('/atencion-medica');
            }
        } catch (error) {
            console.error('Error al guardar triage:', error);
            res.render('utiles/error', { mensaje: 'Error técnico al guardar el triage.' });
        }
    },

    // Módulo de Médicos
    renderAtencionMedica: async (req, res) => {
        try {
            const [pacientesMed] = await db.query(`
                SELECT DISTINCT a.id_admision, p.nombre, p.apellido, t.prioridad, t.presion_arterial as presion, t.temperatura, t.frecuencia_cardiaca, t.saturacion_oxigeno,
                       TIMESTAMPDIFF(MINUTE, a.fecha_ingreso, NOW()) as tiempo_espera_minutos, a.fecha_ingreso
                FROM admisiones a JOIN pacientes p ON a.paciente_id = p.id_paciente
                JOIN atenciones_triage t ON a.id_admision = t.admision_id
                WHERE a.estado_admision = 'Espera Médico' 
                AND t.fecha_registro = (
                    SELECT MAX(t2.fecha_registro) 
                    FROM atenciones_triage t2 
                    WHERE t2.admision_id = a.id_admision
                )
                ORDER BY t.prioridad ASC, a.fecha_ingreso ASC`);
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
                WHERE admision_id = ?
                ORDER BY fecha_registro DESC
                LIMIT 1`, [id]);

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

    // Renderizar lista de pacientes con paginación
    renderListaPacientes: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            const search = req.query.search ? req.query.search.trim() : '';

            const totalPacientes = await pacienteModel.countPacientes(search);
            const totalPages = Math.ceil(totalPacientes / limit);
            const pacientes = await pacienteModel.searchPacientes({ search, limit, offset });

            res.render('pacientes/listapacientes', {
                pacientes,
                currentPage: page,
                totalPages,
                totalPacientes,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                search
            });
        } catch (error) {
            console.error('Error al cargar lista de pacientes:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar la lista de pacientes.' });
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
            // Si requiere internación, NO lo marcamos como 'Internado' todavía, sino que sigue en atención hasta que admisión le asigne la cama
            const estadoAdmision = requiere_internacion === '1' ? 'En Atención' : 'Alta';

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
    },

    // === MÉTODOS DE ADMINISTRACIÓN DE USUARIOS ===

    // Panel principal de administración de usuarios
    renderAdminUsuarios: async (req, res) => {
        try {
            const usuarios = await usuarioModel.getAllUsuarios();
            res.render('admin/usuarios', { usuarios });
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar la lista de usuarios.' });
        }
    },

    // Formulario para crear nuevo usuario
    renderNuevoUsuario: async (req, res) => {
        try {
            const medicos = await usuarioModel.getMedicosActivos();

            const [especialidades] = await db.query(
                'SELECT IdEspecialidad, Nombre FROM especialidades WHERE estado = ? ORDER BY Nombre',
                ['activa']
            );

            res.render('admin/nuevo-usuario', { medicos, especialidades });
        } catch (error) {
            console.error('Error al cargar formulario nuevo usuario:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar el formulario.' });
        }
    },

    // Validar si un DNI ya existe antes de crear usuario
    validarDniUsuario: async (req, res) => {
        const { dni } = req.query;

        if (!dni) {
            return res.status(400).json({ error: 'DNI es requerido.' });
        }

        try {
            const existe = await usuarioModel.existsDni(dni);
            return res.json({ existe });
        } catch (error) {
            console.error('Error al validar DNI:', error);
            return res.status(500).json({ error: 'No se pudo validar el DNI.' });
        }
    },

    // Validar si un email ya existe antes de crear usuario
    validarEmailUsuario: async (req, res) => {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email es requerido.' });
        }

        try {
            const existe = await usuarioModel.existsEmail(email);
            return res.json({ existe });
        } catch (error) {
            console.error('Error al validar email:', error);
            return res.status(500).json({ error: 'No se pudo validar el email.' });
        }
    },

    // Crear nuevo usuario
    crearUsuario: async (req, res) => {
        const { nombre, apellido, dni, telefono, email, password, rol, id_medico, matricula, id_especialidad } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !dni || !email || !password || !rol) {
            return res.render('admin/nuevo-usuario', {
                error: 'Todos los campos obligatorios deben ser completados.',
                medicos: [],
                especialidades: []
            });
        }

        if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
            return res.render('admin/nuevo-usuario', {
                error: 'Nombre y apellido deben contener solo letras.',
                medicos: [],
                especialidades: []
            });
        }

        if (!regexNumeros.test(dni) || dni.length < 7 || dni.length > 15) {
            return res.render('admin/nuevo-usuario', {
                error: 'DNI debe contener solo números (7-15 dígitos).',
                medicos: [],
                especialidades: []
            });
        }

        if (password.length < 6) {
            return res.render('admin/nuevo-usuario', {
                error: 'La contraseña debe tener al menos 6 caracteres.',
                medicos: [],
                especialidades: []
            });
        }

        // Validaciones específicas para médicos
        if (rol === 'medico') {
            if (!matricula || !id_especialidad) {
                return res.render('admin/nuevo-usuario', {
                    error: 'Para médicos, matrícula y especialidad son obligatorios.',
                    medicos: [],
                    especialidades: []
                });
            }

            if (!regexNumeros.test(matricula) || matricula.length < 4 || matricula.length > 10) {
                return res.render('admin/nuevo-usuario', {
                    error: 'Matrícula debe contener solo números (4-10 dígitos).',
                    medicos: [],
                    especialidades: []
                });
            }
        }

        // Validaciones específicas para enfermería
        if (rol === 'enfermeria') {
            // Para enfermería, id_medico puede ser null
        }

        try {
            // Verificar si DNI o email ya existen
            const existe = await usuarioModel.findUsuarioByDniOrEmail(dni, email);

            if (existe.length > 0) {
                return res.render('admin/nuevo-usuario', {
                    error: 'Ya existe un usuario con ese DNI o email.',
                    medicos: [],
                    especialidades: []
                });
            }

            // Si es médico, verificar que la matrícula no exista
            if (rol === 'medico') {
                const [matriculaExiste] = await db.query(
                    'SELECT IdMedico FROM medicos WHERE Matricula = ?',
                    [matricula]
                );

                if (matriculaExiste.length > 0) {
                    return res.render('admin/nuevo-usuario', {
                        error: 'Ya existe un médico con esa matrícula.',
                        medicos: [],
                        especialidades: []
                    });
                }
            }

            const passwordHasheada = await hashPassword(password);

            let idMedicoAsignado = null;

            if (rol === 'medico') {
                idMedicoAsignado = await usuarioModel.createMedico({
                    nombre,
                    apellido,
                    matricula,
                    id_especialidad
                });
            }

            await usuarioModel.createUsuario({
                nombre,
                apellido,
                dni,
                telefono,
                email,
                password: passwordHasheada,
                rol,
                id_medico: rol === 'enfermeria' ? null : (idMedicoAsignado || id_medico || null)
            });

            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.render('utiles/error', { mensaje: 'Error al crear el usuario.' });
        }
    },

    // Formulario para editar usuario
    renderEditarUsuario: async (req, res) => {
        const { id } = req.params;

        // Verificar que no sea el propio usuario administrador
        if (req.session.user.id == id && req.session.user.rol === 'administrador') {
            return res.redirect('/admin/usuarios');
        }

        try {
            const usuario = await usuarioModel.findUsuarioById(id);

            if (!usuario) {
                return res.render('utiles/error', { mensaje: 'Usuario no encontrado.' });
            }

            const medicos = await usuarioModel.getMedicosActivos();

            res.render('admin/editar-usuario', { usuario, medicos });
        } catch (error) {
            console.error('Error al cargar usuario para editar:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar los datos del usuario.' });
        }
    },

    // Actualizar usuario
    actualizarUsuario: async (req, res) => {
        const { id } = req.params;
        const { nombre, apellido, dni, telefono, email, rol, id_medico, password } = req.body;

        // Verificar que no sea el propio usuario administrador
        if (req.session.user.id == id && req.session.user.rol === 'administrador') {
            return res.redirect('/admin/usuarios');
        }

        // Validaciones
        if (!nombre || !apellido || !dni || !email || !rol) {
            return res.redirect(`/admin/usuarios/${id}/editar`);
        }

        if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
            return res.redirect(`/admin/usuarios/${id}/editar`);
        }

        if (!regexNumeros.test(dni) || dni.length < 7 || dni.length > 15) {
            return res.redirect(`/admin/usuarios/${id}/editar`);
        }

        try {
            const existe = await usuarioModel.findUsuarioByDniOrEmailExceptId(dni, email, id);

            if (existe.length > 0) {
                return res.redirect(`/admin/usuarios/${id}/editar`);
            }

            let passwordHasheada = null;
            if (password && password.length >= 6) {
                passwordHasheada = await hashPassword(password);
            }

            await usuarioModel.updateUsuario({
                id,
                nombre,
                apellido,
                dni,
                telefono,
                email,
                rol,
                id_medico,
                password: passwordHasheada
            });

            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.redirect(`/admin/usuarios/${id}/editar`);
        }
    },

    // Eliminar usuario (borrado lógico - cambiar estado)
    eliminarUsuario: async (req, res) => {
        const { id } = req.params;

        try {
            if (req.session.user.id == id) {
                return res.redirect('/admin/usuarios');
            }

            await usuarioModel.setUsuarioEstado(id, 'inactivo');
            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.redirect('/admin/usuarios');
        }
    },

    // Activar/Desactivar usuario
    toggleEstadoUsuario: async (req, res) => {
        const { id } = req.params;

        try {
            if (req.session.user.id == id) {
                return res.redirect('/admin/usuarios');
            }

            const estadoActual = await usuarioModel.getUsuarioEstado(id);
            if (!estadoActual) {
                return res.redirect('/admin/usuarios');
            }

            const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
            await usuarioModel.setUsuarioEstado(id, nuevoEstado);

            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al cambiar estado de usuario:', error);
            res.redirect('/admin/usuarios');
        }
    },

    // Renderizar formulario de edición de paciente
    renderEditarPaciente: async (req, res) => {
        const { id } = req.params;

        try {
            const paciente = await pacienteModel.getPacienteById(id);

            if (!paciente) {
                return res.render('utiles/error', { mensaje: 'Paciente no encontrado.' });
            }

            const obrasSociales = await pacienteModel.getObrasSociales();

            res.render('pacientes/editarpaciente', {
                paciente,
                obrasSociales
            });
        } catch (error) {
            console.error('Error al cargar paciente para edición:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar el paciente.' });
        }
    },

    // Actualizar paciente (solo campos editables)
    actualizarPaciente: async (req, res) => {
        const { id } = req.params;
        const { obrasocial, direccion, telefono } = req.body;

        try {
            await pacienteModel.updatePaciente({
                id,
                obrasocial,
                direccion,
                telefono
            });

            res.redirect('/lista-pacientes');
        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            res.render('utiles/error', { mensaje: 'Error al actualizar el paciente.' });
        }
    },

    // Generar Reporte de Historia Clínica
    generarReporteHistoriaClinica: async (req, res) => {
        const { id } = req.params;
        const { pdf } = req.query;

        try {
            // Obtener datos del paciente
            const paciente = await pacienteModel.getPacienteById(id);
            if (!paciente) {
                return res.render('utiles/error', { mensaje: 'Paciente no encontrado.' });
            }

            // Obtener todas las admisiones del paciente
            const [admisiones] = await db.query('SELECT * FROM admisiones WHERE paciente_id = ? ORDER BY fecha_ingreso DESC', [id]);

            const historiaClinica = {
                paciente,
                admisiones: []
            };

            for (const admision of admisiones) {
                const admisionData = { ...admision };

                // Triage
                const [triage] = await db.query('SELECT * FROM atenciones_triage WHERE admision_id = ?', [admision.id_admision]);
                admisionData.triage = triage[0] || null;

                // Atención médica
                const [atencion] = await db.query('SELECT * FROM atenciones_medicas WHERE admision_id = ?', [admision.id_admision]);
                admisionData.atencion_medica = atencion[0] || null;

                // Internación
                const [internacion] = await db.query('SELECT * FROM internaciones WHERE admision_id = ?', [admision.id_admision]);
                admisionData.internacion = internacion[0] || null;

                if (admisionData.internacion) {
                    // Evoluciones
                    const [evoluciones] = await db.query('SELECT * FROM evoluciones_internacion WHERE internacion_id = ? ORDER BY fecha_registro ASC', [admisionData.internacion.id_internacion]);
                    admisionData.evoluciones = evoluciones.map(e => ({
                        fecha_evolucion: e.fecha_registro,
                        evolucion: e.evolucion_clinica,
                        tratamiento: e.tratamiento_actual
                    }));

                    // Alta (usando datos de internaciones)
                    if (admisionData.internacion.fecha_alta_piso) {
                        admisionData.alta = {
                            fecha_alta: admisionData.internacion.fecha_alta_piso,
                            tipo_alta: 'Alta médica', // Asumiendo, ya que no hay campo específico
                            observaciones: 'Alta procesada'
                        };
                    }
                }

                historiaClinica.admisiones.push(admisionData);
            }

            if (pdf === 'true') {
                // Generar PDF con PDFKit
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: `Historia Clínica - ${paciente.apellido} ${paciente.nombre}`,
                        Author: 'Hospital La Trinidad',
                        Subject: 'Historia Clínica del Paciente'
                    }
                });
                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename=historia clinica ${paciente.apellido} ${paciente.nombre}.pdf`);
                    res.send(pdfBuffer);
                });

                // Encabezado del hospital
                doc.fontSize(16).font('Helvetica-Bold').text('HOSPITAL LA TRINIDAD', { align: 'center' });
                doc.moveDown(0.5);
                doc.fontSize(14).font('Helvetica-Bold').text('Historia Clínica del Paciente', { align: 'center' });
                doc.moveDown();

                // Línea separadora
                doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
                doc.moveDown();

                // Datos del Paciente
                doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL PACIENTE');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica');

                const patientData = [
                    ['Nombre:', `${paciente.nombre} ${paciente.apellido}`],
                    ['DNI:', paciente.dni],
                    ['Fecha de Nacimiento:', new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES')],
                    ['Edad:', `${paciente.edad} años`],
                    ['Género:', paciente.genero],
                    ['Teléfono:', paciente.telefono || 'No registrado'],
                    ['Dirección:', paciente.direccion || 'No registrada'],
                    ['Obra Social:', paciente.obra_social || 'Sin obra social']
                ];

                patientData.forEach(([label, value]) => {
                    doc.text(`${label} ${value}`);
                });

                doc.moveDown();

                // Historial de Admisiones
                doc.fontSize(12).font('Helvetica-Bold').text('HISTORIAL DE ADMISIONES');
                doc.moveDown(0.5);

                historiaClinica.admisiones.forEach((admision, index) => {
                    // Verificar si hay espacio suficiente para la admisión completa
                    if (doc.y > 700) {
                        doc.addPage();
                    }

                    // Título de la admisión
                    doc.fontSize(11).font('Helvetica-Bold').text(`Admisión ${index + 1}`, { underline: true });
                    doc.fontSize(10).font('Helvetica');
                    doc.text(`Fecha: ${new Date(admision.fecha_ingreso).toLocaleString('es-ES')}`);
                    doc.text(`Estado: ${admision.estado_admision}`);
                    doc.moveDown(0.3);

                    // Motivo de consulta
                    doc.font('Helvetica-Bold').text('Motivo de Consulta:');
                    doc.font('Helvetica').text(admision.motivo_consulta || 'No especificado');
                    doc.moveDown(0.3);

                    // Triage
                    if (admision.triage) {
                        doc.font('Helvetica-Bold').text('Triage:');
                        doc.font('Helvetica').text(`Prioridad: ${admision.triage.prioridad}`);
                        if (admision.triage.sintomas) {
                            doc.text(`Síntomas: ${admision.triage.sintomas}`);
                        }
                        doc.moveDown(0.3);
                    }

                    // Atención médica
                    if (admision.atencion_medica) {
                        doc.font('Helvetica-Bold').text('Atención Médica:');
                        doc.font('Helvetica');
                        if (admision.atencion_medica.diagnostico) {
                            doc.text(`Diagnóstico: ${admision.atencion_medica.diagnostico}`);
                        }
                        doc.text(`Requiere Internación: ${admision.atencion_medica.requiere_internacion ? 'Sí' : 'No'}`);
                        doc.text(`Estado: ${admision.atencion_medica.estado_atencion}`);
                        doc.moveDown(0.3);
                    }

                    // Internación
                    if (admision.internacion) {
                        doc.font('Helvetica-Bold').text('Internación:');
                        doc.font('Helvetica');
                        doc.text(`Fecha: ${admision.internacion.fecha_ingreso_piso ? new Date(admision.internacion.fecha_ingreso_piso).toLocaleString('es-ES') : 'No registrada'}`);
                        doc.text(`Cama: ${admision.internacion.cama_id}`);
                        doc.text(`Estado: ${admision.internacion.estado_registro}`);
                        doc.text(`Alta Médica Autorizada: ${admision.internacion.autorizado_alta_medica ? 'Sí' : 'No'}`);

                        // Evoluciones
                        if (admision.evoluciones && admision.evoluciones.length > 0) {
                            doc.moveDown(0.3);
                            doc.font('Helvetica-Bold').text('Evoluciones:');
                            doc.font('Helvetica');
                            admision.evoluciones.forEach((evolucion, evIndex) => {
                                if (doc.y > 750) {
                                    doc.addPage();
                                }
                                doc.text(`${evIndex + 1}. Fecha: ${new Date(evolucion.fecha_evolucion).toLocaleString('es-ES')}`);
                                doc.text(`   Evolución: ${evolucion.evolucion}`);
                                if (evolucion.tratamiento) {
                                    doc.text(`   Tratamiento: ${evolucion.tratamiento}`);
                                }
                                doc.moveDown(0.2);
                            });
                        }

                        // Alta
                        if (admision.alta) {
                            doc.moveDown(0.3);
                            doc.font('Helvetica-Bold').text('Alta:');
                            doc.font('Helvetica');
                            doc.text(`Fecha: ${new Date(admision.alta.fecha_alta).toLocaleString('es-ES')}`);
                            doc.text(`Tipo: ${admision.alta.tipo_alta}`);
                            if (admision.alta.observaciones) {
                                doc.text(`Observaciones: ${admision.alta.observaciones}`);
                            }
                        }

                        doc.moveDown(0.5);
                    }

                    // Línea separadora entre admisiones
                    if (index < historiaClinica.admisiones.length - 1) {
                        doc.moveDown(0.5);
                        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
                        doc.moveDown(0.5);
                    }
                });

                // Pie de página en la última página
                doc.fontSize(8).font('Helvetica').text(
                    `Generado el ${new Date().toLocaleString('es-ES')}`,
                    50,
                    doc.page.height - 30,
                    { align: 'center' }
                );

                doc.end();
            } else {
                // Renderizar vista HTML
                res.render('pacientes/reporte-historia-clinica', { historiaClinica });
            }
        } catch (error) {
            console.error('Error al generar reporte:', error);
            console.log('Detalles del error en generación de reporte de historia clínica:', {
                pacienteId: id,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
            res.render('utiles/error', { mensaje: 'Error al generar el reporte de historia clínica.' });
        }
    }
};

module.exports = hospitalController;