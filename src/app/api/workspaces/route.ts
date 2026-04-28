import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkPlanLimit } from "@/lib/limits";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    where: { orgId: session.user.orgId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workspaces);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Enforce plan limit
  const limitResult = await checkPlanLimit(session.user.orgId, "workspaces");
  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: `Workspace limit reached. Your ${limitResult.plan} plan allows ${limitResult.limit} workspaces. Upgrade to Pro for unlimited workspaces.`,
      },
      { status: 403 }
    );
  }

  const workspace = await prisma.workspace.create({
    data: { name: parsed.data.name, orgId: session.user.orgId },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(workspace, { status: 201 });
}
