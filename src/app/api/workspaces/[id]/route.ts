import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(80),
});

type Params = { params: Promise<{ id: string }> };

async function getWorkspace(id: string, orgId: string) {
  return prisma.workspace.findFirst({ where: { id, orgId } });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const workspace = await getWorkspace(id, session.user.orgId);
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(workspace);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const workspace = await getWorkspace(id, session.user.orgId);
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

  const updated = await prisma.workspace.update({
    where: { id },
    data: { name: parsed.data.name },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const workspace = await getWorkspace(id, session.user.orgId);
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Tasks cascade via Prisma relation
  await prisma.workspace.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
