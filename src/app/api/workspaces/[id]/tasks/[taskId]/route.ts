import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

type Params = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, taskId } = await params;

  // Verify workspace belongs to org
  const workspace = await prisma.workspace.findFirst({
    where: { id, orgId: session.user.orgId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const task = await prisma.task.update({
    where: { id: taskId, workspaceId: id },
    data: parsed.data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, taskId } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id, orgId: session.user.orgId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id: taskId, workspaceId: id } });
  return NextResponse.json({ success: true });
}
