-- Migration: Add attachments and final design support for Dashboard C (Design)
-- This adds file storage capabilities for reference images and final designs

-- 1. Add new columns to solicitudes table for attachments
ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS final_design JSONB DEFAULT NULL;

-- attachments format: [{ "name": "file.jpg", "url": "https://...", "size": 12345, "type": "image/jpeg", "uploaded_at": "2024-..." }]
-- final_design format: { "name": "final.psd", "url": "https://...", "size": 12345, "type": "image/png", "uploaded_at": "2024-..." }

-- 2. Create storage bucket for design attachments (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-attachments',
  'design-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/zip', 'application/x-rar-compressed', 'application/vnd.adobe.photoshop', 'application/illustrator']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for the bucket
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'design-attachments');

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated reads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'design-attachments');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'design-attachments');

-- Allow public read access (for sharing designs)
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'design-attachments');
