# Drinking Game Battle App — Architecture & Implementation Plan

## Context
A team of 5 students is building a mobile-first web app for organizing and tracking drinking game battles (Beer Pong, Flunky Ball, Freestyle). Users can play solo (matchmaking), privately within a crew, or publicly against other crews in their region. Wins feed into crew and city leaderboards. Timeline: 12–16 weeks. Stack: Next.js + Supabase + Vercel.

A map view will show active match-seekers (crews in the queue or with open challenges) at ~200 m fuzzed GPS precision. The device's Geolocation API auto-detects the user's position to drive proximity-based matching (replaces city-string matching). Location is ephemeral — stored only while in the queue and wiped when a match is found or cancelled.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | Team knows React; App Router enables server components for leaderboard queries |
| Styling | Tailwind CSS | Fastest path to polished mobile-first UI |
| Backend/BaaS | Supabase | Postgres + Auth + REST + RLS + Storage — eliminates a separate API server |
| Hosting | Vercel | Zero-config Next.js deploys, free tier, preview URLs per PR |
| Version control | GitHub (Education) | Use Codespaces for uniform dev environment across all 5 laptops |
| Polling | Next.js API routes + `setInterval` client-side | Near-real-time is sufficient; avoids Supabase Realtime complexity |
| Map | react-leaflet + OpenStreetMap tiles | Completely free, no API key, works in all browsers, good React integration |
| Geolocation | Browser Geolocation API | Native, no library needed; ask permission only when entering matchmaking |
| Spatial DB | Supabase + PostGIS extension | `ST_DWithin` for radius queries; `geography` type for accurate distance calc |

---

## Database Schema (Supabase/Postgres)

Enable PostGIS first: `CREATE EXTENSION IF NOT EXISTS postgis;`

```
users            id, username, city, avatar_url, wins, losses, birth_date date, created_at
                 ↳ city kept for leaderboard grouping; set manually on profile
                 ↳ birth_date hidden from other users via RLS; checked server-side at registration

crews            id, name, city, invite_code, captain_id → users.id
crew_members     id, crew_id → crews, user_id → users, role (captain/member)
game_types       id, name (beer_pong | flunky_ball | freestyle), rules_md

matches          id, game_type_id, mode (solo|crew|regional), status (open|active|completed|cancelled),
                 city, location geography(POINT,4326),   ← fuzzed coords of where the match takes place
                 challenger_id, challenger_type (user|crew),
                 opponent_id, opponent_type, winner_id, created_at, completed_at

match_queue      id, user_id, game_type_id,
                 location geography(POINT,4326),         ← fuzzed coords; NULL = no geo permission given
                 radius_km integer DEFAULT 5,            ← how far the user is willing to travel
                 joined_at
                 ↳ row deleted as soon as a match is created
```

**Coordinate fuzzing** (done client-side before sending, and re-applied server-side):
```ts
// lib/geo.ts
const GRID = 0.002; // ≈ 200 m per step
export function fuzzCoords(lat: number, lng: number) {
  return {
    lat: Math.round(lat / GRID) * GRID,
    lng: Math.round(lng / GRID) * GRID,
  };
}
```

**Proximity matchmaking query** (replaces city-string match):
```sql
SELECT q2.* FROM match_queue q1
JOIN match_queue q2
  ON q1.user_id <> q2.user_id
  AND q1.game_type_id = q2.game_type_id
  AND ST_DWithin(q1.location::geography, q2.location::geography,
                 LEAST(q1.radius_km, q2.radius_km) * 1000)
WHERE q1.user_id = $userId
LIMIT 1
FOR UPDATE SKIP LOCKED;   ← prevents race condition
```

Row Level Security (RLS) must be enabled on all tables from day 1. Users can only read/write their own data; match results are immutable once set. The `match_queue` and `matches` location columns are readable by all authenticated users (needed for the map), but only the queue entry owner can insert/delete their row.

---

## Feature Breakdown by Mode

### Solo Matchmaking
1. User clicks "Find Opponent" → browser asks for Geolocation permission.
   - If granted: coords are fuzzed (`fuzzCoords`) and stored in `match_queue`.
   - If denied: user falls back to city-string matching (graceful degradation).
2. Client polls `/api/matchmaking/status` every 5 s.
3. API route: runs `ST_DWithin` query to find compatible nearby user → if found, creates `match` record (with fuzzed location), deletes both queue rows, returns match ID.
4. Both clients redirect to match lobby page.

### Map View
- Route: `app/map/page.tsx`
- On load: fetch `GET /api/map/challenges?lat=X&lng=Y` (user's fuzzed coords as params).
- API returns: all `match_queue` entries + open `matches` within a configurable radius (default 10 km), with fuzzed coordinates.
- Renders react-leaflet map centered on user's location.
- Markers: open challenges (tap to see game type, crew name, and "Accept" button); user's own position shown with distinct marker.
- Map re-fetches every 15 s (same polling pattern as matchmaking).

### Private Crew Battle
1. Crew captain creates a challenge → `match` row with mode=crew, status=open.
2. Opponent crew captain receives invite link (share link with match ID).
3. Accepting flips status to `active`.

### Regional / Public Challenge
1. User/crew posts a public challenge → `match` row with mode=regional, status=open, location=fuzzed GPS coords.
2. Challenge appears as a marker on the map AND in the regional list view.
3. Any user/crew within range can accept directly from the map or list.

---

## Leaderboard

- **City leaderboard**: `SELECT users.*, wins FROM users WHERE city = $city ORDER BY wins DESC LIMIT 50` — server component, cached with `revalidate = 60`.
- **Crew leaderboard**: Aggregate wins across `crew_members` for each crew in a city.
- No materialized view needed at this scale; simple queries are fast enough.

---

## Project Phases (16 weeks)

| Weeks | Milestone | Owner suggestion |
|---|---|---|
| 1–2 | Repo setup, Supabase project, auth (email + Google OAuth), age-gate splash, registration with DOB validation, basic profile page | All |
| 3–4 | Crew creation, invite code flow, crew member management | 2 devs |
| 5–6 | Match creation UI — all 3 modes, game type selection | 2 devs |
| 7–8 | Solo matchmaking queue + proximity logic; map view + geolocation; challenge accept flow | 1–2 devs |
| 9–10 | Result submission, win/loss recording, leaderboard pages | 2 devs |
| 11–12 | Mobile UX polish, PWA manifest, offline-friendly states | All |
| 13–14 | End-to-end testing, RLS audit, performance | All |
| 15–16 | Final deployment, demo, buffer for bugs | All |

---

## Team Split (5 people)

- **2× Frontend** — pages, components, Tailwind, mobile UX
- **1× Backend/DB** — Supabase schema, RLS policies, migrations, API routes
- **1× Fullstack** — matchmaking logic, challenge flow, glue between front and back
- **1× QA/Design** — Figma mockups early on, test coverage, bug triage

All devs should use GitHub Codespaces (via GitHub Education) to avoid "works on my machine" issues.

---

## Critical Files to Create

```
/
├── app/                         # Next.js App Router
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx     # includes DOB field; server action validates age ≥ 18
│   ├── (auth)/age-gate/page.tsx     # shown to unauthenticated visitors before any content
│   ├── profile/page.tsx
│   ├── crews/[id]/page.tsx
│   ├── matches/new/page.tsx
│   ├── matches/[id]/page.tsx    # lobby + result submission
│   ├── map/page.tsx             # live map of nearby challenges
│   ├── leaderboard/page.tsx
│   └── api/
│       ├── matchmaking/status/route.ts
│       ├── map/challenges/route.ts  # returns nearby open matches + queue entries
│       └── matches/[id]/result/route.ts
├── lib/
│   ├── supabase/client.ts       # browser client
│   ├── supabase/server.ts       # server client (cookies)
│   ├── matchmaking.ts           # queue logic + ST_DWithin query
│   └── geo.ts                   # fuzzCoords(), haversine util
├── components/
│   ├── MapView.tsx              # react-leaflet wrapper (dynamic import, SSR disabled)
│   ├── ChallengeMarker.tsx      # marker popup with Accept button
│   ├── MatchCard.tsx
│   ├── LeaderboardTable.tsx
│   └── CrewInviteModal.tsx
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        └── 002_enable_postgis.sql  # CREATE EXTENSION postgis; add location columns
```

---

## Verification / Testing Plan

1. Age gate: unauthenticated visitor hits `/` → redirected to age-gate splash before any app content is shown.
2. Registration — underage: submit DOB that yields age < 18 → server returns 403, form shows error, no account created.
3. Registration — valid: submit DOB ≥ 18 → account created, redirected to profile setup.
4. Auth: login → logout → protected route redirects correctly.
5. Crew: create crew → share invite code → second user joins → both appear in roster.
6. Solo matchmaking: open two browser tabs as different users, same city/game → both get redirected to match lobby within 10 s.
7. Crew battle: challenge sent → opponent crew accepts → status flips to active.
8. Result: winner submits result → `wins` counter on profile increments → leaderboard reorders.
9. RLS audit: log in as User A, attempt `SELECT * FROM matches` via Supabase client → only A's matches returned.
10. Map: open map page → browser prompts for location → markers appear for nearby open challenges within 10 km.
11. Fuzzing: verify stored `location` coords differ from raw GPS by no more than ~200 m and land on 0.002° grid.
12. Proximity matchmaking: two test users 3 km apart, same game type → matched; two users 20 km apart → not matched.

---

## Risks & Implementation Notes

- **Age verification**: Required — DOB field on registration, server-side rejects age < 18. `birth_date` stored in `users` table, hidden from other users via RLS. Full-page age-gate splash shown to unauthenticated visitors.
- **react-leaflet SSR**: Leaflet accesses `window` directly — `MapView.tsx` must use `next/dynamic` with `{ ssr: false }`, otherwise Next.js crashes during server rendering.
- **Geolocation denied**: Graceful fallback to city-string matching so the app still works for users who refuse the permission prompt.
- **Matchmaking race condition**: Use `FOR UPDATE SKIP LOCKED` in the proximity query to prevent two concurrent requests from matching the same pair of users twice.
- **Abuse / fake results**: Trust-based result submission is fine for MVP.
- **Supabase free tier**: 500 MB DB, 2 GB bandwidth — more than sufficient for a student project.
