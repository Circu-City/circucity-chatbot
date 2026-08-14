export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-border">
          <div className="h-10 w-10 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
