"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSession } from "@/lib/api";

const FREE_FEATURES = [
  "3 AI-generated video ads",
  "All voiceover voices (Alloy, Nova, Shimmer)",
  "Edit & re-render unlimited times",
  "MP4 download",
];

const PRO_FEATURES = [
  "Unlimited AI video ads",
  "Priority video rendering",
  "All voiceover voices",
  "Edit & re-render unlimited times",
  "MP4 download",
  "Cancel anytime",
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  async function handleUpgrade() {
    setError("");
    if (signedIn === false) {
      router.push("/auth/signup");
      return;
    }
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
    <div className="space-y-12">
      <div className="text-center">
        <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-700">
          Pricing
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
          Start free. Upgrade when you&apos;re ready to ship more ads.
        </p>
      </div>

      {canceled && (
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout canceled. No charge was made — pick a plan whenever you&apos;re
          ready.
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Free trial</h2>
          <p className="mt-1 text-sm text-slate-500">
            Try RunAds with no credit card.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">
              $0
            </span>
            <span className="text-sm text-slate-500">/ lifetime</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={signedIn ? "/dashboard" : "/auth/signup"}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {signedIn ? "Go to dashboard" : "Start free"}
          </Link>
        </div>

        {/* Pro */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-500 bg-white p-8 shadow-lg shadow-indigo-600/10">
          <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            Recommended
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Pro</h2>
          <p className="mt-1 text-sm text-slate-500">
            For businesses shipping ads weekly.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">
              $49
            </span>
            <span className="text-sm text-slate-500">/ month</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={upgrading || signedIn === null}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {upgrading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Opening checkout...
              </>
            ) : signedIn ? (
              <>
                Upgrade to Pro
                <span>→</span>
              </>
            ) : (
              <>
                Sign up & upgrade
                <span>→</span>
              </>
            )}
          </button>
          {error && (
            <p className="mt-3 text-center text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Prices in USD. Cancel anytime. Powered by Stripe.
      </p>
    </div>
  );
}
