"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBillingMe } from "@/lib/api";

type BillingInfo = Awaited<ReturnType<typeof getBillingMe>>;

export default function QuotaBadge() {
  const [info, setInfo] = useState<BillingInfo | null>(null);

  useEffect(() => {
    getBillingMe()
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  if (!info) return null;

  if (info.plan === "pro") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-600" />
        Pro · Unlimited ads
      </div>
    );
  }

  const atLimit = info.ads_used >= info.free_limit;
  const styles = atLimit
    ? "border-amber-300 bg-amber-50 text-amber-800"
    : "border-slate-200 bg-white text-slate-700";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${styles}`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            atLimit ? "bg-amber-500" : "bg-slate-400"
          }`}
        />
        {info.ads_used} of {info.free_limit} free ads used
      </div>
      {atLimit && (
        <Link
          href="/pricing"
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
        >
          Upgrade to Pro →
        </Link>
      )}
    </div>
  );
}
