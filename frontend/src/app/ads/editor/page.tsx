"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scrapeUrl, generateAd, updateAd } from "@/lib/api";

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
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [ad, setAd] = useState<AdData | null>(null);
  const [saveMsg, setSaveMsg] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaveMsg("");

    try {
      setLoading("Scraping page...");
      const scraped = await scrapeUrl(url);

      setLoading("Generating ad...");
      const result = await generateAd({ ...scraped, url });

      setAd({
        id: result.id,
        video_url: result.video_url,
        headline: result.headline,
        ad_copy: result.ad_copy,
        colors: scraped.colors.length ? scraped.colors : ["#1a73e8"],
        logo: scraped.logo,
        images: scraped.images,
      });
    } catch {
      setError("Something went wrong. Check the URL and try again.");
    } finally {
      setLoading("");
    }
  }

  async function handleSave() {
    if (!ad) return;
    setSaveMsg("");
    try {
      await updateAd(ad.id, {
        headline: ad.headline,
        ad_copy: ad.ad_copy,
      });
      setSaveMsg("Saved!");
    } catch {
      setError("Failed to save ad.");
    }
  }

  function handleDownload() {
    if (!ad?.video_url) return;
    window.open(ad.video_url, "_blank");
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Ad Editor</h1>

      {/* URL Input */}
      <form onSubmit={handleGenerate} className="flex gap-3">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!!loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          {loading || "Generate Ad"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {ad && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Preview */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">Preview</h2>
            <div
              className="rounded-xl overflow-hidden shadow-lg border"
              style={{ backgroundColor: ad.colors[0] || "#1a73e8" }}
            >
              {ad.video_url && (
                <video
                  src={ad.video_url}
                  controls
                  autoPlay
                  muted
                  className="w-full"
                  poster={ad.images[0] || undefined}
                />
              )}

              <div className="p-6 text-white">
                {ad.logo && (
                  <img
                    src={ad.logo}
                    alt="Logo"
                    className="h-8 mb-4 object-contain"
                  />
                )}
                <h3 className="text-xl font-bold leading-tight">
                  {ad.headline}
                </h3>
                <p className="mt-2 text-sm opacity-90">{ad.ad_copy}</p>
              </div>
            </div>
          </div>

          {/* Edit Controls */}
          <div className="space-y-5">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Edit</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Headline
              </label>
              <input
                value={ad.headline}
                onChange={(e) => setAd({ ...ad, headline: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Copy
              </label>
              <textarea
                rows={3}
                value={ad.ad_copy}
                onChange={(e) => setAd({ ...ad, ad_copy: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors
              </label>
              <div className="flex gap-2 flex-wrap">
                {ad.colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const updated = [...ad.colors];
                        updated[i] = e.target.value;
                        setAd({ ...ad, colors: updated });
                      }}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs text-gray-400 font-mono">
                      {color}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAd({ ...ad, colors: [...ad.colors, "#000000"] })
                  }
                  className="w-10 h-10 rounded border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                Download Video
              </button>
            </div>
            {saveMsg && <p className="text-sm text-green-600">{saveMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
