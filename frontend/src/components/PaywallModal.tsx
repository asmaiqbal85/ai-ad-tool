"use client";

import { useState } from "react";
import Link from "next/link";
import { createCheckoutSession } from "@/lib/api";

interface PaywallModalProps {
  open: boolean;
  used: number;
  limit: number;
  onClose?: () => void;
}

export default function PaywallModal({
  open,
  used,
  limit,
  onClose,
}: PaywallModalProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleUpgrade() {
    setError("");
    setUpgrading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setError("Could not start checkout. Please try again.");
      setUpgrading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-8 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Free plan limit reached
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            You&apos;ve used {used} of {limit} free ads
          </h2>
          <p className="mt-2 text-sm text-white/90">
            Upgrade to Pro for unlimited AI ads.
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-slate-900">RunAds Pro</span>
              <span>
                <span className="text-2xl font-bold text-slate-900">$49</span>
                <span className="text-sm text-slate-500"> / month</span>
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">
                  ✓
                </span>
                Unlimited AI video ads
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">
                  ✓
                </span>
                Priority rendering
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">
                  ✓
                </span>
                Cancel anytime
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={upgrading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {upgrading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Opening checkout...
              </>
            ) : (
              <>
                Upgrade to Pro
                <span>→</span>
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-red-600">{error}</p>
          )}

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-3 block w-full text-center text-sm text-slate-500 hover:text-slate-700"
            >
              Maybe later
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="mt-3 block text-center text-sm text-slate-500 hover:text-slate-700"
            >
              ← Back to dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
