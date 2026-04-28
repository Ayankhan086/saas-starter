export default function WorkspacesLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-40 bg-slate-800 rounded-lg mb-2" />
          <div className="h-4 w-56 bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-800 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl" />
              <div className="h-6 w-16 bg-slate-700 rounded-full" />
            </div>
            <div className="h-5 w-36 bg-slate-700 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
