-- ============================================================
-- PetPal Seed Data
-- ============================================================
-- BEFORE RUNNING THIS FILE:
--   1. Sign up at least one provider account in the app
--      (role = 'provider').  The listings below will be
--      assigned to the first provider found in public.profiles.
--   2. Optionally sign up a second provider; the script will
--      use both if they exist, otherwise it falls back to the
--      first one for all rows.
--   3. Run schema.sql first if you haven't already.
-- ============================================================

do $$
declare
  p1 uuid;
  p2 uuid;
begin

  -- ── Resolve provider IDs ──────────────────────────────────
  -- p1 = first provider by sign-up time (required)
  select id into p1
  from public.profiles
  where role = 'provider'
  order by created_at
  limit 1;

  if p1 is null then
    raise exception
      'No provider account found. Sign up a provider in the app first, then re-run this file.';
  end if;

  -- p2 = second provider if one exists, otherwise reuse p1
  select id into p2
  from public.profiles
  where role = 'provider'
    and id <> p1
  order by created_at
  limit 1;

  if p2 is null then
    p2 := p1;
  end if;

  -- ── Listings for provider 1 ───────────────────────────────
  insert into public.listings
    (provider_id, title, service_type, description, price_per_hour, city, availability)
  values
  (
    p1,
    'Cozy Home Pet Sitting',
    'sitting',
    'I will care for your pet in my home like it is my own. Your furry friend gets a warm bed, regular meals, playtime, and plenty of love. I have two friendly dogs of my own so social pets thrive here. Daily photo updates included.',
    25.00,
    'Austin',
    'Mon–Sun, all day'
  ),
  (
    p1,
    'Morning & Evening Dog Walks',
    'walking',
    'Energetic 45-minute walks in your neighbourhood. I keep dogs on leash, carry waste bags, and send a route summary and a photo after each walk. Groups of up to 3 dogs welcome.',
    18.00,
    'Austin',
    'Mon–Fri 7am–9am and 5pm–7pm'
  ),
  (
    p1,
    'Full-Service Dog Grooming',
    'grooming',
    'Bath, blow-dry, breed-standard haircut, nail trim, ear cleaning, and teeth brushing. I use only pet-safe, sulphate-free products. Appointments at my home studio. All sizes welcome; giant breeds add $10.',
    55.00,
    'Austin',
    'Tue–Sat 9am–5pm'
  ),
  (
    p1,
    'Basic Obedience Training',
    'training',
    'Six-session programme covering sit, stay, down, come, and loose-leash walking using positive reinforcement only. Suitable for puppies 8 weeks+ and adult dogs. Sessions held in your home or a local park.',
    45.00,
    'Austin',
    'Weekends and weekday evenings'
  );

  -- ── Listings for provider 2 (or p1 if only one provider) ─
  insert into public.listings
    (provider_id, title, service_type, description, price_per_hour, city, availability)
  values
  (
    p2,
    'In-Home Puppy Sitting',
    'sitting',
    'Certified pet first-aid provider with 8 years of experience. I come to your home so your puppy keeps their routine. Hourly check-ins, medication reminders, and detailed end-of-day reports. Insured.',
    30.00,
    'Denver',
    'Mon–Sun 7am–10pm'
  ),
  (
    p2,
    'Adventure Trail Walking',
    'walking',
    'High-energy 60-minute hike/trail walks for athletic dogs. I take small groups (max 2) to dog-friendly Denver trails. Your pup comes back happy and tired. Harness and water bottle provided.',
    22.00,
    'Denver',
    'Daily 6am–11am'
  ),
  (
    p2,
    'Mobile Cat & Dog Grooming',
    'grooming',
    'Fully equipped van comes to your driveway—no stressful car rides to a salon. Services include bath, trim, deshedding treatment, nails, and spritz. Cats and small dogs a speciality. Anxiety-friendly approach.',
    60.00,
    'Denver',
    'Mon–Fri 8am–4pm'
  ),
  (
    p2,
    'Senior Pet Veterinary Escort',
    'vet',
    'I accompany your senior or special-needs pet to their vet appointment, keep notes, and brief you afterwards. Ideal for owners who cannot take time off work. Transport in my pet-safe vehicle included.',
    40.00,
    'Denver',
    'Mon–Fri 8am–6pm (by appointment)'
  ),
  (
    p2,
    'Agility & Trick Training',
    'training',
    'Fun, reward-based sessions introducing jumps, tunnels, weave poles, and cool tricks. Great mental enrichment for active breeds. Beginner to intermediate levels. Equipment provided. Minimum 4-session booking.',
    50.00,
    'Denver',
    'Sat–Sun 9am–1pm'
  );

end $$;
