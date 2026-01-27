

# Plan: Mostrar Campo `notes` en el Detalle del Producto

## Contexto

El campo `notes` de la base de datos ya está disponible en la API (`GET /products/:sku`), pero actualmente no se muestra en el modal de detalle del producto.

Según los datos de la API vistos en network requests, el campo contiene información útil como:
- `"ACEITE SINTETICO 10W30 1LT. =19434702"`
- `"FILTRO AIRE CHEVY 94-12 1.4 1.6 =FA9494 =GA134"`

## Solución

Agregar una sección para mostrar el campo `notes` dentro del área de "Ficha Técnica", justo antes de los atributos técnicos.

---

## Cambios a Implementar

**Archivo: `src/components/inventory/ProductDetailModal.tsx`**

Agregar visualización del campo `notes` del producto en la sección de Ficha Técnica:

```typescript
{/* Tech Sheet */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
      <FileText className="w-5 h-5" />
      Ficha Técnica
    </h3>
    ...
  </div>
  <Separator />
  
  {/* NUEVO: Notas del producto (campo notes) */}
  {product.notes && (
    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
        Notas del producto:
      </span>
      <p className="text-sm mt-1 text-blue-900 dark:text-blue-100">
        {product.notes}
      </p>
    </div>
  )}
  
  {/* Resto del contenido de la ficha técnica... */}
  {loadingTechSheet ? (
    ...
  ) : techSheet ? (
    ...
  ) : (
    ...
  )}
</div>
```

---

## Ubicación Visual

```text
┌──────────────────────────────────────┐
│  Ficha Técnica              [Editar] │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ 📝 Notas del producto:           │ │  ← NUEVO
│ │ ACEITE SINTETICO 10W30 1LT...    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Notas generales (tech sheet):   │ │  ← Existente
│ │ ...                              │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Voltaje:                      120V   │  ← Atributos existentes
│ Material:                   Acero   │
└──────────────────────────────────────┘
```

---

## Diferenciación Visual

| Elemento | Color | Fuente |
|----------|-------|--------|
| Notas del producto (`notes`) | Fondo azul claro | Distintivo del producto |
| Notas generales (tech sheet) | Fondo gris (`muted/30`) | De la ficha técnica |

Esta diferenciación ayuda a distinguir entre las notas que vienen directamente del producto vs las notas de la ficha técnica.

---

## Tipo de Datos

El campo `notes` ya existe en el tipo `ApiProduct`:

```typescript
// src/types/products.ts
export interface ApiProduct {
  sku: string;
  descrip: string | null;
  marca: string | null;
  // ... otros campos
  notes?: string | null;  // ← Ya definido (verificar)
}
```

Si no existe, se agregará al tipo.

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/inventory/ProductDetailModal.tsx` | Agregar visualización del campo `notes` en sección de Ficha Técnica |
| `src/types/products.ts` | Verificar/agregar campo `notes` al tipo `ApiProduct` (si no existe) |

