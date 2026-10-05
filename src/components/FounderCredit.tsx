const COMPANY_URL = "https://senvante.com/";
const NAME = "Shoaib Shoukat";

function Portrait({ className }: { className: string }) {
  return (
    <img
      src="/founder.jpg"
      alt="Shoaib Shoukat, CEO and Founder of Universal POS and Senvante"
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
        className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 hover:border-copper-400/40"
      >
        <Portrait className="h-10 w-10 shrink-0 rounded-full object-cover object-[center_18%] ring-2 ring-copper-400/50" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-paper-50">{NAME}</span>
          <span className="block truncate text-[11px] text-copper-400">CEO & Founder · Senvante</span>
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
        className="mt-4 flex items-center gap-3 rounded-2xl border border-paper-200 bg-white p-3 shadow-card transition hover:border-copper-400"
      >
        <Portrait className="h-14 w-14 shrink-0 rounded-full object-cover object-[center_18%] ring-2 ring-copper-400/70" />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink-950">{NAME}</span>
          <span className="mt-0.5 block text-xs text-ink-700/70">CEO & Founder · Senvante</span>
        </span>
      </a>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="overflow-hidden rounded-3xl bg-ink-950 text-paper-50 shadow-[0_28px_70px_-36px_rgba(20,17,14,0.7)]">
        <div className="grid md:grid-cols-[16.5rem_minmax(0,1fr)]">
          <div className="relative min-h-[22rem] bg-ink-900 md:min-h-full">
            <Portrait className="absolute inset-0 h-full w-full object-cover object-[center_12%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-ink-950" />
          </div>
          <div className="relative flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-copper-400">CEO & Founder</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.05] text-white sm:text-5xl">{NAME}</h2>
            <p className="mt-3 text-sm text-paper-50/70">Universal POS is a product of his company, Senvante.</p>
            <p className="mt-5 max-w-xl text-sm leading-7 text-paper-50/75">
              Shoaib Shoukat founded Senvante and leads Universal POS. Senvante designs, engineers, and
              supports the software a business depends on, from the public site to the systems people use
              every day.
            </p>
            <a
              href={COMPANY_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex w-fit items-center rounded-full bg-copper-500 px-4 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-copper-400"
            >
              Visit senvante.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
