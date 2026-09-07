-- JOY Social Welfare Trust website intake schema.
-- Run this in a dedicated Supabase project, never in the existing payroll project.

create extension if not exists pgcrypto;

create table if not exists public.donation_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  phone text check (phone is null or char_length(phone) <= 40),
  purpose text not null check (char_length(purpose) between 3 and 120),
  amount_inr numeric(12, 2) check (amount_inr is null or amount_inr > 0),
  message text check (message is null or char_length(message) <= 1000),
  source_page text check (source_page is null or char_length(source_page) <= 200),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 40),
  email text check (email is null or char_length(email) <= 254),
  location text not null check (char_length(location) between 2 and 160),
  support_type text not null check (char_length(support_type) between 3 and 120),
  urgency text not null check (char_length(urgency) between 3 and 80),
  estimated_requirement text check (estimated_requirement is null or char_length(estimated_requirement) <= 300),
  situation text not null check (char_length(situation) between 40 and 1500),
  source_page text check (source_page is null or char_length(source_page) <= 200),
  status text not null default 'new' check (status in ('new', 'reviewing', 'referred', 'approved', 'declined', 'closed'))
);

alter table public.donation_enquiries enable row level security;
alter table public.support_requests enable row level security;

-- Public browser clients must never read or write these tables directly.
-- The intake Edge Function performs validation and writes with its server-only key.
revoke all on table public.donation_enquiries from anon, authenticated;
revoke all on table public.support_requests from anon, authenticated;

grant all on table public.donation_enquiries to service_role;
grant all on table public.support_requests to service_role;

comment on table public.donation_enquiries is
  'Initial donation enquiries submitted through the JOY public website.';
comment on table public.support_requests is
  'Initial support requests. Do not store identity documents, passwords, OTPs, bank credentials, or full medical records.';

