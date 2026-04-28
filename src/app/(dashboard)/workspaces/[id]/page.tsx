import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { KanbanBoard } from "./kanban-board";
import Link from "next/link";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return { title: "Workspace | TeamSpace" };
  const { id } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id, orgId: session.user.orgId },
    select: { name: true },
  });

  return {
    title: workspace ? `${workspace.name} | TeamSpace` : "Workspace | TeamSpace",
  };
}

export default async function WorkspacePage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    redirect("/login");
  }

  const { id } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id, orgId: session.user.orgId },
  });

  if (!workspace) {
    notFound();
  }

  const tasks = await prisma.task.findMany({
    where: { workspaceId: id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const members = await prisma.membership.findMany({
    where: { orgId: session.user.orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const users = members.map((m) => m.user);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link
          href="/workspaces"
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {workspace.name}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Kanban Board</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard workspaceId={id} initialTasks={tasks} users={users} />
      </div>
    </div>
  );
}
