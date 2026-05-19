import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunAds.io — Create. Target. Run. Repeat.",
  description:
    "Pakistan's AI-powered self-serve ad platform. Paste a URL, get a video ad, run it on Facebook & Instagram.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white border-b px-6 py-4 flex items-center justify-between gap-6">
          <a
            href={user ? "/dashboard" : "/"}
            className="flex flex-col leading-tight"
          >
            <span className="text-xl font-bold text-gray-900">RunAds.io</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">
              Create. Target. Run. Repeat.
            </span>
          </a>

          <div className="flex items-center gap-5 text-sm">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <span className="hidden text-slate-400 sm:inline">
                  {user.email}
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:-translate-y-0.5"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
        <main className="max-w-5xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
