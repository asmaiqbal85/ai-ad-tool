const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createAd(data: {
  url: string;
  headline: string;
  ad_copy: string;
  video_url?: string;
}) {
  const res = await fetch(`${API_URL}/api/ads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create ad");
  return res.json();
}

export async function getAds() {
  const res = await fetch(`${API_URL}/api/ads`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch ads");
  return res.json();
}

export async function getAd(id: string) {
  const res = await fetch(`${API_URL}/api/ads/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch ad");
  return res.json();
}

export async function updateAd(
  id: string,
  data: { headline?: string; ad_copy?: string; video_url?: string }
) {
  const res = await fetch(`${API_URL}/api/ads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update ad");
  return res.json();
}

export async function scrapeUrl(url: string) {
  const res = await fetch(`${API_URL}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to scrape URL");
  return res.json();
}

export async function generateAd(scraped: {
  url?: string;
  business_name: string;
  tagline: string;
  logo: string;
  colors: string[];
  images: string[];
}) {
  const res = await fetch(`${API_URL}/api/generate-ad`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scraped),
  });
  if (!res.ok) throw new Error("Failed to generate ad");
  return res.json();
}
