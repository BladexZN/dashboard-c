# Editors DC - Consultas de Solicitudes

Este skill contiene consultas frecuentes para solicitudes de diseño.

## Proyecto Supabase
- **ID:** yvnshlomzgcynphkqoaj

## Consultas disponibles:

### Solicitudes pendientes
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.tipo,
  s.prioridad,
  s.board_number,
  es.estado,
  s.fecha_creacion
FROM solicitudes s
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false 
  AND es.estado IN ('Pendiente', 'En Producción', 'Corrección')
ORDER BY 
  CASE s.prioridad WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Media' THEN 3 ELSE 4 END,
  s.fecha_creacion;
```

### Solicitudes en corrección
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  es.timestamp as fecha_correccion
FROM solicitudes s
JOIN LATERAL (
  SELECT estado, timestamp FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false AND es.estado = 'Corrección'
ORDER BY es.timestamp DESC;
```

### Solicitudes listas para entregar
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  u.nombre as asesor,
  s.completed_at,
  CASE WHEN s.final_design IS NOT NULL THEN 'Sí' ELSE 'No' END as tiene_diseno_final
FROM solicitudes s
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
LEFT JOIN usuarios u ON u.id = s.asesor_id
WHERE s.is_deleted = false AND es.estado = 'Listo'
ORDER BY s.completed_at DESC;
```

### Solicitudes entregadas hoy
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.tipo
FROM solicitudes s
JOIN LATERAL (
  SELECT estado, timestamp FROM estados_solicitud 
  WHERE solicitud_id = s.id AND estado = 'Entregado'
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false 
  AND DATE(es.timestamp) = CURRENT_DATE
ORDER BY es.timestamp DESC;
```

### Buscar solicitud por folio
```sql
-- Reemplaza {FOLIO} con el folio a buscar
SELECT 
  s.*,
  u.nombre as asesor_nombre,
  es.estado as estado_actual
FROM solicitudes s
LEFT JOIN usuarios u ON u.id = s.asesor_id
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.folio = {FOLIO};
```

### Solicitudes por cliente
```sql
-- Reemplaza {CLIENTE} con el nombre del cliente (puede ser parcial con ILIKE)
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.tipo,
  es.estado,
  s.fecha_creacion
FROM solicitudes s
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.cliente ILIKE '%{CLIENTE}%'
  AND s.is_deleted = false
ORDER BY s.fecha_creacion DESC;
```

### Solicitudes con diseño final
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.final_design->>'name' as archivo_nombre,
  s.final_design->>'uploaded_at' as fecha_subida
FROM solicitudes s
WHERE s.final_design IS NOT NULL
  AND s.is_deleted = false
ORDER BY (s.final_design->>'uploaded_at')::timestamp DESC
LIMIT 20;
```

### Papelera (eliminados)
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.deleted_at,
  u.nombre as eliminado_por
FROM solicitudes s
LEFT JOIN usuarios u ON u.id = s.deleted_by
WHERE s.is_deleted = true
ORDER BY s.deleted_at DESC
LIMIT 50;
```

## Tipos de solicitud
- Nueva solicitud
- Corrección/Añadido
- Ajuste

## Campos especiales
- `attachments` (JSONB) - Imágenes de referencia/inspiración
- `final_design` (JSONB) - Archivo de diseño final entregado
