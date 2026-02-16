-- Multi-Board: Add board_number to estados_solicitud
-- Each request can have independent status per board (Tablero 1 / Tablero 2)

-- Add board_number column (default 1 = existing records belong to Tablero 1)
ALTER TABLE estados_solicitud
ADD COLUMN IF NOT EXISTS board_number integer NOT NULL DEFAULT 1;

-- Index for board-filtered queries
CREATE INDEX IF NOT EXISTS idx_estados_board
ON estados_solicitud (solicitud_id, board_number, timestamp);

-- Create initial "Pendiente" state in Tablero 2 for all existing non-deleted requests
INSERT INTO estados_solicitud (solicitud_id, estado, usuario_id, timestamp, board_number)
SELECT DISTINCT ON (es.solicitud_id)
  es.solicitud_id,
  'Pendiente',
  es.usuario_id,
  es.timestamp,
  2
FROM estados_solicitud es
JOIN solicitudes s ON s.id = es.solicitud_id
WHERE s.is_deleted = false
ORDER BY es.solicitud_id, es.timestamp ASC;
