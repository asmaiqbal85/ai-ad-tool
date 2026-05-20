import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Add it to .env.local or your Vercel environment variables."
  );
}

async function resolveToken(explicitToken?: string): Promise<string> {
  if (explicitToken) return explicitToken;
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not signed in");
  }
  return session.access_token;
}

async function authedFetch(
  path: string,
  init: RequestInit = {},
  explicitToken?: string
): Promise<Response> {
  const token = await resolveToken(explicitToken);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

export async function getAds(accessToken?: string) {
  const res = await authedFetch(
    "/api/ads",
    { cache: "no-store" },
    accessToken
  );
  if (!res.ok) throw new Error("Failed to fetch ads");
  return res.json();
}

export async function getAd(id: string) {
  const res = await authedFetch(`/api/ads/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch ad");
  return res.json();
}

export async function updateAd(
  id: string,
  data: { headline?: string; ad_copy?: string; video_url?: string }
) {
  const res = await authedFetch(`/api/ads/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update ad");
  return res.json();
}

export async function rerenderAd(
  id: string,
  data: {
    headline: string;
    ad_copy: string;
    colors?: string[];
    logo?: string;
    images?: string[];
    voice?: "alloy" | "nova" | "shimmer";
  }
) {
  const res = await authedFetch(`/api/ads/${id}/rerender`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to re-render ad");
  return res.json();
}

export async function scrapeUrl(url: string) {
  const res = await authedFetch("/api/scrape", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to scrape URL");
  return res.json();
}

export async function getBillingMe() {
  const res = await authedFetch("/api/billing/me", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load billing info");
  return res.json() as Promise<{
    plan: "free" | "pro";
    subscription_status: string | null;
    current_period_end: string | null;
    has_stripe_customer: boolean;
    ads_used: number;
    free_limit: number;
  }>;
}

export async function createCheckoutSession() {
  const res = await authedFetch("/api/billing/checkout", { method: "POST" });
  if (!res.ok) throw new Error("Failed to start checkout");
  return res.json() as Promise<{ url: string }>;
}

export async function createPortalSession() {
  const res = await authedFetch("/api/billing/portal", { method: "POST" });
  if (!res.ok) throw new Error("Failed to open billing portal");
  return res.json() as Promise<{ url: string }>;
}

export async function generateAd(scraped: {
  url?: string;
  business_name: string;
  tagline: string;
  logo: string;
  colors: string[];
  images: string[];
  voice?: "alloy" | "nova" | "shimmer";
}) {
  const res = await authedFetch("/api/generate-ad", {
    method: "POST",
    body: JSON.stringify(scraped),
  });
  if (!res.ok) throw new Error("Failed to generate ad");
  return res.json();
}
