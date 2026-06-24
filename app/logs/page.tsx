import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ReminderLog } from "@/lib/renewals";

async function getLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminder_logs")
    .select("*, renewal_records(company_name)")
    .order("sent_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReminderLog[];
}

export default async function LogsPage() {
  const logs = await getLogs();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Careware</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reminder Log</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Audit trail for reminders, billing actions, and renewal record changes.
            </p>
          </div>
          <Link className="button-secondary" href="/">
            Back to Dashboard
          </Link>
        </header>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-slate-600">No reminders sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Triggered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="px-4 py-4 text-slate-600">{new Date(log.sent_at).toLocaleString("en-MY")}</td>
                      <td className="px-4 py-4 font-medium">{log.renewal_records?.company_name ?? "Deleted record"}</td>
                      <td className="px-4 py-4">{log.reminder_type.replace("_", " ")}</td>
                      <td className="px-4 py-4 text-slate-600">{log.recipient_email}</td>
                      <td className="px-4 py-4 text-slate-600">{log.email_subject ?? "-"}</td>
                      <td className="px-4 py-4 text-slate-600">{log.triggered_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

