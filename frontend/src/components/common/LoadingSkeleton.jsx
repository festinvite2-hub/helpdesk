export default function LoadingSkeleton() {
  return (
    <section className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="h-4 w-72 max-w-full rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-10 w-28 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    </section>
  )
}
