-- Consentimiento informado para el tratamiento de datos personales
-- (Ley N.° 29733 en Perú y Ley 1581 de 2012 en Colombia).
alter table users add column if not exists consent_at timestamptz;
alter table users add column if not exists consent_version text;
