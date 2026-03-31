-- Run this in Supabase SQL Editor to create the ads table
create table ads (
  id uuid default gen_random_uuid() primary key,
  url text,
  headline text,
  ad_copy text,
  video_url text,
  created_at timestamptz default now()
);
