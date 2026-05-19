-- Migration 001: Add user_id to ads (Phase 1 Step 2 — User Authentication)
--
-- Run this in three phases via the Supabase SQL Editor.
-- DO NOT run all three at once — the backfill needs a real founder uuid
-- that only exists after the founder has signed up on the live app.

-- =============================================================================
-- PHASE 1 — Run BEFORE the auth-enabled code is deployed.
-- Safe to run anytime; nullable column has no effect on existing inserts.
-- =============================================================================

ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ads_user_id_idx ON public.ads(user_id);


-- =============================================================================
-- PHASE 2 — Run AFTER deploy AND after the founder has signed up at
-- https://ai-ad-tool.vercel.app/auth/signup.
-- Find the founder uuid in Supabase dashboard → Authentication → Users.
-- Replace <FOUNDER_UUID> below before running.
-- =============================================================================

-- UPDATE public.ads
-- SET user_id = '<FOUNDER_UUID>'::uuid
-- WHERE user_id IS NULL;

-- ALTER TABLE public.ads
-- ALTER COLUMN user_id SET NOT NULL;


-- =============================================================================
-- PHASE 3 — RLS policies. Run after Phase 2 succeeds.
-- Backend uses service_role and bypasses RLS; these policies are
-- defense-in-depth for any direct anon-key access.
--
-- First, list current policies so you know what to drop:
--   SELECT policyname FROM pg_policies WHERE tablename = 'ads';
-- Then `DROP POLICY "<name>" ON public.ads;` for each old policy
-- before creating the new ones below.
-- =============================================================================

-- ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "users select own ads"
--   ON public.ads FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);

-- CREATE POLICY "users insert own ads"
--   ON public.ads FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "users update own ads"
--   ON public.ads FOR UPDATE
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "users delete own ads"
--   ON public.ads FOR DELETE
--   TO authenticated
--   USING (auth.uid() = user_id);
