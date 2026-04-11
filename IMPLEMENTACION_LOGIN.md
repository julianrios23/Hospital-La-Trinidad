# 🔐 Sistema de Autenticación y Login - Hospital La Trinidad

## ✅ Implementación Completada

Se ha implementado un **sistema seguro de autenticación** basado en:
- Contraseñas hasheadas con **bcrypt**
- Sesiones con **express-session**
- Validación en servidor
- Middleware de autenticación
- Interfaz de usuario moderno

---

## 📦 Cambios Realizados

### 1. **Instalación de Dependencias**
- ✅ Agregado `bcrypt` v5.1.1 a `package.json`

### 2. **Backend - Controlador**
**Archivo:** `src/controllers/hospitalController.js`
- ✅ Importado módulo `bcrypt`
- ✅ **Actualizado `loginUser()`**: Ahora valida contraseña con `bcrypt.compare()`
- ✅ **Nuevo `cambiarPassword()`**: Permite cambiar contraseña
- ✅ **Nuevo `renderCambiarPassword()`**: Renderiza formulario de cambio

### 3. **Backend - Rutas**
**Archivo:** `src/routes/hospitalRoutes.js`
- ✅ Ruta `GET /cambiar-password` (protegida)
- ✅ Ruta `POST /cambiar-password` (protegida)

### 4. **Backend - Helpers**
**Archivo:** `src/helpers/passwordHelper.js` (NUEVO)
- ✅ Función `hashPassword()` - Hashea contraseñas
- ✅ Función `validatePassword()` - Valida contraseña

### 5. **Frontend - Vistas**
**Archivo:** `src/views/layout.pug` (ACTUALIZADO)
- ✅ Menú dropdown de usuario con opciones
- ✅ Link a "Cambiar contraseña"
- ✅ Mostrar rol del usuario

**Archivo:** `src/views/cambiar-password.pug` (NUEVO)
- ✅ Formulario para cambiar contraseña
- ✅ Validaciones en cliente
- ✅ Mensajes de error/éxito
- ✅ Tips de seguridad

### 6. **Scripts de Utilidad**
**Archivo:** `seed-usuarios.js` (NUEVO)
- ✅ Crea 4 usuarios de prueba
- ✅ Contraseñas hasheadas automáticamente
- ✅ Roles: Administrador, Médico, Enfermería, Admisión

**Archivo:** `admin-password.js` (NUEVO)
- ✅ Resetear contraseña de usuario
- ✅ Generar hash de contraseña

### 7. **Documentación**
**Archivo:** `AUTENTICACION.md` (NUEVO)
- ✅ Documentación completa del sistema

**Archivo:** `.env.example` (NUEVO)
- ✅ Variables de entorno necesarias

---

## 🚀 Cómo Usar

### Instalación Inicial
```bash
npm install
```

### Crear Usuarios de Prueba
```bash
node seed-usuarios.js
```

Esto crea:
- Email: `admin@hospital.com` → Contraseña: `123456`
- Email: `medico@hospital.com` → Contraseña: `123456`
- Email: `enfermeria@hospital.com` → Contraseña: `123456`
- Email: `admision@hospital.com` → Contraseña: `123456`

### Ejecutar Aplicación
```bash
npm run dev
```

Ir a `http://localhost:3000/login`

---

## 🔐 Características de Seguridad

### Contraseñas
- ✅ Hasheadas con bcrypt (10 rounds)
- ✅ Longitud mínima: 6 caracteres
- ✅ Validadas en servidor
- ✅ Validadas en cliente

### Sesiones
- ✅ Express-session configurada
- ✅ Duración: 24 horas
- ✅ Middleware de autenticación en rutas sensibles

### Validación
- ✅ Mensajes de error genéricos (previene información injection)
- ✅ Campos requeridos
- ✅ Formato de email

---

## 📝 API de Autenticación

### GET `/login`
Renderiza el formulario de login

### POST `/login`
```json
{
  "usuario": "admin@hospital.com",
  "password": "123456"
}
```

Respuesta:
- ✅ Válido: Redirige a `/atencion-medica`
- ❌ Inválido: Muestra error en `/login`

### GET `/logout`
Destruye sesión y redirige a `/login`

### GET `/cambiar-password`
Renderiza formulario (requiere autenticación)

### POST `/cambiar-password`
```json
{
  "passwordActual": "123456",
  "passwordNueva": "nuestra",
  "passwordConfirmar": "nuestra"
}
```

---

## 🛡️ Consideraciones de Producción

### 1. Configurar `.env`
```
SESSION_SECRET=tu-valor-secreto-muy-largo
DB_HOST=tu-servidor
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
```

### 2. Usar HTTPS
Las cookies de sesión deben usar `secure: true`

### 3. Validar Base de Datos
Asegúrate que la tabla `usuarios` tenga el campo `password`

### 4. Rate Limiting (Opcional)
```bash
npm install express-rate-limit
```

---

## 🧪 Pruebas

### Resetear Contraseña de Usuario
```bash
node admin-password.js reset admin@hospital.com
```

### Generar Hash de Contraseña
```bash
node admin-password.js generate tu-contraseña
```

---

## 📚 Archivos Modificados/Creados

```
Hospital La Trinidad/
├── package.json (MOD - agregu bcrypt)
├── .env.example (NEW)
├── AUTENTICACION.md (NEW)
├── seed-usuarios.js (NEW)
├── admin-password.js (NEW)
├── src/
│   ├── controllers/
│   │   └── hospitalController.js (MOD - login + cambiar password)
│   ├── helpers/
│   │   └── passwordHelper.js (NEW)
│   ├── routes/
│   │   └── hospitalRoutes.js (MOD - rutas password)
│   └── views/
│       ├── layout.pug (MOD - dropdown usuario)
│       └── cambiar-password.pug (NEW)
```

---

## ❓ Preguntas Frecuentes

**¿Cómo creo un nuevo usuario?**
- Usa el script `seed-usuarios.js` o inserta manualmente en BD con contraseña hasheada

**¿Cómo reseteó una contraseña?**
```bash
node admin-password.js reset correo@hospital.com
```

**¿Las contraseñas se guardan en texto plano?**
No. Se hashean con bcrypt antes de guardar en BD.

**¿Cómo autorizo diferentes rutas por rol?**
El middleware `ensureAuthenticated` ya está listo. Se puede extender:
```javascript
const ensureRole = (rol) => (req, res, next) => {
  if (req.session.user.rol === rol) return next();
  res.status(403).render('utiles/error', { mensaje: 'Acceso denegado' });
};
```

---

## 📞 Soporte

Para problemas:
1. Verifica que tengas instalado Node.js 14+
2. Ejecuta `npm install`
3. Comprueba la conexión a BD
4. Revisa los logs en consola

---

**Implementado:** 11 de abril de 2026
**Versión:** 1.0
**Estado:** ✅ Listo para usar
