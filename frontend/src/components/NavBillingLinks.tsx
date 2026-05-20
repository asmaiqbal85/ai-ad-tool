"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBillingMe } from "@/lib/api";

type BillingInfo = Awaited<ReturnType<typeof getBillingMe>>;

export default function NavBillingLinks() {
  const [info, setInfo] = useState<BillingInfo | null>(null);

  useEffect(() => {
    getBillingMe()
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  return (
    <>
      <Link
        href="/billing"
        className="text-slate-600 hover:text-slate-900"
      >
        Billing
      </Link>
      {info?.plan === "pro" ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
          Pro
        </span>
      ) : info ? (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:-translate-y-0.5"
        >
          Upgrade
        </Link>
      ) : null}
    </>
  );
}
