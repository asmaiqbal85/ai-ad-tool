import Link from "next/link";
import { getAds } from "@/lib/api";

export default async function Home() {
  let ads: any[] = [];
  try {
    ads = await getAds();
  } catch {
    // API not available yet
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-8 py-20 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_60%)]" />
        <span className="inline-block rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-700 backdrop-blur">
          AI-Powered Ad Creation
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Create TV Ads from any URL
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            in seconds
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
          Paste any website. Our AI scrapes the brand, writes the copy, and renders a
          polished video ad — ready to download and run.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/ads/new"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
          >
            Create Ad from URL
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </section>

      {/* Ads Gallery */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Your Ads
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {ads.length} {ads.length === 1 ? "ad" : "ads"} generated
            </p>
          </div>
          {ads.length > 0 && (
            <Link
              href="/ads/new"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              + New Ad
            </Link>
          )}
        </div>

        {ads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl">
              ✨
            </div>
            <p className="text-slate-600">No ads yet.</p>
            <p className="mt-1 text-sm text-slate-400">
              Create your first ad from any URL.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {ads.map((ad) => {
              let domain = "";
              try {
                domain = new URL(ad.url).hostname.replace(/^www\./, "");
              } catch {
                domain = ad.url;
              }
              return (
                <div
                  key={ad.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
                    {ad.video_url ? (
                      <video
                        src={ad.video_url}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">
                        ▶
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-1 text-base font-semibold text-slate-900">
                      {ad.headline}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                      {ad.ad_copy}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
                      {domain}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <Link
                        href={`/ads/${ad.id}/edit`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Edit →
                      </Link>
                      {ad.video_url && (
                        <a
                          href={ad.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                        >
                          View Video
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
