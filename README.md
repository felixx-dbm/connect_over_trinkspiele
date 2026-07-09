# Prost — Trinkspiel Battle App

Mobile-first beer drinking game battle app. Challenge nearby players, join crews, climb the leaderboard.

## Features

- **Matches** — post a challenge (Beer Pong, Flunkyball, Freestyle …), let nearby players accept, track the score live and confirm the winner
- **Map** — see open challenges around you on an interactive OpenStreetMap (locations are fuzzed for privacy)
- **Crews** — create or join a crew via invite code, fight crew-vs-crew battles
- **Events** — create public events, join others, see who's coming
- **Leaderboard** — global and crew rankings based on match wins
- **Profile & QR challenge** — share a QR code that lets anyone challenge you directly
- **Notifications** — in-app notifications for challenges, match results and crew activity
- **i18n** — English and German, switchable in settings
- **PWA** — installable on the home screen (manifest + install banner)

## Stack

- **Next.js 16** (App Router, TypeScript strict)
- **Supabase** — Postgres + Auth + PostGIS for geolocation
- **Tailwind CSS v4** — dark theme, amber accent
- **react-leaflet + OpenStreetMap** — no API key required

## Local Development

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The app uses a hosted Supabase project — no local Supabase setup needed. Email confirmation links will redirect to `localhost:3000` in local dev.

> **Supabase free tier** sleeps after 7 days of inactivity. If server-side requests time out ("fetch failed"), open the Supabase dashboard to wake the project.

## Deployment (Vercel)

Add these environment variables in the Vercel dashboard before deploying:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://your-app.vercel.app`) — used for email confirmation redirect |

## Database Migrations

Migrations are in `supabase/migrations/` and must be run in order via the Supabase SQL editor:

| File | Description |
|---|---|
| `001_schema.sql` | Initial schema |
| `002_*.sql` | RLS policies |
| `003_functions.sql` | PostGIS RPCs (nearby matches, matchmaking) |
| `004_constraints.sql` | Unique constraint on crew membership |
| `005_user_trigger.sql` | Auto-create public.users on auth signup |
| `006_rls.sql` | Full RLS policies for all tables |
