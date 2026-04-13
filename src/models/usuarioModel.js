const db = require('../../config/db');

const usuarioModel = {
    // traigo todos los usuarios ordenados por fecha de creacion
    getAllUsuarios: async () => {
        const [usuarios] = await db.query(
            'SELECT id_usuario, nombre, apellido, dni, email, telefono, rol, estado, created_at FROM usuarios ORDER BY created_at DESC'
        );
        return usuarios;
    },

    // obtengo la lista de medicos activos para asignar
    getMedicosActivos: async () => {
        const [medicos] = await db.query(
            'SELECT id_usuario, nombre, apellido FROM usuarios WHERE rol = ? AND estado = ?',
            ['medico', 'activo']
        );
        return medicos;
    },

    // verifico si existe un usuario con ese dni
    existsDni: async (dni) => {
        const [rows] = await db.query('SELECT id_usuario FROM usuarios WHERE dni = ?', [dni]);
        return rows.length > 0;
    },

    // verifico si existe un usuario con ese email
    existsEmail: async (email) => {
        const [rows] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
        return rows.length > 0;
    },

    // busco usuario por dni o email para validaciones
    findUsuarioByDniOrEmail: async (dni, email) => {
        const [rows] = await db.query(
            'SELECT id_usuario FROM usuarios WHERE dni = ? OR email = ?',
            [dni, email]
        );
        return rows;
    },

    // busco usuario por dni o email excluyendo un id especifico
    findUsuarioByDniOrEmailExceptId: async (dni, email, id) => {
        const [rows] = await db.query(
            'SELECT id_usuario FROM usuarios WHERE (dni = ? OR email = ?) AND id_usuario != ?',
            [dni, email, id]
        );
        return rows;
    },

    // obtengo datos completos de un usuario por su id
    findUsuarioById: async (id) => {
        const [rows] = await db.query(
            'SELECT id_usuario, nombre, apellido, dni, telefono, email, rol, id_medico, estado FROM usuarios WHERE id_usuario = ?',
            [id]
        );
        return rows[0] || null;
    },

    // creo un registro en la tabla medicos y devuelvo el id
    createMedico: async ({ nombre, apellido, matricula, id_especialidad }) => {
        const [result] = await db.query(
            `INSERT INTO medicos (Nombre, Apellido, Matricula, IdEspecialidad, estado)
             VALUES (?, ?, ?, ?, 'activo')`,
            [nombre, apellido, matricula, id_especialidad]
        );
        return result.insertId;
    },

    // inserto un nuevo usuario en la tabla usuarios
    createUsuario: async ({ nombre, apellido, dni, telefono, email, password, rol, id_medico }) => {
        return db.query(
            `INSERT INTO usuarios (nombre, apellido, dni, telefono, email, password, rol, id_medico, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
            [nombre, apellido, dni, telefono || null, email, password, rol, id_medico || null]
        );
    },

    // actualizo los datos de un usuario, incluyendo password si se proporciona
    updateUsuario: async ({ id, nombre, apellido, dni, telefono, email, rol, id_medico, password }) => {
        let query;
        let params;

        if (password) {
            query = `UPDATE usuarios SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, rol = ?, id_medico = ?, password = ? WHERE id_usuario = ?`;
            params = [nombre, apellido, dni, telefono || null, email, rol, id_medico || null, password, id];
        } else {
            query = `UPDATE usuarios SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, rol = ?, id_medico = ? WHERE id_usuario = ?`;
            params = [nombre, apellido, dni, telefono || null, email, rol, id_medico || null, id];
        }

        return db.query(query, params);
    },

    // cambio el estado de un usuario (activo/inactivo)
    setUsuarioEstado: async (id, estado) => {
        return db.query('UPDATE usuarios SET estado = ? WHERE id_usuario = ?', [estado, id]);
    },

    // obtengo el estado actual de un usuario
    getUsuarioEstado: async (id) => {
        const [rows] = await db.query('SELECT estado FROM usuarios WHERE id_usuario = ?', [id]);
        return rows[0] ? rows[0].estado : null;
    }
};

module.exports = usuarioModel;
