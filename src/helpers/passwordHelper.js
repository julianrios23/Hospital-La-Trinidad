const bcrypt = require('bcrypt');

// Número de rounds para generar el salt (mayor = más seguro pero lento)
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña en texto plano
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Contraseña hasheada
 */
const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error al hashear la contraseña: ' + error.message);
    }
};

/**
 * Valida una contraseña en texto plano contra su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en BD
 * @returns {Promise<boolean>} - true si coinciden
 */
const validatePassword = async (password, hash) => {
    try {
        const isValid = await bcrypt.compare(password, hash);
        return isValid;
    } catch (error) {
        throw new Error('Error al validar la contraseña: ' + error.message);
    }
};

module.exports = {
    hashPassword,
    validatePassword
};
