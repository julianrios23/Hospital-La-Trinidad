/**
 * SCRIPT DE SEEDING - Usuarios de Prueba para Hospital La Trinidad
 * 
 * Instrucciones:
 * 1. Coloca este archivo en la raíz del proyecto
 * 2. Ejecuta: node seed-usuarios.js
 * 3. Se crearán usuarios de ejemplo con contraseñas hasheadas
 * 
 * Usuarios creados (contraseña: 123456):
 * - admin@hospital.com (Administrador)
 * - medico@hospital.com (Médico)
 * - enfermeria@hospital.com (Enfermería)
 * - admision@hospital.com (Admisión Guardia)
 */

const db = require('./config/db');
const { hashPassword } = require('./src/helpers/passwordHelper');

const usuarios = [
    {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        telefono: '1123456789',
        email: 'admin@hospital.com',
        password: '123456', // Se hasheará
        rol: 'administrador',
        id_medico: null,
        estado: 'activo'
    },
    {
        nombre: 'Dr. Carlos',
        apellido: 'García',
        dni: '87654321',
        telefono: '1187654321',
        email: 'medico@hospital.com',
        password: '123456',
        rol: 'medico',
        id_medico: 1, // Ajustar según tu base de datos
        estado: 'activo'
    },
    {
        nombre: 'María',
        apellido: 'López',
        dni: '11122233',
        telefono: '1111122233',
        email: 'enfermeria@hospital.com',
        password: '123456',
        rol: 'enfermeria',
        id_medico: null,
        estado: 'activo'
    },
    {
        nombre: 'Ana',
        apellido: 'Rodríguez',
        dni: '44455566',
        telefono: '1144455566',
        email: 'admision@hospital.com',
        password: '123456',
        rol: 'admision_guardia',
        id_medico: null,
        estado: 'activo'
    }
];

const seedUsuarios = async () => {
    try {
        console.log('🌱 Iniciando seeding de usuarios...\n');

        for (const usuario of usuarios) {
            // Hashear la contraseña
            const passwordHasheada = await hashPassword(usuario.password);

            // Insertar en la BD
            const [result] = await db.query(
                `INSERT INTO usuarios (nombre, apellido, dni, telefono, email, password, rol, id_medico, estado) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    usuario.nombre,
                    usuario.apellido,
                    usuario.dni,
                    usuario.telefono,
                    usuario.email,
                    passwordHasheada,
                    usuario.rol,
                    usuario.id_medico,
                    usuario.estado
                ]
            );

            console.log(`✅ Usuario creado: ${usuario.email} (${usuario.rol})`);
            console.log(`   DNI: ${usuario.dni} | ID: ${result.insertId}\n`);
        }

        console.log('🎉 Seeding completado exitosamente!');
        console.log('\n📝 Usuarios de prueba listos para usar:');
        console.log('   - Email: admin@hospital.com | Contraseña: 123456');
        console.log('   - Email: medico@hospital.com | Contraseña: 123456');
        console.log('   - Email: enfermeria@hospital.com | Contraseña: 123456');
        console.log('   - Email: admision@hospital.com | Contraseña: 123456');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear usuarios:', error);
        process.exit(1);
    }
};

seedUsuarios();
