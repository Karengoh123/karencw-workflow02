export type RenewalStatus = "active" | "due_2m" | "due_1m" | "billed";

export type RenewalRecord = {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  next_renewal_date: string;
  amount: number | string;
  status: RenewalStatus;
  reminder_2m_sent: boolean;
  reminder_1m_sent: boolean;
  billed_at: string | null;
  notes: string | null;
  created_at: string;
};

export type ReminderLog = {
  id: string;
  renewal_record_id: string | null;
  reminder_type: "2_month" | "1_month" | "billed" | "created" | "edited" | "deleted";
  sent_at: string;
  recipient_email: string;
  email_subject: string | null;
  email_body: string | null;
  triggered_by: "cron" | "manual" | "system";
  created_at: string;
  renewal_records?: Pick<RenewalRecord, "company_name"> | null;
};

export function daysUntil(dateText: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewalDate = new Date(`${dateText}T00:00:00`);
  return Math.ceil((renewalDate.getTime() - today.getTime()) / 86_400_000);
}

export function computeStatus(record: Pick<RenewalRecord, "next_renewal_date" | "billed_at">): RenewalStatus {
  if (record.billed_at) {
    return "billed";
  }

  const days = daysUntil(record.next_renewal_date);

  if (days <= 30) {
    return "due_1m";
  }

  if (days <= 60) {
    return "due_2m";
  }

  return "active";
}

export function statusLabel(status: RenewalStatus) {
  return {
    active: "Active",
    due_2m: "Due in 2 months",
    due_1m: "Due in 1 month",
    billed: "Billed",
  }[status];
}

export function urgencyScore(dateText: string) {
  return Math.max(0, Math.min(100, 100 - daysUntil(dateText)));
}

export function money(value: number | string) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

