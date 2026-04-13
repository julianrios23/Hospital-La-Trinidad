# 🏥 Hospital La Trinidad - Sistema de Gestión Hospitalaria

**TP WEB II - UNIVERSIDAD DE LA PUNTA**

Sistema integral de gestión hospitalaria desarrollado con Node.js, Express y MySQL para la administración completa del flujo de pacientes en un hospital.

## 📋 Descripción del Proyecto

Hospital La Trinidad es un sistema web completo que digitaliza y optimiza los procesos hospitalarios, desde la llegada del paciente hasta su alta médica. El sistema está dividido en módulos especializados que cubren todas las etapas de atención médica.

## 🏗️ Arquitectura del Sistema

### Tecnologías Principales
- **Backend**: Node.js con Express.js
- **Base de Datos**: MySQL con pool de conexiones
- **Frontend**: Pug (Jade) templates con Bootstrap 5
- **Autenticación**: bcrypt para hash de contraseñas + express-session
- **UI/UX**: Bootstrap Icons + diseño responsive

### Estructura del Proyecto
```
hospital-trinidad/
├── config/
│   └── db.js                 # Configuración de base de datos MySQL
├── src/
│   ├── controllers/          # Lógica de negocio (MVC)
│   │   ├── hospitalController.js    # Controlador principal
│   │   └── internacionController.js # Controlador de internación
│   ├── helpers/
│   │   └── passwordHelper.js        # Utilidades de contraseñas
│   ├── public/
│   │   └── css/
│   │       └── style.css            # Estilos personalizados
│   ├── routes/
│   │   ├── hospitalRoutes.js        # Rutas principales
│   │   └── internacionRoutes.js     # Rutas de internación
│   └── views/                       # Templates Pug
│       ├── layout.pug              # Layout base
│       ├── index.pug               # Página principal
│       ├── login.pug               # Autenticación
│       ├── admin/                  # Panel administrativo
│       ├── enfermeria/             # Módulo de enfermería
│       ├── medico/                 # Módulo médico
│       ├── pacientes/              # Gestión de pacientes
│       ├── internacion/            # Módulo de internación
│       └── utiles/                 # Utilidades (errores, confirmaciones)
├── app.js                   # Punto de entrada del servidor
├── package.json
├── hospital_trinidad.sql    # Script de base de datos
└── README.md
```

## 🏥 Módulos del Sistema

### 1. 🔐 Sistema de Autenticación y Autorización
- **Login seguro** con validación de credenciales
- **Control de roles** con permisos específicos por módulo
- **Sesiones persistentes** con tiempo de expiración
- **Middleware de protección** para rutas restringidas

### 2. 👥 Gestión de Usuarios (Administrador)
- **CRUD completo** de usuarios del sistema
- **Asignación de roles** y especialidades médicas
- **Gestión de estados** (activo/inactivo)
- **Validación de datos** y unicidad de emails/DNI

### 3. 🏠 Módulo de Guardia Hospitalaria

#### 3.1 Recepción y Admisión
- **Búsqueda inteligente** de pacientes por DNI
- **Registro automático** de nuevos pacientes
- **Asignación de obra social** desde base de datos
- **Derivación automática** según tipo de atención

#### 3.2 Triage de Enfermería
- **Evaluación inicial** con signos vitales completos
- **Clasificación por prioridad** (niveles 1-5)
- **Registro de observaciones** y estado inicial
- **Tiempo de espera** calculado automáticamente

#### 3.3 Atención Médica
- **Diagnóstico médico** con campos especializados
- **Tratamiento y medicación** detallada
- **Indicaciones de alta** específicas
- **Derivación a internación** cuando sea necesario

### 4. 🏥 Módulo de Internación Hospitalaria

#### 4.1 Gestión de Camas
- **Mapa visual de camas** por alas y habitaciones
- **Estados de camas**: Libre, Ocupada, En limpieza
- **Asignación inteligente** de pacientes a camas
- **Control de disponibilidad** en tiempo real

#### 4.2 Internación de Pacientes
- **Admisión desde guardia** con datos completos
- **Seguimiento médico** durante hospitalización
- **Evoluciones clínicas** con historial completo
- **Autorización de altas** médicas

#### 4.3 Gestión Clínica
- **Historial de evoluciones** por paciente
- **Tratamientos activos** y medicación
- **Estado de internación** (activa, alta autorizada, finalizada)
- **Liberación de camas** al egreso

### 5. � Reportes de Historia Clínica
- **Generación automática** de reportes completos por paciente
- **Recorrido cronológico** desde guardia hasta alta médica
- **Información integrada**: datos personales, triage, diagnósticos, evoluciones, altas
- **Exportación a PDF** para archivo y distribución
- **Vista imprimible** optimizada para papel
- **Acceso desde lista de pacientes** para personal de admisión

### 6. �📊 Gestión de Pacientes
- **Base de datos centralizada** con información completa
- **Búsqueda y filtrado** avanzado
- **Edición de datos** (contacto, obra social)
- **Historial de atenciones** por paciente

## 👤 Roles y Usuarios del Sistema

| Usuario | Email | Rol | Descripción | Contraseña |
|---------|-------|-----|-------------|------------|
| **Luis ** | luisguardia@hospital.com | Admisión Guardia | Recepción de pacientes en ventanilla | 123456 |
| **Mariano ** | marianoenferm@hospital.com | Enfermería | Triage y evaluación inicial | 123456 |
| **Sofía ** | sofiadoc@mail.com | Médico | Diagnóstico y tratamiento | 123456 |
| **Marta ** | martaadmision@mail.com | Admisión Internación | Gestión de camas y internaciones | 123456 |
| **Gabriel ** | gabrieldoc@mail.com | Médico | Diagnóstico y tratamiento | 123456 |

### Permisos por Rol

#### 👑 Administrador
- ✅ Gestión completa de usuarios
- ✅ Acceso a todos los módulos
- ✅ Configuración del sistema
- ✅ Reportes y estadísticas

#### 🏠 Admisión Guardia
- ✅ Recepción de pacientes
- ✅ Registro de nuevos pacientes
- ✅ Gestión de obras sociales
- ✅ Acceso a lista de pacientes
- ✅ Generación de reportes de historia clínica

#### 👩‍⚕️ Enfermería
- ✅ Triage y evaluación inicial
- ✅ Toma de signos vitales
- ✅ Clasificación por prioridad
- ✅ Lista de pacientes en espera

#### 👨‍⚕️ Médico
- ✅ Atención médica completa
- ✅ Diagnóstico y tratamiento
- ✅ Indicaciones de alta
- ✅ Autorización de internaciones
- ✅ Evoluciones clínicas
- ✅ Mapa de camas (solo lectura)

#### 🏥 Admisión Internación
- ✅ Gestión de camas y asignaciones
- ✅ Lista de pacientes en espera de internación
- ✅ Finalización de internaciones
- ✅ Acceso a lista de pacientes
- ✅ Mapa de camas (lectura/escritura)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- MySQL Server (versión 8.0 o superior)
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd hospital-trinidad
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos**
```bash
# Crear base de datos MySQL
mysql -u root -p < hospital_trinidad.sql
```

4. **Configurar variables de entorno**
```bash
# Crear archivo .env
cp .env.example .env

# Editar .env con tus configuraciones:
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=hospitaltrinidad
SESSION_SECRET=tu_clave_secreta_segura
PORT=3000
```

5. **Ejecutar el servidor**
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

6. **Acceder al sistema**
```
http://localhost:3000
```

## 📊 Base de Datos

### Estructura Principal

#### Tablas Core
- **`usuarios`** - Usuarios del sistema con roles
- **`pacientes`** - Información de pacientes
- **`obras_sociales`** - Catálogo de obras sociales
- **`admisiones`** - Registros de ingreso al hospital

#### Tablas de Guardia
- **`atenciones_triage`** - Evaluaciones de enfermería
- **`atenciones_medicas`** - Consultas médicas

#### Tablas de Internación
- **`alas`** - Alas del hospital
- **`habitaciones`** - Habitaciones por ala
- **`camas`** - Camas disponibles
- **`internaciones`** - Registros de internación
- **`evoluciones`** - Seguimiento médico

### Relaciones
```
usuarios (1) ──── (N) internaciones
pacientes (1) ──── (N) admisiones
admisiones (1) ──── (1) atenciones_triage
admisiones (1) ──── (1) atenciones_medicas
admisiones (1) ──── (1) internaciones
alas (1) ──── (N) habitaciones
habitaciones (1) ──── (N) camas
camas (1) ──── (1) internaciones
```

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start

# Resetear contraseña de usuario
node admin-password.js reset usuario@email.com
```

## 🌟 Características Destacadas

### 🎨 Interfaz Moderna
- **Bootstrap 5** con diseño responsive
- **Componentes interactivos** (modales, alertas, tooltips)
- **Iconografía consistente** con Bootstrap Icons
- **Tema hospitalario** profesional

### 🔒 Seguridad
- **Hash de contraseñas** con bcrypt
- **Validación de sesiones** con expiración automática
- **Protección CSRF** en formularios
- **Validación de datos** en backend y frontend

### 📱 Experiencia de Usuario
- **Navegación intuitiva** por roles
- **Mensajes contextuales** de éxito/error
- **Carga asíncrona** de datos
- **Responsive design** para móviles y tablets

### ⚡ Rendimiento
- **Pool de conexiones** MySQL optimizado
- **Consultas eficientes** con índices apropiados
- **Caché de sesiones** en memoria
- **Compresión de respuestas** HTTP

## 📈 Estado del Proyecto

### ✅ Completado
- [x] Sistema de autenticación y roles
- [x] Gestión de usuarios (CRUD completo)
- [x] Módulo de guardia hospitalaria
- [x] Triage de enfermería
- [x] Atención médica
- [x] Gestión de pacientes
- [x] Base de datos completa
- [x] Interfaz responsive

### 🚧 En Desarrollo
- [x] Módulo de internación (80% completado)
- [ ] Gestión de camas avanzada
- [ ] Reportes y estadísticas
- [ ] API REST para integraciones
- [ ] Notificaciones push
- [ ] Backup automático

### 🔮 Próximas Funcionalidades
- [ ] Sistema de turnos ambulatorios
- [ ] Gestión de medicamentos
- [ ] Integración con laboratorios
- [ ] Portal del paciente
- [ ] Aplicación móvil

## 📄 Reporte Técnico

Este documento describe el cumplimiento de objetivos y la arquitectura del módulo de internación.

### Proyecto

- **Nombre:** Hospital La Trinidad HIS
- **Versión:** v2.0
- **Materia:** Programación Web II - Universidad de La Punta
- **Responsable:** Julian Rios

### 1. 🎯 Objetivo Académico

El objetivo del trabajo práctico es evolucionar un sistema de guardia hacia un sistema HIS completo que gestione la infraestructura física del hospital y el flujo clínico-administrativo de los pacientes en piso.

### 2. 🏛️ Infraestructura Hospitalaria

El sistema debe gestionar la estructura física definida en el requerimiento.

| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| 3 alas definidas | Coronaria, Medicina General y Cirugía | ✅ CUMPLIDO |
| 5 habitaciones por ala | 15 habitaciones registradas en la base de datos | ✅ CUMPLIDO |
| 2 camas por habitación | Total de 30 camas con nomenclatura A/B | ✅ CUMPLIDO |
| Gestión de estados de cama | Estados libres y ocupadas | ✅ CUMPLIDO |

### 3. 🔄 Flujo de Trabajo y Roles

El sistema implementa el viaje del paciente respetando la separación de funciones por rol.

#### A. Admisión de Internación (Rol: `admision_internacion`)

- Captura desde guardia: el sistema identifica pacientes en estado de espera de internación.
- Asignación de cama: proceso visual desde el mapa de camas.
- Transaccionalidad: se utiliza `connection.beginTransaction()` para asegurar que la cama y el estado del paciente se actualicen juntos.

#### B. Seguimiento Clínico (Rol: `medico`)

- Evolución diaria: el médico registra progresos y tratamientos.
- Autorización de alta: el médico activa el flag `autorizado_alta_medica`.
- El sistema impide liberar la cama si no se autoriza el alta.

#### C. Egreso Hospitalario

- Cierre de ciclo: el personal administrativo finaliza la internación y libera la cama para el siguiente ingreso.

### 4. 🛠️ Calidad Técnica y Arquitectura

- **Arquitectura MVC:** separación clara entre rutas, controladores y vistas.
- **Seguridad:** uso de consultas parametrizadas para evitar inyección SQL.
- **Sesiones:** `express-session` para el estado del usuario y la gestión de flujo.
- **Interfaz:** Bootstrap 5 para un mapa de camas dinámico y responsive.

### 5. ✅ Conclusión

El proyecto cumple con los objetivos del documento `2025_Practico_Integrador_HIS_Internacion.pdf`. La integración con el módulo anterior de guardia es orgánica y la base de datos está normalizada para soportar escalabilidad.

## 📝 Licencia

Este proyecto es parte del Trabajo Práctico de la materia **WEB II** de la **Universidad de La Punta**.

## 👨‍💻 Autor

**Julian Rios** - Desarrollo del sistema Hospital La Trinidad

---

**🏥 Hospital La Trinidad - Cuidando la salud de nuestra comunidad**
