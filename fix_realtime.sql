-- Fix Realtime Configuration (Idempotent Version)
-- Run this in your Supabase SQL Editor

begin;

-- 1. Force the publication to include exactly these tables
-- This avoids the "already member" error by resetting the list
alter publication supabase_realtime set table orders, tables, menu_items;

-- 2. Set replica identity to FULL (Critical for updates to work)
alter table orders replica identity full;
alter table tables replica identity full;
alter table menu_items replica identity full;

commit;

-- Verification
select * from pg_publication_tables where pubname = 'supabase_realtime';
