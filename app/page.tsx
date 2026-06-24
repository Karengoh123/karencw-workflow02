import Link from "next/link";
import { addRenewal, deleteRenewal, editRenewal, markAsBilled } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import {
  computeStatus,
  daysUntil,
  money,
  statusLabel,
  urgencyScore,
  type RenewalRecord,
  type RenewalStatus,
} from "@/lib/renewals";

const statusStyles: Record<RenewalStatus, string> = {
  active: "bg-slate-100 text-slate-700 ring-slate-200",
  due_2m: "bg-amber-100 text-amber-800 ring-amber-200",
  due_1m: "bg-red-100 text-red-700 ring-red-200",
  billed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const filters = [
  { label: "All", value: "all" },
  { label: "Due Soon", value: "due" },
  { label: "Billed", value: "billed" },
];

type SearchParams = Promise<{ filter?: string; edit?: string }>;

async function getRenewals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("renewal_records")
    .select("*")
    .order("next_renewal_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RenewalRecord[];
}

function visibleRecords(records: RenewalRecord[], filter: string) {
  return records
    .map((record) => ({ ...record, computed_status: computeStatus(record) }))
    .filter((record) => {
      if (filter === "due") {
        return record.computed_status === "due_1m" || record.computed_status === "due_2m";
      }
      if (filter === "billed") {
        return record.computed_status === "billed";
      }
      return true;
    })
    .sort((a, b) => urgencyScore(b.next_renewal_date) - urgencyScore(a.next_renewal_date));
}

function RenewalForm({ record }: { record?: RenewalRecord }) {
  const action = record ? editRenewal : addRenewal;

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}
      {record ? <input type="hidden" name="billed_at" value={record.billed_at ?? ""} /> : null}
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Company
        <input name="company_name" defaultValue={record?.company_name} required className="input" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Contact
        <input name="contact_name" defaultValue={record?.contact_name} required className="input" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Email
        <input name="contact_email" type="email" defaultValue={record?.contact_email} required className="input" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Renewal Date
        <input
          name="next_renewal_date"
          type="date"
          defaultValue={record?.next_renewal_date}
          required
          className="input"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Amount
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={record?.amount}
          required
          className="input"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Notes
        <input name="notes" defaultValue={record?.notes ?? ""} className="input" />
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button className="button-primary" type="submit">
          {record ? "Save Renewal" : "Add Renewal"}
        </button>
        {record ? (
          <Link className="button-secondary" href="/">
            Cancel Edit
          </Link>
        ) : null}
      </div>
    </form>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const renewals = await getRenewals();
  const records = visibleRecords(renewals, filter);
  const editRecord = renewals.find((record) => record.id === params.edit);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Careware</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Maintenance Renewal Tracker</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Shared Renewal and Accounts workspace for upcoming maintenance renewals, billing status, and reminder logs.
            </p>
          </div>
          <nav className="flex items-center gap-2">
            <Link className="button-secondary" href="/">
              Dashboard
            </Link>
            <Link className="button-secondary" href="/logs">
              Reminder Log
            </Link>
          </nav>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="metric">
            <span>Total Records</span>
            <strong>{renewals.length}</strong>
          </div>
          <div className="metric">
            <span>Due in 2 Months</span>
            <strong>{renewals.filter((record) => computeStatus(record) === "due_2m").length}</strong>
          </div>
          <div className="metric">
            <span>Due in 1 Month</span>
            <strong>{renewals.filter((record) => computeStatus(record) === "due_1m").length}</strong>
          </div>
          <div className="metric">
            <span>Billed</span>
            <strong>{renewals.filter((record) => computeStatus(record) === "billed").length}</strong>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">{editRecord ? "Edit Renewal" : "Add Renewal"}</h2>
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              {filters.map((item) => (
                <Link
                  key={item.value}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    filter === item.value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                  href={item.value === "all" ? "/" : `/?filter=${item.value}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <RenewalForm record={editRecord} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {records.length === 0 ? (
            <div className="p-10 text-center text-slate-600">No renewal records yet. Add one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Renewal</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Reminder</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => {
                    const status = computeStatus(record);
                    const days = daysUntil(record.next_renewal_date);
                    const lastReminder = record.reminder_1m_sent
                      ? "1-month sent"
                      : record.reminder_2m_sent
                        ? "2-month sent"
                        : "Not sent";

                    return (
                      <tr key={record.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-950">{record.company_name}</div>
                          {Number(record.amount) >= 10000 ? (
                            <div className="mt-1 text-xs font-medium text-cyan-700">High value</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <div>{record.contact_name}</div>
                          <a className="text-cyan-700" href={`mailto:${record.contact_email}`}>
                            {record.contact_email}
                          </a>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <div>{record.next_renewal_date}</div>
                          <div className="text-xs">{days >= 0 ? `${days} days left` : `${Math.abs(days)} days overdue`}</div>
                        </td>
                        <td className="px-4 py-4 font-medium">{money(record.amount)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}>
                            {statusLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{lastReminder}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link className="button-small" href={`/?edit=${record.id}`}>
                              Edit
                            </Link>
                            <form action={markAsBilled}>
                              <input type="hidden" name="id" value={record.id} />
                              <input type="hidden" name="company_name" value={record.company_name} />
                              <button className="button-small" disabled={status === "billed"} type="submit">
                                Mark Billed
                              </button>
                            </form>
                            <form action={deleteRenewal}>
                              <input type="hidden" name="id" value={record.id} />
                              <input type="hidden" name="company_name" value={record.company_name} />
                              <button className="button-danger" type="submit">
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

