import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunAds.io — Create. Target. Run. Repeat.",
  description: "Pakistan's AI-powered self-serve ad platform. Paste a URL, get a video ad, run it on Facebook & Instagram.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white border-b px-6 py-4 flex items-center gap-6">
          <a href="/" className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-gray-900">RunAds.io</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">
              Create. Target. Run. Repeat.
            </span>
          </a>
          <a href="/ads/editor" className="text-sm text-blue-600 hover:underline">
            Editor
          </a>
        </nav>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
