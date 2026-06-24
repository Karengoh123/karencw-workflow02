"use client";

import Link from "next/link";
import { deleteRenewal, markAsBilled } from "@/app/actions";

type RecordActionsProps = {
  id: string;
  companyName: string;
  isBilled: boolean;
};

export function RecordActions({ id, companyName, isBilled }: RecordActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link className="button-small" href={`/?edit=${id}`}>
        Edit
      </Link>
      <form
        action={markAsBilled}
        onSubmit={(event) => {
          if (!window.confirm(`Mark ${companyName} as billed?`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="company_name" value={companyName} />
        <button className="button-small" disabled={isBilled} type="submit">
          Mark Billed
        </button>
      </form>
      <form
        action={deleteRenewal}
        onSubmit={(event) => {
          if (!window.confirm(`Delete ${companyName}? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="company_name" value={companyName} />
        <button className="button-danger" type="submit">
          Delete
        </button>
      </form>
    </div>
  );
}

