# Tasks & Sprints

## Sprint 1 — Database & Core CRUD (Demo-First)
**Goal**: App renders with seed data, team can add/edit/delete renewal records without login.
- [ ] Create Supabase tables: `renewal_records`, `reminder_logs`
- [ ] Seed 4 realistic demo renewal records
- [ ] Enable RLS with v1 permissive policies
- [ ] Build `/` dashboard page — sortable table of all renewal records with status badges
- [ ] Build Add Renewal form (company, contact, email, renewal date, amount)
- [ ] Build Edit Renewal form
- [ ] Build Delete Renewal (confirm dialog, critical action)
- [ ] Status badge auto-computed from renewal date on load
- [ ] Empty state and loading state handled

**Definition of Done**: Dashboard loads with seed data, Add/Edit/Delete all persist to DB and reflect in UI.

---

## Sprint 2 — Mark as Billed + Reminder Log View ✅ v1 FUNCTIONAL
**Goal**: Core workflow runs end-to-end — the one action that matters works.
- [ ] "Mark as Billed" button per record → sets `status = billed`, `billed_at`, inserts reminder_log row
- [ ] Reminder Log page `/logs` — table of all reminder_log entries
- [ ] Dashboard filters: All / Due Soon / Billed
- [ ] Status badge colours: grey (active), amber (due_2m), red (due_1m), green (billed)
- [ ] Confirm the end-to-end scenario from PRD manually

**Definition of Done**: Mark as Billed persists, status updates live, log entry visible on /logs. ← **v1 FUNCTIONAL milestone**

---

## Sprint 3 — Automated Email Reminders
**Goal**: Cron fires real emails at 2-month and 1-month triggers.
- [ ] Supabase Edge Function `send-renewal-reminders` (daily cron)
- [ ] Query records where reminder not sent and within window
- [ ] Call Resend API, send to account@careware.com.my
- [ ] Insert row in `reminder_logs` with email subject + body
- [ ] Set `reminder_2m_sent` / `reminder_1m_sent` flags
- [ ] Show last reminder sent date on dashboard row
- [ ] Test with a record dated 60 days and 30 days out

**Definition of Done**: Cron runs, emails land in account@careware.com.my inbox, logs appear in /logs.

---

## Sprint 4 — Lock It Down (Auth & RLS)
**Goal**: Require login, isolate data per user, harden permissions.
- [ ] Enable Supabase Auth (email/password)
- [ ] Login / signup pages
- [ ] Replace permissive RLS with `auth.uid() = user_id` owner policies
- [ ] Assign `user_id` on record creation
- [ ] Role flags: renewal_team / accounts_team
- [ ] Only logged-in users can write; read open to team members
- [ ] Redirect unauthenticated users to /login

**Definition of Done**: Anonymous visitors see login page; authenticated team members see only their data; RLS blocks cross-user reads.

---

## Gantt (sprint → feature)
```
Sprint 1: DB schema, seed data, dashboard table, Add/Edit/Delete forms
Sprint 2: Mark as Billed, Reminder Log page, status filters  ← v1 functional
Sprint 3: Edge Function cron, Resend emails, email log entries
Sprint 4: Auth, RLS lock-down, role model
```