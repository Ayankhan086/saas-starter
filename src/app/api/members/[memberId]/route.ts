import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

type Params = { params: Promise<{ memberId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can change roles" }, { status: 403 });
  }

  const { memberId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const membership = await prisma.membership.findFirst({
    where: { id: memberId, orgId: session.user.orgId },
  });
  if (!membership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (membership.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
  }

  const updated = await prisma.membership.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;
  const membership = await prisma.membership.findFirst({
    where: { id: memberId, orgId: session.user.orgId },
  });
  if (!membership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (membership.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the organization owner" }, { status: 400 });
  }

  await prisma.membership.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
