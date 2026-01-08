# Subagent: Design Daily Report

Este agente genera un reporte diario ejecutivo del sistema de diseño.

## Proyecto
- **Supabase ID:** yvnshlomzgcynphkqoaj
- **Repo:** BladexZN/dashboard-c

## Workflow Autónomo

Ejecuta las siguientes consultas usando `mcp__supabase__execute_sql`:

### 1. Resumen del día
```sql
SELECT 
  COUNT(*) FILTER (WHERE DATE(s.fecha_creacion) = CURRENT_DATE) as creadas_hoy,
  COUNT(*) FILTER (WHERE DATE(es_entregado.timestamp) = CURRENT_DATE) as entregadas_hoy,
  COUNT(*) FILTER (WHERE es_actual.estado IN ('Pendiente', 'En Producción', 'Corrección')) as backlog_actual
FROM solicitudes s
LEFT JOIN LATERAL (
  SELECT timestamp FROM estados_solicitud 
  WHERE solicitud_id = s.id AND estado = 'Entregado'
  ORDER BY timestamp DESC LIMIT 1
) es_entregado ON true
LEFT JOIN LATERAL (
  SELECT estado FROM estados_solicitud 
  WHERE solicitud_id = s.id 
  ORDER BY timestamp DESC LIMIT 1
) es_actual ON true
WHERE s.is_deleted = false;
```

### 2. Cambios de estado hoy
```sql
SELECT 
  es.estado,
  COUNT(*) as transiciones
FROM estados_solicitud es
WHERE DATE(es.timestamp) = CURRENT_DATE
GROUP BY es.estado
ORDER BY transiciones DESC;
```

### 3. Detalle de entregas de hoy
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.tipo,
  CASE WHEN s.final_design IS NOT NULL THEN 'Sí' ELSE 'No' END as con_archivo,
  es.timestamp as hora_entrega
FROM solicitudes s
JOIN estados_solicitud es ON es.solicitud_id = s.id AND es.estado = 'Entregado'
WHERE DATE(es.timestamp) = CURRENT_DATE
  AND s.is_deleted = false
ORDER BY es.timestamp DESC;
```

### 4. Nuevas solicitudes de hoy
```sql
SELECT 
  s.folio,
  s.cliente,
  s.producto,
  s.tipo,
  s.prioridad,
  u.nombre as asesor,
  CASE WHEN s.attachments IS NOT NULL AND jsonb_array_length(s.attachments) > 0 
       THEN jsonb_array_length(s.attachments)::text || ' refs'
       ELSE 'Sin refs' 
  END as referencias
FROM solicitudes s
LEFT JOIN usuarios u ON u.id = s.asesor_id
WHERE DATE(s.fecha_creacion) = CURRENT_DATE
  AND s.is_deleted = false
ORDER BY s.fecha_creacion DESC;
```

### 5. Comparativa con ayer
```sql
SELECT 
  'Ayer' as periodo,
  COUNT(*) FILTER (WHERE DATE(s.fecha_creacion) = CURRENT_DATE - 1) as creadas,
  COUNT(*) FILTER (WHERE DATE(es.timestamp) = CURRENT_DATE - 1 AND es.estado = 'Entregado') as entregadas
FROM solicitudes s
LEFT JOIN estados_solicitud es ON es.solicitud_id = s.id
WHERE s.is_deleted = false
UNION ALL
SELECT 
  'Hoy' as periodo,
  COUNT(*) FILTER (WHERE DATE(s.fecha_creacion) = CURRENT_DATE) as creadas,
  COUNT(*) FILTER (WHERE DATE(es.timestamp) = CURRENT_DATE AND es.estado = 'Entregado') as entregadas
FROM solicitudes s
LEFT JOIN estados_solicitud es ON es.solicitud_id = s.id
WHERE s.is_deleted = false;
```

### 6. Actividad por usuario hoy
```sql
SELECT 
  u.nombre,
  COUNT(*) as cambios_realizados
FROM estados_solicitud es
JOIN usuarios u ON u.id = es.usuario_id
WHERE DATE(es.timestamp) = CURRENT_DATE
GROUP BY u.id, u.nombre
ORDER BY cambios_realizados DESC;
```

## Output Esperado

```markdown
## 📅 Reporte Diario - Editors DC
**Fecha:** [FECHA]

### 📊 Resumen del Día
| Métrica | Hoy | Ayer |
|---------|-----|------|
| Creadas | X | X |
| Entregadas | X | X |
| Backlog actual | X | - |

### ✅ Entregas de Hoy
| Folio | Cliente | Producto | Tipo | Archivo |
|-------|---------|----------|------|----------|
| X | X | X | X | Sí/No |

### 🆕 Nuevas Solicitudes
| Folio | Cliente | Prioridad | Referencias |
|-------|---------|-----------|-------------|
| X | X | X | X refs |

### 📊 Flujo del Día
| Estado | Transiciones |
|--------|--------------|
| Pendiente | X |
| En Producción | X |
| ... | ... |

### 👤 Actividad por Usuario
| Usuario | Cambios |
|---------|----------|
| X | X |
```
