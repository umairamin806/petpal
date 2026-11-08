# 🐾 PetPal — Pet Services Marketplace

![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20RLS-3ecf8e?style=flat-square&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-f5a623?style=flat-square)

A full-stack pet services marketplace where **pet owners** discover and book trusted **service providers** for sitting, walking, grooming, training, and vet appointments — built as a developer portfolio project.

---

## ✨ Features

### For Pet Owners
- Browse and search all active service listings
- Filter by service type, city, and max price per hour
- View listing details with provider info, availability, and reviews
- Request a booking with date, time, pet name, and notes
- Track all bookings and their status (pending / accepted / declined)
- Leave a 1–5 star review with a comment after an accepted booking

### For Service Providers
- Create, edit, and delete service listings (title, type, description, price, city, availability)
- Pause / re-activate listings without deleting them
- View all incoming booking requests
- Accept or decline requests with one click
- Tabbed inbox — Pending / Accepted / Declined

### General
- Email/password authentication (Supabase Auth)
- Role chosen at signup — **owner** or **provider** — stored in a `profiles` table
- Average star ratings displayed on every listing card
- Clean dark-mode UI, fully responsive down to 320 px

---

## 🛠 Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React 18, Vite 5, React Router v6       |
| Backend     | Supabase (Postgres, Auth, Row-Level Security) |
| Styling     | Vanilla CSS with CSS custom properties (no framework) |
| Auth        | Supabase Auth — email/password          |
| Deployment  | Any static host (Vercel, Netlify, etc.) + Supabase cloud |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 1 — Clone and install

```bash
git clone https://github.com/your-username/petpal.git
cd petpal
npm install
```

### 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Find both values in your Supabase dashboard under **Project Settings → API**.

### 3 — Set up the database

In the Supabase dashboard go to **SQL Editor** and run:

1. `supabase/schema.sql` — creates all tables, indexes, views, RLS policies, and the `handle_new_user` trigger

### 4 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> ⚠️ **Disable "Confirm email" for development**
> In Supabase go to **Authentication → Providers → Email** and turn off *Confirm email*. Otherwise new signups won't be able to log in immediately during local testing.

### 5 — Load sample data

1. Sign up at least one account in the app with role **Provider**
2. In the Supabase **SQL Editor** run `supabase/seed.sql`

The script resolves the provider ID automatically from `public.profiles` — no hardcoded UUIDs or magic credentials needed. If two provider accounts exist it will spread the 9 listings across both; otherwise all listings go to the first provider.

---

## 📐 Schema Overview

```
profiles
  id (uuid, FK → auth.users)
  email · full_name · role (owner|provider) · avatar_url · created_at

listings
  id · provider_id (FK profiles) · title · service_type (enum)
  description · price_per_hour · city · availability
  is_active · created_at · updated_at

bookings
  id · listing_id · owner_id · provider_id
  booking_date · booking_time · pet_name · notes
  status (pending|accepted|declined) · created_at · updated_at

reviews
  id · booking_id (unique) · listing_id · owner_id · provider_id
  rating (1–5) · comment · created_at

-- View
listings_with_stats   -- listings + provider name + avg_rating + review_count
```

### Row-Level Security summary

| Table    | Read               | Insert                    | Update / Delete        |
|----------|--------------------|---------------------------|------------------------|
| profiles | Anyone             | Own row only              | Own row only           |
| listings | Anyone             | Providers (own `provider_id`) | Provider owns listing  |
| bookings | Owner or provider of that booking | Owners only | Provider updates status; owner deletes |
| reviews  | Anyone             | Owner of accepted booking | Own review only        |

---

## 📁 Project Structure

```
petpal/
├── supabase/
│   ├── schema.sql          # Tables, indexes, RLS, trigger
│   └── seed.sql            # Demo accounts + 8 listings
├── src/
│   ├── lib/
│   │   └── supabase.js     # Supabase client
│   ├── context/
│   │   └── AuthContext.jsx # Session, profile, auth helpers
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ListingCard.jsx
│   │   ├── StarRating.jsx
│   │   ├── ReviewModal.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── PageSpinner.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── owner/
│   │   │   ├── Browse.jsx
│   │   │   ├── ListingDetail.jsx
│   │   │   └── MyBookings.jsx
│   │   └── provider/
│   │       ├── ProviderListings.jsx
│   │       ├── ListingForm.jsx
│   │       └── ProviderBookings.jsx
│   ├── App.jsx             # Router + layout shell
│   ├── main.jsx            # React entry point
│   └── index.css           # Global dark-mode styles
├── public/
│   └── paw.svg
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## 🏗 Build for production

```bash
npm run build
```

The `dist/` folder is a standard static site — deploy to Vercel, Netlify, Cloudflare Pages, or any static host. Point your host's SPA rewrite rule to `index.html` so React Router handles all routes.

---

## 📄 License

MIT — free to use, modify, and showcase in your portfolio.
