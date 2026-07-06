export default function NewReadingLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="h-3 w-32 bg-[var(--surface-2)] rounded animate-pulse mb-4" />
      <div className="border-b border-[var(--border)] pb-4 mb-6">
        <div className="h-5 w-44 bg-[var(--surface-2)] rounded animate-pulse mb-1" />
        <div className="h-3 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
      <div className="border border-[var(--border)] rounded p-3 mb-5">
        <div className="h-4 w-64 bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
    </main>
  );
}
