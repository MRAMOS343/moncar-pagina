

# Plan: Pantalla de seleccion de modulo y acceso por rol

## Resumen

Despues de iniciar sesion, el usuario vera una pantalla intermedia donde elige a cual seccion del portal quiere entrar (Refaccionarias, Propiedades, Vehiculos). El acceso a cada seccion estara controlado por roles fijos. Para cambiar de seccion, el usuario regresa al selector.

---

## Nueva estructura de navegacion

```text
Login --> Selector de Modulo --> Modulo elegido (con su propio sidebar)
                ^                       |
                |_______________________|
                    (boton "Cambiar modulo")
```

---

## Roles y acceso

| Rol | Refaccionarias | Propiedades | Vehiculos |
|-----|---------------|-------------|-----------|
| admin | Si | Si | Si |
| gerente | Si | No | No |
| cajero | Si | No | No |
| gestor_propiedades | No | Si | No |
| gestor_vehiculos | No | Si (lectura) | Si |
| developer | Si | Si | Si |

**Nota**: Se agregan dos roles nuevos al tipo `User` y al enum de roles. El backend debera reflejar estos roles en su tabla `user_roles`.

---

## Cambios en detalle

### 1. Actualizar tipo User (`src/types/index.ts`)

Expandir el tipo de `role` para incluir los nuevos roles:
```
role: 'admin' | 'gerente' | 'cajero' | 'gestor_propiedades' | 'gestor_vehiculos' | 'developer'
```

Actualizar tambien `src/schemas/userSchema.ts` y `src/constants/index.ts` con los nuevos valores.

### 2. Nueva pagina: `src/pages/ModuleSelectorPage.tsx`

Pantalla con 3 tarjetas grandes mostrando los modulos disponibles para el usuario:

```text
+------------------------------------------------------------------+
|                     Grupo Monzalvo                                |
|              Selecciona un modulo de trabajo                      |
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  |   Refaccionarias |  |   Propiedades    |  |    Vehiculos     | |
|  |                  |  |                  |  |                  | |
|  |  Inventario,     |  |  Inmuebles en    |  |  Flotilla de     | |
|  |  ventas y        |  |  renta, pagos    |  |  transporte,     | |
|  |  prediccion      |  |  y documentos    |  |  servicios       | |
|  |                  |  |                  |  |                  | |
|  |    [Entrar]      |  |    [Entrar]      |  |    [Entrar]      | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                    |
|                                          [Cerrar Sesion]          |
+------------------------------------------------------------------+
```

- Las tarjetas de modulos a los que el usuario no tiene acceso se ocultan o se muestran deshabilitadas con un candado
- La pagina verifica el rol del usuario y solo muestra las tarjetas permitidas
- Al hacer clic en "Entrar", redirige a la ruta base del modulo

### 3. Nuevas rutas por modulo

La estructura de rutas cambiara para separar cada modulo:

| Ruta | Modulo | Layout |
|------|--------|--------|
| `/selector` | Selector de modulo | Sin sidebar |
| `/refaccionarias/*` | Refaccionarias | Sidebar de refaccionarias |
| `/propiedades/*` | Propiedades | Sidebar de propiedades |
| `/vehiculos/*` | Vehiculos | Sidebar de vehiculos |

Cada modulo tendra su propio layout con sidebar contextual. Esto reemplaza la estructura actual de `/dashboard/*`.

### 4. Layouts por modulo

**`src/pages/RefaccionariasLayout.tsx`** (basado en el actual `DashboardLayout.tsx`)
- Sidebar con: Dashboard, Inventario, Ventas, Prediccion, Compra Sugerida, Proveedores, Equipos, Soporte, Configuracion
- Boton "Cambiar modulo" en el footer del sidebar que regresa a `/selector`
- Mantiene la logica de warehouse existente

**`src/pages/PropiedadesLayout.tsx`** (nuevo)
- Sidebar con: Resumen, Inmuebles, Contratos, Pagos, Mantenimiento
- Boton "Cambiar modulo" en el footer
- Sin logica de warehouse

**`src/pages/VehiculosLayout.tsx`** (nuevo, preparado para el modulo de vehiculos)
- Sidebar con: Resumen, Flotilla, Mantenimiento, Gastos
- Boton "Cambiar modulo" en el footer

### 5. Logica de permisos: `src/utils/moduleAccess.ts` (nuevo)

```typescript
type ModuleId = 'refaccionarias' | 'propiedades' | 'vehiculos';

const MODULE_ACCESS: Record<string, ModuleId[]> = {
  admin: ['refaccionarias', 'propiedades', 'vehiculos'],
  developer: ['refaccionarias', 'propiedades', 'vehiculos'],
  gerente: ['refaccionarias'],
  cajero: ['refaccionarias'],
  gestor_propiedades: ['propiedades'],
  gestor_vehiculos: ['vehiculos'],
};

function getUserModules(role: string): ModuleId[] { ... }
function canAccessModule(role: string, module: ModuleId): boolean { ... }
```

### 6. Componente de proteccion: `src/components/auth/ModuleRoute.tsx` (nuevo)

Similar a `AdminRoute` pero parametrizado por modulo:
```typescript
<ModuleRoute module="propiedades">
  <PropiedadesLayout />
</ModuleRoute>
```

Redirige a `/selector` si el usuario no tiene acceso al modulo.

### 7. Actualizar `src/main.tsx`

Reemplazar la estructura actual:

```text
/                   -> Redirect a /selector o /login
/login              -> LoginPage
/selector           -> ModuleSelectorPage (protegido)
/refaccionarias     -> RefaccionariasLayout
  /                 -> DashboardPage
  /inventario       -> InventarioPage
  /ventas           -> VentasPage
  /prediccion       -> PrediccionPage
  /compras          -> ComprasPage
  /equipos          -> EquiposPage
  /proveedores      -> ProveedoresPage
  /configuracion    -> ConfiguracionPage
  /soporte          -> SoportePage
/propiedades        -> PropiedadesLayout
  /                 -> PropiedadesPage (actual)
/vehiculos          -> VehiculosLayout
  /                 -> VehiculosPage (por crear)
```

### 8. Actualizar flujo post-login

Modificar `LoginPage.tsx` y `Index.tsx` para redirigir a `/selector` en lugar de `/dashboard`.

### 9. Actualizar `AuthContext.tsx`

- Actualizar el tipo de `updateUserRole` para aceptar los nuevos roles
- Ajustar logout para redirigir a `/login`

---

## Archivos nuevos

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/ModuleSelectorPage.tsx` | Pantalla de seleccion de modulo |
| `src/pages/RefaccionariasLayout.tsx` | Layout/sidebar para modulo de refaccionarias |
| `src/pages/PropiedadesLayout.tsx` | Layout/sidebar para modulo de propiedades |
| `src/pages/VehiculosLayout.tsx` | Layout/sidebar para modulo de vehiculos (placeholder) |
| `src/utils/moduleAccess.ts` | Logica de permisos por modulo |
| `src/components/auth/ModuleRoute.tsx` | Componente protector por modulo |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/main.tsx` | Reestructurar rutas completamente |
| `src/pages/LoginPage.tsx` | Redirigir a `/selector` |
| `src/pages/Index.tsx` | Redirigir a `/selector` |
| `src/types/index.ts` | Agregar nuevos roles al tipo User |
| `src/schemas/userSchema.ts` | Agregar nuevos roles al schema |
| `src/constants/index.ts` | Agregar nuevos roles a ROLES_USUARIO |
| `src/contexts/AuthContext.tsx` | Actualizar tipo de updateUserRole |
| `src/pages/DashboardLayout.tsx` | Refactorizar como RefaccionariasLayout (renombrar y ajustar sidebar) |
| `src/components/layout/AppSidebar.tsx` | Refactorizar para recibir items de navegacion como props en lugar de tenerlos hardcoded |

---

## Detalles Tecnicos

- El `DashboardLayout` actual se convierte en `RefaccionariasLayout` con ajustes minimos; la logica de warehouse, dark mode y breadcrumbs se preserva intacta
- `AppSidebar` se vuelve generico: recibe un array de items de navegacion y un titulo de modulo como props, permitiendo reutilizarlo en los 3 layouts
- El modulo de Vehiculos quedara como placeholder con una pagina basica; se implementara completo despues con el plan ya aprobado anteriormente
- Si un usuario solo tiene acceso a 1 modulo, el selector lo mostrara igual (por consistencia) pero podria auto-redirigir en el futuro

