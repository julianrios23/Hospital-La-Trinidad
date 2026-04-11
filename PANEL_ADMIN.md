# 📊 Panel de Administración - Gestión de Usuarios

## 🎯 Funcionalidades Implementadas

### ✅ **Gestión Completa de Usuarios (CRUD)**
- **Crear** nuevos usuarios con validaciones
- **Leer** lista completa de usuarios con estadísticas
- **Actualizar** información de usuarios existentes
- **Eliminar** usuarios (borrado lógico)

### ✅ **Características de Seguridad**
- ✅ Middleware `ensureAdmin` - Solo administradores acceden
- ✅ Validaciones en frontend y backend
- ✅ Hash de contraseñas con bcrypt
- ✅ Protección contra auto-eliminación
- ✅ Confirmaciones para acciones críticas

### ✅ **Interfaz de Usuario**
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Tabla responsive con información completa
- ✅ Formularios validados con feedback visual
- ✅ Avatares automáticos por iniciales
- ✅ Estados visuales (activo/inactivo)
- ✅ Iconos y colores por rol

---

## 🚀 Cómo Acceder

### 1. **Iniciar sesión como administrador**
```bash
Email: admin@hospital.com
Contraseña: 123456
```

### 2. **Ir al panel de administración**
- Desde el navbar: **"Administración"**
- URL directa: `/admin/usuarios`

### 3. **Funciones disponibles**
- 📊 **Dashboard** - Ver estadísticas y lista de usuarios
- ➕ **Nuevo Usuario** - Crear usuario con formulario validado
- ✏️ **Editar** - Modificar datos existentes
- 🔄 **Activar/Desactivar** - Cambiar estado del usuario
- 🗑️ **Eliminar** - Borrado lógico (cambiar a inactivo)

---

## 📋 Campos de Usuario Gestionados

### **Información Personal**
- ✅ Nombre (requerido, solo letras)
- ✅ Apellido (requerido, solo letras)
- ✅ DNI (requerido, 7-15 dígitos)
- ✅ Teléfono (opcional, 10-15 dígitos)
- ✅ Email (requerido, formato válido)

### **Información del Sistema**
- ✅ Rol (Administrador, Médico, Enfermería, Admisión)
- ✅ Médico asignado (solo para enfermería)
- ✅ Estado (Activo/Inactivo)
- ✅ Contraseña (hasheada con bcrypt)
- ✅ Fecha de registro (automática)

---

## 🔐 Validaciones Implementadas

### **Backend (Node.js)**
```javascript
// Nombre y apellido: solo letras
if (!regexLetras.test(nombre)) { /* error */ }

// DNI: números, 7-15 dígitos
if (!regexNumeros.test(dni) || dni.length < 7) { /* error */ }

// Contraseña: mínimo 6 caracteres
if (password.length < 6) { /* error */ }

// Unicidad: DNI y email únicos
const [existe] = await db.query('SELECT id FROM usuarios WHERE dni = ? OR email = ?', [dni, email]);
```

### **Frontend (JavaScript)**
```javascript
// Validación en tiempo real
form.addEventListener('submit', function(e) {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    e.preventDefault();
    alert('Las contraseñas no coinciden');
  }
});
```

### **HTML5 Validation**
```pug
input#dni.form-control(
  type="text"
  name="dni"
  required
  pattern="\\d{7,15}"
  title="Solo números, 7-15 dígitos"
)
```

---

## 🎨 Interfaz de Usuario

### **Dashboard Principal**
```
┌─────────────────────────────────────────────────┐
│ 👥 Gestión de Usuarios                    ➕ Nuevo │
├─────────────────────────────────────────────────┤
│ 📊 Estadísticas: Total | Activos | Inactivos | Admins │
├─────────────────────────────────────────────────┤
│ ┌─ Tabla de Usuarios ──────────────────────────┐ │
│ │ Avatar | Nombre | Contacto | Rol | Estado | Fecha │
│ │ [👤]   | Juan   | email@.. | Admin| Activo | 2024 │
│ │        | Pérez  | tel:..   |      |        |      │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### **Formulario de Creación**
```
┌─ Crear Nuevo Usuario ──────────────────────────┐
│ Nombre*     Apellido*                          │
│ [Juan]      [Pérez]                            │
│                                                │
│ DNI*        Teléfono                           │
│ [12345678]  [1123456789]                       │
│                                                │
│ Email*      Rol*                               │
│ [juan@...]  [👑 Administrador ▼]              │
│                                                │
│ Contraseña* Confirmar*                         │
│ [••••••]    [••••••]                           │
│                                                │
│ [ Cancelar ]                    [ Crear ]      │
└────────────────────────────────────────────────┘
```

---

## 🛠️ Rutas Implementadas

### **GET Routes**
- `/admin/usuarios` - Lista de usuarios (admin only)
- `/admin/usuarios/nuevo` - Formulario crear (admin only)
- `/admin/usuarios/:id/editar` - Formulario editar (admin only)

### **POST Routes**
- `/admin/usuarios/crear` - Crear usuario (admin only)
- `/admin/usuarios/:id/actualizar` - Actualizar usuario (admin only)
- `/admin/usuarios/:id/eliminar` - Eliminar usuario (admin only)
- `/admin/usuarios/:id/toggle-estado` - Activar/desactivar (admin only)

### **Middleware de Seguridad**
```javascript
const ensureAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.rol === 'administrador') {
    return next();
  }
  res.status(403).render('utiles/error', { mensaje: 'Acceso denegado' });
};
```

---

## 📊 Estadísticas en Tiempo Real

### **Métricas Mostradas**
- **Total de Usuarios**: Conteo total en BD
- **Usuarios Activos**: Estado = 'activo'
- **Usuarios Inactivos**: Estado = 'inactivo'
- **Administradores**: Rol = 'administrador'

### **Código de Estadísticas**
```javascript
// En la vista usuarios.pug
h4.mb-0= usuarios.length  // Total
h4.mb-0= usuarios.filter(u => u.estado === 'activo').length  // Activos
h4.mb-0= usuarios.filter(u => u.rol === 'administrador').length  // Admins
```

---

## 🔄 Estados de Usuario

### **Activo** ✅
- Puede iniciar sesión
- Accede a todas sus funciones según rol
- Aparece en listas de asignación

### **Inactivo** ❌
- No puede iniciar sesión
- Conserva todos sus datos
- No aparece en listas de asignación
- Puede ser reactivado

### **Borrado Lógico**
- Nunca se elimina físicamente de BD
- Solo cambia estado a 'inactivo'
- Historial de actividades se mantiene

---

## 👥 Roles y Permisos

### **Administrador** 👑
- ✅ Acceso completo al panel de administración
- ✅ Gestionar todos los usuarios
- ✅ Todas las funciones del sistema

### **Médico** 🩺
- ❌ No accede al panel de administración
- ✅ Funciones médicas completas

### **Enfermería** 💊
- ❌ No accede al panel de administración
- ✅ Funciones de triage y enfermería

### **Admisión** 📋
- ❌ No accede al panel de administración
- ✅ Funciones de admisión

---

## 🛡️ Medidas de Seguridad

### **Protección contra Auto-Acciones**
```javascript
// No permitir eliminarse a sí mismo
if (req.session.user.id == id) {
  return res.redirect('/admin/usuarios');
}
```

### **Validaciones Duplicadas**
- **Frontend**: JavaScript para UX inmediata
- **Backend**: Validaciones de servidor para seguridad

### **Hash de Contraseñas**
```javascript
const passwordHasheada = await hashPassword(password);
// Se guarda en BD como hash, nunca como texto plano
```

### **Confirmaciones de Acción**
```javascript
// JavaScript para confirmar acciones críticas
onsubmit="return confirm('¿Eliminar usuario permanentemente?')"
```

---

## 📱 Responsive Design

### **Desktop (>768px)**
- Tabla completa con todas las columnas
- Formularios en 2 columnas
- Sidebar de navegación completa

### **Mobile (<768px)**
- Tabla responsive con scroll horizontal
- Formularios apilados en 1 columna
- Menú colapsable

### **Bootstrap Classes Usadas**
```pug
.table-responsive     // Tabla adaptable
.d-flex               // Layouts flexibles
.justify-content-between  // Espaciado
.g-3                  // Gutter en formularios
```

---

## 🔧 Personalización

### **Agregar Nuevo Rol**
1. Actualizar enum en BD
2. Agregar opción en formularios
3. Actualizar lógica de permisos

### **Agregar Campo Personalizado**
1. Modificar tabla `usuarios`
2. Actualizar formularios
3. Actualizar métodos del controlador

### **Cambiar Validaciones**
1. Modificar regex en `hospitalController.js`
2. Actualizar validaciones HTML5
3. Actualizar JavaScript del cliente

---

## 📈 Próximas Mejoras (Opcionales)

### **Funcionalidades Adicionales**
- 🔍 **Búsqueda y filtros** por nombre, rol, estado
- 📧 **Invitaciones por email** para nuevos usuarios
- 📊 **Logs de actividad** de usuarios
- 🔐 **Permisos granulares** por módulo
- 📱 **Notificaciones push** de cambios

### **Mejoras de UX**
- 🎨 **Temas oscuros/claros**
- 🌐 **Internacionalización** (i18n)
- 📊 **Gráficos de estadísticas**
- 💾 **Exportar datos** a Excel/CSV
- 🔄 **Paginación** para listas grandes

---

## 🐛 Solución de Problemas

### **Error: "Acceso denegado"**
- Verificar que el usuario tenga rol 'administrador'
- Revisar middleware `ensureAdmin`

### **Error: "Usuario no encontrado"**
- Verificar que el ID existe en BD
- Revisar parámetros de URL

### **Error: "Email/DNI ya existe"**
- Intentar crear usuario con datos duplicados
- Usar datos únicos

### **Error: "Contraseña muy corta"**
- Mínimo 6 caracteres requeridos
- Validar tanto en frontend como backend

---

## 📚 Archivos Modificados/Creados

```
Hospital La Trinidad/
├── src/
│   ├── routes/
│   │   └── hospitalRoutes.js (MOD - rutas admin + middleware)
│   ├── controllers/
│   │   └── hospitalController.js (MOD - métodos admin)
│   ├── views/
│   │   ├── layout.pug (MOD - enlace admin)
│   │   └── admin/
│   │       ├── usuarios.pug (NEW - dashboard)
│   │       ├── nuevo-usuario.pug (NEW - crear)
│   │       └── editar-usuario.pug (NEW - editar)
└── PANEL_ADMIN.md (NEW - documentación)
```

---

## 🎯 Checklist de Implementación

- ✅ Middleware de autenticación admin
- ✅ Rutas protegidas para gestión de usuarios
- ✅ Dashboard con estadísticas
- ✅ Formulario de creación con validaciones
- ✅ Formulario de edición
- ✅ Funciones activar/desactivar/eliminar
- ✅ Interfaz responsive
- ✅ Validaciones frontend y backend
- ✅ Seguridad contra auto-acciones
- ✅ Documentación completa

---

**Implementado:** 11 de abril de 2026
**Versión:** 1.0
**Estado:** ✅ Completo y funcional
