import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl font-bold text-slate-500">?</span>
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">
        Page Not Found
      </h2>
      <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>

      <Link
        href="/dashboard"
        className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
