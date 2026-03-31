"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAd, updateAd } from "@/lib/api";

export default function EditAdPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ad, setAd] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAd(id).then(setAd);
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await updateAd(id, {
        headline: ad.headline,
        ad_copy: ad.ad_copy,
      });
      setMessage("Saved!");
    } catch {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    if (!ad?.video_url) return;
    window.open(ad.video_url, "_blank");
  }

  if (!ad) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Edit Ad</h1>
      <p className="text-sm text-gray-400 mb-6">Source: {ad.url}</p>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
          <input
            value={ad.headline}
            onChange={(e) => setAd({ ...ad, headline: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Copy</label>
          <textarea
            rows={3}
            value={ad.ad_copy}
            onChange={(e) => setAd({ ...ad, ad_copy: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {ad.video_url && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Preview</label>
            <video src={ad.video_url} controls autoPlay muted className="w-full rounded-lg" />
          </div>
        )}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {ad.video_url && (
            <button
              type="button"
              onClick={handleDownload}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Download Video
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="border px-6 py-2 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
