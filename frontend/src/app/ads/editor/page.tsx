"use client";

import { useState } from "react";
import Link from "next/link";
import { scrapeUrl, generateAd, pollAdUntilFinal, rerenderAd } from "@/lib/api";

interface AdData {
  id: string;
  video_url: string;
  headline: string;
  ad_copy: string;
  colors: string[];
  logo: string;
  images: string[];
}

export default function EditorPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [ad, setAd] = useState<AdData | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [rerendering, setRerendering] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaveMsg("");

    try {
      setLoading("Scraping page...");
      const scraped = await scrapeUrl(url);

      setLoading("Generating ad...");
      const { id } = await generateAd({ ...scraped, url });

      setLoading("Rendering video... (this can take ~1 minute)");
      const ready = await pollAdUntilFinal(id);

      setAd({
        id: ready.id,
        video_url: ready.video_url ?? "",
        headline: ready.headline ?? "",
        ad_copy: ready.ad_copy ?? "",
        colors: scraped.colors.length ? scraped.colors : ["#1a73e8"],
        logo: scraped.logo,
        images: scraped.images,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg || "Something went wrong. Check the URL and try again.");
    } finally {
      setLoading("");
    }
  }

  async function handleSave() {
    if (!ad) return;
    setSaveMsg("");
    setError("");
    setRerendering(true);
    try {
      const updated = await rerenderAd(ad.id, {
        headline: ad.headline,
        ad_copy: ad.ad_copy,
        colors: ad.colors,
        logo: ad.logo,
        images: ad.images,
      });
      setAd({ ...ad, video_url: updated.video_url });
      setSaveMsg("Saved & video updated!");
    } catch {
      setError("Could not re-render video. Please try again.");
    } finally {
      setRerendering(false);
    }
  }

  async function handleDownload() {
    if (!ad?.video_url) return;
    setError("");
    setDownloading(true);
    try {
      const res = await fetch(ad.video_url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `ad-${ad.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Could not download video. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-block text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to ads
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Ad Editor
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Generate an ad from a URL, then fine-tune and re-render.
        </p>
      </div>

      {/* URL Input (always visible at top) */}
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label
          htmlFor="editor-url"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Generate from URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="editor-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={!!loading}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading || "Generate Ad"}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>

      {ad && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* LEFT — Form */}
          <div className="lg:col-span-3 lg:order-1 order-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-900">
                Edit Details
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Headline
                  </label>
                  <input
                    value={ad.headline}
                    onChange={(e) =>
                      setAd({ ...ad, headline: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Ad Copy
                  </label>
                  <textarea
                    rows={4}
                    value={ad.ad_copy}
                    onChange={(e) =>
                      setAd({ ...ad, ad_copy: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Colors
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {ad.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5"
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const updated = [...ad.colors];
                            updated[i] = e.target.value;
                            setAd({ ...ad, colors: updated });
                          }}
                          className="h-8 w-8 cursor-pointer rounded-lg border-0 p-0"
                        />
                        <span className="font-mono text-xs text-slate-500">
                          {color}
                        </span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setAd({ ...ad, colors: [...ad.colors, "#000000"] })
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={rerendering}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {rerendering ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Re-rendering video...
                      </>
                    ) : (
                      "Save & Re-render"
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading || !ad.video_url}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {downloading ? "Downloading..." : "Download Video"}
                  </button>
                </div>

                {saveMsg && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {saveMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Preview */}
          <div className="lg:col-span-2 lg:order-2 order-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                Your Ad Preview
              </h2>
              <div className="relative overflow-hidden rounded-xl bg-slate-900">
                {ad.video_url && (
                  <video
                    key={ad.video_url}
                    src={ad.video_url}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="w-full object-contain"
                    style={{ maxHeight: 400 }}
                  />
                )}
                {rerendering && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                    <p className="text-sm font-medium text-white">
                      Updating your video...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
