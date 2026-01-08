# Subagent: Design Request Tracker

Este agente rastrea el ciclo de vida completo de una solicitud de diseño específica.

## Proyecto
- **Supabase ID:** yvnshlomzgcynphkqoaj
- **Repo:** BladexZN/dashboard-c

## Input Requerido
El usuario debe proporcionar el **folio** de la solicitud a rastrear.

## Workflow Autónomo

Reemplaza `{FOLIO}` con el folio proporcionado.

### 1. Información general de la solicitud
```sql
SELECT 
  s.id,
  s.folio,
  s.cliente,
  s.producto,
  s.tipo,
  s.prioridad,
  s.descripcion,
  s.escaleta_video,
  s.material_descargable,
  s.attachments,
  s.final_design,
  s.board_number,
  s.fecha_creacion,
  s.completed_at,
  s.is_deleted,
  s.deleted_at,
  u_asesor.nombre as asesor,
  u_creador.nombre as creado_por,
  u_eliminador.nombre as eliminado_por
FROM solicitudes s
LEFT JOIN usuarios u_asesor ON u_asesor.id = s.asesor_id
LEFT JOIN usuarios u_creador ON u_creador.id = s.created_by_user_id
LEFT JOIN usuarios u_eliminador ON u_eliminador.id = s.deleted_by
WHERE s.folio = {FOLIO};
```

### 2. Historial completo de estados
```sql
SELECT 
  es.estado,
  u.nombre as cambiado_por,
  es.timestamp,
  es.nota,
  es.timestamp - LAG(es.timestamp) OVER (ORDER BY es.timestamp) as tiempo_en_estado_anterior
FROM estados_solicitud es
JOIN solicitudes s ON s.id = es.solicitud_id
LEFT JOIN usuarios u ON u.id = es.usuario_id
WHERE s.folio = {FOLIO}
ORDER BY es.timestamp;
```

### 3. Estado actual
```sql
SELECT 
  es.estado as estado_actual,
  u.nombre as ultimo_cambio_por,
  es.timestamp as desde,
  es.nota,
  NOW() - es.timestamp as tiempo_en_estado_actual
FROM estados_solicitud es
JOIN solicitudes s ON s.id = es.solicitud_id
LEFT JOIN usuarios u ON u.id = es.usuario_id
WHERE s.folio = {FOLIO}
ORDER BY es.timestamp DESC
LIMIT 1;
```

### 4. Tiempo total del ciclo
```sql
SELECT 
  s.folio,
  s.fecha_creacion as inicio,
  MAX(es.timestamp) FILTER (WHERE es.estado = 'Entregado') as fin,
  CASE 
    WHEN MAX(es.timestamp) FILTER (WHERE es.estado = 'Entregado') IS NOT NULL
    THEN MAX(es.timestamp) FILTER (WHERE es.estado = 'Entregado') - s.fecha_creacion
    ELSE NOW() - s.fecha_creacion
  END as tiempo_total,
  CASE 
    WHEN MAX(es.timestamp) FILTER (WHERE es.estado = 'Entregado') IS NOT NULL
    THEN 'Completado'
    ELSE 'En proceso'
  END as status
FROM solicitudes s
JOIN estados_solicitud es ON es.solicitud_id = s.id
WHERE s.folio = {FOLIO}
GROUP BY s.id, s.folio, s.fecha_creacion;
```

### 5. Notificaciones relacionadas
```sql
SELECT 
  n.titulo,
  n.mensaje,
  n.tipo,
  u.nombre as destinatario,
  n.is_read,
  n.created_at
FROM notificaciones n
JOIN solicitudes s ON s.id = n.solicitud_id
JOIN usuarios u ON u.id = n.user_id
WHERE s.folio = {FOLIO}
ORDER BY n.created_at DESC;
```

### 6. Cantidad de correcciones
```sql
SELECT 
  COUNT(*) as veces_en_correccion
FROM estados_solicitud es
JOIN solicitudes s ON s.id = es.solicitud_id
WHERE s.folio = {FOLIO}
  AND es.estado = 'Corrección';
```

## Output Esperado

```markdown
## 📍 Tracking de Solicitud: [FOLIO]

### 📋 Información General
| Campo | Valor |
|-------|-------|
| Cliente | [X] |
| Producto | [X] |
| Tipo | [X] |
| Prioridad | [X] |
| Asesor | [X] |
| Board | [X] |
| Creado por | [X] |
| Fecha creación | [X] |

### 🟢 Estado Actual: [ESTADO]
- Desde: [FECHA]
- Tiempo en este estado: [DURACIÓN]
- Último cambio por: [USUARIO]
- Nota: [NOTA]

### 📈 Timeline Completo
| # | Estado | Cambiado por | Fecha | Duración | Nota |
|---|--------|--------------|-------|----------|------|
| 1 | Pendiente | [X] | [X] | [X] | [X] |
| 2 | En Producción | [X] | [X] | [X] | [X] |
| ... | ... | ... | ... | ... | ... |

### ⏱️ Tiempo Total
- **Inicio:** [FECHA]
- **Fin:** [FECHA o "En proceso"]
- **Duración total:** [X días/horas]

### ⚠️ Correcciones
- Veces en corrección: [X]

### 📎 Attachments (Referencias)
- Cantidad: [X] archivos
- [Lista de archivos con nombres]

### 🎨 Diseño Final
- Archivo: [nombre o "No entregado"]
- Subido: [fecha]

### 🔔 Notificaciones
[Lista de notificaciones con destinatario y estado]
```
