"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeStatus, type RenewalRecord } from "@/lib/renewals";

const ACCOUNT_EMAIL = "account@careware.com.my";

function requiredText(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim();
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
}

function recordFromForm(formData: FormData) {
  const next_renewal_date = requiredText(formData, "next_renewal_date");
  const billed_at = formData.get("billed_at")?.toString() || null;

  return {
    company_name: requiredText(formData, "company_name"),
    contact_name: requiredText(formData, "contact_name"),
    contact_email: requiredText(formData, "contact_email"),
    next_renewal_date,
    amount: Number(requiredText(formData, "amount")),
    notes: formData.get("notes")?.toString().trim() || null,
    status: computeStatus({ next_renewal_date, billed_at }),
  };
}

async function writeLog(
  renewalRecordId: string | null,
  reminderType: "created" | "edited" | "deleted" | "billed",
  subject: string,
  body: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("reminder_logs").insert({
    renewal_record_id: renewalRecordId,
    reminder_type: reminderType,
    recipient_email: ACCOUNT_EMAIL,
    email_subject: subject,
    email_body: body,
    triggered_by: "manual",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function addRenewal(formData: FormData) {
  const supabase = await createClient();
  const payload = recordFromForm(formData);

  const { data, error } = await supabase
    .from("renewal_records")
    .insert(payload)
    .select("id, company_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await writeLog(
    data.id,
    "created",
    `Renewal record created: ${data.company_name}`,
    `${data.company_name} was added to the renewal tracker.`,
  );

  revalidatePath("/");
  revalidatePath("/logs");
}

export async function editRenewal(formData: FormData) {
  const supabase = await createClient();
  const id = requiredText(formData, "id");
  const payload = recordFromForm(formData);

  const { data, error } = await supabase
    .from("renewal_records")
    .update(payload)
    .eq("id", id)
    .select("company_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await writeLog(
    id,
    "edited",
    `Renewal record edited: ${data.company_name}`,
    `${data.company_name} was updated in the renewal tracker.`,
  );

  revalidatePath("/");
  revalidatePath("/logs");
}

export async function deleteRenewal(formData: FormData) {
  const supabase = await createClient();
  const id = requiredText(formData, "id");
  const companyName = requiredText(formData, "company_name");

  const { error } = await supabase.from("renewal_records").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await writeLog(
    null,
    "deleted",
    `Renewal record deleted: ${companyName}`,
    `${companyName} was deleted from the renewal tracker.`,
  );

  revalidatePath("/");
  revalidatePath("/logs");
}

export async function markAsBilled(formData: FormData) {
  const supabase = await createClient();
  const id = requiredText(formData, "id");
  const companyName = requiredText(formData, "company_name");

  const { data: existing, error: existingError } = await supabase
    .from("renewal_records")
    .select("billed_at")
    .eq("id", id)
    .single<Pick<RenewalRecord, "billed_at">>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing.billed_at) {
    return;
  }

  const { error } = await supabase
    .from("renewal_records")
    .update({ status: "billed", billed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await writeLog(
    id,
    "billed",
    `Marked as Billed: ${companyName}`,
    `${companyName} was marked as billed by the Accounts team.`,
  );

  revalidatePath("/");
  revalidatePath("/logs");
}

