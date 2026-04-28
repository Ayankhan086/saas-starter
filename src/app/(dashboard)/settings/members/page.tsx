import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MemberList } from "./member-list";
import { InviteMemberForm } from "./invite-member-form";
import { checkPlanLimit } from "@/lib/limits";

export const metadata = {
  title: "Members | TeamSpace",
};

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.orgId) {
    redirect("/login");
  }

  const members = await prisma.membership.findMany({
    where: { orgId: session.user.orgId },
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const limitResult = await checkPlanLimit(session.user.orgId, "members");
  const canInvite = limitResult.allowed;
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(session.user.role ?? "");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage who has access to your organization's workspaces.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <InviteMemberForm canInvite={canInvite} limitResult={limitResult} />
        )}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
        <MemberList
          initialMembers={members}
          currentUserRole={session.user.role as string}
          currentUserId={session.user.id as string}
        />
      </div>
    </div>
  );
}
