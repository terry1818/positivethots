-- Biometric consent record (BIPA / Texas CUBI / Washington), November 2026.
-- The face verification screen now asks for written consent before the camera opens.
-- Each attempt stores when the person agreed and which version of the wording they saw.
-- Safe to run more than once.
ALTER TABLE public.face_verifications
  ADD COLUMN IF NOT EXISTS consented_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version text;
