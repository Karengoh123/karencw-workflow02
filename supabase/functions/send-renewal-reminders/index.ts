import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type RenewalRecord = {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  next_renewal_date: string;
  amount: number;
  reminder_2m_sent: boolean;
  reminder_1m_sent: boolean;
  billed_at: string | null;
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

async function sendEmail(apiKey: string, subject: string, body: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") ?? "Careware Renewals <renewals@careware.com.my>",
      to: ACCOUNT_EMAIL,
      subject,
      text: body,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return Response.json({ error: "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("renewal_records")
    .select("*")
    .is("billed_at", null)
    .order("next_renewal_date", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const sent: Array<{ id: string; company_name: string; reminder_type: string }> = [];

  for (const record of (data ?? []) as RenewalRecord[]) {
    const reminder = reminderFor(record);
    if (!reminder) {
      continue;
    }

    await sendEmail(resendApiKey, reminder.subject, reminder.body);

    const { error: logError } = await supabase.from("reminder_logs").insert({
      renewal_record_id: record.id,
      reminder_type: reminder.type,
      recipient_email: ACCOUNT_EMAIL,
      email_subject: reminder.subject,
      email_body: reminder.body,
      triggered_by: "cron",
    });

    if (logError) {
      throw new Error(logError.message);
    }

    const { error: updateError } = await supabase
      .from("renewal_records")
      .update({ [reminder.flag]: true })
      .eq("id", record.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    sent.push({ id: record.id, company_name: record.company_name, reminder_type: reminder.type });
  }

  return Response.json({ sent });
});

