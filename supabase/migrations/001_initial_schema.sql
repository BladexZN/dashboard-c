-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. usuarios (users)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rol TEXT DEFAULT 'Diseñador',
  estado TEXT DEFAULT 'Activo',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. solicitudes (design requests)
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio SERIAL,
  cliente TEXT NOT NULL,
  producto TEXT NOT NULL,
  tipo TEXT NOT NULL,
  prioridad TEXT DEFAULT 'Media',
  asesor_id UUID REFERENCES usuarios(id),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  descripcion TEXT DEFAULT '',
  escaleta_video TEXT DEFAULT '',
  material_descargable TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES usuarios(id)
);

-- 3. estados_solicitud (status history)
CREATE TABLE estados_solicitud (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE,
  estado TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  nota TEXT
);

-- 4. notificaciones (notifications)
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  solicitud_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_solicitud ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated users - simple approach)
CREATE POLICY "Allow all for authenticated users" ON usuarios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON solicitudes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON estados_solicitud FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON notificaciones FOR ALL USING (auth.role() = 'authenticated');
