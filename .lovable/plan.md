

# Rediseno del Modulo de Vehiculos: Rutas > Unidades > Documentos

## Vision General

Transformar la pagina de Vehiculos de un grid de tarjetas a una **estructura jerarquica colapsable** que refleje como realmente se organizan los vehiculos en la operacion:

```text
Ruta (ej: Paseos de Chavarria 2026)
  └─ Unidad 04
  │    ├─ Cromatica 04 Chavarria.pdf          09/02/26
  │    ├─ Factura 04 Chavarria.pdf            09/02/26
  │    ├─ Poliza de Seguro 04 Chavarria.pdf   13/02/26  ⚠ Vence pronto
  │    ├─ Tarjeta de Circulacion 04           04/07/25
  │    └─ Titulo de Concesion 04              17/02/26
  └─ Unidad 07
       ├─ Cromatica 07 Chavarria.pdf          ...
       └─ ...
```

---

## Diseno de Tablas Postgres

### Tabla 1: `rutas`
Agrupa las unidades por zona/ruta de operacion.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | Identificador unico |
| nombre | VARCHAR(150) NOT NULL | Nombre de la ruta (ej: "Paseos de Chavarria 2026") |
| descripcion | TEXT | Notas opcionales |
| activa | BOOLEAN DEFAULT true | Si la ruta esta vigente |
| created_at | TIMESTAMPTZ DEFAULT now() | Fecha de creacion |

### Tabla 2: `unidades`
Cada vehiculo/unidad pertenece a una ruta.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | Identificador unico |
| ruta_id | UUID FK -> rutas(id) | Ruta a la que pertenece |
| numero | VARCHAR(10) NOT NULL | Numero de unidad (ej: "04", "07") |
| placa | VARCHAR(20) | Placa vehicular |
| marca | VARCHAR(50) | Marca del vehiculo |
| modelo | VARCHAR(50) | Modelo |
| anio | SMALLINT | Ano |
| color | VARCHAR(30) | Color |
| km | INTEGER DEFAULT 0 | Kilometraje actual |
| estado | VARCHAR(20) DEFAULT 'activo' | activo, taller, baja |
| descripcion | TEXT | Notas |
| created_at | TIMESTAMPTZ DEFAULT now() | Fecha de creacion |

**Constraint**: UNIQUE(ruta_id, numero) — no puede haber dos unidades con el mismo numero en la misma ruta.

### Tabla 3: `documentos_unidad`
Documentos asociados a cada unidad, con vigencia para alertas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | Identificador unico |
| unidad_id | UUID FK -> unidades(id) ON DELETE CASCADE | Unidad a la que pertenece |
| nombre | VARCHAR(200) NOT NULL | Nombre del archivo (ej: "Poliza de Seguro 04 Chavarria.pdf") |
| tipo | VARCHAR(30) NOT NULL | cromatica, factura, poliza_seguro, tarjeta_circulacion, titulo_concesion, verificacion, permiso, otro |
| vigencia | DATE | Fecha de vencimiento (NULL si no aplica) |
| archivo_url | TEXT | URL del archivo almacenado |
| tamano_bytes | BIGINT | Tamano del archivo en bytes |
| fecha_subida | TIMESTAMPTZ DEFAULT now() | Cuando se subio |
| notas | TEXT | Notas adicionales |

### Tabla 4: `alertas_documento`
Configuracion de alertas por tipo de documento por unidad.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | Identificador |
| unidad_id | UUID FK -> unidades(id) ON DELETE CASCADE | Unidad |
| tipo_documento | VARCHAR(30) NOT NULL | Tipo de documento a vigilar |
| dias_antes | INTEGER DEFAULT 30 | Alertar N dias antes del vencimiento |
| activa | BOOLEAN DEFAULT true | Si la alerta esta habilitada |

**Constraint**: UNIQUE(unidad_id, tipo_documento) — una alerta por tipo por unidad.

### Diagrama de relaciones

```text
rutas (1) ──< (N) unidades (1) ──< (N) documentos_unidad
                              (1) ──< (N) alertas_documento
```

---

## Cambios en el Frontend

### 1. Nuevos tipos TypeScript (`src/types/vehiculos.ts`)

Agregar las interfaces `Ruta` y `Unidad` (renombrando/extendiendo `Vehiculo`), y actualizar `DocumentoVehiculo` para incluir los nuevos tipos de documento (cromatica, titulo_concesion, poliza_seguro) y el campo `tamano`.

Agregar tambien la interface `AlertaDocumento` para la configuracion de alertas.

### 2. Mock data (`src/data/mockVehiculos.ts`)

Crear datos mock que reflejen la estructura de la imagen:
- 2 rutas: "Paseos de Chavarria 2026" (con ~6 unidades) y "Centro Historico 2026" (con ~3 unidades)
- Cada unidad con 3-5 documentos (cromatica, factura, poliza, tarjeta circulacion, titulo concesion)
- Algunas vigencias vencidas o proximas a vencer para mostrar alertas

### 3. Hook actualizado (`src/hooks/useVehiculos.ts`)

Agregar CRUD para rutas, y reestructurar para que las unidades se relacionen con rutas. Agregar gestion de alertas de documentos.

### 4. Pagina principal rediseñada (`src/pages/VehiculosPage.tsx`)

Reemplazar el grid de tarjetas con la estructura colapsable:

- **Header**: Titulo "Flotilla de Vehiculos" + boton "Nueva Ruta" + buscador
- **KPIs**: Total rutas, total unidades, documentos por vencer, documentos vencidos
- **Lista colapsable de Rutas**: Cada ruta es un `Collapsible` con icono de carpeta
  - Al expandir una ruta, muestra sus unidades como items colapsables
  - Al expandir una unidad, muestra la tabla de documentos con columnas: Nombre, Tipo, Vigencia, Tamano, Acciones
  - Indicadores visuales de alerta (rojo = vencido, amarillo = por vencer)
- **Boton "Subir Documento"** dentro de cada unidad
- **Boton "Configurar Alertas"** por unidad (abre un modal para definir dias de anticipacion por tipo)

### 5. Componentes nuevos

- **`RutaCollapsible.tsx`**: Componente para cada ruta colapsable, muestra nombre + badge con conteo de unidades + indicador si hay alertas
- **`UnidadCollapsible.tsx`**: Componente para cada unidad dentro de una ruta, muestra numero + tabla de documentos + indicadores de vigencia
- **`AlertConfigModal.tsx`**: Modal para configurar alertas de vencimiento por tipo de documento

### 6. Se mantienen las tabs de Mantenimiento y Gastos

Las tabs de Mantenimiento y Gastos existentes se conservan sin cambios, solo se actualiza la tab "Flotilla" con el nuevo diseno jerarquico.

---

## Resumen de archivos a modificar/crear

| Archivo | Accion |
|---------|--------|
| `src/types/vehiculos.ts` | Agregar interfaces Ruta, AlertaDocumento, actualizar tipos de documento |
| `src/data/mockVehiculos.ts` | Reescribir con estructura rutas > unidades > documentos |
| `src/hooks/useVehiculos.ts` | Agregar CRUD de rutas y alertas |
| `src/pages/VehiculosPage.tsx` | Redisenar tab Flotilla con collapsibles anidados |
| `src/components/vehiculos/RutaCollapsible.tsx` | Nuevo: componente colapsable de ruta |
| `src/components/vehiculos/UnidadCollapsible.tsx` | Nuevo: componente colapsable de unidad con tabla de docs |
| `src/components/vehiculos/AlertConfigModal.tsx` | Nuevo: modal de configuracion de alertas |
| `src/components/vehiculos/DocVehFormModal.tsx` | Actualizar para nuevos tipos de documento |

