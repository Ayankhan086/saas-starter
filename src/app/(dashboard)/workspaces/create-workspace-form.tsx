"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface CreateWorkspaceFormProps {
  canCreate: boolean;
  limitResult: { allowed: true } | { allowed: false; limit: number; plan: string };
}

export function CreateWorkspaceForm({
  canCreate,
  limitResult,
}: CreateWorkspaceFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create workspace");
      }

      setIsOpen(false);
      setName("");
      router.refresh(); // Refresh the server component to show the new workspace
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        New Workspace
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-1">
            Create Workspace
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            A workspace organizes tasks for a specific project or team.
          </p>

          {!limitResult.allowed ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <p className="text-amber-400 text-sm">
                You've reached the limit of {limitResult.limit} workspaces on the{" "}
                {limitResult.plan} plan. Upgrade to Pro to create more.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Workspace Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marketing Site Redesign"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          )}

          {!limitResult.allowed && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50 mt-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
