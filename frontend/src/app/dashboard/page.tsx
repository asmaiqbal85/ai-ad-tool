import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAds } from "@/lib/api";
import QuotaBadge from "@/components/QuotaBadge";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let ads: any[] = [];
  try {
    ads = token ? await getAds(token) : [];
  } catch {
    // backend unreachable — render empty state
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Your ads
        </h1>
        <p className="mt-2 text-base text-slate-600">
          {ads.length} {ads.length === 1 ? "ad" : "ads"} generated
        </p>
        <div className="mt-4">
          <QuotaBadge />
        </div>
      </section>

      {/* Gallery */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div />
          <Link
            href="/ads/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30"
          >
            + New ad
          </Link>
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
            <Link
              href="/ads/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30"
            >
              Create your first ad
              <span>→</span>
            </Link>
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
                          View video
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
