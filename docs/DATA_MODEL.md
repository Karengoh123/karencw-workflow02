# Data Model

## renewal_records
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid NULL | owner (nullable until auth sprint) |
| company_name | text NOT NULL | |
| contact_name | text NOT NULL | |
| contact_email | text NOT NULL | |
| next_renewal_date | date NOT NULL | |
| amount | numeric(12,2) NOT NULL | |
| status | text | 'active' \| 'due_2m' \| 'due_1m' \| 'billed' |
| reminder_2m_sent | bool default false | |
| reminder_1m_sent | bool default false | |
| billed_at | timestamptz NULL | |
| notes | text NULL | |
| created_at | timestamptz default now() | |

## reminder_logs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NULL | |
| renewal_record_id | uuid FK → renewal_records.id | |
| reminder_type | text | '2_month' \| '1_month' \| 'billed' |
| sent_at | timestamptz default now() | |
| recipient_email | text | account@careware.com.my |
| email_subject | text | |
| email_body | text | |
| triggered_by | text | 'cron' \| 'manual' |
| created_at | timestamptz default now() | |

## RLS
- All tables: RLS enabled, v1 permissive policies (select/all using true) — replaced with `auth.uid() = user_id` at lock-down sprint.

## Relationships
- `reminder_logs.renewal_record_id` → `renewal_records.id` (cascade delete)