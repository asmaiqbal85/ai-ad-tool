import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Paste your URL",
    body: "Drop in your website, product page, or shop link. We scrape the brand, copy, and visuals.",
  },
  {
    n: "2",
    title: "AI builds your ad",
    body: "Our AI writes a punchy headline and copy, then renders a polished video — ready to publish.",
  },
  {
    n: "3",
    title: "Run it everywhere",
    body: "Launch on Facebook, Instagram, and YouTube. Target customers in your city, by age and interest.",
  },
];

export default function Landing() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-8 py-20 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_60%)]" />
        <span className="inline-block rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-700 backdrop-blur">
          Pakistan&apos;s AI-Powered Ad Platform
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Create. Target. Run.
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Repeat.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
          Paste a URL. Our AI writes the ad and renders a video. Run it on
          Facebook and Instagram — without paying an agency Rs 25,000 a month.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30"
          >
            Start free trial
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Log in
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          3 ads free · No credit card required
        </p>
      </section>

      {/* How it works */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From URL to running ad in minutes
          </h2>
          <p className="mt-3 text-base text-slate-600">
            No designer. No copywriter. No agency.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl border border-slate-200 bg-slate-900 px-8 py-16 text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to run your first ad?
        </h2>
        <p className="mt-3 text-base text-slate-300">
          Sign up and create your first ad in under 60 seconds.
        </p>
        <Link
          href="/auth/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          Start free trial
          <span>→</span>
        </Link>
      </section>
    </div>
  );
}
