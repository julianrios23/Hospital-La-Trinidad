# Hospital La Trinidad
TP WEB II - UNIVERSIDAD DE LA PUNTA

## Módulo de Guardia Hospitalaria

### Descripción General
El módulo de Guardia Hospitalaria es el sistema principal de gestión de emergencias y atenciones médicas iniciales del Hospital La Trinidad. Este módulo permite la administración completa del flujo de pacientes desde su llegada hasta la derivación a diferentes especialidades o internación.

### Funcionalidades Principales

#### 1. Gestión de Pacientes
- **Registro y búsqueda de pacientes**: Permite buscar pacientes existentes por DNI o registrar nuevos pacientes automáticamente
- **Edición de datos**: Los administradores pueden modificar información de contacto (obra social, dirección, teléfono) de los pacientes
- **Lista completa**: Vista paginada con búsqueda por DNI de todos los pacientes registrados

#### 2. Admisión de Pacientes
- **Recepción en ventanilla**: Registro inicial de pacientes que llegan a guardia
- **Asignación de obra social**: Vinculación automática con obras sociales registradas
- **Derivación automática**: Sistema de redireccionamiento según el tipo de atención requerida

#### 3. Triage de Enfermería
- **Evaluación inicial**: Toma de signos vitales (presión arterial, temperatura, frecuencia cardíaca, saturación de oxígeno)
- **Clasificación por prioridad**: Asignación de niveles de urgencia (1-5)
- **Observaciones**: Registro de notas iniciales del estado del paciente

#### 4. Atención Médica
- **Diagnóstico**: Registro médico con diagnóstico, tratamiento y medicación
- **Indicaciones de alta**: Definición de criterios para el egreso del paciente
- **Derivación**: Posibilidad de internación o derivación a otras especialidades

#### 5. Panel de Administración
- **Gestión de usuarios**: Creación, edición y desactivación de cuentas de personal
- **Control de roles**: Diferentes niveles de acceso (administrador, admisión, enfermería, médico)
- **Auditoría**: Seguimiento de actividades del sistema

### Usuarios del Sistema

| Email | Rol | Contraseña |
|-------|-----|------------|
| admin@hospital.com | administrador | 123456 |
| luis@hospital.com | admision_guardia | 123456 |
| mariano@hospital.com | enfermeria | 123456 |
| sofia@mail.com | medico | 123456 |
| marta@mail.com | admision_internacion | 123456 |
| gabriel@mail.com | medico | 123456 |

### Próximo Módulo: Internación
El siguiente módulo a desarrollar será el de **Internación Hospitalaria**, que permitirá:
- Gestión de camas y habitaciones
- Control de internaciones activas
- Seguimiento médico durante la hospitalización
- Altas médicas y traslados
- Integración con el módulo de guardia para derivaciones automáticas

### Tecnologías Utilizadas
- **Backend**: Node.js con Express.js
- **Base de datos**: MySQL
- **Frontend**: Pug (Jade) templates con Bootstrap 5
- **Autenticación**: bcrypt para hash de contraseñas
- **Sesiones**: express-session para manejo de estado

### Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en producción
npm start
```

### Estructura del Proyecto
```
hospital-trinidad/
├── config/
│   └── db.js                 # Configuración de base de datos
├── src/
│   ├── controllers/          # Lógica de negocio
│   ├── models/              # Modelos de datos
│   ├── routes/              # Definición de rutas
│   ├── views/               # Templates Pug
│   └── helpers/             # Utilidades
├── app.js                   # Punto de entrada
├── package.json
└── README.md
```
