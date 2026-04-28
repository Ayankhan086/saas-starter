import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  assigneeId: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

async function verifyWorkspace(workspaceId: string, orgId: string) {
  return prisma.workspace.findFirst({ where: { id: workspaceId, orgId } });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const workspace = await verifyWorkspace(id, session.user.orgId);
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: { workspaceId: id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const workspace = await verifyWorkspace(id, session.user.orgId);
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      priority: parsed.data.priority,
      status: "TODO",
      workspaceId: id,
      creatorId: session.user.id,
      assigneeId: parsed.data.assigneeId ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
