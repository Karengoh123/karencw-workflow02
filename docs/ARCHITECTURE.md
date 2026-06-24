# Architecture

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend/DB**: Supabase (Postgres + Edge Functions)
- **Email**: Supabase Edge Function → Resend API
- **Scheduler**: Supabase pg_cron (daily job) or Edge Function cron
- **Hosting**: Vercel

## Now vs Later
**Now**: renewal record CRUD, status dashboard, cron-triggered reminder emails, mark-as-billed action, reminder log.
**Later**: per-user auth & RLS lock-down, role-based access (Renewal vs Accounts), in-app notifications, bulk import from CSV.

## Key User Action — Step by Step
1. Team member fills "Add Renewal" form → POST to Supabase `renewal_records`
2. Record saved with `status = active`, `reminder_2m_sent = false`, `reminder_1m_sent = false`
3. Daily cron queries records where `next_renewal_date - today <= 60 days` and `reminder_2m_sent = false` → fires email → inserts row in `reminder_logs` → sets flag
4. Same cron checks 30-day window → sends billing reminder
5. Accounts team clicks **Mark as Billed** → sets `status = billed`, `billed_at = now()`, logs to `reminder_logs`
6. Dashboard re-fetches; all team members see updated status badge

## Layer Plan
1. **Data first** — tables, seed rows, RLS open policies
2. **App logic** — CRUD UI, status computation, cron emails
3. **Smart features** — renewal risk scoring, draft email previews (later)