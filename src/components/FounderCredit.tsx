const COMPANY_URL = "https://senvante.com/";

function Portrait({ className }: { className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/founder.jpg"
      alt="Shoaib Ahmad, CEO and Founder of Universal POS and Senvante"
      className={className}
    />
  );
}

export function FounderCredit({ variant = "panel" }: { variant?: "panel" | "compact" | "sidebar" }) {
  if (variant === "sidebar") {
    return (
      <a
        href={COMPANY_URL}
        target="_blank"
        rel="noreferrer"
        className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 hover:bg-white/5"
      >
        <Portrait className="h-10 w-10 shrink-0 rounded-full object-cover object-top" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-paper-50">Shoaib Ahmad</span>
          <span className="block truncate text-[11px] text-paper-50/55">CEO & Founder · Senvante</span>
        </span>
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <a
        href={COMPANY_URL}
        target="_blank"
        rel="noreferrer"
        className="card mt-4 flex items-center gap-3 p-3 hover:border-copper-300"
      >
        <Portrait className="h-14 w-14 shrink-0 rounded-xl object-cover object-top" />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink-950">Shoaib Ahmad</span>
          <span className="block text-xs text-ink-700/70">CEO & Founder · A product of Senvante</span>
        </span>
      </a>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="card grid gap-6 p-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center sm:p-8">
        <Portrait className="h-44 w-44 rounded-2xl object-cover object-[center_18%] sm:h-48 sm:w-full" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-600">The company behind this software</p>
          <h2 className="mt-2 font-display text-3xl text-ink-950">Shoaib Ahmad</h2>
          <p className="mt-1 text-sm font-medium text-ink-800">CEO & Founder, Universal POS</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-700/80">
            Universal POS is a product of Senvante, the software company founded and led by Shoaib Ahmad.
            Senvante designs, engineers, and supports the platforms a business depends on. He is CEO and
            Founder of the company and of this point of sale.
          </p>
          <a
            href={COMPANY_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-copper-600 underline underline-offset-4"
          >
            senvante.com
          </a>
        </div>
      </div>
    </section>
  );
}
