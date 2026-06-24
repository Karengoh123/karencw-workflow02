# Test Plan

## v1 Success Scenario (manual)
1. Open `/` — confirm 4 seed records load with correct status badges
2. Click **Add Renewal** — fill all fields, submit → record appears in table immediately
3. Edit that record — change amount → verify change persists on refresh
4. Change renewal date to today+58 days → status badge shows **Due in 2 months** (amber)
5. Change renewal date to today+28 days → status badge shows **Due in 1 month** (red)
6. Click **Mark as Billed** → confirm dialog → record status changes to **Billed** (green), `billed_at` populated
7. Open `/logs` → confirm billed action appears as a log entry
8. Trigger cron manually (or simulate) for a 60-day record → email received at account@careware.com.my → log entry created, `reminder_2m_sent = true`
9. Repeat for 30-day record → billing reminder email received → `reminder_1m_sent = true`

## Empty State
- Delete all records → dashboard shows "No renewal records yet. Add one to get started."
- `/logs` with no log entries → shows "No reminders sent yet."

## Error Cases
- Submit Add form with missing required field → inline validation error, no DB write
- Cron fires but Resend API key invalid → Edge Function logs error, no partial record mutation, reminder flags stay false
- Mark as Billed on already-billed record → button disabled, no duplicate log entry

## Regression
- After any edit, refresh page and confirm values match DB (no stale cache)
- Status badge recomputed correctly after renewal date change