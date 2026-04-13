const db = require('../../config/db');

const internacionController = {
    // 1. Cargar el Mapa de Camas dinámico
    getMapaCamas: async (req, res) => {
        try {
            let [camasData] = await db.query(`
                SELECT 
                    c.id_cama,
                    c.nombre_cama,
                    h.numero as habitacion_numero,
                    al.nombre_ala,
                    c.estado_cama,
                    CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
                    p.dni,
                    i.id_internacion
                FROM camas c
                JOIN habitaciones h ON c.habitacion_id = h.id_habitacion
                JOIN alas al ON h.ala_id = al.id_ala
                LEFT JOIN internaciones i ON c.id_cama = i.cama_id AND i.estado_registro = 'Activo'
                LEFT JOIN admisiones a ON i.admision_id = a.id_admision
                LEFT JOIN pacientes p ON a.paciente_id = p.id_paciente
                ORDER BY al.id_ala ASC, h.numero ASC, c.nombre_cama ASC
            `);

            if (camasData.length === 0) {
                const [habitaciones] = await db.query(`
                    SELECT h.id_habitacion, h.numero as habitacion_numero, al.id_ala, al.nombre_ala
                    FROM habitaciones h
                    JOIN alas al ON h.ala_id = al.id_ala
                    ORDER BY al.id_ala ASC, h.numero ASC
                `);

                if (habitaciones.length === 0) {
                    const [alasRows] = await db.query('SELECT id_ala, nombre_ala FROM alas ORDER BY id_ala ASC');
                    if (alasRows.length > 0) {
                        const habValues = [];
                        alasRows.forEach(ala => {
                            for (let numero = 1; numero <= 5; numero++) {
                                habValues.push([numero, ala.id_ala]);
                            }
                        });
                        await db.query('INSERT INTO habitaciones (numero, ala_id) VALUES ?', [habValues]);
                    }
                }

                const [habitacionesFinal] = await db.query('SELECT id_habitacion, numero as habitacion_numero, ala_id FROM habitaciones');
                if (habitacionesFinal.length > 0) {
                    const camaValues = [];
                    habitacionesFinal.forEach(hab => {
                        ['A', 'B'].forEach(nombreCama => {
                            camaValues.push([nombreCama, hab.id_habitacion, 'Libre']);
                        });
                    });
                    await db.query('INSERT INTO camas (nombre_cama, habitacion_id, estado_cama) VALUES ?', [camaValues]);
                }

                [camasData] = await db.query(`
                    SELECT 
                        c.id_cama,
                        c.nombre_cama,
                        h.numero as habitacion_numero,
                        al.nombre_ala,
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
            }

            
            

            // Agrupar camas por ala y habitación
            const alasMap = new Map();

            camasData.forEach(cama => {
                if (!alasMap.has(cama.nombre_ala)) {
                    alasMap.set(cama.nombre_ala, new Map());
                }

                const habitacionesAla = alasMap.get(cama.nombre_ala);
                if (!habitacionesAla.has(cama.habitacion_numero)) {
                    habitacionesAla.set(cama.habitacion_numero, []);
                }

                habitacionesAla.get(cama.habitacion_numero).push({
                    id_cama: cama.id_cama,
                    nombre_cama: cama.nombre_cama,
                    estado_cama: cama.estado_cama,
                    paciente_nombre: cama.paciente_nombre,
                    dni: cama.dni,
                    id_internacion: cama.id_internacion
                });
            });

            // Construir la estructura final
            const alas = Array.from(alasMap.entries()).map(([nombreAla, habitacionesMap]) => ({
                nombre_ala: nombreAla,
                habitaciones: Array.from(habitacionesMap.entries()).map(([numeroHab, camas]) => ({
                    numero: numeroHab,
                    camas: camas
                }))
            }));

            let selectedPatient = null;
            if (req.session.idAdmisionPendiente) {
                const [selectedRows] = await db.query(`
                    SELECT a.id_admision, p.nombre, p.apellido, p.dni,
                        a.motivo_consulta as diagnostico_guardia
                    FROM admisiones a
                    JOIN pacientes p ON a.paciente_id = p.id_paciente
                    WHERE a.id_admision = ?
                `, [req.session.idAdmisionPendiente]);
                selectedPatient = selectedRows[0] || null;
            }

            res.render('internacion/mapa-camas', {
                alas,
                user: req.session.user,
                idAdmisionPendiente: req.session.idAdmisionPendiente,
                selectedPatient,
                tieneCamas: camasData.length > 0
            });
        } catch (error) {
            console.error('Error en getMapaCamas:', error);
            res.status(500).send('Error al cargar el mapa');
        }
    },

    // 2. Obtener pacientes en espera usando atenciones médicas válidas
    getPacientesEspera: async (req, res) => {
        try {
            const [pacientesEspera] = await db.query(`
                SELECT 
                    a.id_admision, p.nombre, p.apellido, p.dni,
                    am.diagnostico as diagnostico_guardia,
                    TIMEDIFF(NOW(), COALESCE(am.fecha_completada, a.fecha_ingreso)) as tiempo_transcurrido,
                    COALESCE(t.prioridad, 'No asignada') as prioridad
                FROM admisiones a
                JOIN pacientes p ON a.paciente_id = p.id_paciente
                JOIN atenciones_medicas am ON a.id_admision = am.admision_id
                LEFT JOIN atenciones_triage t ON a.id_admision = t.admision_id
                WHERE am.requiere_internacion = 1
                  AND am.estado_atencion IN ('completada', 'internacion')
                  AND a.estado_admision NOT IN ('Internado', 'Alta')
                ORDER BY COALESCE(t.prioridad, 0) ASC, COALESCE(am.fecha_completada, a.fecha_ingreso) ASC
            `);
            res.render('internacion/espera', { pacientesEspera, user: req.session.user });
        } catch (error) {
            console.error('Error en getPacientesEspera:', error);
            res.status(500).send("Error al obtener pacientes");
        }
    },

    // 3. Captura el paciente seleccionado y lo lleva al mapa
    iniciarAsignacion: (req, res) => {
        req.session.idAdmisionPendiente = parseInt(req.params.idAdmision, 10);
        req.session.save((err) => {
            if (err) {
                return res.status(500).send('Error al iniciar asignación');
            }
            res.redirect('/internacion/mapa-camas');
        });
    },

    // 4. Procesa la internación final (Transacción)
    asignarCama: async (req, res) => {
        const { idAdmision, idCama } = req.body;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // A. Cama ocupada
            await connection.query("UPDATE camas SET estado_cama = 'Ocupada' WHERE id_cama = ?", [idCama]);
            // B. Crear registro
            await connection.query("INSERT INTO internaciones (admision_id, cama_id) VALUES (?, ?)", [idAdmision, idCama]);
            // C. Actualizar guardia
            await connection.query("UPDATE admisiones SET estado_admision = 'Internado' WHERE id_admision = ?", [idAdmision]);
            
            await connection.commit();
            delete req.session.idAdmisionPendiente; // Limpiamos la selección
            res.redirect('/internacion/pacientes-espera');
        } catch (error) {
            await connection.rollback();
            res.status(500).send("Error en la internación");
        } finally {
            connection.release();
        }
    },

    // 5. Ver evolución (Médico)
    getEvolucion: async (req, res) => {
        const { idInternacion } = req.params;
        try {
            const [internacion] = await db.query(`
                SELECT i.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, h.numero as numero_hab, c.nombre_cama, a.nombre_ala
                FROM internaciones i
                JOIN admisiones adm ON i.admision_id = adm.id_admision
                JOIN pacientes p ON adm.paciente_id = p.id_paciente
                JOIN camas c ON i.cama_id = c.id_cama
                JOIN habitaciones h ON c.habitacion_id = h.id_habitacion
                JOIN alas a ON h.ala_id = a.id_ala
                WHERE i.id_internacion = ?`, [idInternacion]);

            const [evoluciones] = await db.query(
                `SELECT e.*, DATE_FORMAT(e.fecha_registro, '%d/%m/%Y %H:%i') as fecha_formateada,
                        CONCAT('Dr/a. ', m.Nombre, ' ', m.Apellido) as medico_nombre
                 FROM evoluciones_internacion e
                 LEFT JOIN medicos m ON e.medico_id = m.IdMedico
                 WHERE e.internacion_id = ? 
                 ORDER BY e.fecha_registro DESC`, 
                [idInternacion]
            );

            const internacionRow = internacion[0] ? {
                ...internacion[0],
                paciente: {
                    nombre: internacion[0].paciente_nombre,
                    apellido: internacion[0].paciente_apellido
                }
            } : null;

            res.render('internacion/evolucion', { 
                internacion: internacionRow, 
                evoluciones, 
                user: req.session.user 
            });
        } catch (error) {
            res.status(500).send("Error al cargar evolución");
        }
    },

    // 6. Guardar evolución
    guardarEvolucion: async (req, res) => {
        const { idInternacion } = req.params;
        const { evolucion, tratamiento } = req.body;
        try {
            const [usuario] = await db.query("SELECT id_medico FROM usuarios WHERE id_usuario = ?", [req.session.user.id]);
            const idMedico = usuario[0]?.id_medico;

            if (!idMedico) {
                return res.status(403).send("El usuario actual no tiene un perfil de médico asociado.");
            }

            await db.query(
                "INSERT INTO evoluciones_internacion (internacion_id, medico_id, evolucion_clinica, tratamiento_actual) VALUES (?, ?, ?, ?)",
                [idInternacion, idMedico, evolucion, tratamiento]
            );
            res.redirect(`/internacion/evolucion/${idInternacion}`);
        } catch (error) {
            console.error("Error al guardar evolución:", error);
            res.status(500).send("Error al guardar la evolución");
        }
    },

    // 7. Médico autoriza el alta
    autorizarAlta: async (req, res) => {
        try {
            const [usuario] = await db.query("SELECT id_medico FROM usuarios WHERE id_usuario = ?", [req.session.user.id]);
            const idMedico = usuario[0]?.id_medico;

            if (!idMedico) {
                return res.status(403).send("El usuario actual no tiene un perfil de médico asociado.");
            }

            await db.query(
                "UPDATE internaciones SET autorizado_alta_medica = 1, medico_id = ?, fecha_alta_piso = NOW() WHERE id_internacion = ?", 
                [idMedico, req.params.idInternacion]
            );
            res.redirect('/internacion/mapa-camas');
        } catch (error) {
            console.error("Error al autorizar alta:", error);
            res.status(500).send("Error al autorizar");
        }
    },

    // 8. Marta efectúa la salida y libera cama
    finalizarInternacion: async (req, res) => {
        const { idInternacion, idCama } = req.body;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // Obtener el admision_id asociado a esta internacion
            const [internaciones] = await connection.query("SELECT admision_id FROM internaciones WHERE id_internacion = ?", [idInternacion]);
            if (internaciones.length > 0) {
                const idAdmision = internaciones[0].admision_id;
                // Actualizar estado de admision a Alta
                await connection.query("UPDATE admisiones SET estado_admision = 'Alta' WHERE id_admision = ?", [idAdmision]);
            }
            
            // A. Finalizar stay
            await connection.query("UPDATE internaciones SET estado_registro = 'Finalizado' WHERE id_internacion = ?", [idInternacion]);
            // B. Liberar cama
            await connection.query("UPDATE camas SET estado_cama = 'Libre' WHERE id_cama = ?", [idCama]);
            await connection.commit();
            res.redirect('/internacion/mapa-camas');
        } catch (error) {
            console.error("Error al finalizar internacion:", error);
            await connection.rollback();
            res.status(500).send("Error al finalizar");
        } finally {
            connection.release();
        }
    }
};

module.exports = internacionController;