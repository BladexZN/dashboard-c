# Editors DC - Contexto Completo

Este skill proporciona contexto completo del proyecto para debugging y desarrollo.

## Información del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | Dashboard Editors DC |
| **Repo** | BladexZN/dashboard-c |
| **Supabase ID** | yvnshlomzgcynphkqoaj |
| **Stack** | React 19 + TypeScript + Vite + Supabase + Framer Motion + Recharts |

## Propósito
Sistema de gestión de solicitudes de diseño para el equipo de Editors DC. Maneja solicitudes de diseño gráfico desde su creación hasta entrega, con tracking de estados, attachments de referencia, y entrega de diseños finales.

## Flujo de Estados
```
Pendiente → En Producción → Listo → Entregado
              ↓
          Corrección (puede ocurrir en cualquier momento)
```

## Tipos de Solicitud
- **Nueva solicitud:** Diseño completamente nuevo
- **Corrección/Añadido:** Modificaciones a diseño existente
- **Ajuste:** Ajustes menores

## Prioridades
- Urgente (rojo)
- Alta (naranja)
- Media (amarillo)
- Baja (verde)

## Tablas de Base de Datos

| Tabla | Filas | Descripción |
|-------|-------|-------------|
| solicitudes | ~1 | Solicitudes de diseño |
| estados_solicitud | ~4 | Historial de estados |
| usuarios | 6 | Usuarios del sistema |
| notificaciones | 2 | Notificaciones in-app |

## Roles de Usuario
- **Diseñador** (default)
- Otros roles según necesidad

## Campos Especiales

### attachments (JSONB)
Imágenes de referencia/inspiración subidas por el solicitante.
```json
[
  {
    "id": "uuid",
    "name": "referencia.jpg",
    "url": "https://storage.supabase.co/...",
    "size": 12345,
    "type": "image/jpeg",
    "uploaded_at": "2024-01-01T00:00:00Z"
  }
]
```

### final_design (JSONB)
Archivo de diseño final entregado por el diseñador.
```json
{
  "id": "uuid",
  "name": "diseno_final.psd",
  "url": "https://storage.supabase.co/...",
  "size": 54321,
  "type": "application/psd",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

### board_number
Asignación a tablero de diseñador (1-4), similar al sistema de Video Team.

## Componentes Principales
- `App.tsx` - Componente principal, estado global
- `ProductionKanban.tsx` - Vista Kanban de producción
- `RequestsTable.tsx` - Vista de tabla con paginación
- `ReportsView.tsx` - Analytics
- `AuditLogView.tsx` - Bitácora de cambios
- `NewRequestModal.tsx` - Crear solicitudes
- `RequestDetailModal.tsx` - Detalle y edición

## Features
1. Gestión de solicitudes de diseño
2. Upload de referencias/inspiración (attachments)
3. Entrega de diseños finales
4. Kanban con 4 tableros
5. Reportes y analytics
6. Bitácora de cambios
7. Soft delete / Papelera
8. Notificaciones in-app

## Soft Delete
Las solicitudes eliminadas van a papelera con:
- `is_deleted = true`
- `deleted_at = timestamp`
- `deleted_by = user_id`

## Diferencias con Video Team (dashboard-b)
- Tipos de solicitud diferentes (Nueva/Corrección/Ajuste vs Video completo/Agregado/Variante)
- Sin campo `video_type` (Stock/Híbrido/Original)
- Campo `attachments` para referencias visuales
- Campo `final_design` para entregable
- Rol default: Diseñador (vs Productor)
