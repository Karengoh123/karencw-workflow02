# Intelligence Layer

## v1 — Rule-Based (No AI Required)
The core runs entirely on deterministic rules; AI is additive only.

### Status Computation (rule-based, runs daily)
```
days_to_renewal = next_renewal_date - today
if billed_at IS NOT NULL        → status = 'billed'
else if days_to_renewal <= 30   → status = 'due_1m'
else if days_to_renewal <= 60   → status = 'due_2m'
else                            → status = 'active'
```

### Events Tracked
- Record created / edited / deleted
- Reminder email sent (type, recipient, timestamp)
- Record marked as billed

### Scoring (v1 rule-based)
- Urgency score = 100 − days_to_renewal (capped 0–100); used to sort dashboard
- High-value flag = amount >= 10,000

## Later — AI-Assisted Fields
If AI generates content (e.g. draft reminder email body), store:
```json
{
  "value": "Dear Accounts, renewal for Acme Corp is due 30 days...",
  "source": "gpt-4o",
  "confidence": 0.91,
  "review_status": "unreviewed"
}
```
Human reviews draft before sending. App works without this layer.