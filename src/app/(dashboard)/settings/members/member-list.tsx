"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface MemberListProps {
  initialMembers: Member[];
  currentUserRole: string;
  currentUserId: string;
}

export function MemberList({
  initialMembers,
  currentUserRole,
  currentUserId,
}: MemberListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const canManageRoles = currentUserRole === "OWNER";
  const canRemoveMembers = ["OWNER", "ADMIN"].includes(currentUserRole);

  async function handleRoleChange(memberId: string, newRole: string) {
    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;

    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-b border-slate-700/60">
          <tr>
            <th className="px-6 py-4 font-medium">User</th>
            <th className="px-6 py-4 font-medium">Role</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/60">
          {initialMembers.map((member) => {
            const isCurrentUser = member.user.id === currentUserId;
            const isOwner = member.role === "OWNER";

            return (
              <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold border border-slate-600">
                      {(member.user.name || member.user.email)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {member.user.name || "Pending User"}
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {canManageRoles && !isOwner && !isCurrentUser ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={loadingId === member.id}
                      className="bg-slate-900/60 border border-slate-600 text-slate-300 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        isOwner
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : member.role === "ADMIN"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-slate-700 text-slate-300 border border-slate-600"
                      }`}
                    >
                      {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {canRemoveMembers && !isOwner && !isCurrentUser && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={loadingId === member.id}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {loadingId === member.id ? "Removing..." : "Remove"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
