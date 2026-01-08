# Editors DC - Helper de Migraciones

Este skill ayuda a crear migraciones SQL seguras para el proyecto Editors DC.

## Proyecto Supabase
- **ID:** yvnshlomzgcynphkqoaj

## Estructura de tablas actual

### solicitudes
```sql
-- Tabla principal de solicitudes de diseño
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  folio INTEGER DEFAULT nextval('solicitudes_folio_seq'),
  cliente TEXT NOT NULL,
  producto TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'Nueva solicitud', 'Corrección/Añadido', 'Ajuste'
  prioridad TEXT DEFAULT 'Media', -- 'Baja', 'Media', 'Alta', 'Urgente'
  asesor_id UUID REFERENCES usuarios(id),
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  descripcion TEXT DEFAULT '',
  escaleta_video TEXT DEFAULT '',
  material_descargable TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES usuarios(id),
  attachments JSONB DEFAULT '[]', -- Imágenes de referencia/inspiración
  final_design JSONB, -- Archivo de diseño final
  board_number INTEGER DEFAULT 1 CHECK (board_number >= 1 AND board_number <= 4),
  completed_at TIMESTAMPTZ,
  created_by_user_id UUID
);
```

### estados_solicitud
```sql
-- Historial de estados de cada solicitud
CREATE TABLE estados_solicitud (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  solicitud_id UUID REFERENCES solicitudes(id),
  estado TEXT NOT NULL, -- 'Pendiente', 'En Producción', 'Listo', 'Entregado', 'Corrección'
  usuario_id UUID REFERENCES usuarios(id),
  timestamp TIMESTAMPTZ DEFAULT now(),
  nota TEXT
);
```

### usuarios
```sql
-- Usuarios del sistema
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rol TEXT DEFAULT 'Diseñador',
  estado TEXT DEFAULT 'Activo',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### notificaciones
```sql
-- Notificaciones in-app
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id),
  solicitud_id UUID REFERENCES solicitudes(id),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Checklist de migración

1. [ ] Verificar que la columna/tabla no existe
2. [ ] Usar IF NOT EXISTS donde sea posible
3. [ ] Agregar RLS si es tabla nueva
4. [ ] Considerar índices para campos de búsqueda frecuente
5. [ ] Probar en desarrollo antes de producción
6. [ ] Documentar el cambio

## Ejemplo de migración segura

```sql
-- Nombre: add_category_to_solicitudes
-- Descripción: Agrega categoría de diseño a solicitudes

-- 1. Agregar columna
ALTER TABLE solicitudes 
ADD COLUMN IF NOT EXISTS categoria TEXT;

-- 2. Agregar constraint si es necesario
ALTER TABLE solicitudes
ADD CONSTRAINT check_categoria 
CHECK (categoria IN ('Logo', 'Banner', 'Social Media', 'Impresión', 'Web', 'Otro'))
NOT VALID;

-- 3. Validar constraint (puede tomar tiempo en tablas grandes)
ALTER TABLE solicitudes VALIDATE CONSTRAINT check_categoria;

-- 4. Comentario para documentación
COMMENT ON COLUMN solicitudes.categoria IS 'Categoría del diseño solicitado';
```

## Estructura de attachments (JSONB)
```json
[
  {
    "id": "uuid",
    "name": "referencia.jpg",
    "url": "https://...",
    "size": 12345,
    "type": "image/jpeg",
    "uploaded_at": "2024-01-01T00:00:00Z"
  }
]
```

## Estructura de final_design (JSONB)
```json
{
  "id": "uuid",
  "name": "diseno_final.psd",
  "url": "https://...",
  "size": 54321,
  "type": "application/psd",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

## Usar mcp__supabase__apply_migration
```
project_id: yvnshlomzgcynphkqoaj
name: nombre_en_snake_case
query: <SQL>
```
