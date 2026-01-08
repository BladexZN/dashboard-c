# Editors DC - Estado del Sistema

Este skill genera un resumen ejecutivo del estado de solicitudes de diseño.

## Proyecto Supabase
- **Nombre:** Editors DC
- **ID:** yvnshlomzgcynphkqoaj

## Consultas SQL para ejecutar:

### 1. Resumen general de solicitudes
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_deleted = false) as activas,
  COUNT(*) FILTER (WHERE is_deleted = true) as en_papelera
FROM solicitudes;
```

### 2. Solicitudes por estado (activas)
```sql
SELECT 
  es.estado,
  COUNT(DISTINCT s.id) as cantidad
FROM solicitudes s
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false
GROUP BY es.estado
ORDER BY 
  CASE es.estado
    WHEN 'Pendiente' THEN 1
    WHEN 'En Producción' THEN 2
    WHEN 'Corrección' THEN 3
    WHEN 'Listo' THEN 4
    WHEN 'Entregado' THEN 5
  END;
```

### 3. Solicitudes por prioridad
```sql
SELECT 
  s.prioridad,
  COUNT(*) as cantidad
FROM solicitudes s
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false
  AND es.estado NOT IN ('Entregado')
GROUP BY s.prioridad
ORDER BY 
  CASE s.prioridad
    WHEN 'Urgente' THEN 1
    WHEN 'Alta' THEN 2
    WHEN 'Media' THEN 3
    WHEN 'Baja' THEN 4
  END;
```

### 4. Solicitudes urgentes/alta prioridad pendientes
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.prioridad,
  s.tipo,
  es.estado
FROM solicitudes s
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false 
  AND s.prioridad IN ('Urgente', 'Alta')
  AND es.estado NOT IN ('Entregado')
ORDER BY 
  CASE s.prioridad WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 END,
  s.fecha_creacion;
```

### 5. Usuarios activos
```sql
SELECT 
  nombre,
  email,
  rol,
  estado
FROM usuarios
WHERE estado = 'Activo'
ORDER BY rol, nombre;
```

### 6. Notificaciones sin leer
```sql
SELECT 
  u.nombre,
  COUNT(*) as sin_leer
FROM notificaciones n
JOIN usuarios u ON u.id = n.user_id
WHERE n.is_read = false
GROUP BY u.id, u.nombre
ORDER BY sin_leer DESC;
```

## Instrucciones
Ejecuta estas consultas usando `mcp__supabase__execute_sql` con project_id `yvnshlomzgcynphkqoaj` y presenta un resumen ejecutivo.
