# Subagent: Editors DC Health Check

Este agente ejecuta un chequeo completo de salud del sistema de solicitudes de diseño.

## Proyecto
- **Supabase ID:** yvnshlomzgcynphkqoaj
- **Repo:** BladexZN/dashboard-c

## Workflow Autónomo

Ejecuta las siguientes consultas en secuencia usando `mcp__supabase__execute_sql`:

### 1. Estado general del sistema
```sql
SELECT 
  COUNT(*) as total_solicitudes,
  COUNT(*) FILTER (WHERE is_deleted = false) as activas,
  COUNT(*) FILTER (WHERE is_deleted = true) as en_papelera
FROM solicitudes;
```

### 2. Solicitudes por estado actual
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

### 3. Solicitudes por prioridad (no entregadas)
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

### 5. Solicitudes en corrección
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  es.timestamp as desde
FROM solicitudes s
JOIN LATERAL (
  SELECT estado, timestamp FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false AND es.estado = 'Corrección'
ORDER BY es.timestamp;
```

### 6. Solicitudes listas sin diseño final
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto
FROM solicitudes s
JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es ON true
WHERE s.is_deleted = false 
  AND es.estado = 'Listo'
  AND s.final_design IS NULL;
```

### 7. Notificaciones no leídas
```sql
SELECT 
  u.nombre,
  COUNT(*) as notificaciones_sin_leer
FROM notificaciones n
JOIN usuarios u ON u.id = n.user_id
WHERE n.is_read = false
GROUP BY u.id, u.nombre
HAVING COUNT(*) > 0
ORDER BY notificaciones_sin_leer DESC;
```

### 8. Usuarios activos
```sql
SELECT nombre, rol, estado FROM usuarios WHERE estado = 'Activo';
```

### 9. Revisar advisors de Supabase
Usa `mcp__supabase__get_advisors` con type "security" y "performance".

## Output Esperado

```markdown
## 📊 Health Check - Editors DC

### Estado General
- Total solicitudes: X
- Activas: X | En papelera: X

### Por Estado
| Estado | Cantidad |
|--------|----------|
| Pendiente | X |
| En Producción | X |
| Corrección | X |
| Listo | X |
| Entregado | X |

### Por Prioridad (Pendientes)
| Prioridad | Cantidad |
|-----------|----------|
| Urgente | X |
| Alta | X |
| Media | X |
| Baja | X |

### ⚠️ Alertas
- Urgentes/Altas pendientes: X
- En corrección: X
- Listas sin diseño final: X

### 👥 Usuarios Activos
- [Lista de usuarios]

### 🔔 Notificaciones Pendientes
- [Usuario]: X sin leer

### 🛡️ Advisors
- Security: [resumen]
- Performance: [resumen]
```
