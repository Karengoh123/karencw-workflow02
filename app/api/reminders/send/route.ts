import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type RenewalRecord = {
  id: string;
  company_name: string;
  next_renewal_date: string;
  reminder_2m_sent: boolean;
  reminder_1m_sent: boolean;
};

const ACCOUNT_EMAIL = "account@careware.com.my";

function daysUntil(dateText: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewalDate = new Date(`${dateText}T00:00:00`);
  return Math.ceil((renewalDate.getTime() - today.getTime()) / 86_400_000);
}

function reminderFor(record: RenewalRecord) {
  const days = daysUntil(record.next_renewal_date);

  if (days <= 30 && !record.reminder_1m_sent) {
    return {
      type: "1_month",
      flag: "reminder_1m_sent",
      subject: `Billing Prompt (1 Month): ${record.company_name}`,
      body: `Please initiate billing for ${record.company_name}. Their maintenance renewal is due on ${record.next_renewal_date}.`,
    };
  }

  if (days <= 60 && days > 30 && !record.reminder_2m_sent) {
    return {
      type: "2_month",
      flag: "reminder_2m_sent",
      subject: `Renewal Reminder (2 Months): ${record.company_name}`,
      body: `Please prepare the client notification for ${record.company_name}. Their maintenance renewal is due on ${record.next_renewal_date}.`,
    };
  }

  return null;
}

async function sendEmail(subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "Careware Renewals <renewals@careware.com.my>",
      to: ACCOUNT_EMAIL,
      subject,
      text: body,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("renewal_records")
    .select("*")
    .is("billed_at", null)
    .order("next_renewal_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: Array<{ id: string; company_name: string; reminder_type: string }> = [];

  for (const record of (data ?? []) as RenewalRecord[]) {
    const reminder = reminderFor(record);
    if (!reminder) {
      continue;
    }

    await sendEmail(reminder.subject, reminder.body);

    const { error: logError } = await supabase.from("reminder_logs").insert({
      renewal_record_id: record.id,
      reminder_type: reminder.type,
      recipient_email: ACCOUNT_EMAIL,
      email_subject: reminder.subject,
      email_body: reminder.body,
      triggered_by: "cron",
    });

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("renewal_records")
      .update({ [reminder.flag]: true })
      .eq("id", record.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    sent.push({ id: record.id, company_name: record.company_name, reminder_type: reminder.type });
  }

  return NextResponse.json({ sent });
}

