-- Run this in Supabase SQL Editor to create the ads table
create table ads (
  id uuid default gen_random_uuid() primary key,
  url text,
  headline text,
  ad_copy text,
  video_url text,
  colors jsonb default '[]'::jsonb,
  logo text default '',
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- Migration for existing databases (Priority 5 — persist visuals)
-- Run this once in the Supabase SQL Editor on any DB created before this change.
-- Idempotent: safe to run multiple times.
-- ============================================================================
-- alter table ads
--   add column if not exists colors jsonb default '[]'::jsonb,
--   add column if not exists logo   text  default '',
--   add column if not exists images jsonb default '[]'::jsonb;
