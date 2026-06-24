@AGENTS.md

# Prost — Project Context

Beer drinking game battle app. Mobile-first Next.js 16 + Supabase + Tailwind v4.

## Dev server
```bash
npm run dev   # runs on localhost:3000
```

## Stack decisions (don't change without asking)
- Auth redirects use `window.location.href`, not `router.push` — session cookie propagation
- react-leaflet map must be dynamically imported with `{ ssr: false }`
- Supabase joined relations need `as unknown as Type` cast in TypeScript
- All mutations go through server actions in `src/app/actions/`
- Leaflet icons at `public/leaflet/*.png` — do not use CDN URLs

## Supabase gotcha
Free tier project sleeps after 7 days. If server-side fetch times out ("fetch failed"), the project is asleep — open the Supabase dashboard to wake it. Not a code bug.

## All migrations already run (001–005)
Migration 005 is critical: trigger on auth.users that creates public.users row with id, username, birth_date (all three required — birth_date is NOT NULL).

## Git workflow
Always push to GitHub after every fix, bug, or feature — no exceptions. Commit first, then `git push` before reporting done.

## Deployment
GitHub: https://github.com/felixx-dbm/connect_over_trinkspiele.git
Vercel plugin installed. Deploy via `vercel` CLI or vercel.com browser UI.
Env vars needed on Vercel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
