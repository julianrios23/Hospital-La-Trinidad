const db = require('../../config/db');

const internacionModel = {
    // cargo el mapa de camas y creo datos por defecto si no hay camas
    getCamasMapaData: async () => {
        let [camasData] = await db.query(`
            SELECT 
                c.id_cama,
                c.nombre_cama,
                h.numero as habitacion_numero,
                al.nombre_ala,
                c.estado_cama,
                CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
                p.dni,
                i.id_internacion,
                i.autorizado_alta_medica
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

        return camasData;
    },

    // obtengo paciente seleccionado para la admision pendiente
    getSelectedPatientByAdmisionId: async (idAdmision) => {
        const [selectedRows] = await db.query(`
            SELECT a.id_admision, p.nombre, p.apellido, p.dni,
                a.motivo_consulta as diagnostico_guardia
            FROM admisiones a
            JOIN pacientes p ON a.paciente_id = p.id_paciente
            WHERE a.id_admision = ?
        `, [idAdmision]);
        return selectedRows[0] || null;
    },

    // obtengo la lista de pacientes en espera para internacion
    getPacientesEspera: async () => {
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
        return pacientesEspera;
    },

    // proceso la asignacion de cama dentro de una transaccion
    assignCamaTransaction: async ({ idAdmision, idCama }) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query("UPDATE camas SET estado_cama = 'Ocupada' WHERE id_cama = ?", [idCama]);
            await connection.query("INSERT INTO internaciones (admision_id, cama_id) VALUES (?, ?)", [idAdmision, idCama]);
            await connection.query("UPDATE admisiones SET estado_admision = 'Internado' WHERE id_admision = ?", [idAdmision]);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // obtengo internacion por id para mostrar la evolucion
    getInternacionById: async (idInternacion) => {
        const [internacion] = await db.query(`
            SELECT i.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, h.numero as numero_hab, c.nombre_cama, a.nombre_ala
            FROM internaciones i
            JOIN admisiones adm ON i.admision_id = adm.id_admision
            JOIN pacientes p ON adm.paciente_id = p.id_paciente
            JOIN camas c ON i.cama_id = c.id_cama
            JOIN habitaciones h ON c.habitacion_id = h.id_habitacion
            JOIN alas a ON h.ala_id = a.id_ala
            WHERE i.id_internacion = ?`, [idInternacion]);
        return internacion[0] || null;
    },

    // obtengo todas las evoluciones de una internacion
    getEvolucionesByInternacion: async (idInternacion) => {
        const [evoluciones] = await db.query(
            `SELECT e.*, DATE_FORMAT(e.fecha_registro, '%d/%m/%Y %H:%i') as fecha_formateada,
                    CONCAT('Dr/a. ', m.Nombre, ' ', m.Apellido) as medico_nombre
             FROM evoluciones_internacion e
             LEFT JOIN medicos m ON e.medico_id = m.IdMedico
             WHERE e.internacion_id = ?
             ORDER BY e.fecha_registro DESC`,
            [idInternacion]
        );
        return evoluciones;
    },

    // autorizo el alta medica
    autorizarAltaMedica: async (idInternacion) => {
        return db.query(
            "UPDATE internaciones SET autorizado_alta_medica = 1 WHERE id_internacion = ?",
            [idInternacion]
        );
    },

    // busco el id_medico asociado a un usuario
    getMedicoIdByUsuarioId: async (idUsuario) => {
        const [usuario] = await db.query('SELECT id_medico, nombre, apellido FROM usuarios WHERE id_usuario = ?', [idUsuario]);
        if (usuario[0]?.id_medico) {
            return usuario[0].id_medico;
        }
        // Si no tiene id_medico pero es médico, buscar médico con mismo nombre
        const [medico] = await db.query('SELECT IdMedico FROM medicos WHERE Nombre = ? AND Apellido = ?', [usuario[0].nombre, usuario[0].apellido]);
        return medico[0]?.IdMedico || null;
    },

    // guardo una evolucion clinica para la internacion
    saveEvolucion: async ({ idInternacion, idMedico, evolucion, tratamiento }) => {
        return db.query(
            "INSERT INTO evoluciones_internacion (internacion_id, medico_id, evolucion_clinica, tratamiento_actual) VALUES (?, ?, ?, ?)",
            [idInternacion, idMedico, evolucion, tratamiento]
        );
    },

    // autorizo el alta de la internacion
    authorizeAltaInternacion: async ({ idInternacion, idMedico }) => {
        return db.query(
            "UPDATE internaciones SET autorizado_alta_medica = 1, medico_id = ?, fecha_alta_piso = NOW() WHERE id_internacion = ?",
            [idMedico, idInternacion]
        );
    },

    // finalizo internacion y libero cama dentro de una transaccion
    finalizeInternacionTransaction: async ({ idInternacion, idCama }) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [internaciones] = await connection.query(
                "SELECT admision_id FROM internaciones WHERE id_internacion = ?", [idInternacion]
            );

            if (internaciones.length > 0) {
                const idAdmision = internaciones[0].admision_id;
                await connection.query(
                    "UPDATE admisiones SET estado_admision = 'Alta' WHERE id_admision = ?",
                    [idAdmision]
                );
            }

            await connection.query(
                "UPDATE internaciones SET estado_registro = 'Finalizado' WHERE id_internacion = ?",
                [idInternacion]
            );

            await connection.query(
                "UPDATE camas SET estado_cama = 'Libre' WHERE id_cama = ?",
                [idCama]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = internacionModel;
