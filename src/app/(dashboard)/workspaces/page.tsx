import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { checkPlanLimit } from "@/lib/limits";

export const metadata = {
  title: "Workspaces | TeamSpace",
};

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user?.orgId) {
    redirect("/login");
  }

  const workspaces = await prisma.workspace.findMany({
    where: { orgId: session.user.orgId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });

  const limitResult = await checkPlanLimit(session.user.orgId, "workspaces");
  const canCreate = limitResult.allowed;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage your team's projects and boards.
          </p>
        </div>

        <CreateWorkspaceForm canCreate={canCreate} limitResult={limitResult} />
      </div>

      {workspaces.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No workspaces yet
          </h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            Get started by creating your first workspace to organize tasks and
            collaborate with your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="group bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold group-hover:scale-110 transition-transform">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
                <div className="px-2.5 py-1 rounded-full bg-slate-900/50 border border-slate-700/50 text-xs font-medium text-slate-400">
                  {workspace._count.tasks} tasks
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1 truncate">
                {workspace.name}
              </h3>
              <p className="text-sm text-slate-500">
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
