export default function MembersLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-44 bg-slate-800 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-800 rounded-lg" />
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="bg-slate-900/50 border-b border-slate-700/60 px-6 py-4 flex gap-24">
          <div className="h-3 w-12 bg-slate-700 rounded" />
          <div className="h-3 w-10 bg-slate-700 rounded" />
          <div className="h-3 w-14 bg-slate-700 rounded ml-auto" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="px-6 py-4 flex items-center gap-4 border-b border-slate-700/40"
          >
            <div className="w-10 h-10 bg-slate-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-28 bg-slate-700 rounded mb-1.5" />
              <div className="h-3 w-40 bg-slate-700/50 rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
