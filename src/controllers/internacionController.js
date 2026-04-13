const db = require('../../config/db');

const internacionController = {
    // 1. Cargar el Mapa de Camas (Coronaria, General, Cirugía)
    getMapaCamas: async (req, res) => {
        try {
            // Consulta jerárquica: Traemos Alas -> Habitaciones -> Camas
            const [rows] = await db.query(`
                SELECT 
                    a.nombre_ala, h.numero as numero_hab, c.id_cama, c.nombre_cama, c.estado_cama
                FROM alas a
                JOIN habitaciones h ON a.id_ala = h.ala_id
                JOIN camas c ON h.id_habitacion = c.habitacion_id
                ORDER BY a.id_ala, h.numero, c.nombre_cama
            `);

            // Formateamos los datos para que Pug los entienda fácilmente (Agrupamos por ala)
            const alas = rows.reduce((acc, row) => {
                let ala = acc.find(a => a.nombre_ala === row.nombre_ala);
                if (!ala) {
                    ala = { nombre_ala: row.nombre_ala, habitaciones: [] };
                    acc.push(ala);
                }

                let hab = ala.habitaciones.find(h => h.numero === row.numero_hab);
                if (!hab) {
                    hab = { numero: row.numero_hab, camas: [] };
                    ala.habitaciones.push(hab);
                }

                hab.camas.push({
                    id_cama: row.id_cama,
                    nombre_cama: row.nombre_cama,
                    estado_cama: row.estado_cama
                });
                return acc;
            }, []);

            res.render('internacion/mapa-camas', { alas, user: req.session.user });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al cargar el mapa de camas");
        }
    },

    // 2. Ver pacientes que el médico de guardia marcó para internar
    getPacientesEspera: async (req, res) => {
        try {
            const [pacientesEspera] = await db.query(`
    SELECT 
        a.id_admision,
        p.nombre,
        p.apellido,
        p.dni,
        a.motivo_consulta as diagnostico_guardia,
        TIMEDIFF(NOW(), a.fecha_ingreso) as tiempo_transcurrido,  
        COALESCE(t.prioridad, 'No asignada') as prioridad
    FROM admisiones a
    JOIN pacientes p ON a.paciente_id = p.id -- Corregido: era p.id_paciente y en tu DB es p.id
    LEFT JOIN triage t ON a.id_admision = t.admision_id -- Corregido: era triages (plural)
    WHERE a.estado_admision IN ('Ventanilla', 'Triage')
    ORDER BY 
        CASE 
            WHEN t.prioridad = 'roja' THEN 1
            WHEN t.prioridad = 'amarilla' THEN 2
            WHEN t.prioridad = 'verde' THEN 3
            WHEN t.prioridad = 'azul' THEN 4
            ELSE 5
        END,
        a.fecha_ingreso ASC
`);
            res.render('internacion/pacientes-espera', { pacientesEspera, user: req.session.user });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al cargar pacientes en espera");
        }
    },

    // 3. Proceso de Internación: Ocupar cama y crear registro
    asignarCama: async (req, res) => {
                const { idAdmision, idCama } = req.body;
                const connection = await db.getConnection();
                try {
                    await connection.beginTransaction();

                    // 1. Cambiar estado de la cama a 'Ocupada'
                    await connection.query("UPDATE camas SET estado_cama = 'Ocupada' WHERE id_cama = ?", [idCama]);

                    // 2. Crear el registro de internación
                    await connection.query("INSERT INTO internaciones (admision_id, cama_id) VALUES (?, ?)", [idAdmision, idCama]);

                    // 3. Actualizar la admisión original
                    await connection.query("UPDATE admisiones SET estado_admision = 'Internado' WHERE id_admision = ?", [idAdmision]);

                    await connection.commit();
                    res.redirect('/internacion/mapa-camas');
                } catch (error) {
                    await connection.rollback();
                    res.status(500).send("Error en la asignación");
                } finally {
                    connection.release();
                }
            },
                // 4. Ver historial y cargar evolución
                getEvolucion: async (req, res) => {
                    const { idInternacion } = req.params;
                    try {
                        const [internacion] = await db.query(`
            SELECT i.*, p.nombre as paciente_nombre, h.numero as numero_hab, c.nombre_cama, a.nombre_ala
            FROM internaciones i
            JOIN admisiones adm ON i.admision_id = adm.id_admision
            JOIN pacientes p ON adm.paciente_id = p.id
            JOIN camas c ON i.cama_id = c.id_cama
            JOIN habitaciones h ON c.habitacion_id = h.id_habitacion
            JOIN alas a ON h.ala_id = a.id_ala
            WHERE i.id_internacion = ?`, [idInternacion]);

                        const [evoluciones] = await db.query(
                            "SELECT * FROM evoluciones_internacion WHERE internacion_id = ? ORDER BY fecha_registro DESC",
                            [idInternacion]
                        );

                        res.render('internacion/evolucion', {
                            internacion: internacion[0],
                            evoluciones,
                            user: req.session.user
                        });
                    } catch (error) {
                        res.status(500).send("Error al cargar la evolución");
                    }
                },

                    // 5. Guardar nueva evolución (Médico)
                    guardarEvolucion: async (req, res) => {
                        const { idInternacion } = req.params;
                        const { evolucion, tratamiento } = req.body;
                        const medicoId = req.session.user.id; // Asumiendo que el ID del médico está en sesión

                        try {
                            await db.query(
                                "INSERT INTO evoluciones_internacion (internacion_id, medico_id, evolucion_clinica, tratamiento_actual) VALUES (?, ?, ?, ?)",
                                [idInternacion, medicoId, evolucion, tratamiento]
                            );
                            res.redirect(`/internacion/evolucion/${idInternacion}`);
                        } catch (error) {
                            res.status(500).send("Error al guardar evolución");
                        }
                    },

                        // 6. Autorizar Alta (Solo el Médico)
                        autorizarAlta: async (req, res) => {
                            const { idInternacion } = req.params;
                            try {
                                await db.query("UPDATE internaciones SET autorizado_alta_medica = 1 WHERE id_internacion = ?", [idInternacion]);
                                res.redirect('/internacion/pacientes-piso');
                            } catch (error) {
                                res.status(500).send("Error al autorizar alta");
                            }
                        },

                            // 7. Salida Física y Liberación de Cama (Marta - admision_internacion)
                            finalizarInternacion: async (req, res) => {
                                const { idInternacion, idCama } = req.body;
                                const connection = await db.getConnection();
                                try {
                                    await connection.beginTransaction();

                                    // 1. Marcar internación como finalizada
                                    await connection.query(
                                        "UPDATE internaciones SET fecha_alta_piso = NOW(), estado_registro = 'Finalizado' WHERE id_internacion = ?",
                                        [idInternacion]
                                    );

                                    // 2. Liberar la cama
                                    await connection.query("UPDATE camas SET estado_cama = 'Libre' WHERE id_cama = ?", [idCama]);

                                    // 3. Finalizar la admisión general
                                    const [row] = await connection.query("SELECT admision_id FROM internaciones WHERE id_internacion = ?", [idInternacion]);
                                    await connection.query("UPDATE admisiones SET estado_admision = 'Finalizado' WHERE id_admision = ?", [row[0].admision_id]);

                                    await connection.commit();
                                    res.redirect('/internacion/mapa-camas');
                                } catch (error) {
                                    await connection.rollback();
                                    res.status(500).send("Error al procesar el egreso");
                                } finally {
                                    connection.release();
                                }
                            }
        };

        module.exports = internacionController;