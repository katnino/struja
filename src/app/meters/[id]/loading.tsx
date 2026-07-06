export default function MeterDetailLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="h-3 w-32 bg-[var(--surface-2)] rounded animate-pulse mb-4" />
      <div className="border-b border-[var(--border)] pb-4 mb-6">
        <div className="h-5 w-48 bg-[var(--surface-2)] rounded animate-pulse mb-1" />
        <div className="h-3 w-24 bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
      <div className="h-11 w-full bg-[var(--surface-2)] rounded animate-pulse mb-8" />
      <div className="mb-8">
        <div className="h-3 w-20 bg-[var(--surface-2)] rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-[var(--surface-2)] rounded animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
