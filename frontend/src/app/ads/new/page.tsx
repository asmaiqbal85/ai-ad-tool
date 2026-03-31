"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scrapeUrl, generateAd, createAd } from "@/lib/api";

export default function NewAdPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setLoading("Scraping page...");
      const scraped = await scrapeUrl(url);

      setLoading("Generating ad...");
      const result = await generateAd(scraped);

      setLoading("Saving...");
      const ad = await createAd({
        url,
        headline: result.headline,
        ad_copy: result.ad_copy,
        video_url: result.video_url,
      });

      router.push(`/ads/${ad.id}/edit`);
    } catch {
      setError("Failed to generate ad. Check the URL and try again.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Ad from URL</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Page URL
          </label>
          <input
            id="url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/product"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!!loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading || "Generate Ad"}
        </button>
      </form>
    </div>
  );
}
