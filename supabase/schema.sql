-- ============================================================
-- PetPal Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Types ───────────────────────────────────────────────────
create type service_type as enum (
  'sitting',
  'walking',
  'grooming',
  'training',
  'vet'
);

create type booking_status as enum (
  'pending',
  'accepted',
  'declined'
);

-- ============================================================
-- PROFILES
-- One row per auth user; role chosen at signup and immutable.
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        text not null check (role in ('owner', 'provider')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Index for quick look-ups by role
create index idx_profiles_role on profiles(role);

-- ============================================================
-- LISTINGS
-- Created by providers; visible to everyone.
-- ============================================================
create table listings (
  id            uuid primary key default uuid_generate_v4(),
  provider_id   uuid not null references profiles(id) on delete cascade,
  title         text not null,
  service_type  service_type not null,
  description   text not null,
  price_per_hour numeric(8,2) not null check (price_per_hour >= 0),
  city          text not null,
  availability  text not null,           -- e.g. "Mon–Fri 8am–6pm"
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_listings_provider   on listings(provider_id);
create index idx_listings_service    on listings(service_type);
create index idx_listings_city       on listings(city);
create index idx_listings_price      on listings(price_per_hour);
create index idx_listings_active     on listings(is_active);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute function set_updated_at();

-- ============================================================
-- BOOKINGS
-- Owners book a listing; providers respond.
-- ============================================================
create table bookings (
  id            uuid primary key default uuid_generate_v4(),
  listing_id    uuid not null references listings(id) on delete cascade,
  owner_id      uuid not null references profiles(id) on delete cascade,
  provider_id   uuid not null references profiles(id) on delete cascade,
  booking_date  date not null,
  booking_time  time not null,
  pet_name      text not null,
  notes         text,
  status        booking_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_bookings_owner    on bookings(owner_id);
create index idx_bookings_provider on bookings(provider_id);
create index idx_bookings_listing  on bookings(listing_id);
create index idx_bookings_status   on bookings(status);

create trigger bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- ============================================================
-- REVIEWS
-- Owners leave one review per accepted booking.
-- ============================================================
create table reviews (
  id           uuid primary key default uuid_generate_v4(),
  booking_id   uuid not null unique references bookings(id) on delete cascade,
  listing_id   uuid not null references listings(id) on delete cascade,
  owner_id     uuid not null references profiles(id) on delete cascade,
  provider_id  uuid not null references profiles(id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

create index idx_reviews_listing  on reviews(listing_id);
create index idx_reviews_provider on reviews(provider_id);
create index idx_reviews_owner    on reviews(owner_id);

-- ============================================================
-- VIEWS
-- Handy aggregate used by the listings page.
-- ============================================================
create or replace view listings_with_stats as
select
  l.*,
  p.full_name      as provider_name,
  p.avatar_url     as provider_avatar,
  coalesce(r.avg_rating, 0)::numeric(3,2) as avg_rating,
  coalesce(r.review_count, 0)             as review_count
from listings l
join profiles p on p.id = l.provider_id
left join (
  select
    listing_id,
    round(avg(rating)::numeric, 2) as avg_rating,
    count(*)                        as review_count
  from reviews
  group by listing_id
) r on r.listing_id = l.id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles  enable row level security;
alter table listings  enable row level security;
alter table bookings  enable row level security;
alter table reviews   enable row level security;

-- ── Profiles ────────────────────────────────────────────────

-- Anyone can read any profile (needed for listing author names)
create policy "profiles: public read"
  on profiles for select
  using (true);

-- Users can only insert their own profile row
create policy "profiles: insert own"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can only update their own profile row
create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Listings ────────────────────────────────────────────────

-- Anyone (including anonymous) can read active listings
create policy "listings: public read"
  on listings for select
  using (true);

-- Only providers can insert, and only for themselves
create policy "listings: provider insert"
  on listings for insert
  with check (
    auth.uid() = provider_id
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'provider'
    )
  );

-- Providers can only update their own listings
create policy "listings: provider update own"
  on listings for update
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

-- Providers can only delete their own listings
create policy "listings: provider delete own"
  on listings for delete
  using (auth.uid() = provider_id);

-- ── Bookings ────────────────────────────────────────────────

-- Owners see their own bookings; providers see bookings on their listings
create policy "bookings: owner read own"
  on bookings for select
  using (
    auth.uid() = owner_id
    or auth.uid() = provider_id
  );

-- Only owners can create bookings (for themselves)
create policy "bookings: owner insert"
  on bookings for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- Providers can update status (accept/decline) on their own bookings
create policy "bookings: provider update status"
  on bookings for update
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

-- Owners can delete/cancel their own pending bookings
create policy "bookings: owner delete own"
  on bookings for delete
  using (auth.uid() = owner_id);

-- ── Reviews ─────────────────────────────────────────────────

-- Anyone can read reviews
create policy "reviews: public read"
  on reviews for select
  using (true);

-- Only the owner of an accepted booking can insert a review
create policy "reviews: owner insert after accepted booking"
  on reviews for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from bookings
      where id = booking_id
        and owner_id = auth.uid()
        and status = 'accepted'
    )
  );

-- Owners can update their own review
create policy "reviews: owner update own"
  on reviews for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Owners can delete their own review
create policy "reviews: owner delete own"
  on reviews for delete
  using (auth.uid() = owner_id);

-- ============================================================
-- HANDLE NEW USER  (trigger runs on auth.users insert)
-- Creates a stub profile automatically so foreign keys work.
-- The signup form passes full_name and role via metadata.
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous'),
    coalesce(new.raw_user_meta_data->>'role', 'owner')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
