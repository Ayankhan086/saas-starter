"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrgSettingsFormProps {
  orgId: string;
  initialName: string;
  slug: string;
  isOwner: boolean;
}

export function OrgSettingsForm({
  orgId,
  initialName,
  slug,
  isOwner,
}: OrgSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name === initialName) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/org`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Organization Name */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">
          Organization Name
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="orgName"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Display Name
            </label>
            <input
              id="orgName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {!isOwner && (
              <p className="mt-1.5 text-xs text-slate-500">
                Only the organization owner can change this.
              </p>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm max-w-md">
              {error}
            </div>
          )}

          {saved && (
            <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm max-w-md">
              ✓ Settings saved successfully.
            </div>
          )}

          {isOwner && (
            <button
              type="submit"
              disabled={loading || name === initialName || !name.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>

      {/* Org Slug (read-only) */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">
          Organization URL
        </h3>
        <div className="flex items-center gap-2 max-w-md">
          <span className="text-slate-500 text-sm">teamspace.com/orgs/</span>
          <code className="px-3 py-2 bg-slate-900/60 border border-slate-600 rounded-lg text-indigo-400 text-sm font-mono">
            {slug}
          </code>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          The organization slug is set during signup and cannot be changed.
        </p>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-red-400 mb-2">
            Danger Zone
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Deleting your organization is permanent and cannot be undone. All
            workspaces, tasks, and member data will be lost.
          </p>
          <button
            disabled
            className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg cursor-not-allowed opacity-60"
          >
            Delete Organization (coming soon)
          </button>
        </div>
      )}
    </div>
  );
}
