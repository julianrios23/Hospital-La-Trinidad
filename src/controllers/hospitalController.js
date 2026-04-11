const db = require('../../config/db');
const bcrypt = require('bcrypt');

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
    },

    // === MÉTODOS DE ADMINISTRACIÓN DE USUARIOS ===

    // Panel principal de administración de usuarios
    renderAdminUsuarios: async (req, res) => {
        try {
            const [usuarios] = await db.query(
                'SELECT id_usuario, nombre, apellido, dni, email, telefono, rol, estado, created_at FROM usuarios ORDER BY created_at DESC'
            );

            res.render('admin/usuarios', { usuarios });
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.render('utiles/error', { mensaje: 'Error al cargar la lista de usuarios.' });
        }
    },

    // Formulario para crear nuevo usuario
    renderNuevoUsuario: async (req, res) => {
        try {
            // Obtener lista de médicos para asignar
            const [medicos] = await db.query(
                'SELECT id_usuario, nombre, apellido FROM usuarios WHERE rol = ? AND estado = ?',
                ['medico', 'activo']
            );

            // Obtener lista de especialidades
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
            const [existe] = await db.query(
                'SELECT id_usuario FROM usuarios WHERE dni = ?',
                [dni]
            );

            return res.json({ existe: existe.length > 0 });
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
            const [existe] = await db.query(
                'SELECT id_usuario FROM usuarios WHERE email = ?',
                [email]
            );

            return res.json({ existe: existe.length > 0 });
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
        if (rol === 'enfermeria' && !id_medico) {
            return res.render('admin/nuevo-usuario', {
                error: 'Para enfermería, debe seleccionar un médico asignado.',
                medicos: [],
                especialidades: []
            });
        }

        try {
            // Verificar si DNI o email ya existen
            const [existe] = await db.query(
                'SELECT id_usuario FROM usuarios WHERE dni = ? OR email = ?',
                [dni, email]
            );

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

            // Hashear contraseña
            const { hashPassword } = require('../helpers/passwordHelper');
            const passwordHasheada = await hashPassword(password);

            let idMedicoAsignado = null;

            // Si es médico, crear registro en tabla medicos primero
            if (rol === 'medico') {
                const [result] = await db.query(
                    `INSERT INTO medicos (Nombre, Apellido, Matricula, IdEspecialidad, estado)
                     VALUES (?, ?, ?, ?, 'activo')`,
                    [nombre, apellido, matricula, id_especialidad]
                );

                idMedicoAsignado = result.insertId;
            }

            // Insertar usuario
            await db.query(
                `INSERT INTO usuarios (nombre, apellido, dni, telefono, email, password, rol, id_medico, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
                [nombre, apellido, dni, telefono || null, email, passwordHasheada, rol, idMedicoAsignado || id_medico || null]
            );

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
            const [usuarios] = await db.query(
                'SELECT id_usuario, nombre, apellido, dni, telefono, email, rol, id_medico, estado FROM usuarios WHERE id_usuario = ?',
                [id]
            );

            if (!usuarios.length) {
                return res.render('utiles/error', { mensaje: 'Usuario no encontrado.' });
            }

            // Obtener lista de médicos para asignar
            const [medicos] = await db.query(
                'SELECT id_usuario, nombre, apellido FROM usuarios WHERE rol = ? AND estado = ?',
                ['medico', 'activo']
            );

            res.render('admin/editar-usuario', { usuario: usuarios[0], medicos });
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
            // Verificar si DNI o email ya existen en otro usuario
            const [existe] = await db.query(
                'SELECT id_usuario FROM usuarios WHERE (dni = ? OR email = ?) AND id_usuario != ?',
                [dni, email, id]
            );

            if (existe.length > 0) {
                return res.redirect(`/admin/usuarios/${id}/editar`);
            }

            // Preparar consulta de actualización
            let query, params;

            if (password && password.length >= 6) {
                // Actualizar con nueva contraseña
                const { hashPassword } = require('../helpers/passwordHelper');
                const passwordHasheada = await hashPassword(password);

                query = `UPDATE usuarios SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, rol = ?, id_medico = ?, password = ? WHERE id_usuario = ?`;
                params = [nombre, apellido, dni, telefono || null, email, rol, id_medico || null, passwordHasheada, id];
            } else {
                // Actualizar sin cambiar contraseña
                query = `UPDATE usuarios SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, rol = ?, id_medico = ? WHERE id_usuario = ?`;
                params = [nombre, apellido, dni, telefono || null, email, rol, id_medico || null, id];
            }

            await db.query(query, params);
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
            // Verificar que no sea el propio usuario
            if (req.session.user.id == id) {
                return res.redirect('/admin/usuarios');
            }

            // Cambiar estado a inactivo (borrado lógico)
            await db.query(
                'UPDATE usuarios SET estado = ? WHERE id_usuario = ?',
                ['inactivo', id]
            );

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
            // Verificar que no sea el propio usuario
            if (req.session.user.id == id) {
                return res.redirect('/admin/usuarios');
            }

            // Obtener estado actual
            const [usuario] = await db.query(
                'SELECT estado FROM usuarios WHERE id_usuario = ?',
                [id]
            );

            if (!usuario.length) {
                return res.redirect('/admin/usuarios');
            }

            const nuevoEstado = usuario[0].estado === 'activo' ? 'inactivo' : 'activo';

            await db.query(
                'UPDATE usuarios SET estado = ? WHERE id_usuario = ?',
                [nuevoEstado, id]
            );

            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al cambiar estado de usuario:', error);
            res.redirect('/admin/usuarios');
        }
    }
};

module.exports = hospitalController;