import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { tenantDb } from "@/lib/db";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Dashboard — TeamSpace",
  description: "Your team workspace overview",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/login");

  const db = tenantDb(session.user.orgId);
  const [workspaces, memberCount, subscription] = await Promise.all([
    db.workspaces.findMany(),
    db.members.count(),
    db.subscription.findFirst(),
  ]);

  // Real task stats
  const taskStats = await prisma.task.groupBy({
    by: ["status"],
    where: {
      workspace: { orgId: session.user.orgId },
    },
    _count: { id: true },
  });

  const taskCounts = {
    TODO: taskStats.find((s) => s.status === "TODO")?._count.id ?? 0,
    IN_PROGRESS: taskStats.find((s) => s.status === "IN_PROGRESS")?._count.id ?? 0,
    DONE: taskStats.find((s) => s.status === "DONE")?._count.id ?? 0,
  };
  const totalTasks = taskCounts.TODO + taskCounts.IN_PROGRESS + taskCounts.DONE;

  const plan = subscription?.plan ?? "FREE";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-slate-400 mt-1">
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      {/* Plan badge */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            plan === "PRO"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
              : "bg-slate-700/60 text-slate-400 border border-slate-600/50"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              plan === "PRO" ? "bg-amber-400" : "bg-slate-500"
            }`}
          />
          {plan === "PRO" ? "Pro Plan" : "Free Plan"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Workspaces"
          value={workspaces.length}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          label="Members"
          value={memberCount}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={taskCounts.DONE}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Task Status Breakdown */}
      {totalTasks > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Task Progress</h3>
          <div className="flex rounded-full overflow-hidden h-3 bg-slate-700/50">
            {taskCounts.DONE > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(taskCounts.DONE / totalTasks) * 100}%` }}
              />
            )}
            {taskCounts.IN_PROGRESS > 0 && (
              <div
                className="bg-indigo-500 transition-all"
                style={{ width: `${(taskCounts.IN_PROGRESS / totalTasks) * 100}%` }}
              />
            )}
            {taskCounts.TODO > 0 && (
              <div
                className="bg-slate-500 transition-all"
                style={{ width: `${(taskCounts.TODO / totalTasks) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done ({taskCounts.DONE})
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> In Progress ({taskCounts.IN_PROGRESS})
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> To Do ({taskCounts.TODO})
            </span>
          </div>
        </div>
      )}

      {/* Recent Workspaces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent Workspaces</h2>
          <Link
            href="/workspaces"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            View all →
          </Link>
        </div>

        {workspaces.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-700/60 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No workspaces yet</p>
            <p className="text-slate-500 text-xs mt-1">Create your first workspace to get started</p>
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Create workspace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workspaces.slice(0, 4).map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 rounded-xl p-5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 text-sm font-bold">
                      {ws.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate group-hover:text-indigo-300 transition-colors">
                      {ws.name}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(ws.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/15 flex items-center justify-center text-indigo-400">
          {icon}
        </div>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
