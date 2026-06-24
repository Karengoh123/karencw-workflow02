# PRD — Careware Maintenance Renewal Tracker

## Problem
The Renewal and Accounts departments manage yearly maintenance renewals in spreadsheets and chat. Reminders are manual, billing triggers are missed, and there is no shared live view of what is due, pending, or billed.

## Target Users
- **Renewal team** — owns customer records, tracks upcoming renewals
- **Accounts team** — receives reminders, prepares notifications, marks billing done

## Core Objects
- **RenewalRecord** — one row per customer maintenance contract
- **ReminderLog** — audit trail of every email reminder sent

## MVP Checklist (v1 must-haves)
- [ ] Add / edit / delete renewal records (company, contact, email, renewal date, amount)
- [ ] Dashboard table: all records with status badges (Active, Due in 2 months, Due in 1 month, Billed)
- [ ] Automated email reminder to account@careware.com.my at 2 months before renewal ("prepare notification to client")
- [ ] Automated email reminder to account@careware.com.my at 1 month before renewal ("initiate billing")
- [ ] "Mark as Billed" button per record — updates status and logs action
- [ ] ReminderLog table visible to both teams
- [ ] Seed demo data so app is viewable without login

## Non-Goals (v1)
- Client-facing portal
- Automated invoice generation
- Per-user login / auth (deferred to lock-down sprint)
- Multi-tenant / SaaS

## Success Scenario
A Renewal team member adds a new customer with a renewal date 60 days out. The system auto-emails account@careware.com.my that day. 30 days later a second email fires. The Accounts team opens the dashboard, sees the record flagged, clicks **Mark as Billed**, and the record shows **Billed** instantly for everyone.