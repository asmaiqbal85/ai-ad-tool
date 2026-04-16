"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { scrapeUrl, generateAd } from "@/lib/api";

const STEPS = [
  "Scraping website...",
  "Generating ad copy...",
  "Creating your video...",
];

export default function NewAdPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState(0); // 0 idle, 1-3 active step
  const [error, setError] = useState("");

  const loading = step > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setStep(1);
      const scraped = await scrapeUrl(url);

      setStep(2);
      const result = await generateAd({ ...scraped, url });

      setStep(3);
      // brief pause so users see the final step
      await new Promise((r) => setTimeout(r, 700));

      router.push(`/ads/${result.id}/edit`);
    } catch {
      setError("Failed to generate ad. Check the URL and try again.");
      setStep(0);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
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
