export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-paper-200" />
      <div className="h-4 w-full max-w-xs animate-pulse rounded bg-paper-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-paper-100" />
        ))}
      </div>
    </div>
  );
}
