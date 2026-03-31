import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Ad Tool",
  description: "Create ads from any URL using AI",
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
          <a href="/" className="text-xl font-bold text-gray-900">
            AI Ad Tool
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
