/**
 * UTILIDAD - Administración de Contraseñas
 * 
 * Uso:
 * node admin-password.js reset <email>
 * node admin-password.js reset admin@hospital.com
 * 
 * Reseteará la contraseña a "123456"
 */

const db = require('./config/db');
const { hashPassword } = require('./src/helpers/passwordHelper');

const command = process.argv[2];
const email = process.argv[3];

if (!command || !email) {
    console.error('❌ Uso: node admin-password.js <reset|generate> <email>');
    console.error('   Ejemplo: node admin-password.js reset admin@hospital.com');
    process.exit(1);
}

const resetPassword = async () => {
    try {
        const newPassword = '123456';
        const hashedPassword = await hashPassword(newPassword);

        const [result] = await db.query(
            'UPDATE usuarios SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (result.affectedRows === 0) {
            console.error(`❌ Usuario con email "${email}" no encontrado.`);
            process.exit(1);
        }

        console.log(`✅ Contraseña reseteada para: ${email}`);
        console.log(`🔐 Nueva contraseña: ${newPassword}`);
        console.log('\n⚠️  Advierte al usuario que cambie su contraseña al próximo login');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

const generateHashedPassword = async () => {
    try {
        const password = process.argv[4] || '123456';
        const hashedPassword = await hashPassword(password);
        
        console.log('📋 Hash de contraseña generado:');
        console.log(`Password: ${password}`);
        console.log(`Hash: ${hashedPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

if (command === 'reset') {
    resetPassword();
} else if (command === 'generate') {
    generateHashedPassword();
} else {
    console.error(`❌ Comando desconocido: ${command}`);
    console.error('Comandos disponibles: reset, generate');
    process.exit(1);
}
