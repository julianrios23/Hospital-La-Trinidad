const db = require('../../config/db');

const pacienteModel = {
    // busco paciente por dni y devuelvo todas las filas encontradas
    findByDni: async (dni) => {
        const [rows] = await db.query('SELECT * FROM pacientes WHERE dni = ?', [dni]);
        return rows;
    },

    // traigo la lista de obras sociales ordenadas para los selects
    getObrasSociales: async () => {
        const [rows] = await db.query('SELECT * FROM obras_sociales ORDER BY nombre_obra_social ASC');
        return rows;
    },

    // inserto un nuevo paciente en la tabla pacientes
    insertPaciente: async ({ dni, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, obrasocial }) => {
        return db.query(
            `INSERT INTO pacientes (dni, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, obrasocial)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [dni, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, obrasocial]
        );
    },

    // creo la admision para un paciente nuevo o existente
    createAdmision: async ({ paciente_id, obra_social_id, motivo_consulta }) => {
        return db.query(
            `INSERT INTO admisiones (paciente_id, obra_social_id, motivo_consulta, estado_admision)
             VALUES (?, ?, ?, 'Ventanilla')`,
            [paciente_id, obra_social_id, motivo_consulta]
        );
    },

    // actualizo el telefono y la obra social del paciente
    updatePacienteContacto: async ({ paciente_id, telefono, obrasocial }) => {
        return db.query(
            'UPDATE pacientes SET telefono = ?, obrasocial = ? WHERE id_paciente = ?',
            [telefono || null, obrasocial, paciente_id]
        );
    },

    // obtengo datos completos de un paciente por su id
    getPacienteById: async (id) => {
        const [rows] = await db.query(
            `SELECT p.id_paciente, p.nombre, p.apellido, p.dni, p.fecha_nacimiento, p.genero,
                    p.telefono, p.direccion, p.obrasocial,
                    o.nombre_obra_social as obra_social,
                    TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) as edad
             FROM pacientes p
             LEFT JOIN obras_sociales o ON p.obrasocial = o.id_obra_social
             WHERE p.id_paciente = ?`,
            [id]
        );
        return rows[0] || null;
    },

    // cuento pacientes totales o filtrados por dni
    countPacientes: async (search) => {
        let query = 'SELECT COUNT(*) as total FROM pacientes p';
        const params = [];

        if (search) {
            query += ' WHERE p.dni LIKE ?';
            params.push(`%${search}%`);
        }

        const [rows] = await db.query(query, params);
        return rows[0].total;
    },

    // busco pacientes con paginacion y filtro por dni
    searchPacientes: async ({ search, limit, offset }) => {
        let query = `
            SELECT p.id_paciente, p.nombre, p.apellido, p.dni, p.fecha_nacimiento, p.genero,
                   o.nombre_obra_social as obra_social,
                   TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) as edad
            FROM pacientes p
            LEFT JOIN obras_sociales o ON p.obrasocial = o.id_obra_social`;
        const params = [];

        if (search) {
            query += ' WHERE p.dni LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY p.apellido, p.nombre LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await db.query(query, params);
        return rows;
    },

    // actualizo los datos de contacto que se pueden cambiar en el formulario
    updatePaciente: async ({ id, obrasocial, direccion, telefono }) => {
        return db.query(
            'UPDATE pacientes SET obrasocial = ?, direccion = ?, telefono = ? WHERE id_paciente = ?',
            [obrasocial, direccion, telefono, id]
        );
    }
};

module.exports = pacienteModel;
