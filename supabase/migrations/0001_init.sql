create extension if not exists pgcrypto;

create table if not exists renewal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  next_renewal_date date not null,
  amount numeric(12,2) not null,
  status text not null default 'active' check (status in ('active', 'due_2m', 'due_1m', 'billed')),
  reminder_2m_sent boolean not null default false,
  reminder_1m_sent boolean not null default false,
  billed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table renewal_records enable row level security;

drop policy if exists "renewal_records_v1_read" on renewal_records;
create policy "renewal_records_v1_read" on renewal_records for select using (true);
drop policy if exists "renewal_records_v1_write" on renewal_records;
create policy "renewal_records_v1_write" on renewal_records for all using (true) with check (true);

create table if not exists reminder_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  renewal_record_id uuid references renewal_records(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('2_month', '1_month', 'billed', 'created', 'edited', 'deleted')),
  sent_at timestamptz not null default now(),
  recipient_email text not null default 'account@careware.com.my',
  email_subject text,
  email_body text,
  triggered_by text not null default 'cron',
  created_at timestamptz not null default now()
);

alter table reminder_logs enable row level security;

drop policy if exists "reminder_logs_v1_read" on reminder_logs;
create policy "reminder_logs_v1_read" on reminder_logs for select using (true);
drop policy if exists "reminder_logs_v1_write" on reminder_logs;
create policy "reminder_logs_v1_write" on reminder_logs for all using (true) with check (true);

insert into renewal_records (id, company_name, contact_name, contact_email, next_renewal_date, amount, status, reminder_2m_sent, reminder_1m_sent)
values
  (gen_random_uuid(), 'Acme Manufacturing Sdn Bhd', 'Lim Wei Jian', 'weijian@acmemfg.com.my', (current_date + interval '65 days')::date, 12500.00, 'active', false, false),
  (gen_random_uuid(), 'Pinnacle Logistics Sdn Bhd', 'Nurul Hana Binti Aziz', 'nurul.hana@pinnlog.com', (current_date + interval '32 days')::date, 8800.00, 'due_2m', true, false),
  (gen_random_uuid(), 'Silverstone Retail Group', 'David Tan Kah Wai', 'davidtan@silverstone.com.my', (current_date + interval '55 days')::date, 15000.00, 'due_2m', false, false),
  (gen_random_uuid(), 'Greenfield Properties Bhd', 'Siti Rohani Ibrahim', 'srohani@greenfield.com.my', (current_date - interval '10 days')::date, 6200.00, 'billed', true, true);

update renewal_records set billed_at = now() - interval '5 days' where company_name = 'Greenfield Properties Bhd';

insert into reminder_logs (renewal_record_id, reminder_type, sent_at, recipient_email, email_subject, triggered_by)
select id, '2_month', now() - interval '25 days', 'account@careware.com.my',
  'Renewal Reminder (2 Months): ' || company_name, 'cron'
from renewal_records where company_name = 'Pinnacle Logistics Sdn Bhd';

insert into reminder_logs (renewal_record_id, reminder_type, sent_at, recipient_email, email_subject, triggered_by)
select id, '1_month', now() - interval '5 days', 'account@careware.com.my',
  'Billing Prompt (1 Month): ' || company_name, 'cron'
from renewal_records where company_name = 'Greenfield Properties Bhd';

insert into reminder_logs (renewal_record_id, reminder_type, sent_at, recipient_email, email_subject, triggered_by)
select id, 'billed', now() - interval '4 days', 'account@careware.com.my',
  'Marked as Billed: ' || company_name, 'manual'
from renewal_records where company_name = 'Greenfield Properties Bhd';
