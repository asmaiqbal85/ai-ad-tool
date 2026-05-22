"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { scrapeUrl, generateAd, pollAdUntilFinal, getBillingMe } from "@/lib/api";
import VoicePicker, { type Voice } from "@/components/VoicePicker";
import PaywallModal from "@/components/PaywallModal";

const STEPS = [
  "Scraping website...",
  "Generating ad copy...",
  "Creating your video...",
];

export default function NewAdPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [voice, setVoice] = useState<Voice>("alloy");
  const [step, setStep] = useState(0); // 0 idle, 1-3 active step
  const [error, setError] = useState("");
  const [paywall, setPaywall] = useState<{
    open: boolean;
    used: number;
    limit: number;
  }>({ open: false, used: 0, limit: 3 });

  const loading = step > 0;

  useEffect(() => {
    getBillingMe()
      .then((info) => {
        if (info.plan === "free" && info.ads_used >= info.free_limit) {
          setPaywall({
            open: true,
            used: info.ads_used,
            limit: info.free_limit,
          });
        }
      })
      .catch(() => {
        // ignore — backend will still gate at submit time
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setStep(1);
      const scraped = await scrapeUrl(url);

      setStep(2);
      const { id } = await generateAd({ ...scraped, url, voice });

      setStep(3);
      await pollAdUntilFinal(id);

      router.push(`/ads/${id}/edit`);
    } catch (e) {
      // Defensive: if quota was exhausted between mount and submit
      // (multi-tab race), surface the paywall instead of a generic error.
      const info = await getBillingMe().catch(() => null);
      if (info && info.plan === "free" && info.ads_used >= info.free_limit) {
        setPaywall({
          open: true,
          used: info.ads_used,
          limit: info.free_limit,
        });
        setStep(0);
        return;
      }
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg.startsWith("AI generation failed") ||
          msg.startsWith("Voiceover generation failed") ||
          msg.startsWith("Video rendering failed") ||
          msg.startsWith("Failed to save ad")
          ? msg
          : "Failed to generate ad. Check the URL and try again."
      );
      setStep(0);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PaywallModal
        open={paywall.open}
        used={paywall.used}
        limit={paywall.limit}
      />
      {/* Header */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-block text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to ads
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Create a new ad
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Paste any product URL — we&apos;ll handle the rest.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {!loading ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="url"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Product or page URL
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🌐
                </span>
                <input
                  id="url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/product"
                  className="w-full rounded-xl border border-slate-300 bg-white py-4 pl-12 pr-4 text-lg text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <VoicePicker value={voice} onChange={setVoice} />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 sm:w-auto"
            >
              Generate Ad
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </form>
        ) : (
          <div className="py-4">
            <p className="mb-6 text-sm font-medium text-slate-500">
              Generating your ad — this takes about a minute.
            </p>
            <ol className="space-y-4">
              {STEPS.map((label, i) => {
                const idx = i + 1;
                const state =
                  idx < step ? "done" : idx === step ? "active" : "pending";
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
                      state === "active"
                        ? "border-indigo-200 bg-indigo-50"
                        : state === "done"
                          ? "border-slate-200 bg-white"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                      {state === "done" && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                          ✓
                        </div>
                      )}
                      {state === "active" && (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                      )}
                      {state === "pending" && (
                        <div className="h-6 w-6 rounded-full border-2 border-slate-200" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        state === "active"
                          ? "text-indigo-700"
                          : state === "done"
                            ? "text-slate-700"
                            : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
