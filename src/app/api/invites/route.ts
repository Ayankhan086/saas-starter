import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkPlanLimit } from "@/lib/limits";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Only owners and admins can invite members" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Enforce plan limit
  const limitResult = await checkPlanLimit(session.user.orgId, "members");
  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: `Member limit reached. Your ${limitResult.plan} plan allows ${limitResult.limit} members. Upgrade to Pro for unlimited members.`,
      },
      { status: 403 }
    );
  }

  const { email, role } = parsed.data;

  // Check if already a member
  const existingMembership = await prisma.membership.findFirst({
    where: { orgId: session.user.orgId, user: { email } },
  });
  if (existingMembership) {
    return NextResponse.json({ error: "This user is already a member of your organization." }, { status: 409 });
  }

  // Upsert user (may already have an account in another org)
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: email.split("@")[0], email, password: "" }, // placeholder password — user must set via reset
  });

  const membership = await prisma.membership.create({
    data: { userId: user.id, orgId: session.user.orgId, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(membership, { status: 201 });
}
