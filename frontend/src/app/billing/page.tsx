"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getBillingMe,
  createCheckoutSession,
  createPortalSession,
} from "@/lib/api";

type BillingInfo = Awaited<ReturnType<typeof getBillingMe>>;

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 20_000;

export default function BillingPage() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "1";

  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [webhookTimedOut, setWebhookTimedOut] = useState(false);
  const pollStartRef = useRef<number | null>(null);

  // Initial load + optional poll after successful checkout.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const data = await getBillingMe();
        if (cancelled) return;
        setInfo(data);
        setLoadError("");

        if (upgraded && data.plan !== "pro") {
          if (pollStartRef.current === null) pollStartRef.current = Date.now();
          if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
            setWaitingForWebhook(false);
            setWebhookTimedOut(true);
            return;
          }
          setWaitingForWebhook(true);
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        } else {
          setWaitingForWebhook(false);
        }
      } catch {
        if (!cancelled) setLoadError("Could not load billing info.");
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [upgraded]);

  async function handleUpgrade() {
    setActionError("");
    setWorking(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setActionError("Could not start checkout. Please try again.");
      setWorking(false);
    }
  }

  async function handleManage() {
    setActionError("");
    setWorking(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch {
      setActionError("Could not open billing portal. Please try again.");
      setWorking(false);
    }
  }

  if (!info && !loadError) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  const isPro = info!.plan === "pro";
  const periodEnd = info!.current_period_end
    ? new Date(info!.current_period_end)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Billing
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Manage your RunAds subscription.
        </p>
      </div>

      {upgraded && isPro && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          You&apos;re on Pro. Welcome aboard — enjoy unlimited ads.
        </div>
      )}

      {waitingForWebhook && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Finalizing your upgrade — this usually takes a few seconds.
        </div>
      )}

      {webhookTimedOut && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Stripe hasn&apos;t confirmed your payment yet. Refresh in a minute — if
          you were charged, your account will be upgraded shortly.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current plan
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {isPro ? "Pro" : "Free trial"}
            </p>
          </div>
          {isPro ? (
            <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Pro
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
              Free
            </span>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {isPro ? (
            <>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {info!.subscription_status || "active"}
                </dd>
              </div>
              {periodEnd && (
                <div>
                  <dt className="text-slate-500">Renews on</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {periodEnd.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <dt className="text-slate-500">Ads used</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {info!.ads_used} of {info!.free_limit}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Price</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  $0 / lifetime
                </dd>
              </div>
            </>
          )}
        </dl>

        <div className="mt-6 border-t border-slate-100 pt-6">
          {isPro ? (
            <button
              type="button"
              onClick={handleManage}
              disabled={working}
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
            >
              {working ? "Opening Stripe..." : "Manage subscription"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={working}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {working ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Opening checkout...
                </>
              ) : (
                <>
                  Upgrade to Pro — $49/month
                  <span>→</span>
                </>
              )}
            </button>
          )}
          {actionError && (
            <p className="mt-3 text-center text-sm text-red-600">
              {actionError}
            </p>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
