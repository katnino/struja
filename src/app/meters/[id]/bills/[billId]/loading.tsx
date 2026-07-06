export default function BillDetailLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="h-3 w-32 bg-[var(--surface-2)] rounded animate-pulse mb-4" />
      <div className="border-b border-[var(--border)] pb-4 mb-6">
        <div className="h-5 w-28 bg-[var(--surface-2)] rounded animate-pulse mb-1" />
        <div className="h-3 w-48 bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
      <div className="border border-[var(--border)] rounded-lg p-5 bg-black/30">
        <div className="h-3 w-32 bg-[var(--surface-2)] rounded animate-pulse mb-4" />
        <div className="space-y-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full bg-[var(--surface-2)] rounded animate-pulse" />
          ))}
        </div>
        <div className="h-8 w-full bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
    </main>
  );
}
