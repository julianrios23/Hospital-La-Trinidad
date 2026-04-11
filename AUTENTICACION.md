# Documentación - Sistema de Login y Autenticación

## 📋 Tabla de Usuarios

La tabla `usuarios` incluye los siguientes campos:

```sql
id_usuario         int           Primary Key (auto_increment)
nombre            varchar(100)   Nombre del usuario
apellido          varchar(100)   Apellido del usuario  
dni               varchar(15)    DNI (Unique)
telefono          varchar(20)    Teléfono (opcional)
email             varchar(100)   Email (Unique, opcional)
password          varchar(255)   Contraseña hasheada (IMPORTANTE)
rol               enum(...)      Rol del usuario
id_medico         int            ID del médico (opcional)
estado            enum(...)      activo / inactivo
created_at        timestamp      Fecha de creación
```

## 🔐 Sistema de Contraseñas

### Características de Seguridad:
- ✅ **Bcrypt Hashing**: Las contraseñas se almacenan hasheadas con bcrypt (10 rounds)
- ✅ **Validación Segura**: Comparación usando `bcrypt.compare()` (resistente a timing attacks)
- ✅ **Session Management**: Express-session para mantener sesiones seguras
- ✅ **HTTPS Ready**: Preparado para HTTPS en producción

### Longitud Mínima:
- **6 caracteres** como mínimo

## 🚀 Instalación Inicial

### 1. Instalar dependencias
```bash
npm install
```

Se instalará automáticamente **bcrypt** (v5.1.1) junto con las otras dependencias.

### 2. Crear usuarios de prueba
```bash
node seed-usuarios.js
```

Esto creará 4 usuarios de ejemplo:
- **admin@hospital.com** - Rol: Administrador
- **medico@hospital.com** - Rol: Médico  
- **enfermeria@hospital.com** - Rol: Enfermería
- **admision@hospital.com** - Rol: Admisión Guardia

**Contraseña para todos:** `123456`

## 📝 Flujo de Login

### 1. Usuario accede a `/login`
```
GET /login → Se renderiza la vista login.pug
```

### 2. Usuario envía formulario
```
POST /login
Body: {
  usuario: "admin@hospital.com" (o DNI),
  password: "123456"
}
```

### 3. Backend valida
```
1. Obtener usuario de BD (activo)
2. Comparar contraseña con bcrypt.compare()
3. Si es válida:
   - Crear sesión (req.session.user)
   - Redirigir a /atencion-medica
4. Si es inválida:
   - Mostrar error genérico
   - Volver a /login
```

## 🔄 Cambio de Contraseña

### Acceder
```
GET /cambiar-password (requiere autenticación)
```

### Actualizar
```
POST /cambiar-password
Body: {
  passwordActual: "123456",
  passwordNueva: "nueva123",
  passwordConfirmar: "nueva123"
}
```

### Validaciones
- ✅ Contraseña actual debe ser correcta
- ✅ Contraseña nueva mínimo 6 caracteres
- ✅ Debe coincidir con confirmación
- ✅ No puede ser igual a la anterior

## 🛡️ Cambios en los Archivos

### `/src/controllers/hospitalController.js`
- ✅ Agregado `const bcrypt = require('bcrypt')`
- ✅ Método `loginUser`: Ahora valida contraseña con `bcrypt.compare()`
- ✅ Método `cambiarPassword`: Permite cambiar contraseña
- ✅ Método `renderCambiarPassword`: Renderiza formulario

### `/src/routes/hospitalRoutes.js`
- ✅ Ruta GET `/cambiar-password`
- ✅ Ruta POST `/cambiar-password`

### `/src/helpers/passwordHelper.js` (NUEVO)
- ✅ Función `hashPassword()`: Hashea contraseñas
- ✅ Función `validatePassword()`: Valida contraseña

### `/src/views/cambiar-password.pug` (NUEVO)
- ✅ Formulario para cambiar contraseña
- ✅ Validaciones del lado del cliente
- ✅ Mensajes de error/éxito

### `/seed-usuarios.js` (NUEVO)
- ✅ Script para crear usuarios de prueba
- ✅ Las contraseñas se hashean automáticamente

### `/package.json`
- ✅ Agregada dependencia `"bcrypt": "^5.1.1"`

## 👤 Middleware de Autenticación

Protege rutas sensibles:

```javascript
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Uso
router.get('/atencion-medica', ensureAuthenticated, ...);
```

## 📊 Datos en Sesión

Cuando un usuario inicia sesión, se almacena en `req.session.user`:

```javascript
{
  id: 1,
  nombre: "Juan",
  apellido: "Pérez",
  dni: "12345678",
  email: "admin@hospital.com",
  rol: "administrador"
}
```

Accesible en todas las vistas via `user` (gracias al middleware):
```pug
if user
  p Bienvenido #{user.nombre} #{user.apellido}
  p Rol: #{user.rol}
```

## 🚪 Logout

```
GET /logout
```

Destruye la sesión y redirige a `/login`

## 📱 Consideraciones de Producción

Cuando despliegues a producción:

1. **Genera un .env con SESSION_SECRET único:**
```
SESSION_SECRET=tu-secret-aleatorio-muy-largo-y-seguro
```

2. **Usa HTTPS:** Las cookies de sesión deben ser `secure: true`

3. **Database:** Asegúrate de usar credenciales BD seguras en .env

4. **Rate Limiting:** Considera añadir un middleware para prevenir fuerza bruta

## 🔧 Ejemplo de Integración

### Crear un nuevo usuario manualmente:

```javascript
const { hashPassword } = require('./src/helpers/passwordHelper');

const password = '123456';
const hashedPassword = await hashPassword(password);

// Insertar en BD
db.query(
  `INSERT INTO usuarios (nombre, apellido, dni, email, password, rol, estado)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ['Juan', 'Pérez', '12345678', 'juan@hospital.com', hashedPassword, 'medico', 'activo']
);
```

## ❓ Preguntas Frecuentes

**P: ¿Cómo se actualiza la contraseña?**
A: El usuario inicia sesión y va a `/cambiar-password`

**P: ¿Qué pasa si olvida su contraseña?**
A: Por ahora requiere que un administrador reinicie la contraseña. (Feature para después)

**P: ¿De dónde viene el campo `password`?**
A: Debe estar en la tabla `usuarios` en tu BD. El script `seed-usuarios.js` espera eso.

**P: ¿Cómo administro usuarios?**
A: Se puede crear una sección de administración o usar scripts como `seed-usuarios.js`

---

**Última actualización:** 11 de abril de 2026
**Versión:** 1.0
