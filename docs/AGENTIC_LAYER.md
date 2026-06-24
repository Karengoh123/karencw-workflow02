# Agentic Layer

## Risk Classification & Actions

### Low — Auto (no approval)
- Compute `status` badge from renewal date (rule)
- Compute urgency score for dashboard sort
- Insert `reminder_log` row after email sends

### Medium — Light Approval (team confirms)
- Draft reminder email content for review before cron sends
- Bulk-update status after CSV import

### High — Always Approval ⚠️
- **Send reminder email** to account@careware.com.my (2-month trigger)
- **Send billing prompt email** to account@careware.com.my (1-month trigger)
- Flow: Draft → Preview in UI → Confirm → Send → Audit log entry

### Critical — Human Only 🚫
- Delete a renewal record
- Bulk delete / data wipe

## Named Tools (approved)
- `send_reminder_email(record_id, type)` — Resend API call, logs to reminder_logs
- `mark_as_billed(record_id)` — sets status + billed_at, logs action
- `compute_status(record_id)` — reads date, writes status field

## Audit Log Fields (reminder_logs)
`id, renewal_record_id, reminder_type, sent_at, recipient_email, email_subject, triggered_by, created_at`

## v1 vs Later
**v1**: cron auto-sends emails (high-risk, auto after admin review of cron config).
**Later**: in-app approve/reject queue before each send; AI-drafted email bodies with review_status gating.