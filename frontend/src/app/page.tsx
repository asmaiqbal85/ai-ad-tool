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
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Ads</h1>
        <Link
          href="/ads/editor"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Ad from URL
        </Link>
      </div>

      {ads.length === 0 ? (
        <p className="text-gray-500">No ads yet. Create one from a URL!</p>
      ) : (
        <div className="grid gap-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold">{ad.headline}</h2>
              <p className="text-gray-600 mt-1">{ad.ad_copy}</p>
              <div className="flex items-center justify-between mt-4">
                {ad.video_url && (
                  <a
                    href={ad.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full"
                  >
                    View Video
                  </a>
                )}
                <Link
                  href={`/ads/${ad.id}/edit`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </Link>
              </div>
              <p className="text-xs text-gray-400 mt-2">Source: {ad.url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
