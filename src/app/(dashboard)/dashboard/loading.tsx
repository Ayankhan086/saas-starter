export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-slate-800 rounded-lg mb-2" />
        <div className="h-4 w-48 bg-slate-800/60 rounded" />
      </div>

      {/* Plan badge */}
      <div className="mb-6">
        <div className="h-6 w-24 bg-slate-800 rounded-full" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-slate-700 rounded-lg" />
              <div className="h-4 w-20 bg-slate-700 rounded" />
            </div>
            <div className="h-8 w-12 bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Recent workspaces */}
      <div className="h-5 w-40 bg-slate-800 rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-700 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-700 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-700/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
