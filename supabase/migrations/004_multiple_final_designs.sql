-- Add final_designs JSONB column for multiple final design files
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS final_designs JSONB DEFAULT '[]'::jsonb;

-- Migrate existing single final_design data into the new array column
UPDATE solicitudes
SET final_designs = jsonb_build_array(final_design)
WHERE final_design IS NOT NULL
  AND final_design != 'null'::jsonb
  AND final_design::text != 'null';
