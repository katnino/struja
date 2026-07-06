export default function DashboardLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-[var(--border)]">
        <div className="h-5 w-32 bg-[var(--surface-2)] rounded animate-pulse mb-1" />
        <div className="h-3 w-64 bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--surface)]">
            <div className="h-4 w-40 bg-[var(--surface-2)] rounded animate-pulse mb-2" />
            <div className="h-3 w-56 bg-[var(--surface-2)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
