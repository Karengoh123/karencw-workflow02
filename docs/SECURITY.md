# Security

## Secret Handling
- Resend API key stored in Supabase Edge Function environment variables only — never in frontend code or client bundle
- Supabase service-role key used only inside Edge Functions, never exposed to browser
- All env vars prefixed `SUPABASE_` or `RESEND_` live in Vercel/Supabase dashboards, not in repo

## Permission Model (v1 → lock-down)
- **v1**: RLS permissive (demo-first) — all team members can read/write; no login wall
- **Lock-down sprint**: `auth.uid() = user_id` row-level policies; Renewal and Accounts roles defined; only record owner or admin can delete
- Agent (cron) uses a scoped service role with only INSERT on reminder_logs and UPDATE on renewal_records — no DELETE, no auth.users access

## Approved Tools Rule
- Only `send_reminder_email`, `mark_as_billed`, and `compute_status` are callable from app logic
- No `run_any`, `eval`, or raw SQL execution from frontend
- Every tool call writes to `reminder_logs` (who, what, when, result)

## Audit Principle
Every state-changing action (send email, mark billed, create/edit/delete record) produces a `reminder_logs` row or console log with timestamp and trigger source. Nothing silently mutates.